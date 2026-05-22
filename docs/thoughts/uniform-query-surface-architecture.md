# Architecture sketch: uniform domain query surface

**Companion to:** [`dealbrain-today-vs-proposed.md`](./dealbrain-today-vs-proposed.md)

This document describes the shape of the proposed retrieval layer. It is intentionally minimal — enough to align on the contract, not enough to be a build spec. A build spec lives downstream of "yes, let's go."

## Goals

1. The agent gets a **single, uniform retrieval idiom** that works the same way across every CRM entity. It learns the verb set once and reuses it.
2. Filters are **composable across entity boundaries** — "meetings whose deal's account is in industry X and that have facts of classification Y" is one call, not three.
3. The convenience tools we already have (`list_action_items`, `search_deal_context`, `list_deal_updates`, …) **continue to exist** but are reframed as named compilations of underlying primitives. They become the "observed common queries" layer.
4. The substrate is **codegen-friendly** — entity manifests describe the schema, primitives are generated. We don't hand-author N filter dialects.
5. The substrate is **honest about what it can and can't do** — exact-filter / sort / paginate / join semantics in the primitive layer; aggregation / cross-entity measures in the analytics layer (Cube); embeddings / fuzzy / semantic recall stays where it earns its cost (the fact engine, today).

## Three layers

```
┌────────────────────────────────────────────────────────┐
│  Convenience MCP tools  (the surface sellers see)      │
│  list_action_items / list_meetings / search_deal_      │
│  context / list_deal_updates — bespoke wrappers that   │
│  compile to one or more primitive calls.               │
├────────────────────────────────────────────────────────┤
│  Uniform domain query primitive  (the substrate)       │
│  query_domain(entity, filter, sort, search, page,      │
│                expand, include_sql?)                   │
│  get_entity(entity, id, expand)                        │
├────────────────────────────────────────────────────────┤
│  Generated repositories + Cube semantic layer          │
│  Drizzle queries (filter / join / sort / paginate)     │
│  Cube measures / dimensions for cross-entity aggregate │
│  questions ("count of pain_points by industry × stage") │
└────────────────────────────────────────────────────────┘
```

The agent calls either layer. For "fetch me these three Meetings linked to deal X" it hits a convenience tool. For "find meetings linked to deals in industry Y where the buyer mentioned Z" — a query that doesn't exist as a convenience tool — it composes a `query_domain` call.

## Layer 1: Entity primitive

Each CRM entity exposes the same interface. The interface is **generated from a YAML manifest**, not hand-written per entity (this is the codegen-patterns angle).

### Entity manifest (illustrative)

```yaml
# entities/meeting.yaml
entity:
  name: meeting
  plural: meetings
  table: meetings
  family: activity                          # CRM | activity | metadata | knowledge
                                            # families ship pre-built query patterns

fields:
  occurred_at:    { type: datetime, required: true, index: true }
  duration_min:   { type: integer }
  source:         { type: enum, choices: [google_calendar, manual] }
  status:         { type: enum, choices: [scheduled, completed, cancelled] }
  visibility:     { type: enum, choices: [visible, hidden] }

behaviors:
  - timestamps
  - org_scoped                              # tenant filter applied automatically
  - opportunity_scoped                      # deal filter applied automatically

relationships:
  deal:    { type: belongs_to, target: opportunity, foreign_key: opportunity_id }
  account: { type: through,    via: deal.account_id }
  artifact:{ type: has_one,    target: artifact, foreign_key: source_artifact_id }
  facts:   { type: has_many,   target: fact,     foreign_key: source_artifact_id, via: artifact }

queries:                                    # codegen emits typed repository methods + use cases
  - by: [opportunity_id]
    order: occurred_at desc
  - by: [opportunity_id, status]
    order: occurred_at desc
  - by: [occurred_at_range]
    order: occurred_at asc

dimensions:                                 # exposed to Cube + to filter joins
  - source
  - status
  - occurred_at:    { granularity: [day, week, month] }
  - deal.stage                              # cross-entity dimension via relationship
  - account.industry

measures:
  - count
  - avg_duration_min
```

### What gets generated

From this manifest, codegen emits:

- A typed Drizzle entity + table + types
- A `MeetingRepository` extending the `activity` family base, with typed methods for each declared query (`findByOpportunityId`, `findByOpportunityIdAndStatus`, `findByOccurredAtRange`)
- A `MeetingService` with the same shape, layering org/opportunity scoping
- A `MeetingQueryPort` exposing the uniform shape (see below)
- Cube schema files (under `model/cubes/meeting.cube.js`) for the analytics layer
- NestJS module wiring + barrel re-export

