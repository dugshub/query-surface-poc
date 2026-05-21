# What this POC validates

A one-page summary of the proposal — full source material in
[`./thoughts/`](./thoughts/) (mirror of the originals in
`../../dealbrain-integrations/.ai-docs/discussions/2026-05-20/`).

## The proposal in one sentence

A uniform domain query surface — ONE JSON FilterExpression language —
expressing every cross-entity, text-search, and structured-filter question
the agent needs to ask, with the entity YAML as the single source of truth.

## Why it matters

Today's MCP surface in `dealbrain-crm` has:
- Per-entity `list_*` tools with bespoke filter args (each entity invents its
  own dialect)
- No cross-entity reachability (queries like "transcripts of opportunities
  in stage X" require chained calls)
- One monolithic `search_deal_context` doing both ranked retrieval AND
  structured filtering, with no clean separation

The agent learns 10 dialects, can't compose across entities, and pays for
ranked retrieval even on exact-filter queries.

The proposal: replace the per-entity dialect explosion with ONE uniform
primitive. Cross-entity reach via dotted field paths. Text search as a
composable op. Same vocabulary across every entity.

## What this POC proves

| Claim from the proposal | POC evidence |
|---|---|
| One language can express cross-entity composable filters | Q1–Q3, Q6 in `bun src/demo-api.ts` |
| Text search is just another op, not a special tool | `on: 'text'` field, Q4–Q5 |
| Multi-entity dispatch happens by fanning the same filter across entities | Scene 1 in demo-api |
| Two-stage IDs-first, fetch-later is the natural agent pattern | Scenes 3-4 |
| Refinement at fetch time avoids extra round-trips | Scene 5 |
| Cross-entity reach falls out of repository-declared relationships | Q2, Q6 — the proof point |
| The substrate is generic; codegen can emit it | `src/generated/query-registry.ts` is hand-authored as a placeholder; codegen would emit exactly this shape |
| Drizzle does the work; we never hand-write SQL | `include_sql: true` shows the compiler's output is real Drizzle-generated SQL |

## What's still hand-authored (and would be codegen-emitted in production)

- `src/generated/query-registry.ts` — codegen would read entity YAMLs
- `entityName` on each `<entity>.repository.ts` — codegen would emit one line
- `src/shared/base-classes/*` modifications — kit-side change to the family
  base classes

See [`upstream-kit-contributions.md`](./upstream-kit-contributions.md) for the
full lift-into-kit plan.

## Where to go from here

- **For the proposal narrative**: [`./thoughts/position-memo.md`](./thoughts/position-memo.md)
- **For the architecture sketch**: [`./thoughts/uniform-query-surface-architecture.md`](./thoughts/uniform-query-surface-architecture.md)
- **For the per-entity gap analysis vs. the existing dealbrain MCP surface**: [`./thoughts/dealbrain-today-vs-proposed.md`](./thoughts/dealbrain-today-vs-proposed.md)
- **For the 5 illustrative dealbrain-specific entity manifests**: [`./thoughts/entities/`](./thoughts/entities/)
