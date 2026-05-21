# query-surface-poc

POC consumer of `pattern-stack/codegen-patterns` demonstrating the **uniform domain query surface** proposal — cross-entity composable filters plus grep-equivalent text search (across-corpus + within-document) over CRM entities.

See [`PLAN.md`](./PLAN.md) for full scope, [`PROGRESS.md`](./PROGRESS.md) for build status, and [`../dealbrain-integrations/.ai-docs/discussions/2026-05-20/`](../dealbrain-integrations/.ai-docs/discussions/2026-05-20/) for the meeting docs this proves out.

## Quick start (when ready)

```bash
mise install              # pins bun + node
bun install               # deps
just db-up                # docker-compose Postgres
just gen-all              # codegen → modules/<plural>/
just db-push              # drizzle push schema
bun seed.ts               # populate demo data
bun demo.ts               # run example queries
```

## The proof-point query

> *"Find transcript chunks discussing 'pricing' from transcripts of opportunities currently in stage 'Closing.'"*

Composes:
1. ILIKE filter on `transcript_chunk.body` (text search)
2. Cross-entity reach: `transcript_chunk → transcript → opportunity`
3. Categorical filter on `opportunity.stage`

One `query_domain` call. If this works end-to-end, the proposal is concrete.

## Entity model

```
account ─< opportunity ─< email
                     │
                     └─< transcript ─< transcript_chunk
```

Chunked transcripts are the architectural insight: ACROSS and WITHIN text search both fall out of the same `query_domain` primitive — no special operator needed.

- **ACROSS** = `query_domain(entity='transcript', filter={on: 'chunks.body', op: 'contains', value: 'X'})`
- **WITHIN** = `query_domain(entity='transcript_chunk', filter={and: [{on: 'transcript_id', op: 'eq', value: ID}, {on: 'body', op: 'contains', value: 'X'}]})`
