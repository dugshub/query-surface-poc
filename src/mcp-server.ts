#!/usr/bin/env bun
// MCP server — exposes the uniform domain query primitive as three tools
// (`query_describe`, `query_search`, `query_fetch`) over stdio. Configured in
// Claude Code's settings.json so an agent can call the surface in natural
// language.
//
// Bootstraps NestJS via NestFactory.createApplicationContext and resolves the
// entity services from the DI container. Tool handlers call
// `serviceFor(entity).search/fetch(...)` exactly like the HTTP controllers do.
// This keeps MCP + HTTP on the same code path: both route through Service →
// Repository → FilterCompilerService, so any cross-cutting concern added at
// the repo layer (soft-delete filtering, actor scoping, audit logging) applies
// to both transports uniformly.
//
// Why no stdout logging: stdio is the MCP transport. Anything Nest writes to
// stdout corrupts the protocol. `logger: false` disables Nest's default logger
// entirely; the few diagnostics we need go to stderr.
//
// Boot:
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp \
//     bun src/mcp-server.ts
//
// Or wire into Claude Code's settings.json:
//   {
//     "mcpServers": {
//       "sales-crm": {
//         "command": "bun",
//         "args": ["/absolute/path/to/query-surface-poc/src/mcp-server.ts"],
//         "env": { "DATABASE_URL": "postgresql://qsp:qsp@localhost:5532/qsp" }
//       }
//     }
//   }

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { z } from 'zod';

import { AppModule } from './app.module';
import { AccountService } from './modules/accounts/account.service';
import { ContactService } from './modules/contacts/contact.service';
import { EmailService } from './modules/emails/email.service';
import { OpportunityService } from './modules/opportunities/opportunity.service';
import { TranscriptService } from './modules/transcripts/transcript.service';
import { FilterCompilerService } from './query/filter-compiler.service';

import type { EntityName, SingleSearchQuery } from './query/types';
import {
  EntityNameSchema,
  FilterExpressionSchema,
  SortSchema,
} from './query/zod-schemas';
import { getEntitySchema, getFullSchema } from './query/agent-schema';

// ---------------------------------------------------------------------------
// Nest bootstrap — resolved once at boot, used by every tool call. Tool
// handlers below read from `services` (populated by bootstrap()) — they're
// registered at module load but only invoked after main() runs bootstrap.
// ---------------------------------------------------------------------------

let app: INestApplicationContext | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EntityService = { search: (...args: any[]) => Promise<any>; fetch: (...args: any[]) => Promise<any> };
let services: Record<EntityName, EntityService>;
let filterCompiler: FilterCompilerService;

async function bootstrap(): Promise<void> {
  app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  services = {
    account:     app.get(AccountService) as unknown as EntityService,
    opportunity: app.get(OpportunityService) as unknown as EntityService,
    contact:     app.get(ContactService) as unknown as EntityService,
    email:       app.get(EmailService) as unknown as EntityService,
    transcript:  app.get(TranscriptService) as unknown as EntityService,
  };
  // Global provider — used by query_describe to fold the actor's EAV fields
  // into the entity schemas.
  filterCompiler = app.get(FilterCompilerService);
}

function serviceFor(entity: EntityName): EntityService {
  return services[entity];
}

// ---------------------------------------------------------------------------
// MCP server setup
// ---------------------------------------------------------------------------