### Primitive surface

```ts
interface DomainQueryRequest<E extends EntityName> {
  entity: E;
  filter?: FilterExpression<E>;             // composable boolean algebra
  sort?:   Sort<E>[];
  search?: SearchExpression<E>;             // optional keyword search over indexed text fields
  page?:   { cursor?: string; limit?: number };
  expand?: ExpandExpression<E>;             // shallow joins for related entities
  include_sql?: boolean;                    // debug surface, off in prod
}

type FilterExpression<E> =
  | LeafFilter<E>
  | { and: FilterExpression<E>[] }
  | { or:  FilterExpression<E>[] }
  | { not: FilterExpression<E> };

interface LeafFilter<E> {
  on: FieldPath<E>;                         // 'occurred_at' | 'deal.stage' | 'facts.classification'
  op: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte'
    | 'before' | 'after' | 'between'
    | 'contains' | 'startswith' | 'endswith'
    | 'exists' | 'is_null'
    | 'has_any' | 'has_all'                 // for has_many relationships
    | 'joined_to';                          // cross-entity reachability test
  value: unknown;                           // schema-checked against the field type
}
```

The `FieldPath<E>` type is generated from the manifest and includes dotted paths through declared relationships. The compiler validates that `'facts.classification'` is reachable from `meeting` via the `facts` has_many.

### Example calls

**Simple:** "Recent completed meetings for deal X."

```json
{
  "entity": "meeting",
  "filter": { "and": [
    { "on": "deal.id", "op": "eq", "value": "deal_abc" },
    { "on": "status", "op": "eq", "value": "completed" }
  ]},
  "sort": [{ "field": "occurred_at", "dir": "desc" }],
  "page": { "limit": 5 }
}
```

**Cross-entity:** "Meetings in the last 30 days for deals whose account industry is fintech, where at least one fact extracted from the meeting is classified `pain_point`."

```json
{
  "entity": "meeting",
  "filter": { "and": [
    { "on": "occurred_at", "op": "after", "value": "2026-04-19T00:00:00Z" },
    { "on": "account.industry", "op": "eq", "value": "fintech" },
    { "on": "facts",
      "op": "has_any",
      "value": { "filter": { "on": "classification", "op": "eq", "value": "pain_point" } } }
  ]},
  "expand": ["deal", "account", "facts"],
  "page": { "limit": 25 }
}
```

The agent doesn't have to chain three tool calls and merge in its context window. The query layer compiles this to a single Drizzle query with the correct joins (or, in the analytics path, a Cube query).

## Layer 2: Convenience tools

Each of the existing MCP tools becomes a named compilation. `list_action_items(status='pending', due_before='2026-06-01')` continues to exist, with the same arguments and output shape, but its registrar internally calls `query_domain` rather than reimplementing its own filter dialect.

This is the same pattern AloeVera's `aloevera_reporting_agent` uses: predefined report tools (`get_spending_by_category`, `budget_comparison`, …) for observed common patterns, plus a generic `custom_query` for the composable escape hatch. The seller-facing convenience doesn't go away — it just stops being the only path.

### What this buys

- Bespoke filter dialects (which today differ per tool: `list_action_items` takes `status`/`due_before`; `list_artifacts` takes a different set) collapse into one operator vocabulary.
- New convenience tools are cheap to add — they're a parameter mapping over `query_domain`, not a new module.
- The agent learns to escalate from convenience → primitive when the convenience doesn't cover its question, instead of giving up.

## Layer 3: Cube analytics surface

For aggregate / measure / dimension questions that are awkward in the primitive layer:

- "Count of `pain_point` facts by industry × stage × month."
- "P50 deal cycle length by industry, prior-year comparison."
- "Top 10 product-request themes by frequency in the last quarter, grouped by industry."

Codegen emits Cube schema files (`*.cube.js`) from the same entity manifest. Cube handles join inference, dimension resolution, aggregation, and pre-aggregation caching. The agent gets a separate MCP tool — `query_analytics(measures, dimensions, filters, time_dimension)` — that compiles to a Cube query.

Cube vs. hand-written aggregation in the primitive layer is a real call. The reason to prefer Cube:

