# query-surface-poc — Agent Instructions

## Scope

- **Owns:** a consumer-agnostic semantic query surface over NestJS + Drizzle —
  one `QueryApplicationService` exposing three primitives (`describe` / `query`
  / `fetch`). Uniform JSON `FilterExpression`, cross-entity dotted paths,
  text-search fan-out, and EAV (dynamic typed) fields that look like native
  columns. Introspection-first: structure comes from Drizzle, never hand-declared.
- **Slimmed to the package** — the codegen-vendored runtime (CRUD base classes,
  OpenAPI registry, subsystems, per-entity controllers/services/repositories) and
  the HTTP/Swagger app have been removed. What remains is the query surface +
  example models + minimal DB wiring. `@pattern-stack/codegen` can still scaffold
  consumers; it's an accelerator, not a requirement.
- **Direction:** the portable core (`src/query/*` + `src/shared/orm/define-entity.ts`)
  is intended to become a standalone package. See [`docs/architecture.md`](./docs/architecture.md).
- **History:** see [`PROGRESS.md`](./PROGRESS.md).

## Commands

Run from this directory.

```bash
# One-time bootstrap
bun install
docker-compose up -d                                  # local Postgres on :5532
bunx drizzle-kit push                                 # apply schema (no migrations dir)

# Run + seed
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp \
  bun src/main.ts                                     # runnable example (describe/query/fetch)
bun src/seed.ts                                       # populate demo data

# Verify
bunx tsc --noEmit                                     # typecheck — the gate (must exit 0)
bun run doctor                                        # schema health check (relationship gaps)
```

There is no test suite yet; `tsc --noEmit` is the correctness gate. Entity
scaffolding (optional) is via `@pattern-stack/codegen`, but entity files +
registry registration can be authored by hand.

## Use as a package

`package.json` `exports` make the core importable: `.` → `src/query/index.ts`,
`./eav/schema` → the EAV schema. A consumer depends on `query-surface-poc` +
its own `drizzle-orm` (peer dep), then:

1. `registerSchema(schema, { exclude?, names?, eav? })` — point it at your
   Drizzle barrel; auto-builds the registry. (`registerFromDb(db, opts)` if you
   only have a live client.)
2. **NestJS:** `QueryModule.forRoot()` provides `QueryApplicationService`
   globally; your own `@Global` module supplies the `DRIZZLE` token
   (`drizzle(pool, { schema })`). Inject the service, call `describe/query/fetch`.
   **Standalone:** call the pure runners directly — `buildEntityCatalog`
   (describe), `runSearch` (query), `runFetch` (fetch) — passing your `db`.

EAV field-maps are actor-scoped to a constant (`POC_ACTOR_USER_ID`, cached
process-wide); a multi-tenant consumer must resolve the actor per request and
key that cache (`field-map.ts`).

**Check the schema first.** Relationships are derived ONLY from Drizzle
`relations()` — a `.references()` FK with no `relations()` entry is invisible
(no dotted-path filters, no expand) and fails silently. `diagnose(registrations)`
(exported) reports those gaps and emits paste-ready `relations()` snippets:

```ts
import { diagnose, buildRegistrationsFromSchema } from 'query-surface-poc';
import * as schema from './schema';
const findings = diagnose(buildRegistrationsFromSchema(schema, { exclude, eav }));
// error → FK with no relation; warn → missing inverse / edge to unregistered; info → *_id heuristic
```

v1 covers relationships only (EAV-overlay detection deferred). Internals
(`introspect.ts` Drizzle access, `doctor.ts` checks) stay top-level in `query/`
because `registry` depends on them and `engine/` depends on `registry`.

## Architecture

```
Drizzle entities (tables + relations, optional qField metadata)
        │  introspected at boot
        ▼
registry.ts  ──►  catalog.ts (describe)   +   engine/ (compiler, runners, expand, snippets, preview)
        │                         │
        └──────────┬──────────────┘
                   ▼
   QueryApplicationService   .describe() · .query() · .fetch()   ← the seam
                   ▼
   adapters (thin, build-on-top): MCP / REST / frontend
```

Full diagram, data flow, the metadata model, and the "extend into another
project" guide live in [`docs/architecture.md`](./docs/architecture.md). The
field-catalog rationale is in [`docs/field-catalog-design.md`](./docs/field-catalog-design.md).

