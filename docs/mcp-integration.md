# MCP integration — query_search + query_fetch as Claude Code tools

The POC ships a stdio MCP server (`src/mcp-server.ts`) that exposes the
uniform query primitive as two tools any MCP client can call:

- `query_search` — find IDs (+ optional preview rows with `_snippets`)
- `query_fetch` — hydrate IDs into full rows (+ optional `expand`)

Both tools accept the exact same JSON shapes as `POST /search` and `POST /fetch`,
so anything that works via curl works via the agent.

## Setup — Claude Code

Add the server to Claude Code's MCP configuration. Either at the user level
(`~/.claude/settings.json`) or project level (`.claude/settings.local.json`):

```json
{
  "mcpServers": {
    "query-surface-poc": {
      "command": "bun",
      "args": ["/absolute/path/to/query-surface-poc/src/mcp-server.ts"],
      "env": {
        "DATABASE_URL": "postgresql://qsp:qsp@localhost:5532/qsp"
      }
    }
  }
}
```

Replace `/absolute/path/to/...` with the actual path on your machine.

Claude Code spawns the server on startup, connects over stdio, registers the
tools. You can then ask in natural language and Claude will call the tools.

### Prerequisites

- Postgres running (`docker-compose up -d`)
- Demo data seeded (`bun src/seed.ts`)
- `bun` available on PATH

## Tool reference

### `query_search`

Find IDs by composing filters. Accepts EITHER single-entity inline OR
multi-entity array.

**Single-entity input:**

```ts
{
  entity: 'account' | 'opportunity' | 'email' | 'transcript' | 'transcript_chunk',
  filter?: FilterExpression,           // JSON DSL — same as HTTP body
  sort?: Array<{ field: string; dir: 'asc' | 'desc' }>,
  page?: { limit?: number; offset?: number },
  preview?: boolean                    // include curated columns + _snippets
}
```

**Multi-entity input:**

```ts
{
  queries: [
    { entity: 'email',      filter: {...} },
    { entity: 'transcript', filter: {...} }
  ],
  preview?: boolean
}
```

**Single-entity output:**

```ts
{
  entity: '<entity>',
  ids: string[],
  total: number,
  has_more: boolean,
  preview?: Array<Record<string, unknown>>   // each row may have a _snippets array
}
```

**Multi-entity output:**

```ts
{
  results: {
    [entity]: { ids: string[]; total: number; has_more: boolean; preview?: ... }
  }
}
```

### `query_fetch`

Hydrate IDs into full rows. Typically called after `query_search`.

**Input:**

```ts
{
  entity: '<entity>',
  ids: string[],                       // 1-500
  filter?: FilterExpression,           // optional refinement
  expand?: string[]                    // dotted paths, max 3 hops
}
```

**Output:**

```ts
{
  entity: '<entity>',
  rows: Array<Record<string, unknown>>,  // expanded relations attached inline
  count: number
}
```

## Try it from the natural-language side

Once registered, try asking Claude Code:

> *"Find transcript chunks where pricing was discussed in deals that are currently closing, and show me the full context."*

Claude should:
1. Call `query_search` with the proof-point filter (text contains pricing + cross-entity stage filter)
2. Read the returned IDs + snippets
3. Call `query_fetch` with those IDs and `expand: ["transcript.opportunity.account"]`
4. Render the results conversationally

## Verifying the server works (without Claude Code)

`bun src/mcp-test.ts` spawns the MCP server via stdio and exercises it as a
client:

```bash
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/mcp-test.ts
```

Output is a 5-test verification:

1. `tools/list` — both tools present with descriptions
2. Proof-point `query_search` — returns 8 matches with snippets
3. `query_fetch` with full expand chain — 3-hop ancestor chain inline
4. Multi-entity `query_search` — email + transcript in parallel
5. Error path — invalid expand returns structured compile_error

## How it works

```
Claude Code
   │  spawns subprocess via stdio
   ▼
bun src/mcp-server.ts                     ← McpServer + StdioServerTransport
   │  bootstraps NestJS via NestFactory.createApplicationContext(AppModule)
   │  resolves AccountService / OpportunityService / ContactService /
   │           EmailService / TranscriptService from the DI graph
   ▼
tool handler → serviceFor(entity).search/fetch(...)
   │  → ServiceBase.search() → this.repository.search()
   │  → BaseRepository.search() → this.filterCompiler.search()
   │  → FilterCompilerService → runSearch/runFetch (pure compiler)
   ▼
Drizzle + Postgres via DatabaseModule (DRIZZLE token)
```

**Same code path as the HTTP controllers.** Both transports route through
Service → Repository → FilterCompilerService → compiler. Any cross-cutting
concern added at the repo layer (soft-delete filtering, actor scoping, audit
logging) applies to both uniformly.

No HTTP. No port. The MCP server is a standalone Nest context — `bun`
spawns it on demand; Claude Code keeps the subprocess alive between calls.

## Architectural notes

- **The MCP tools use the same Zod schemas** the HTTP controllers use
  (`src/query/zod-schemas.ts`). Validation happens at the SDK layer via the
  tool input shape; compile errors come back as `{ isError: true,
  structuredContent: { error: 'compile_error', message } }`.
- **`structuredContent`** is populated alongside `content[0].text` so MCP
  clients that prefer the structured payload (e.g., Claude Chat) get it
  without parsing JSON-in-text.
- **Per-tool error handling** classifies compile errors into structured
  responses; unexpected throws bubble up as protocol-level errors.
- **Nest logger disabled** (`{ logger: false }` on bootstrap) — stdout is the
  MCP transport, so Nest's default stdout logger would corrupt the protocol.
  Diagnostics that escape go to stderr.
- **DB connection lifecycle** — the DatabaseModule's Drizzle pool stays open
  for the process's lifetime. `app.close()` on SIGTERM/SIGINT releases it.
- **Cold-start cost** — Nest bootstrap is ~300–500ms on first spawn. Claude
  Code keeps the MCP subprocess alive between sessions, so the tax is paid
  once per editor session, not per tool call.
- **`query_describe`** intentionally does NOT touch Nest — it's a pure read
  off `agent-schema.ts`. Cheap to call, no DB roundtrip.

## Gotchas

- **`bun` must be on PATH** — Claude Code spawns the server using whatever's
  in the `command` field. Use the absolute path to `bun` if PATH issues
  arise (`which bun`).
- **`DATABASE_URL` must be set in the env block** — the subprocess doesn't
  inherit your shell env when spawned by Claude Code.
- **Docker Postgres must be running** before Claude Code starts. The MCP
  server will fail to boot if it can't reach the DB.
- **No hot reload** — Claude Code keeps the same MCP subprocess alive across
  sessions. If you edit `mcp-server.ts`, restart Claude Code (or use the
  Claude Code MCP "Restart server" UI).
