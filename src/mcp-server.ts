#!/usr/bin/env bun
// MCP server — exposes the uniform domain query primitive as two tools
// (`query_search` and `query_fetch`) over stdio. Configured in Claude Code's
// settings.json so an agent can call the surface in natural language.
//
// In-process: no HTTP dependency. Imports runSearch/runSearchMulti/runFetch
// directly. Same Drizzle client as the seed + demo scripts.
//
// Boot:
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp \
//     bun src/mcp-server.ts
//
// Or wire into Claude Code's settings.json:
//   {
//     "mcpServers": {
//       "query-surface-poc": {
//         "command": "bun",
//         "args": ["/absolute/path/to/query-surface-poc/src/mcp-server.ts"],
//         "env": { "DATABASE_URL": "postgresql://qsp:qsp@localhost:5532/qsp" }
//       }
//     }
//   }

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { db, closeDb } from './db';
import { runFetch, runSearch, runSearchMulti } from './query/service';
import type { SingleSearchQuery } from './query/types';
import {
  EntityNameSchema,
  FilterExpressionSchema,
  SortSchema,
} from './query/zod-schemas';

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer(
  {
    name: 'query-surface-poc',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ---------------------------------------------------------------------------
// Input shapes — reuse the same Zod schemas as the HTTP controllers so the
// MCP surface stays in lockstep with what /search and /fetch accept.
// ---------------------------------------------------------------------------

const SingleSearchQueryShape = {
  entity: EntityNameSchema,
  filter: FilterExpressionSchema.optional(),
  sort: z.array(SortSchema).optional(),
  page: z
    .object({
      limit: z.number().int().min(1).max(1000).optional(),
      offset: z.number().int().min(0).optional(),
    })
    .optional(),
};

// Search accepts EITHER single-entity-inline OR { queries: [...] } for multi-entity.
// McpServer.tool() takes a ZodRawShape — flat fields. We model both shapes as
// optional fields and validate at handler entry.
const SearchInputShape = {
  // Single-entity inline shape (mirrors POST /search body shape 1)
  entity: EntityNameSchema.optional()
    .describe('Entity to search. Omit when using `queries` for multi-entity.'),
  filter: FilterExpressionSchema.optional()
    .describe('JSON FilterExpression. Use `on: "text"` for the magic fan-out across declared searchable columns. Supports cross-entity dotted paths like `account.industry`. Use `contains` op for text matching.'),
  sort: z.array(SortSchema).optional(),
  page: z
    .object({
      limit: z.number().int().min(1).max(1000).optional(),
      offset: z.number().int().min(0).optional(),
    })
    .optional(),
  // Multi-entity shape (mirrors body shape 2)
  queries: z.array(z.object(SingleSearchQueryShape)).optional()
    .describe('Multi-entity: array of per-entity queries dispatched in parallel. Tagged response shape: { results: { [entity]: { ids, total, preview } } }.'),
  // Shared opts
  preview: z.boolean().optional()
    .describe('Return preview rows alongside IDs. When a text op fired, each row also gets a `_snippets` array with windowed match context and position offsets.'),
};

const FetchInputShape = {
  entity: EntityNameSchema
    .describe('Entity whose rows to hydrate.'),
  ids: z.array(z.string().uuid()).min(1).max(500)
    .describe('IDs to hydrate (typically from a prior /search call).'),
  filter: FilterExpressionSchema.optional()
    .describe('Optional refinement filter — narrows the ID set further (e.g. "of these 200 IDs, only stage=closing").'),
  expand: z.array(z.string()).optional()
    .describe('Inline-attach related entities. Dotted paths, max 3 hops. belongs_to becomes an object on the row, has_many becomes an array. Example: ["transcript", "transcript.opportunity", "transcript.opportunity.account"].'),
};

// ---------------------------------------------------------------------------
// Tool: query_search
// ---------------------------------------------------------------------------

server.tool(
  'query_search',
  [
    'Find IDs by composing filters across CRM entities (account, opportunity, email, transcript, transcript_chunk).',
    '',
    'Returns IDs first — cheap to iterate. Use `preview: true` to also get curated preview rows. When a text op (contains/startswith/endswith) fires, preview rows include a `_snippets` array with windowed match context and position offsets — non-destructive (original columns stay).',
    '',
    'Supports cross-entity reach via dotted field paths (e.g. `transcript.opportunity.stage`). Supports text-magic fan-out via the magic field `on: "text"` which ORs across the entity\'s declared searchable columns. Supports multi-entity parallel dispatch via the `queries: [...]` shape.',
    '',
    'After finding IDs, use `query_fetch` to hydrate full rows (with optional `expand` for relational data).',
  ].join('\n'),
  SearchInputShape,
  async (input) => {
    const opts = { preview: input.preview };

    // Multi-entity dispatch
    if (input.queries && input.queries.length > 0) {
      const results = await runSearchMulti(
        db,
        input.queries as SingleSearchQuery[],
        opts,
      );
      const payload = { results };
      return {
        content: [
          { type: 'text', text: JSON.stringify(payload, null, 2) },
        ],
        structuredContent: payload as unknown as Record<string, unknown>,
      };
    }

    // Single-entity
    if (!input.entity) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'invalid_request',
                message: 'Must provide either `entity` (single) or `queries` (multi-entity array).',
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await runSearch(
        db,
        {
          entity: input.entity,
          filter: input.filter,
          sort: input.sort,
          page: input.page,
        },
        opts,
      );
      const payload = { entity: input.entity, ...result };
      return {
        content: [
          { type: 'text', text: JSON.stringify(payload, null, 2) },
        ],
        structuredContent: payload as unknown as Record<string, unknown>,
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'compile_error',
                message: err instanceof Error ? err.message : String(err),
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: query_fetch
// ---------------------------------------------------------------------------

server.tool(
  'query_fetch',
  [
    'Hydrate IDs into full rows. Typically called after `query_search` with the IDs it returned.',
    '',
    'Optional `filter` narrows within the ID set without a fresh search (e.g. "of these 200 IDs, only stage=closing").',
    '',
    'Optional `expand` attaches related entities inline (max 3 hops):',
    '  - belongs_to → child object on the row (or null for missing FK)',
    '  - has_many   → array on the row (or [] for no children)',
    '  - Nested paths recurse: `["transcript.opportunity.account"]` walks chunk → transcript → opportunity → account in one trip.',
    '',
    'Batched: one IN-query per expand segment, no N+1.',
  ].join('\n'),
  FetchInputShape,
  async (input) => {
    try {
      const result = await runFetch(db, {
        entity: input.entity,
        ids: input.ids,
        filter: input.filter,
        expand: input.expand,
      });
      return {
        content: [
          { type: 'text', text: JSON.stringify(result, null, 2) },
        ],
        structuredContent: { ...result } as unknown as Record<string, unknown>,
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'compile_error',
                message: err instanceof Error ? err.message : String(err),
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: we do NOT log to stdout — stdio is the MCP transport. Use stderr if
  // needed. The server runs until the parent process (Claude Code) closes it.
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('MCP server failed:', err);
  closeDb().finally(() => process.exit(1));
});

// Clean shutdown
process.on('SIGTERM', () => {
  closeDb().finally(() => process.exit(0));
});
process.on('SIGINT', () => {
  closeDb().finally(() => process.exit(0));
});