## File layout

```
src/
├── query/                              the query surface (portable core)
│   ├── index.ts                        public barrel
│   ├── query.module.ts                 @Global — provides QueryApplicationService
│   ├── query.application-service.ts    THE seam: describe / query / fetch
│   ├── types.ts                        FilterExpression language
│   ├── define-entity.ts                qField() / defineEntity() — attribute-level metadata
│   ├── introspect.ts                   Drizzle-internal access (names, columns, relations, FKs) — the one home
│   ├── registry.ts                     introspected entity registry (configureQueryRegistry)
│   ├── schema-registry.ts              registerSchema() — walk a Drizzle barrel → registrations
│   ├── runtime-registry.ts             loadRegistrations() — DB-backed dynamic registration
│   ├── doctor.ts                       diagnose() — relationship-gap findings + relations() fixes
│   ├── catalog.ts                      describe's data source (mechanics ⊕ semantics)
│   ├── engine/                         compiler.ts · runners.ts · expand.ts · snippets.ts · preview.ts
│   └── eav/                            schema.ts · mapping.ts · read.ts · field-map.ts
├── shared/
│   ├── constants/tokens.ts             DRIZZLE token
│   └── database/database.module.ts     provides the DRIZZLE client
├── modules/<plural>/<entity>.entity.ts example domain models (table + relations + qField)
├── schema.ts                           drizzle-kit root — hand-authored entity barrel + EAV + observation tables
├── seed.ts  seed-data/                 demo data + field_definitions seeds
├── doctor.ts                           bin: `bun run doctor` — run diagnose() on the demo schema
└── main.ts  app.module.ts  db.ts
docs/                                   architecture.md, field-catalog-design.md
```

## Conventions

- **Introspection-first.** Column types, enums, nullability, relationships, and
  searchable columns are derived from Drizzle in `registry.ts` at boot. Never
  re-declare structure by hand.
- **One metadata layer, two homes.** Per-field semantics (`label`, `description`,
  `searchable`, `isKeyField`, `keyFieldOrder`, `isVisible`, `group`) are authored
  inline on native columns via `qField()` *or* as `field_definitions` rows for
  EAV fields — same vocabulary, merged by `catalog.ts`.
- **Register entities from the schema, not a list.** `registerSchema(schema, opts)`
  (`schema-registry.ts`) walks a Drizzle barrel, pairs each table with its
  `relations()`, recovers `qField()` metadata, and registers everything — no
  hand-maintained `EntityRegistration[]`. Only the EAV overlay and table excludes
  are declared (can't be introspected). To register one entity explicitly, pass
  `{ name, table, relations, eav?, fieldMeta?, meta? }` to `configureQueryRegistry`.
- **The 3 primitives are the product.** MCP / REST / frontend are thin adapters
  over `QueryApplicationService` — not part of the core. No transport in `src/query/`.
- **No raw SQL in handlers.** Drizzle query builder; the compiler uses the `sql`
  tag only for the EXISTS subquery wrapper and EAV jsonb casts.
- **EAV seam is invisible.** A `field_values`-backed field is queried exactly
  like a real column (`{ on: 'StageName', op: 'eq', value: '…' }`).

## Known POC edges

- `EntityName` (`types.ts`) is a hand-maintained union — the only remaining
  hardcoded per-entity list (`PREVIEW_FIELDS` deleted; preview derives from the
  catalog). Deferred: derive `EntityName` from the registry.
- Actor is a constant (`POC_ACTOR_USER_ID`); field-map cache is process-wide.
- `transcript_observations` is registered but needs `drizzle-kit push` + seed; the
  polymorphic observation **family** layer is not yet built (to be rebased on the
  upstream design).

## Gotchas

- **`drizzle-orm` is a `peerDependency`** (`>=0.30 <1`) — the consumer picks the
  version (avoids a duplicate drizzle graph / `shouldInlineParams` identity clash).
  qsp's own demo runs on `drizzle-orm ^0.45` + `drizzle-kit ^0.31` (devDeps).
- **`drizzle-kit push` truncates `field_definitions`** (cascades to `field_values`)
  — don't push schema to restore EAV data; re-run `bun src/seed.ts` (idempotent).
