# query-surface

A **consumer-agnostic semantic query surface** over Drizzle. One framework-free
class exposes three primitives — `describe` / `query` / `fetch` — that work across
every registered entity, including EAV (dynamic typed) fields. An MCP server, a
web UI, a CLI, and a frontend filter-builder all consume the identical surface.

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
const q = new QueryApplicationService(db);   // db: a Drizzle node-postgres client

await q.describe();                       // typed field catalog for every entity
await q.describe('opportunities');        // one entity's fields + relationships

await q.query('opportunities', {          // find IDs (+ optional preview rows)
  filter: cmp('StageName', 'eq', 'Negotiation/Review'),   // resolved Predicate
  preview: true,
});

await q.fetch('opportunities', ids, {     // hydrate full rows (+ relational expand)
  expand: ['account', 'transcripts'],
});
```

## The filter language: a resolved Predicate

The filter is a **Predicate** — the resolved subset of the locked Predicate
expression language (dealbrain-integrations RFC-0001 §1.2, shipped as dealbrain
#174; swe-brain RFC-0002 §4 makes it the *only* expression language across
triggers, branches, Find where-clauses, query-surface, and the frontend filter
editor). A leaf compares an **entity binding** (a column / dotted path on the
searched entity) to a **literal**:

```ts
import { cmp, str, unary, and, or, notP, field, lit } from 'query-surface-poc';

cmp('StageName', 'eq', 'Negotiation/Review')
// →  { op: 'eq', left: { from: 'entity', path: 'StageName' },
//                 right: { from: 'literal', value: 'Negotiation/Review' } }

and(
  cmp('Amount', 'gt', 100000),                      // comparison
  str('transcript.opportunity.account.name', 'contains', 'Acme'),  // cross-entity dotted path
  unary('closedAt', 'isNotNull'),                   // presence/null discriminator
)
```

The operand kinds are restricted to `{ from: 'entity', path }` and
`{ from: 'literal', value }` **by design** — the restriction enforces, at the
type level, that every *dynamic* binding (trigger / step / loop / context /
secret / computed) has been resolved against the workflow's JobContext **before**
the query ships. query-surface only ever receives the resolved residue. (See
`src/query/predicate.ts`.)

**Operators** (Predicate spellings): `eq neq gt gte lt lte in nin between`
(comparison) · `contains startsWith endsWith` (string, camelCase) ·
`exists missing isNull isNotNull` (unary) · `and or not` (boolean). Set
`left.path` to the magic `'text'` to fan a string op out across the entity's
searchable columns. Cross-entity reach is via dotted paths
(`transcript.opportunity.account.name`); EAV fields are queried exactly like
real columns.

**Divergences** (see `src/query/engine/compiler.ts`):
- `matches` (regex) is **rejected** in the SQL compile path with a typed error —
  a JS RegExp is not equivalent to Postgres' POSIX `~`, so silently compiling it
  would change semantics. Use `contains`/`startsWith`/`endsWith`, or evaluate
  `matches` against the JS eval target.
- `exists`/`missing` map to `IS NOT NULL`/`IS NULL` (in a flat row model,
  presence and non-null coincide; the EAV LEFT JOIN reads an absent value as
  NULL, so this is the honest interpretation).
- NULL handling is native SQL three-valued logic, which **matches** the predicate
  package's own `evalPredicate` 3VL (e.g. a `nin` whose list contains NULL yields
  the same row exclusion).

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

Each table is exposed under its **table name** (plural — `opportunities`,
`accounts`, …); pass `names: { opportunities: 'opportunity' }` to remap. Substrate
tables (`field_definitions` / `field_values` / …) are excluded by default; the
only thing that can't be introspected — the `eav` overlay — stays explicit. Run
the whole local stack — Postgres, the JSON API, and the Explore UI — with one command:

```bash
just dev   # Postgres + API (:3577) + Explore (:5377) → open http://localhost:5377
```

**Explore** (`explore/`, Vite + React) is the browser instrument: browse the
auto-exposed entities + field catalogs, follow relationship joins, build filters
from the live schema, and run `query`/`fetch` with drill-down. It's a thin client
over the JSON API served by `src/server.ts` (`/api/describe|query|fetch`, a
~50-line `Bun.serve` adapter over the three primitives). For terminal-only
inspection (no DB), the `query-surface` CLI mirrors `describe`: `just cli describe`,
`just cli graph`, `just cli stats`, `just cli doctor`.

## Adding an entity

Write the Drizzle table with `relations()` (optionally wrap columns in `qField`
for semantics) and export it from the schema barrel `registerSchema` points at
(here `src/schema.ts`). It's immediately describable / queryable / fetchable —
no per-entity code, no registration list to maintain.

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
  registry.ts                    introspected entity registry (configureQueryRegistry)
  schema-registry.ts             registerSchema() — auto-expose a Drizzle barrel
  catalog.ts                     field catalog (mechanics ⊕ semantics)
  define-entity.ts               qField() / defineEntity() — attribute-level metadata
  predicate.ts                   the Predicate filter language (resolved subset) + helpers
  types.ts                       request/response shapes (filter?: Predicate)
  engine/                        compiler · runners · expand · snippets · preview
  eav/                           field_definitions / field_values + resolution
src/db.ts                        the shared Drizzle node-postgres client
src/main.ts · server.ts · mcp.ts scripted example · web UI · MCP server (each: new QueryApplicationService(db))
src/cli/                         the query-surface CLI
src/modules/*/*.entity.ts        example domain models (Drizzle tables + relations + qField)
src/seed*                        demo data
```

See [`docs/architecture.md`](./docs/architecture.md) for the full design + the
"extend into another project / packaging" guide, and
[`docs/field-catalog-design.md`](./docs/field-catalog-design.md) for the metadata model.

## License

MIT
