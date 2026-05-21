# query-surface-poc

A working consumer of [`pattern-stack/codegen-patterns`](../codegen-patterns) that validates the **uniform domain query surface** proposal: cross-entity composable filters + grep-equivalent text search (across-corpus *and* within-document) over CRM entities, exposed as one JSON shape over HTTP.

```
HTTP /search → Controller → Service → Repository → FilterCompilerService → Drizzle → rows
```

The repository is the entry point. The compiler is the engine. The registry is the entity graph. Everything is `@pattern-stack/codegen`-compatible — the hand-authored bits in `src/query/` describe what the kit should ultimately emit.

## Read these first

| File | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Canonical agent-facing instructions (architecture, commands, conventions, gotchas) |
| [`PROGRESS.md`](./PROGRESS.md) | Build log — dogfood bugs hit + fixed, refactor milestones, verification ledger |
| [`PLAN.md`](./PLAN.md) | Original scope + decisions |
| [`docs/architecture.md`](./docs/architecture.md) | The 5-layer flow, end to end |
| [`docs/proposal-summary.md`](./docs/proposal-summary.md) | What this POC is validating (1-page) |
| [`docs/upstream-kit-contributions.md`](./docs/upstream-kit-contributions.md) | What to lift into `codegen-patterns` |
| [`docs/filter-compiler-design.md`](./docs/filter-compiler-design.md) | FilterCompiler internals |
| [`docs/demo-queries.md`](./docs/demo-queries.md) | The 6 escalating example queries **+ ~25 agent test questions across 7 tiers** for exercising the MCP tool end-to-end |
| [`docs/mcp-integration.md`](./docs/mcp-integration.md) | MCP server setup for Claude Code |

The proposal docs this POC validates live at [`../dealbrain-integrations/.ai-docs/discussions/2026-05-20/`](../dealbrain-integrations/.ai-docs/discussions/2026-05-20/).

## Quick start

```bash
# One-time
mise install                                          # pins bun + node (optional)
bun install                                           # deps
docker-compose up -d                                  # local Postgres on :5532

# Schema + data
bunx drizzle-kit push                                 # create tables
bun src/seed.ts                                       # populate demo data

# Boot
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp \
  PORT=3577 bun src/main.ts                           # NestJS server

# Demo
bun src/demo-api.ts                                   # 5-scene agent-facing HTTP demo
bun src/demo.ts                                       # legacy CLI (direct runQuery)
```

## The proof-point query

> *"Find transcripts discussing 'pricing' from opportunities currently in stage 'closing'."*

```bash
curl -X POST http://localhost:3577/search -H 'Content-Type: application/json' -d '{
  "entity": "transcript",
  "filter": {
    "and": [
      { "on": "transcript", "op": "contains", "value": "pricing" },
      { "on": "opportunity.stage", "op": "eq", "value": "closing" }
    ]
  }
}'
# → { "entity": "transcript", "ids": [...3 IDs...], "total": 3, "has_more": false }
```

One call. Composes:
- ILIKE text search on `transcripts.transcript`
- Cross-entity reach via `transcript → opportunity`
- Categorical filter on `opportunity.stage`

That's the unlock the proposal argues for. No special operators, no per-entity dialects.

## API surface

Three transport options, same JSON shape across all of them:

| Transport | What |
|---|---|
| **`POST /search`** | HTTP. Find IDs (+ optional preview rows + `_snippets` when text op fires). Single-entity or multi-entity array. Magic `on: 'text'` fans across declared searchable columns. |
| **`POST /fetch`** | HTTP. Hydrate IDs into full rows. Optional refinement filter. Optional `expand` attaches related entities inline (belongs_to → object, has_many → array, nested up to 3 hops). |
| **MCP tools** `query_search` / `query_fetch` | stdio MCP server. Same shapes wrapped as MCP tools for Claude Code / any MCP client. |

Full request/response shapes are in [`src/query/types.ts`](./src/query/types.ts).

### Snippets — additive metadata when text ops fire

When `preview: true` AND a `contains` / `startswith` / `endswith` op is in the filter, each matching preview row gets an additional `_snippets` array. The original column values stay untouched:

```json
{
  "id": "...",
  "subject": "Re: Pricing for Q3 deal",           // unchanged
  "body": "Thanks for the breakdown...",           // unchanged
  "_snippets": [
    {
      "column": "body",
      "snippet": "…breakdown. The pricing tier feels high — can we discuss volume…",
      "match": { "start": 30, "end": 37 },        // offsets within the snippet
      "full_length": 106                          // length of the source column
    }
  ]
}
```

Multi-column matches (text-magic across `[subject, body]`) yield multiple entries.

### Expand — relational hydration on /fetch

`expand: ['opportunity', 'opportunity.account', 'chunks']` enriches rows inline:

- `belongs_to` → child object on the row (or `null` if FK is missing)
- `has_many` → array on the row (or `[]` if no children)
- Nested paths recurse on the attached children, up to 3 hops
- Batched: ONE `WHERE id IN (...)` per segment — no N+1
- Invalid paths or depth-exceeded → HTTP 400 `compile_error`

## MCP setup (Claude Code or any MCP client)

The POC ships an MCP server that exposes `query_search` and `query_fetch` as tools. Register it in Claude Code's config (`~/.claude/settings.json` or your project-level `settings.local.json`):

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

Once configured, Claude Code can call the tools directly. Example natural-language → tool call:

> *"Find transcript chunks where pricing came up in deals that are currently closing."*

→ Claude emits `query_search` with the JSON FilterExpression, gets back IDs + snippets, optionally chains a `query_fetch` to hydrate.

See [`docs/mcp-integration.md`](./docs/mcp-integration.md) for the full setup walkthrough.

## Entity model

```
account ─< opportunity ─< email
   │                  └─< transcript    (direct FK — POC cheat; prod routes via meetings M2M)
   │
   └─< contact
```

Mirrors dealbrain's live schema (`/Users/dug/Projects/dealbrain-crm/dealbrain/packages/db/src/server/schema.ts`):

- **Transcript body lives inline** in the `transcript` text column (matches production). Search is ILIKE on a single column; no chunks table.
- **EAV fields flattened.** Production stores `stage`, `amount`, `closeDate`, etc. in `field_values` keyed by `field_definitions`. The POC flattens these to real columns so demos can target them directly. EAV resolution is a separate compiler enhancement (same shape as cross-entity reach — see `docs/upstream-kit-contributions.md`).
- **Transcript → Opportunity is a direct FK** in the POC; production routes through `opportunity_meetings` (M2M) → `meetings` ← `transcript.meetingId`. M2M support is out of scope for this branch.
- **Text-magic fan-out** on transcripts ORs across 5 text columns (`title`, `transcript`, `summary`, `user_notes`, `enhanced_notes`).

## Branches

- `main` — pre-refactor baseline (`POST /query` direct-runQuery)
- `feat/repo-based-architecture` *(current)* — repo-routed flow (HTTP → service → repo → compiler)

`git diff main..feat/repo-based-architecture` shows the full transition. Both branches pass the full 18-assertion verification ledger.

## License

MIT (consistent with `codegen-patterns`)
