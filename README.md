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
| [`docs/demo-queries.md`](./docs/demo-queries.md) | The 6 escalating example queries |

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

> *"Find transcript chunks discussing 'pricing' from transcripts of opportunities currently in stage 'Closing.'"*

```bash
curl -X POST http://localhost:3577/search -H 'Content-Type: application/json' -d '{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "body", "op": "contains", "value": "pricing" },
      { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
    ]
  }
}'
# → { "entity": "transcript_chunk", "ids": [...8 IDs...], "total": 8, "has_more": false }
```

One call. Composes:
- ILIKE text search on `transcript_chunk.body`
- Two-hop cross-entity reach via `transcript → opportunity`
- Categorical filter on `opportunity.stage`

That's the unlock the proposal argues for. No special operators, no per-entity dialects.

## API surface

| Endpoint | Purpose |
|---|---|
| `POST /search` | Find things. Returns IDs (+ optional preview). Single entity OR multi-entity array. Supports the magic `on: 'text'` field that fans across declared searchable columns. |
| `POST /fetch` | Hydrate IDs into full rows. Optional refinement filter narrows within the ID set. |

Full request/response shapes are in [`src/query/types.ts`](./src/query/types.ts).

## Entity model

```
account ─< opportunity ─< email
                     │
                     └─< transcript ─< transcript_chunk
```

Chunked transcripts make ACROSS and WITHIN text search the same primitive — different root entity, same compiler:

- **ACROSS**: `entity: 'transcript', filter: { on: 'chunks.body', op: 'contains', value: 'X' }` — list parent transcripts where ANY child chunk matches (compiles to EXISTS subquery)
- **WITHIN**: `entity: 'transcript_chunk', filter: { and: [{ on: 'transcript_id', op: 'eq', value: ID }, { on: 'body', op: 'contains', value: 'X' }] }` — list child chunks of a known parent matching pattern

## Branches

- `main` — pre-refactor baseline (`POST /query` direct-runQuery)
- `feat/repo-based-architecture` *(current)* — repo-routed flow (HTTP → service → repo → compiler)

`git diff main..feat/repo-based-architecture` shows the full transition. Both branches pass the full 18-assertion verification ledger.

## License

MIT (consistent with `codegen-patterns`)
