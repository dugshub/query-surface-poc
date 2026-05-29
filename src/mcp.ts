#!/usr/bin/env bun
// MCP server — exposes the uniform domain query primitive as three tools
// (query_describe, query_search, query_fetch) over stdio. Drop this into a
// Claude Code project MCP config (.mcp.json) and the agent gets structured
// access to the full CRM query surface without any HTTP server.
//
// Bootstraps directly: constructs QueryApplicationService(db) — no framework or
// DI container needed. registerSchema() runs once at startup to configure the
// query registry (same overlay as src/server.ts).
//
// Why no stdout logging: stdio IS the MCP transport. Anything written to
// stdout corrupts the protocol. All diagnostics go to stderr.
//
// Boot (standalone):
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/mcp.ts
//
// Or via .mcp.json (Claude Code project MCP):
//   { "mcpServers": { "query-surface": { "command": "bun",
//       "args": ["/abs/path/to/query-surface-poc/src/mcp.ts"],
//       "env": { "DATABASE_URL": "postgresql://qsp:qsp@localhost:5532/qsp" } } } }

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { db, closeDb } from './db';
import { QueryApplicationService } from './query/query.application-service';
import { registerSchema } from './query/schema-registry';
import * as schema from './schema';
import { fieldValues, fieldValuesJsonb } from './query/eav/schema';

// ---------------------------------------------------------------------------
// Schema registration — identical overlay to src/server.ts.
// ---------------------------------------------------------------------------

const EAV_OVERLAY = {
  opportunities:           { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'opportunity' },
  transcript_observations: { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  accounts:                { kind: 'jsonb-value' as const, valueTable: fieldValuesJsonb, entityTypeValue: 'account', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' },
};

registerSchema(schema as unknown as Record<string, unknown>, { eav: EAV_OVERLAY });

// ---------------------------------------------------------------------------
// Service — no DI container; db is the standalone Drizzle client.
// ---------------------------------------------------------------------------

const q = new QueryApplicationService(db);

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

const server = new McpServer(
  { name: 'query-surface', version: '0.1.0' },
  {
    capabilities: { tools: {} },
    instructions: [
      'Sales CRM data — accounts, opportunities (deals), contacts, emails, and call transcripts.',
      '',
      'Use these tools whenever the user asks about deal status, account context, sales activity,',
      'conversations with prospects/customers, call notes, email threads, pipeline, or any',
      '"find me what was said / what happened / where things stand" question.',
      '',
      'How it works:',
      '  • query_describe  — learn the schema (call FIRST if unsure of column names / enums)',
      '  • query_search    — find IDs matching filters (+ optional preview rows)',
      '  • query_fetch     — hydrate IDs into full rows with optional expand for related entities',
      '',
      'Same JSON FilterExpression across every entity. Cross-entity reach via dotted paths',
      '(e.g. opportunity.account.name). Text search: op="contains" on a column, or on="text"',
      'to fan out across the entity\'s declared searchable columns.',
      '',
      'Typical pattern: query_describe → query_search → query_fetch.',
      '',
      'Entities and key relationships:',
      '  • account      ── has many ──> opportunity, contact',
      '  • opportunity  ── has many ──> email, transcript',
      '  • opportunity  ── belongs to ──> account',
      '  • email / transcript ── belongs to ──> opportunity ── belongs to ──> account',
    ].join('\n'),
  },
);

// ---------------------------------------------------------------------------
// Shared Zod types
// ---------------------------------------------------------------------------

// FilterExpression is a recursive JSON shape; represent as passthrough JSON
// with a rich description so the agent understands the structure.
const FilterExpressionSchema = z
  .union([
    z.object({ on: z.string(), op: z.string(), value: z.unknown().optional() }),
    z.object({ and: z.array(z.unknown()) }),
    z.object({ or: z.array(z.unknown()) }),
    z.object({ not: z.unknown() }),
  ])
  .describe(
    'JSON FilterExpression. Leaf: { on, op, value } where op is eq/neq/in/nin/gt/gte/lt/lte/' +
    'between/contains/startswith/endswith/is_null/is_not_null. ' +
    'Compound: { and: [...] } | { or: [...] } | { not: ... }. ' +
    'Use on="text" to fan out across the entity\'s declared searchable columns.',
  );

const SortSchema = z.object({
  field: z.string().describe('Field name to sort by'),
  dir: z.enum(['asc', 'desc']).describe('Sort direction'),
});

const PageSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional().describe('Max rows to return (default 50)'),
  offset: z.number().int().min(0).optional().describe('Row offset for pagination'),
});

// ---------------------------------------------------------------------------
// Tool: query_describe
// ---------------------------------------------------------------------------

