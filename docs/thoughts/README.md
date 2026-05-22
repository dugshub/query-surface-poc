# Thoughts — proposal source material

Mirror of the planning + comparison docs this POC was built to validate.

## Origin

Originally written in the sibling `dealbrain-integrations` workspace at:

```
/Users/dug/Projects/dealbrain-integrations/dealbrain-integrations/.ai-docs/discussions/2026-05-20/
```

These predate the POC. They were the prep for a 2026-05-20 team meeting about
the uniform domain query surface. The POC in this repo was built to validate
what they argue for, end-to-end.

Copied here so the proposal narrative lives alongside the running code that
demonstrates it — no jumping between workspaces to re-orient.

## What's in this directory

| File | Lines | Purpose |
|---|---|---|
| [`uniform-query-surface-architecture.md`](./uniform-query-surface-architecture.md) | 254 | The proposal in detail — three layers (primitive / convenience / Cube analytics), entity manifest shape, `FilterExpression` type, two example calls, org/tenant scoping, mapping to AloeVera and codegen-patterns analogs. |
| [`dealbrain-today-vs-proposed.md`](./dealbrain-today-vs-proposed.md) | 199 | Per-entity gap analysis vs. the existing dealbrain MCP surface. Each existing entity gets: today's filter shape, what the agent CAN'T ask, what the proposed `query_domain` call would look like. |
| [`entities/account.yaml`](./entities/account.yaml) | 64 | Illustrative manifest — CRM family, EAV dynamic fields |
| [`entities/contact.yaml`](./entities/contact.yaml) | 66 | Illustrative manifest — CRM family |
| [`entities/opportunity.yaml`](./entities/opportunity.yaml) | 117 | Illustrative manifest — CRM family, EAV honesty for stage/amount, cross-package relationships |
| [`entities/meeting.yaml`](./entities/meeting.yaml) | 80 | Illustrative manifest — Activity family, cross-package opportunity reach |
| [`entities/fact.yaml`](./entities/fact.yaml) | 101 | Illustrative manifest — Knowledge family, lifecycle (active/historical/retracted) |

Total: 881 lines.

## Relationship to the POC

| What the doc argues | What the POC demonstrates |
|---|---|
| One JSON FilterExpression language across entities | `src/query/types.ts` + `compiler.ts` |
| Cross-entity reach via dotted field paths | `account.industry`, `transcript.opportunity.stage` — proof-point Q6 |
| Text search is a composable op, not a separate tool | `on: 'contains'` / `on: 'text'` magic fan-out |
| Three layers (primitive / convenience / analytics) | Layer 1 (primitive) built; layer 3 (Cube) deferred |
| EAV resolution by the compiler, not post-retrieval | NOT YET in the POC — flattened to real columns for now; v2 work in `docs/upstream-kit-contributions.md` |

## Drift policy

These are a snapshot, not the canonical source. If the proposal evolves, edit
the originals in `dealbrain-integrations/...` first; then `cp` over here.

Don't edit-in-place — the cross-workspace doc is the authority because that's
what other teams reference.
