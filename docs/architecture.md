# Architecture — the semantic query surface

A consumer-agnostic, introspection-first query primitive over Drizzle. One
framework-free class exposes three methods — `describe` / `query` / `fetch` —
that work across every registered entity, including EAV (dynamic typed) fields.
An MCP server, a web UI, a CLI, and a frontend filter-builder all consume the
identical surface.

> This supersedes the old "5-layer / controllers / MCP / YAML-source-of-truth"
> description. The transports (MCP, web, CLI) and the per-entity query
> indirection are now *adapters* built on top, not part of the core.

## The stack

```
  Drizzle entities  ──┐   tables + relations()  + optional defineEntity()/qField()
  (your schema)       │   → STRUCTURE (source of truth) + native field semantics
                      │
  EAV substrate ──────┤   field_definitions (catalog rows) + field_values[_jsonb]
  (optional)          │   → per-actor dynamic typed fields + their semantics
                      ▼
  registry.ts  ───────────  built ONCE at boot by INTROSPECTING Drizzle:
                            columns, types, enums, relationships, searchable cols.
                            Holds per-entity registration (table, relations, eav,
                            fieldMeta, meta). The one place entities are registered.
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
  catalog.ts                   engine/  (pure, entity-agnostic)
  buildEntityCatalog()          compiler.ts  FilterExpression → SQL
  = mechanics(Drizzle)          runners.ts   runSearch / runFetch
  ⊕ semantics(field_def|qField) expand · snippets · preview
        └─────────────┬─────────────┘
                      ▼
  query.application-service.ts  ← THE seam (takes a Drizzle client, caches actor EAV ctx)
     .describe() · .query() · .fetch()
                      ▼
  adapters (thin): MCP server · web UI · CLI · frontend loader
```

### Two principles

1. **Introspection-first.** Structure (columns / types / enums / relationships /
   searchable columns) is *never hand-declared* — `registry.ts` derives it from
   Drizzle at boot, so it cannot drift from the schema.
2. **One metadata layer, two homes.** The semantic half Drizzle can't give you
   (`label`, `description`, `searchable`, `isKeyField`, `keyFieldOrder`,
   `isVisible`, `group`) is authored either **inline on the column** (`qField`,
   for native fields) or **as a `field_definitions` row** (for EAV / dynamic
   fields) — *the same vocabulary either way*. `catalog.ts` merges them into one
   `CatalogField`, tagging each facet's `source` (`drizzle` | `field_definition`
   | `field_meta` | `derived`).

## Data flow per primitive

- **`describe(entity?)`** → `buildEntityCatalog` merges registry mechanics +
  field_def/qField semantics → a typed field catalog (`EntityCatalog`). No SQL.
- **`query(entity, {filter, sort, page, preview})`** → `compiler` walks the
  `FilterExpression` against the registry — LEFT JOIN for `belongs_to`, EXISTS
  subquery for `has_many`, EAV field resolution (typed-column or jsonb cast),
  `on:"text"` fan-out across searchable columns — → IDs (+ preview rows +
  `_snippets`).
- **`fetch(entity, ids, {filter, expand})`** → hydrate full rows, merge EAV
  cells inline (so EAV fields look like real columns), batch-expand relations.

## The query language

One JSON `FilterExpression` across every entity:

```jsonc
{ "on": "StageName", "op": "eq", "value": "Negotiation/Review" }     // EAV field, looks native
{ "on": "transcript.opportunity.account.name", "op": "eq", "value": "Acme" }  // cross-entity dotted path
{ "and": [ { "on": "text", "op": "contains", "value": "pricing" },   // text-magic fan-out
           { "on": "occurred_at", "op": "gte", "value": "2026-01-01" } ] }
```

Ops: `eq neq in nin gt gte lt lte between contains startswith endswith is_null
is_not_null`. Composites: `and` / `or` / `not`. The EAV seam is invisible — a
field backed by `field_values` is queried exactly like a real column.

## How to use

```ts
const q = new QueryApplicationService(db);   // db: a Drizzle node-postgres client

await q.describe();                 // typed catalog for all entities
await q.describe('opportunities');  // one entity's fields + relationships (table name)

await q.query('opportunities', {
  filter: { on: 'StageName', op: 'eq', value: 'Negotiation/Review' },
  preview: true,
});

await q.fetch('opportunities', ids, { expand: ['account', 'transcripts'] });
```

Adapters are thin: the MCP server, the web UI, the CLI, or a React loader is
~20-50 lines over those three calls.

## File layout