server.tool(
  'query_describe',
  [
    'Returns the schema you need to compose query_search / query_fetch calls correctly.',
    'Call this FIRST if unsure about column names, enum values, or relationships.',
    '',
    'Two modes:',
    '  • Omit entity → full schema for all entities in one call (recommended on first contact)',
    '  • Pass entity → just that entity\'s descriptor',
    '',
    'Response includes for each entity: columns (with types + enum values), relationships,',
    'searchableColumns, and example filter expressions. No DB call — pure metadata.',
  ].join('\n'),
  {
    entity: z.string().optional().describe(
      'Entity to describe. Omit to receive the full schema for all entities in a single call.',
    ),
  },
  async (input) => {
    try {
      const payload = input.entity
        ? await q.describe(input.entity as string)
        : await q.describe();
      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'describe_error', message: err instanceof Error ? err.message : String(err) }, null, 2),
        }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: query_search
// ---------------------------------------------------------------------------

server.tool(
  'query_search',
  [
    'Find IDs matching filters across CRM entities (accounts, opportunities, contacts, emails, transcripts).',
    '',
    'Returns IDs + total count. Use preview=true to also get curated preview rows; pass columns=[...]',
    'to instead project specific fields into each preview row (id always included; omit for the curated set).',
    'When a text op fires (contains/startswith/endswith), preview rows include a _snippets array',
    'with windowed match context. Full body of long-text columns (transcript, email) is NOT in',
    'preview — call query_fetch with the row id to get the full body.',
    '',
    'After finding IDs, use query_fetch to hydrate full rows (with optional expand for relations).',
  ].join('\n'),
  {
    entity: z.string().describe('Entity to search: accounts, opportunities, contacts, emails, transcripts, etc.'),
    filter: FilterExpressionSchema.optional(),
    sort: z.array(SortSchema).optional().describe('Sort order, e.g. [{ field: "createdAt", dir: "desc" }]'),
    page: PageSchema.optional(),
    columns: z.array(z.string()).optional().describe(
      'Projection — explicit fields to return in each preview row (id always included). Field keys ' +
      'or belongs_to dotted paths (e.g. "account.name"); has_many paths are dropped (absent from the ' +
      'row — use query_fetch + expand for child rows). Each field is returned keyed by the exact ' +
      'string you pass. Omit to get the entity\'s curated preview fields. Only applies when preview=true.',
    ),
    preview: z.boolean().optional().describe(
      'Include preview rows alongside IDs. Each row carries the entity\'s identifier columns ' +
      'plus _snippets when text ops matched.',
    ),
  },
  async (input) => {
    try {
      const result = await q.query(input.entity as string, {
        filter: input.filter as import('./query/types').FilterExpression | undefined,
        sort: input.sort as import('./query/types').Sort[] | undefined,
        page: input.page,
        columns: input.columns,
        preview: input.preview ?? false,
        include_sql: false,
      });
      const payload = { entity: input.entity, ...result };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'search_error', message: err instanceof Error ? err.message : String(err) }, null, 2),
        }],
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
    'Hydrate IDs into full rows. Typically called after query_search with the IDs it returned.',
    '',
    'Optional filter narrows within the ID set (e.g. "of these 200 IDs, only StageName=Closed Won").',
    '',
    'Optional expand attaches related entities inline (max 3 hops):',
    '  - belongs_to → object on the row (or null)',
    '  - has_many   → array on the row (or [])',
    '  Example: expand=["opportunity", "opportunity.account"]',
    '',
    'Batched: one IN-query per expand segment — no N+1.',
  ].join('\n'),
  {
    entity: z.string().describe('Entity whose rows to hydrate'),
    ids: z.array(z.string().uuid()).min(1).max(500).describe('IDs to hydrate (from a prior query_search call)'),
    filter: FilterExpressionSchema.optional().describe('Optional refinement filter — narrows the ID set further'),
    expand: z.array(z.string()).optional().describe(
      'Inline-attach related entities. Dotted paths up to 3 hops. ' +
      'Example: ["opportunity", "opportunity.account"]',
    ),
  },
  async (input) => {
    try {
      const result = await q.fetch(input.entity as string, input.ids, {
        filter: input.filter as import('./query/types').FilterExpression | undefined,
        expand: input.expand,
        include_sql: false,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'fetch_error', message: err instanceof Error ? err.message : String(err) }, null, 2),
        }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Intentionally no stdout — stdio is the transport. Use stderr for diagnostics.
  process.stderr.write('query-surface MCP server started\n');
}

main().catch(err => {
  process.stderr.write(`MCP server failed to start: ${err instanceof Error ? err.message : String(err)}\n`);
  closeDb().finally(() => process.exit(1));
});

process.on('SIGTERM', () => { closeDb().finally(() => process.exit(0)); });
process.on('SIGINT',  () => { closeDb().finally(() => process.exit(0)); });
