# query-surface-poc — Agent Instructions

## Scope

- **Owns:** a consumer-agnostic semantic query surface over NestJS + Drizzle —
  one `QueryApplicationService` exposing three primitives (`describe` / `query`
  / `fetch`). Uniform JSON `FilterExpression`, cross-entity dotted paths,
  text-search fan-out, and EAV (dynamic typed) fields that look like native
  columns. Introspection-first: structure comes from Drizzle, never hand-declared.
- **Defers to** `../codegen-patterns/` (`@pattern-stack/codegen`) for entity
  scaffolding, family base classes, OpenAPI registry, DI tokens. Codegen is an
  *accelerator*, not a requirement — the query surface is wired by hand here.
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
  PORT=3577 bun src/main.ts                           # NestJS server (Swagger at /docs)
bun src/seed.ts                                       # populate demo data

# Verify
bunx tsc --noEmit                                     # typecheck — the gate (must exit 0)
```

There is no test suite yet; `tsc --noEmit` is the correctness gate. Entity
scaffolding (optional) is via `@pattern-stack/codegen`, but entity files +
registry registration can be authored by hand.

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
│   ├── registry.ts                     introspected entity registry + ENTITIES registration
│   ├── catalog.ts                      describe's data source (mechanics ⊕ semantics)
│   ├── engine/                         compiler.ts · runners.ts · expand.ts · snippets.ts · preview.ts
│   └── eav/                            schema.ts · mapping.ts · read.ts · field-map.ts
├── shared/
│   ├── orm/define-entity.ts            qField() / defineEntity() — attribute-level field metadata
│   ├── base-classes/                   CRUD base repository/service (codegen-vendored)
│   ├── constants/tokens.ts             DRIZZLE token
│   └── database/ openapi/ http/ pipes/
├── modules/<plural>/                   per-entity: <entity>.entity.ts (table + relations + qField),
│                                       repository / service / controller (CRUD), dto/, use-cases/
├── generated/                          schema.ts + modules.ts barrels, query-registry re-export
├── schema.ts                           drizzle-kit root (generated barrel + EAV + observation tables)
├── seed.ts  seed-data/                 demo data + field_definitions seeds
└── main.ts  app.module.ts  db.ts
docs/                                   architecture.md, field-catalog-design.md, design history
```

## Conventions

- **Introspection-first.** Column types, enums, nullability, relationships, and
  searchable columns are derived from Drizzle in `registry.ts` at boot. Never
  re-declare structure by hand.
- **One metadata layer, two homes.** Per-field semantics (`label`, `description`,
  `searchable`, `isKeyField`, `keyFieldOrder`, `isVisible`, `group`) are authored
  inline on native columns via `qField()` *or* as `field_definitions` rows for
  EAV fields — same vocabulary, merged by `catalog.ts`.
- **Register an entity in one place.** Add `{ name, table, relations, eav?,
  fieldMeta?, meta? }` to `ENTITIES` in `registry.ts`; it becomes describable /
  queryable / fetchable with no per-entity code.
- **The 3 primitives are the product.** MCP / REST / frontend are thin adapters
  over `QueryApplicationService` — not part of the core. No transport in `src/query/`.
- **No raw SQL in handlers.** Drizzle query builder; the compiler uses the `sql`
  tag only for the EXISTS subquery wrapper and EAV jsonb casts.
- **EAV seam is invisible.** A `field_values`-backed field is queried exactly
  like a real column (`{ on: 'StageName', op: 'eq', value: '…' }`).

## Known POC edges

- `EntityName` (`types.ts`) is a hand-maintained union and `PREVIEW_FIELDS`
  (`engine/preview.ts`) is an exhaustive per-entity map — the last two hardcoded
  per-entity lists (deferred: derive from registry / route preview through catalog).
- Actor is a constant (`POC_ACTOR_USER_ID`); field-map cache is process-wide.
- `qField` rollout is partial (account converted; others use derived defaults).
- `transcript_observations` is registered but needs `drizzle-kit push` + seed; the
  polymorphic observation **family** layer is not yet built.

## Gotchas

- **Drizzle pinned to `^0.30.x`** — base classes don't compile against 0.45 yet.
- **`@nestjs/swagger` NestJS-11 peer-dep warning** is benign (we use NestJS 10).
