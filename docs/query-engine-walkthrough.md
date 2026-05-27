# Query engine — walkthrough

**Audience:** Nick, then the wider team.
**Goal:** ship this as the replacement for the agent-written-SQL surface in dealbrain.
**Status:** built, verified, ready to port.

This doc is the reference behind the demo. Each `##` is roughly one slide; the
short paragraph under it is what to say out loud. Code blocks are what to show.

---

## 1 · The problem

> *Agents that write SQL silently produce wrong joins.*

When an LLM writes raw SQL against the database, two failure modes dominate:

- **Wrong joins.** The LLM forgets a foreign key, joins on the wrong column, or
  produces a Cartesian product. The query *runs* and returns plausible-looking
  rows. Nobody catches it.
- **Schema drift.** The LLM was trained on a snapshot of the schema. We add a
  column, drop a column, rename a column — the LLM keeps writing the old shape.
  Errors come back from Postgres if we're lucky, silently wrong results if we're
  not.

The default reactions are both bad:

- **Build a tool per question type.** Brittle. Every new ask is a new tool. The
  agent learns ten dialects.
- **Accept the failures.** Wrong data in front of a customer.

There's a third option.

---

## 2 · The reframe

> *Keep the LLM in the part it's good at. Keep the schema in the part code is good at.*

LLMs are excellent at **composing** — given a vocabulary and some examples, they
chain primitives into novel expressions. They are bad at **remembering schema
relationships** — every join, every foreign key, every renamed column is a
chance to be subtly wrong.

So we split the job:

- **The LLM composes.** It speaks a JSON vocabulary that lets it filter, sort,
  paginate, search text, and reach across related entities. It can express
  anything composable in this vocabulary.
- **We compile.** A small piece of code reads the JSON, walks the relationships
  declared in our entity files, and emits the SQL.

The LLM never sees SQL. It cannot get a join wrong, because it doesn't write
joins. We do.

---

## 3 · Show one filter

This is what the LLM emits when a seller asks
*"find transcripts where pricing came up at fintech accounts in deals currently in negotiation."*

```json
{
  "entity": "transcript",
  "filter": {
    "and": [
      { "on": "text",                          "op": "contains", "value": "pricing" },
      { "on": "opportunity.StageName",         "op": "eq",       "value": "Negotiation/Review" },
      { "on": "opportunity.account.Industry",  "op": "eq",       "value": "fintech" }
    ]
  },
  "preview": true,
  "page": { "limit": 25 }
}
```

Six things the LLM did, all composable:

1. Picked the root entity (`transcript`)
2. Used boolean composition (`and:`)
3. Reached across two relationships (`opportunity.account.…`)
4. Used the magic `text` field to search across every text column on transcript
5. Filtered on two EAV-backed fields (`StageName` and `Industry`) **without
   knowing they're EAV** — and without knowing they're stored in two different
   EAV shapes underneath
6. Asked for preview rows + pagination

The LLM didn't know which columns on transcript are text-searchable. It didn't
know the foreign keys. It didn't know that `StageName` lives in dealbrain's
typed-column `field_values` table and `Industry` lives in a jsonb `field_values_jsonb`
table. It composed against a vocabulary. The compiler handled every seam.

---

## 4 · Show the SQL we generated

Same query, what the compiler emitted (one statement, one round trip):

```sql
SELECT transcripts.*, opportunities.*, accounts.*
FROM transcripts
LEFT JOIN opportunities
  ON transcripts.opportunity_id = opportunities.id
LEFT JOIN field_values fv_stage
  ON fv_stage.entity_id = opportunities.id
 AND fv_stage.entity_type = 'opportunity'
 AND fv_stage.field_definition_id = '<StageName-uuid>'
LEFT JOIN accounts
  ON opportunities.account_id = accounts.id
LEFT JOIN field_values_jsonb fvj_industry
  ON fvj_industry.entity_id = accounts.id
 AND fvj_industry.field_definition_id = '<Industry-uuid>'
 AND fvj_industry.valid_to IS NULL
WHERE (
        transcripts.title          ILIKE '%pricing%'
     OR transcripts.transcript     ILIKE '%pricing%'
     OR transcripts.summary        ILIKE '%pricing%'
     OR transcripts.user_notes     ILIKE '%pricing%'
     OR transcripts.enhanced_notes ILIKE '%pricing%'
  )
  AND fv_stage.value_text                = 'Negotiation/Review'
  AND (fvj_industry.value #>> '{}')::text = 'fintech'
ORDER BY transcripts.occurred_at DESC
LIMIT 25;
```

