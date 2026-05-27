# query-surface

A **consumer-agnostic semantic query surface** over NestJS + Drizzle. One service
exposes three primitives — `describe` / `query` / `fetch` — that work across every
registered entity, including EAV (dynamic typed) fields. An LLM tool, a REST
controller, and a frontend filter-builder all consume the identical surface.

Two principles:

- **Introspection-first** — column types, enums, nullability, relationships, and
  searchable columns are derived from Drizzle at boot. Structure is never hand-declared, so it can't drift.
- **One metadata layer, two homes** — the semantic half Drizzle can't give you
  (`label`, `description`, `searchable`, `isKeyField`, …) is authored either inline
  on the column (`qField`) or as a `field_definitions` row (for EAV fields), in the
  *same vocabulary*, and merged into one field catalog.

## Quick start

```bash
bun install
docker-compose up -d                                   # local Postgres on :5532
bunx drizzle-kit push                                  # create tables
bun src/seed.ts                                         # demo data

DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp \
  bun src/main.ts                                       # runnable example (describe/query/fetch)
```

## The three primitives

```ts
const q = app.get(QueryApplicationService);

await q.describe();                       // typed field catalog for every entity
await q.describe('opportunity');          // one entity's fields + relationships

await q.query('opportunity', {            // find IDs (+ optional preview rows)
  filter: { on: 'StageName', op: 'eq', value: 'Negotiation/Review' },
  preview: true,
});

await q.fetch('opportunity', ids, {       // hydrate full rows (+ relational expand)
  expand: ['account', 'transcripts'],
});
```

One JSON `FilterExpression` across every entity — cross-entity dotted paths
(`transcript.opportunity.account.name`), `on:"text"` fan-out, and EAV fields
queried exactly like real columns.

## Auto-expose: point it at a schema

Instead of a hand-written registration list, point the surface at a Drizzle
schema barrel (or a live `db`) and it registers every table automatically —
columns, types, relationships, and `qField` metadata all introspected:

```ts
import * as schema from './schema';
registerSchema(schema, {                       // or registerFromDb(db, …)
  eav: { opportunities: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'opportunity' } },
});
```

Substrate tables (`field_definitions` / `field_values` / …) are excluded by
default; the only thing that can't be introspected — the `eav` overlay — stays
explicit. Run the bundled web UI on top of it:

```bash
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/server.ts   # → http://localhost:3577
```

A lightweight, dependency-free page (`src/web/index.html`) that's entirely
`describe`-driven: browse the auto-exposed entities + their field catalogs, build
filters from the live schema, and run `query` — served by a ~50-line `Bun.serve`
adapter (`src/server.ts`) over the three primitives.

## Adding an entity

Write the Drizzle table with `relations()` (optionally wrap columns in `qField`
for semantics), then add one line to `ENTITIES` in `src/query/registry.ts`. It's
immediately describable / queryable / fetchable — no per-entity code.

```ts
const accountEntity = defineEntity('accounts', {
  id:   uuid('id').primaryKey().defaultRandom(),
  name: qField(text('name'), { label: 'Account name', searchable: true, isKeyField: true }),
  userId: qField(uuid('user_id').notNull(), { isVisible: false }),  // hidden from the catalog
});
```

## Layout

```
src/query/                       the package
  query.application-service.ts   the seam: describe / query / fetch
  registry.ts                    introspected entity registry + ENTITIES registration
  catalog.ts                     field catalog (mechanics ⊕ semantics)
  define-entity.ts               qField() / defineEntity() — attribute-level metadata
  types.ts                       FilterExpression language
  engine/                        compiler · runners · expand · snippets · preview
  eav/                           field_definitions / field_values + resolution
src/shared/                      DRIZZLE token + database module (db wiring)
src/modules/*/*.entity.ts        example domain models (Drizzle tables + relations + qField)
src/seed*                        demo data
```

See [`docs/architecture.md`](./docs/architecture.md) for the full design + the
"extend into another project / packaging" guide, and
[`docs/field-catalog-design.md`](./docs/field-catalog-design.md) for the metadata model.

## License

MIT
