# query-surface-poc — Plan

**Status:** ✅ DELIVERED — CLI demo working end-to-end as of 2026-05-21 ~14:35 PT.
**MCP tool:** deferred (stretch, post-meeting). See PROGRESS.md for full details.
**Companion docs:** [`../dealbrain-integrations/.ai-docs/discussions/2026-05-20/`](../dealbrain-integrations/.ai-docs/discussions/2026-05-20/)

## Why this exists

Demo-quality CRUD app on top of `pattern-stack/codegen-patterns` that proves the uniform-query-surface proposal works end-to-end. The team meeting where the proposal is pitched is later today.

The demo unlocks the question: *"can the agent compose a single call that filters cross-entity AND does grep-equivalent text search?"* If yes → the proposal is concrete, not hypothetical.

## Entity model (5 entities, 4 relationships)

```
account ─< opportunity ─< email
                     │
                     └─< transcript ─< transcript_chunk
```

| Entity | Family | Why |
|---|---|---|
| `account` | crm (=synced base) | CRM root |
| `opportunity` | crm | belongs_to account; cross-entity filter target with `stage` enum and `amount` numeric |
| `email` | activity | belongs_to opportunity; short `body` text, searched with ILIKE directly |
| `transcript` | activity | belongs_to opportunity; has_many chunks (the parent shell — no body itself) |
| `transcript_chunk` | activity | belongs_to transcript; carries `body` + `speaker` + `position`; the row that matches WITHIN search |

### The architectural insight

By making transcripts chunked (transcript has_many transcript_chunks), both ACROSS and WITHIN text search fall out of the SAME `query_domain` primitive — no special operator needed:

- **ACROSS** = `query_domain(entity='transcript', filter={on: 'chunks.body', op: 'contains', value: 'renewal'})` — list parent transcripts where ANY child chunk matches
- **WITHIN** = `query_domain(entity='transcript_chunk', filter={and: [{on: 'transcript_id', op: 'eq', value: X}, {on: 'body', op: 'contains', value: 'pricing'}]})` — list child chunks of a known transcript matching pattern

Same primitive, different root entity. The composability holds without operator inflation.

## Proof-point query (the "this is the unlock" demo)

> *"Find transcript chunks discussing 'pricing' from transcripts of opportunities currently in stage 'Closing.'"*

Composes:
1. Filter on `transcript_chunk.body` (text search via ILIKE)
2. Through `transcript_chunk → transcript → opportunity` (cross-entity reach, 2-hop join)
3. Filter on `opportunity.stage` (categorical)

If this works as **one** `query_domain` call, the demo lands.

## Build phases

1. **[research] Deep codegen-patterns digest** — spawned subagent
2. **[scaffold] Sandbox shell** — package.json, codegen.config.yaml, tsconfig, docker-compose, drizzle.config, app.module shell, justfile, mise.toml
3. **[yaml] 5 entity manifests** — calibrated to what the kit accepts
4. **[gen] Run codegen, fix dogfood bugs**
5. **[filter] FilterCompiler hand-authored** — JSON FilterExpression → Drizzle query with cross-entity joins. Ops: eq/neq/in/nin/gt/gte/lt/lte/contains/startswith/and/or/not/has_any
6. **[seed] Demo data** — 3 accounts, ~10 opportunities (mix of stages), ~30 emails, ~15 transcripts × ~20 chunks each
7. **[demo] CLI script** — `bun demo.ts` runs the 5–6 demo queries, prints results
8. **[stretch] MCP tool** — wraps `query_domain` for Claude Code access

## Autonomous decisions made (override later if wrong)

| Decision | Rationale |
|---|---|
| Chunked transcripts, not chunked emails | Emails ~3 paragraphs; chunks pure overhead. Transcripts 5K–50K words; chunks essential. |
| ILIKE not `ts_vector` for text search | Demo scale fine, no GIN index migration to fight with the kit. |
| Sandbox at `/Users/dug/Projects/dealbrain-integrations/query-surface-poc/` | Sibling of `codegen-patterns/`; workspace dep via `../codegen-patterns`. |
| CLI demo before MCP tool | Fewer moving parts, same proof. MCP if time permits. |
| `stage` + `amount` as real columns on opportunity (not EAV) | This is a POC, not dealbrain. EAV honesty was for the dealbrain manifests; here the columns demo cross-entity filter cleanly. |
| TypeScript + NestJS + Drizzle + Postgres + bun | Matches kit + dealbrain stack. |

## Risks tracked

- **codegen-patterns dogfood issues** (declarative-query repo methods, EJS escape, clean-lite-ps controller writes missing, drizzle skew). Subagent is checking which survived to main.
- **Cross-entity joinable filters are not emitted by the kit.** That's the hand-authored FilterCompiler — entirely new code. ~1–2h focused work.
- **Workspace dep resolution.** Drizzle version skew between consumer and kit runtime could surface; fix by pinning to whatever the kit's runtime expects.
- **My session lost writes once already.** Verify every important write with `cat`/`ls` follow-up.

## What done looks like

A user running `cd query-surface-poc && bun demo.ts` sees:
1. Postgres comes up via docker-compose
2. Schema migrates
3. Seed data lands
4. ~6 demo queries run, each printing: the JSON FilterExpression, the compiled SQL (via `include_sql: true`), and the result rows
5. The proof-point query prints transcript chunks with surrounding context, showing the agent's view

If MCP tool ships: open Claude Code, ask the proof-point question in natural language, watch the model compose the call.