**Four things to notice when you walk Nick through this:**

- The LLM didn't write any SQL.
- The LLM didn't know transcript has five searchable text columns. It said
  `on: "text"` and the compiler fanned out.
- The LLM didn't know how transcript joins to opportunity or how opportunity
  joins to account. It used dotted paths; the compiler walked the foreign keys.
- **The LLM didn't know `StageName` and `Industry` are EAV-stored — in two
  different shapes.** The compiler resolves each field against its declared
  storage strategy (typed-column for opportunity, jsonb for account) and emits
  the right JOIN + predicate. Agent contract is the same; SQL underneath
  differs.

The LLM **cannot** get a join wrong because it doesn't write joins. That's
the whole point.

---

## 5 · How the compiler works (the three pieces)

The entire system is ~600 lines. Three pieces:

### 1. A registry — *one file that knows the graph*

Built at boot from our existing Drizzle `relations()` declarations. For every
entity, it knows:
- The columns it has and their types
- Its `belongs_to` and `has_many` relationships
- Which columns are searchable for the `text` magic
- Its EAV strategy (none / typed-columns / jsonb-value) and which fields are
  EAV-backed — loaded per-actor at request time from `field_definitions`

There is no second source of truth. Add a relationship to a Drizzle entity
file, the registry sees it next boot. Add an EAV field in the database, the
field-map loader picks it up. No YAML, no codegen, no separate config.

### 2. A compiler — *one function, JSON in, SQL out*

Reads the registry, walks dotted paths, emits Drizzle SQL. Operations
supported: `eq | neq | in | nin | gt | gte | lt | lte | between | contains | startswith | endswith | is_null | is_not_null`. Boolean composition (`and | or | not`). Sort. Pagination.

Pure function. Deterministic. Same JSON in always produces the same SQL out.

### 3. Every entity repository gets it for free

Each entity's repository extends a `BaseRepository`. The base class declares one
property — `entityName` — and inherits three methods: `search()`, `fetch()`,
`query()`. The compiler is dependency-injected at the base class level, so every
repository can call it without importing anything.

Add a new entity to dealbrain? Drop the entity file, add it to the registry
list. **Zero work on the query layer.** Cross-entity reach to and from the new
entity works the moment the relationship is declared in Drizzle.

---

## 6 · Why this is the same shape Alexis suggested

This is worth being explicit about. Alexis's challenge was:

> *Don't make the LLM learn brittle tools. Give it composable primitives it
> can chain freely.*

The default reading of that is *"give it SQL."* And he's right about the
principle — composable primitives, not recipe-based tools. But SQL fails the
"can't get it wrong" test. Joins are where LLMs lose.

This system **is** Alexis's idea, with one substitution: we replaced the
"composable primitive" from SQL to a JSON FilterExpression. The LLM still
composes freely. We still don't ship a tool per question. The difference is
the LLM cannot produce a query that joins the wrong table, because it doesn't
write joins. It writes intent. We translate.

If someone says *"isn't this just SQL with extra steps?"* — the answer is
*"yes, and the extra step is the part that makes it correct."*

---

## 7 · What the agent gets to do — for free

Because the LLM composes against the JSON vocabulary, **every novel question
already works** — provided the LLM can express it.

Examples (all working against the POC today, none of them required new code):