```
src/query/
  index.ts                       public barrel
  query.application-service.ts   THE seam: describe / query / fetch (plain class)
  types.ts                       FilterExpression language
  registry.ts                    introspected entity registry (+ registration list)
  catalog.ts                     describe's data source (mechanics ⊕ semantics)
  engine/
    compiler.ts                  FilterExpression → SQL
    runners.ts                   runSearch / runFetch
    expand.ts  snippets.ts  preview.ts
  eav/
    schema.ts                    field_definitions / field_values[_jsonb] tables
    mapping.ts                   data_type ↔ value-column mapping
    read.ts                      EAV row hydration
    field-map.ts                 actor-scoped field maps (loadFieldMaps)

src/query/define-entity.ts       qField() / defineEntity() — attribute-level metadata
src/modules/<plural>/*.entity.ts Drizzle tables + relations() (+ qField semantics)
```

## Extending into another Drizzle project

**Copy verbatim — the portable core:**
`src/query/` (engine, catalog, registry, schema-registry, query.application-service,
types, eav, define-entity) + a Drizzle client (`drizzle(pool, { schema })`).

**Implement the per-project seams (small):**
1. Your Drizzle entities with `relations()` (optionally wrapped in
   `defineEntity`/`qField` for richer `describe`).
2. `registerSchema(schema, { eav?, exclude?, names? })` to auto-expose them — or
   `configureQueryRegistry([{ name, table, relations, eav?, fieldMeta?, meta? }])`
   to register explicitly.
3. Resolve the actor (replace `POC_ACTOR_USER_ID` with per-request user/tenant).
4. `new QueryApplicationService(db)` and write the adapter(s) for how you expose it.

**Optional / conditional:**
- **EAV** only if you have dynamic fields — provide `field_definitions` +
  `field_values` tables and a `loadFieldMap` returning
  `{ key, dataType, selectOptions, label, description, isKeyField, keyFieldOrder }`.
  Native-only projects skip this entirely.
- **qField metadata** is pure polish — the catalog falls back to introspected
  mechanics + derived defaults.

**To add one entity (this or any wired project):** write the `.entity.ts`
(table + relations, `qField` where you want semantics) → export it from the
schema barrel `registerSchema` points at. It's immediately describable /
queryable / fetchable. No per-entity code, no registration list. (See
`transcript_observations` for a worked example.)

### Packaging direction

The portable core is the candidate for extraction into a standalone package
(working name TBD, e.g. `@dealbrain/query-surface`). The boundary is already
drawn: **package** = `src/query/*` (engine, catalog, registry, schema-registry,
the service, types, eav, define-entity); **consumer** = entity registration,
actor resolution, EAV table provisioning, and adapters. The `codegen-patterns` toolchain could emit the registration +
`qField` stubs for its consumers, but the package stays usable by hand in any
Drizzle project — introspection-first, no codegen required.

### Runtime registration (data-driven ERD)

`configureQueryRegistry(entities)` takes `EntityRegistration[]` — which can be
built at runtime, not just from code. `src/query/runtime-registry.ts` ships an
`entity_registrations` table + `loadRegistrations(db, tableCatalog, valueTables)`
that joins DB rows (name / `tableKey` / `enabled` / `eav`) against a code-side
catalog of live Drizzle tables → `EntityRegistration[]`. Toggle `enabled` or
repoint a row and re-run the loader, and the **exposed ERD changes with no
redeploy** (`QueryApplicationService.resetCache()` clears the actor cache between
reconfigurations). The live Drizzle objects + the physical tables still come from
code/migrations — runtime data selects and maps *which* of them to expose. See
`src/query/runtime-registry.ts`. (The EAV half — `field_definitions` — is already
fully runtime/data-driven; this extends the same idea to entity selection.)

## Known POC edges / roadmap

- **`EntityName` is `string`** (`types.ts`) — entity names come from the runtime
  registry keys, narrowable by a consumer to a union of their own registered
  names. (`PREVIEW_FIELDS` is deleted; `query()` preview derives from the
  catalog.) No hardcoded per-entity list remains.
- **Actor is a constant** (`POC_ACTOR_USER_ID`); the field-map cache is
  process-wide, not per-request.
- **Searchability is `qField`-aware** — `qField({ searchable })` opts a column
  in/out, overriding the type heuristic (this removed the `creator_email` /
  `language` / `from_address` text-search noise).
- **`transcript_observations`** is registered in code but its table requires
  `drizzle-kit push` (this repo has no migrations dir), and its
  `field_definitions(entity_type='transcript_observation')` + the polymorphic
  observation **family** layer (fan-out `query`/`describe` across comm-type
  variants) are not yet built. See the field-catalog design doc.
```