- Pre-aggregation caching is built in (cheaper repeat queries)
- Time-based comparisons (PoP, prior-year) are a first-class feature
- We get a queryable metadata surface for the agent to introspect dimensions/measures cheaply
- The semantic layer is the right tool for the kind of inter-deal questions Nick called out

The reason to *not* over-commit yet: it's an infra dependency we don't yet run. The first-slice proposal in the memo doesn't require Cube — we can prove the primitive-layer shape works first, and bring Cube in for the analytics slice once we're confident in the entity manifests.

## Org / tenant scoping

The behavior block on each entity manifest declares scope:

```yaml
behaviors:
  - org_scoped               # joined to org via owner / inferred
  - opportunity_scoped       # joined to deal where applicable
```

The codegen-emitted service injects the active org filter and (where relevant) opportunity filter into every primitive call. Cross-entity joins inherit the scope from the *root* entity — so a `meeting` query that joins `facts` filters facts by the meeting's opportunity, not by the agent's choice.

This is the single most important correctness property of the surface — and the property the first slice has to validate end-to-end.

## What this looks like to the MCP client

Two new tools (`query_domain`, `query_analytics`) — and optionally a metadata tool (`get_entity_manifest(entity)`) that returns the field/relationship/dimension list so the agent can introspect cheaply when it needs to. All existing MCP tools keep their names and contracts; their implementations re-route through the primitive layer over time.

The new tools follow the existing MCP surface conventions in `TOOL_SURFACE.md`:

- `query_domain` — verb `search_*` in spirit but `query_*` reads more accurately for the cross-entity composable case. We'd want to bless `query_*` as a new verb (analogous to `search_*` but with exact-filter / structured-result semantics rather than ranked retrieval).
- `query_analytics` — similarly, a new verb.
- Both `readOnlyHint: true`, no destructive side effects.
- Standard `content` + `structuredContent` shape with `JSON.stringify(structuredContent)` in `content` for Chat compatibility.

## What this is *not*

- **Not a replacement for the fact engine.** The fact engine continues to do fact extraction and semantic recall. The uniform query layer makes its outputs *addressable* via structured filters (classification, status, source_artifact, etc.) and joinable to the rest of the domain.
- **Not a single-vendor lock-in.** The primitive layer is a contract; Cube is the current best fit for the analytics slice but could be swapped for another semantic-layer engine (dbt SL, MetricFlow, hand-rolled) if we have a reason later.
- **Not an MCP-only surface.** The primitives live in the application layer (NestJS use cases / queries) per the existing backend architecture contract in `apps/backend/AGENTS.md`. MCP is one consumer. The web UI is another. Internal scripts are a third.

## Mapping to the references

| Layer / piece              | AloeVera analog                      | codegen-patterns analog                |
|----------------------------|--------------------------------------|----------------------------------------|
| Entity manifest            | `Entity()` registration in Python    | `entities/<name>.yaml`                 |
| Field + relationship       | `CategoricalDimension(relationship_path=…)` | `fields:` + `relationships:`     |
| Filter algebra             | `FilterCondition` with `&`/`\|`/`~`  | (primitive layer — new)                |
| Shared dimensions          | `EntityRegistry.register_shared_dimension` | `dimensions:` on each entity + Cube |
| Convenience layer          | `get_spending_by_category` etc.      | (the existing MCP tools)               |
| Generic escape hatch       | `custom_query` PydanticAI tool       | `query_domain` (new MCP tool)          |
| Analytics                  | `ReportingService.get_measure_data`  | `analytics: cube` in codegen.config    |
| Agent introspection        | `system_prompt` metadata injection   | `get_entity_manifest(entity)` (new)    |

The shape isn't novel. Its application to dealbrain is.

## Open questions

- **`query_domain` vs. extending `search_deal_context`?** Could we evolve the existing tool, or is a new tool clearer? Lean toward new tool — different semantics (exact filters vs. ranked retrieval) and the existing tool's contract is well-tested for its current use.
- **What's the smallest possible first slice?** Best candidate: `meeting` and `fact`, both opportunity-scoped, with cross-entity `joined_to` filters between them and `deal`/`account`. Smallest set that demonstrates cross-entity composability without scope-leak risk.
- **Cube hosting model?** Self-hosted in our cluster, Cube Cloud, or deferred until analytics slice? Probably deferred.
- **Do we adopt `codegen-patterns` directly, or hand-author the first slice and adopt the kit later?** Hand-author first. The kit's `DOGFOOD-LOG.md` is honest about its current rough edges; we'll know what to fix after one slice, not by reading the log.

— Doug