| Question | What the LLM emits |
|---|---|
| "Opportunities in stage Negotiation." | `{entity:'opportunity', filter:{on:'StageName', op:'eq', value:'Negotiation/Review'}}` *(EAV-backed — agent doesn't know)* |
| "Opportunities over $50K closing this quarter." | `{entity:'opportunity', filter:{and:[{on:'Amount', op:'gt', value:50000}, {on:'CloseDate', op:'lte', value:'2026-06-30'}]}}` *(two EAV fields, one a number, one a date — compiler picks the right value column)* |
| "Pricing discussions at fintech accounts." | `{entity:'transcript', filter:{and:[{on:'text', op:'contains', value:'pricing'}, {on:'opportunity.account.Industry', op:'eq', value:'fintech'}]}}` *(reaches across two relationships AND a jsonb-shape EAV field)* |
| "Strategic accounts with active deals." | `{entity:'account', filter:{and:[{on:'IsStrategic', op:'eq', value:true}, {on:'opportunities.IsClosed', op:'eq', value:false}]}}` *(Shape B EAV on account + Shape A EAV on opportunity via has_many, in one query)* |
| "Emails from CFOs about renewal." | `{entity:'email', filter:{and:[{on:'from_address', op:'contains', value:'cfo@'}, {on:'text', op:'contains', value:'renewal'}]}}` |
| "Transcripts after May 1 mentioning compliance." | `{entity:'transcript', filter:{and:[{on:'occurred_at', op:'gte', value:'2026-05-01'}, {on:'text', op:'contains', value:'compliance'}]}}` *(ISO date string coerces to a Date at compile time)* |
| "Hydrate these IDs with their full opportunity + account." | `query_fetch` with `expand: ['opportunity', 'opportunity.account']` *(EAV fields merge inline on the hydrated rows)* |

None of these required a new tool, a new endpoint, a new SQL view, or a new
piece of code. The composability of the vocabulary covers them — including
the EAV fields, which the agent treats identically to any other field.

For the demo: `docs/demo-queries.md` carries ~25 escalating test questions
across 7 tiers — including stress tests where the LLM has to pick between
alternative formulations, handle negation, and reason about cross-deal patterns.

---

## 8 · The MCP surface (what the agent calls)

Three tools, exposed over stdio so any MCP client (Claude Code, etc.) can use
them in natural language.

### `query_describe`
Returns the schema — entities, columns with types, enum values, relationships,
example filters. The agent calls this once to learn the vocabulary, then composes
queries freely. **No DB call.** Pure metadata.

### `query_search`
Find IDs by composing a FilterExpression. Returns `{ids, total, preview?}`.
When a text op fires, preview rows carry `_snippets` — windowed text around
each match with offsets and full_length. Cheap to iterate.

Supports multi-entity dispatch: `queries: [{entity:'email', ...}, {entity:'transcript', ...}]`
runs in parallel and returns tagged-by-entity results. The agent gets per-type
counts without manually fanning out.

### `query_fetch`
Hydrate IDs into full rows. Optional `filter` for refinement ("of these 200,
only the ones in stage closing"). Optional `expand` for inline relational
hydration up to 3 hops, batched (no N+1).

All three tools accept the same JSON vocabulary the HTTP endpoints accept.
Wire identity. Caller gets to switch transports without learning a second
dialect.

---

## 9 · One engine, every transport

This is the operational property that matters.

```
                ┌──────────────────────────────────┐
                │  Same JSON, same code path       │
                └──────────────────────────────────┘
                             ▲
                             │
        ┌────────────────────┼────────────────────────┐
        │                    │                        │
   HTTP /search +     MCP query_search +      Entity-level
   /fetch             query_fetch              GET /transcripts/search
   (POST)             (stdio)                  GET /emails/search
        │                    │                        │
        └────────┬───────────┴────────────────────────┘
                 ▼
       Service → Repository → FilterCompiler → SQL
```

The same `serviceFor(entity).search(filter)` path is hit by:
- The HTTP API (Postman, curl, frontend fetch calls)
- The MCP tools (Claude Code, any MCP client)
- The auto-generated entity-level search endpoints (Swagger-documented at `/docs`)
- Internal code that wants to compose queries programmatically

If we add caching, audit logging, actor scoping, soft-delete filtering, or any
other cross-cutting concern at the repository layer — **all transports inherit
it at once.** No "did we apply this to the MCP path too?" worry.

---

## 10 · Why this scales as we add entities and fields

Every concern that traditionally requires per-entity code is metadata-driven
here:

| Add this to dealbrain | Work needed in the query engine |
|---|---|
| New entity (e.g. `lead`) | Add `lead` to the `ENTITIES` list. Declare `relations()` on the Drizzle entity file as usual. **That's it.** |
| New relationship (e.g. `account.has_many.notes`) | Add `many()` to the existing Drizzle `relations()` block. **That's it.** |
| New searchable text column | Add the column. Type-driven detection picks it up at next boot. **That's it.** |
| New EAV field (e.g. a user defines a custom `Forecast Category` field) | Insert a row into `field_definitions`. Compiler picks it up the next time the per-actor field map loads. **Zero engine work, zero agent retraining.** |
| New EAV storage shape (e.g. a future entity uses a third pattern) | Add a new variant to the `EavStrategy` discriminated union and one branch in `resolveEav`. ~100 lines. Doesn't change anything else. |
| New filter operator (e.g. `regex_match`) | One case in `compileLeafOp` (and `compileLeafOpExpr` for EAV-expr ops). ~10 lines. |
| New question the LLM wants to ask | **Nothing.** If it's expressible in the vocabulary, it already works. |

Compare to the per-tool approach: each of those is a code change, a deploy,
and a new vocabulary item for the agent to learn.

---

## 11 · What's in the POC today

Working corpus:
- 5 entities (account, opportunity, contact, email, transcript)
- 10 deals seeded with realistic content — 27 emails + 125 transcripts spanning
  fintech, SaaS, manufacturing, retail, health
- All 7 deal stages represented, $25K–$560K range, deliberate keyword overlap
  across deals so cross-deal text search returns meaningful results

**EAV substrate, both shapes live:**
- **Opportunity uses Shape A** (dealbrain's typed-column shape). The 8 canonical
  Salesforce business fields (`StageName`, `Amount`, `CloseDate`, `NextStep`,
  `Probability`, `IsClosed`, `IsWon`, `Description`) live in `field_values`
  with four typed value columns. Seed copies real `field_definitions` from the
  live dealbrain database with UUIDs preserved.
- **Account uses Shape B** (codegen-patterns' jsonb-single-value shape). Custom
  fields (`Industry`, `EmployeeCount`, `Tier`, `AnnualRevenue`, `IsStrategic`)
  live in `field_values_jsonb` with a single `value jsonb` column +
  `valid_from`/`valid_to` for temporal validity.
- The compiler resolves both shapes from a per-entity `EavStrategy` descriptor.
  The agent contract is identical for both — `{on: 'StageName', …}` and
  `{on: 'Industry', …}` look the same to the agent and produce different SQL
  underneath.

Working transports:
- `POST /search` / `POST /fetch` — Swagger-documented at `/docs`
- `GET /transcripts/search` / `GET /emails/search` — entity-level convenience
  endpoints that route through the same engine
- MCP server exposing `query_describe` + `query_search` + `query_fetch` over
  stdio
- Drizzle Studio launches alongside the server for inspection

Verified:
- `just verify` (typecheck + seed + demo + mcp-test) is green
- All 25 agent test questions across 7 tiers work end-to-end via Claude Code
- Same JSON shape produces identical results across HTTP and MCP transports
- Cross-entity reach **across both EAV shapes** in a single SQL statement
  (e.g. `transcript → opportunity (Shape A EAV) → account (Shape B EAV)`)
  resolves correctly and runs in one round trip

---

## 12 · Porting to dealbrain — what it takes

The substrate transfers as-is. **Shape A in this POC is dealbrain's shape** —
same table names (`field_definitions`, `field_values`), same typed value
columns, same data_type → value column mapping, same actor-scoped field-map
loading. The seed already copies real field UUIDs from the live database to
verify wire compatibility.

Concretely:

1. **Vendor the query engine** into dealbrain's backend module set (`src/query/`
   plus `src/query/build-registry.ts`, `eav-mapping.ts`, `eav-read.ts`,
   `field-map.ts`). ~800 lines including EAV, no new dependencies beyond what
   dealbrain already runs (NestJS + Drizzle).
2. **Extend dealbrain's existing `relations()` declarations** to include reverse
   `many()` sides. Some of this already exists; some entities only declare
   `one()`. A few hours of careful editing in `packages/db/src/server/schema.ts`.
3. **Drop the `ENTITIES` registration list** mapping singular entity name →
   table + relations export + `EavStrategy`. Dealbrain entities use Shape A;
   declare it on the descriptors. ~30 lines.
4. **Wire `QueryModule` into the dealbrain AppModule.** One import.
5. **Stand up the MCP server.** Mirror the pattern from this POC's
   `src/mcp-server.ts`. Same Nest bootstrap + stdio handler.
6. **Inject the actor at the FilterCompilerService level** so every query
   auto-applies `WHERE entity.user_id = $actor.user_id` AND so the field-map
   loader scopes to the right user's `field_definitions`. This is the one
   piece the POC doesn't have because it's single-tenant. The hook point is
   already there — `FilterCompilerService` accepts a `EavContext` per request.

Estimate: **1-2 focused days** including reasonable testing. The EAV unknown
that previously dominated the port is closed — the substrate is built and
demonstrated wire-compatible against dealbrain's real field definitions.

---

## 13 · The ask

Approve the port. We replace the agent-written-SQL surface with this engine for
all retrieval queries. Three immediate outcomes:

- **Joins stop being wrong.** Silent-failure mode goes away.
- **New agent questions work for free.** Anything composable in the vocabulary
  is already supported. No backlog of "build a tool for X."
- **One code path to maintain.** HTTP, MCP, internal — same engine, same
  behaviour, same place to fix bugs.

The work is bounded (~2-3 days). The architecture is settled. The POC is
verified. The next conversation should be about which week, not whether.

---

## Appendix · Where to look in the code

If Nick (or Codex) wants to read the implementation:

| What | Where |
|---|---|
| The compiler — JSON → SQL | `src/query/compiler.ts` |
| Registry construction from Drizzle relations | `src/query/build-registry.ts` |
| EAV schema (both shapes) | `src/query/eav-schema.ts` |
| EAV data_type → value-column / value-cast mapping | `src/query/eav-mapping.ts` |
| EAV read merge (hydrates EAV fields onto rows for /fetch + expand) | `src/query/eav-read.ts` |
| Per-actor field-definition loader (cached) | `src/query/field-map.ts` |
| The NestJS facade for DI | `src/query/filter-compiler.service.ts` |
| Pure run functions | `src/query/service.ts` (`runSearch`, `runFetch`, `runSearchMulti`) |
| Snippet extraction | `src/query/snippets.ts` |
| Relational hydration on /fetch | `src/query/expand.ts` |
| HTTP controllers | `src/query/{search,fetch}.controller.ts` |
| MCP server | `src/mcp-server.ts` (boots NestJS, resolves services from DI) |
| Agent-facing schema for `query_describe` | `src/query/agent-schema.ts` |
| Worked test questions | `docs/demo-queries.md` |
| Architecture deep-dive | `docs/architecture.md` |
| **EAV Shape B implementation plan** | `docs/eav-shape-b-plan.md` |
| **EAV shape A vs B decision guide (per entity)** | `docs/eav-shape-decision.md` |
| What this validates from the proposal | `docs/proposal-summary.md` |

If Nick wants to *run* it: `just verify` runs the full suite end-to-end against
the seeded corpus. Takes ~30 seconds.