const server = new McpServer(
  {
    name: 'sales-crm',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
    // Server-level brief — surfaced to the model BEFORE any tool is called,
    // alongside the tool list. Use it to anchor what this server is, when to
    // reach for it, and the conceptual model the tools share.
    instructions: [
      'Sales CRM data — accounts, opportunities (deals), contacts, emails, and call transcripts for the current user.',
      '',
      'Use these tools whenever the user asks about deal status, account context, sales activity, conversations with prospects/customers, call notes, email threads, pipeline, or any "find me what was said / what happened / where things stand" question.',
      '',
      'How it works:',
      '  • Three tools: `query_describe` (learn the schema — call this FIRST if you\'re unsure of column names, enum values, or relationships), `query_search` (find IDs that match filters), `query_fetch` (hydrate IDs into full rows, optionally with related entities attached).',
      '  • Same JSON `FilterExpression` language across every entity. Cross-entity reach via dotted field paths (e.g. `opportunity.account.name`). Text search via the `contains`/`startswith`/`endswith` ops, or the magic field `on: "text"` to fan out across the entity\'s declared searchable columns.',
      '  • Typical pattern: `query_describe` (once, to learn the schema) → `query_search` → get IDs + preview rows with `_snippets` → `query_fetch` with `expand` to pull related context.',
      '',
      'Entities and key relationships:',
      '  • account ── has many ──> opportunity, contact',
      '  • opportunity ── has many ──> email, transcript',
      '  • opportunity ── belongs to ──> account',
      '  • email/transcript ── belongs to ──> opportunity ── belongs to ──> account',
      '',
      'Tenant scope: all queries are implicitly scoped to the current user; no need to pass user_id filters.',
    ].join('\n'),
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
    .describe('JSON FilterExpression. Use `on: "text"` for the magic fan-out across declared searchable columns. Supports cross-entity dotted paths like `opportunity.account.name`. Use `contains` op for text matching.'),
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
    .describe('Return preview rows alongside IDs. Each preview row carries the entity\'s curated identifier columns + a `_snippets` array (when text ops fire) with match windows. Long-text bodies (transcript, email body) are NOT in preview — fetch the IDs to read the full body.'),
};

const FetchInputShape = {
  entity: EntityNameSchema
    .describe('Entity whose rows to hydrate.'),
  ids: z.array(z.string().uuid()).min(1).max(500)
    .describe('IDs to hydrate (typically from a prior /search call).'),
  filter: FilterExpressionSchema.optional()
    .describe('Optional refinement filter — narrows the ID set further (e.g. "of these 200 IDs, only StageName=Negotiation/Review").'),
  expand: z.array(z.string()).optional()
    .describe('Inline-attach related entities. Dotted paths, max 3 hops. belongs_to becomes an object on the row, has_many becomes an array. Example: ["transcript", "transcript.opportunity", "transcript.opportunity.account"].'),
};

// ---------------------------------------------------------------------------
// Tool: query_describe
// ---------------------------------------------------------------------------
// Static schema (agent-schema.ts) + the actor's EAV field map folded in, so
// EAV-backed fields (StageName, Amount, …) appear as ordinary queryable
// fields. The field map is cached after first load (see FilterCompilerService).

const DescribeInputShape = {
  entity: EntityNameSchema.optional()
    .describe('Entity to describe. OMIT to receive the full schema for all 5 entities in a single call — recommended for first contact so you have everything in context.'),
};

server.tool(
  'query_describe',
  [
    'Returns the schema you need to compose `query_search` / `query_fetch` calls correctly. Call this FIRST if you\'re unsure about column names, enum values, relationships, or how to phrase a filter.',
    '',
    'Two modes:',
    '  • OMIT `entity` → full schema for all 5 entities in ONE call. Recommended on first contact — gives you the vocabulary, the entity graph, every column with type + enum values, and example filters per entity. ~3-5 KB of structured JSON.',
    '  • PASS `entity` → just that entity\'s descriptor with the vocabulary preamble. Use when you already have the overview and want to verify one entity before composing a query.',
    '',
    'Response includes for each entity:',
    '  - `summary` — one-line description of what the entity represents',
    '  - `columns` — name + type + enum values (where applicable) + notes on units/conventions',
    '  - `relationships` — belongs_to / has_many edges + how to use them in dotted paths',
    '  - `searchableColumns` — which columns the `on: "text"` magic ORs across',
    '  - `examples` — 2-5 concrete filter expressions per entity, ready to copy + adapt',
    '',
    'Pure metadata. No DB call. Cheap.',
  ].join('\n'),
  DescribeInputShape,
  async (input) => {
    // Fold the actor's EAV fields into the schema so the agent sees StageName,
    // Amount, etc. as ordinary queryable fields.
    const eav = await filterCompiler.fieldMaps();
    const payload = input.entity
      ? getEntitySchema(input.entity, eav)
      : getFullSchema(eav);
    return {
      content: [
        { type: 'text', text: JSON.stringify(payload, null, 2) },
      ],
      structuredContent: payload as unknown as Record<string, unknown>,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: query_search
// ---------------------------------------------------------------------------

server.tool(
  'query_search',
  [
    'Find IDs by composing filters across CRM entities (account, opportunity, contact, email, transcript).',
    '',
    'Returns IDs first — cheap to iterate. Use `preview: true` to also get curated preview rows (per-entity identifier columns — see `query_describe` for what\'s included per entity). When a text op (contains/startswith/endswith) fires, preview rows include a `_snippets` array with windowed match context, match offsets, and full_length. The full body of long-text matched columns (e.g. transcript body, email body_text) is NOT included on preview rows — the snippet carries the match window. Call `query_fetch` with the row id when you need the full body.',
    '',
    'Supports cross-entity reach via dotted field paths (e.g. `transcript.opportunity.StageName`). Supports text-magic fan-out via the magic field `on: "text"` which ORs across the entity\'s declared searchable columns. Supports multi-entity parallel dispatch via the `queries: [...]` shape.',
    '',
    'After finding IDs, use `query_fetch` to hydrate full rows (with optional `expand` for relational data).',
  ].join('\n'),
  SearchInputShape,
  async (input) => {
    const opts = { preview: input.preview };

    try {
      // Multi-entity dispatch — fan out across services in parallel, mirror
      // the HTTP controller's response shape: { results: { [entity]: ... } }.
      if (input.queries && input.queries.length > 0) {
        const settled = await Promise.all(
          (input.queries as SingleSearchQuery[]).map(async q => ({
            entity: q.entity,
            result: await serviceFor(q.entity).search(
              { filter: q.filter, sort: q.sort, page: q.page },
              opts,
            ),
          })),
        );
        const results: Partial<Record<EntityName, unknown>> = {};
        for (const { entity, result } of settled) results[entity] = result;
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

      const result = await serviceFor(input.entity).search(
        { filter: input.filter, sort: input.sort, page: input.page },
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
    'Optional `filter` narrows within the ID set without a fresh search (e.g. "of these 200 IDs, only StageName=Negotiation/Review").',
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
      const result = await serviceFor(input.entity).fetch(input.ids, {
        filter: input.filter,
        expand: input.expand,
      });
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
// Boot
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await bootstrap();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: we do NOT log to stdout — stdio is the MCP transport. Use stderr if
  // needed. The server runs until the parent process (Claude Code) closes it.
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('MCP server failed:', err);
  (app ? app.close() : Promise.resolve()).finally(() => process.exit(1));
});

// Clean shutdown — gracefully close the Nest app (releases the DB pool).
process.on('SIGTERM', () => {
  (app ? app.close() : Promise.resolve()).finally(() => process.exit(0));
});
process.on('SIGINT', () => {
  (app ? app.close() : Promise.resolve()).finally(() => process.exit(0));
});
