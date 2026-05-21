# Upstream contributions — what to lift into `@pattern-stack/codegen`

The POC validates the uniform domain query primitive end-to-end. The
hand-authored substrate in `src/query/` and the modifications to vendored
shims should ultimately live in the kit so every consumer gets the dynamic
query layer for free.

This doc names every contribution, in priority order, with the exact files
and shape changes.

## Why upstream

Today, the consumer (this POC) ships:

1. `src/shared/base-classes/base-repository.ts` — modified vendored file
2. `src/shared/base-classes/base-service.ts` — modified vendored file
3. `src/shared/constants/tokens.ts` — added FILTER_COMPILER token
4. `src/shared/http/pagination.ts` — hand-written shim (kit didn't vendor)
5. `src/generated/query-registry.ts` — hand-authored placeholder for what
   codegen *would* emit
6. `src/query/*` — the full FilterCompiler implementation (substrate that
   should live in the kit's runtime, not the consumer)
7. One-line `entityName` declarations on each `<entity>.repository.ts`

If you re-run `codegen project init` today, items 1-4 get clobbered. Items 5-7
have no codegen path. Lifting these into the kit means:

- The vendored shims include `query/search/fetch` baked in
- A new template emits the registry from YAML
- Entity templates emit `entityName` on each repo
- Consumers import `FilterCompilerService` from kit's runtime, never
  hand-author it

## Priority 1 — modify family base classes

### `runtime/base-classes/base-repository.ts`

Add the same modifications the POC made:

```ts
import { Inject, Optional } from '@nestjs/common';
import { FILTER_COMPILER } from '../constants/tokens';
import type { FilterCompilerService } from '../subsystems/query/filter-compiler.service';
import type {
  DomainQueryRequest, DomainQueryResult,
  FetchResponse, FilterExpression,
  SearchEntityResult, Sort,
} from '../subsystems/query/types';

export abstract class BaseRepository<TEntity> {
  protected abstract readonly entityName: string;

  @Optional()
  @Inject(FILTER_COMPILER)
  protected readonly filterCompiler?: FilterCompilerService;

  // … existing CRUD methods unchanged …

  async query(req?: Omit<DomainQueryRequest, 'entity'>): Promise<DomainQueryResult> {
    return this.requireCompiler().run({ entity: this.entityName, ...req });
  }
  async search(
    req?: { filter?: FilterExpression; sort?: Sort[]; page?: { limit?: number; offset?: number } },
    opts?: { preview?: boolean; include_sql?: boolean },
  ): Promise<SearchEntityResult> {
    return this.requireCompiler().search({ entity: this.entityName, ...req }, opts);
  }
  async fetch(
    ids: string[],
    opts?: { filter?: FilterExpression; include_sql?: boolean },
  ): Promise<FetchResponse> {
    return this.requireCompiler().fetch({
      entity: this.entityName,
      ids,
      filter: opts?.filter,
      include_sql: opts?.include_sql,
    });
  }

  private requireCompiler(): FilterCompilerService {
    if (!this.filterCompiler) {
      throw new Error(
        `${this.constructor.name}: FilterCompilerService not injected. ` +
        `Register QueryModule in your AppModule so the FILTER_COMPILER token is provided.`,
      );
    }
    return this.filterCompiler;
  }
}
```

Property injection on the base class works because the **concrete** class is
`@Injectable`; Nest resolves the property on the inherited type at
instantiation time.

### `runtime/base-classes/base-service.ts`

Extend `IBaseRepository<TEntity>` interface + add pass-through methods.
Full diff in the POC's `src/shared/base-classes/base-service.ts`.

### `runtime/constants/tokens.ts`

Add the FILTER_COMPILER token:

```ts
export const FILTER_COMPILER = 'FILTER_COMPILER' as const;
```

## Priority 2 — vendor the FilterCompiler subsystem

### New: `runtime/subsystems/query/`

Vendor the POC's `src/query/*` (sans the controllers — those stay
consumer-defined) into the kit's runtime under a new "query" subsystem:

```
runtime/subsystems/query/
├── types.ts                    FilterExpression, Op, requests/responses
├── compiler.ts                 pure JSON → Drizzle SQL
├── service.ts                  runQuery, runSearch, runFetch
├── filter-compiler.service.ts  NestJS @Injectable facade
├── query.module.ts             @Global() registration
├── preview.ts                  per-entity preview helpers (uses registry)
├── zod-schemas.ts              shared request validation
└── index.ts                    public exports
```

Installable via `codegen subsystem install query` (matches the existing
events/jobs/cache/storage subsystem install pattern).

Consumer setup becomes:
```bash
codegen project init                      # vendors base classes + tokens (already does)
codegen subsystem install query           # vendors src/shared/subsystems/query/*
```

## Priority 3 — emit the registry

### New template: `templates/entity/registry/registry.ejs.t`

Emits `src/generated/query-registry.ts` from ALL `entities/*.yaml` manifests.
Reads:

- `entity.name`, `entity.plural`, `entity.table`, `entity.pattern`
- `fields:` (for `id` primary key lookup + column type validation)
- `relationships:` (belongs_to / has_many — emits relationship descriptors)
- `searchable_columns:` (NEW manifest block — see Priority 4)

Output shape matches the POC's `src/generated/query-registry.ts` exactly.

Emission happens during `codegen entity new --all`, not per-entity, because
the registry is the cross-entity index.

### Modify `clean-lite-ps/repository.ejs.t`

Add ONE line to the generated repo file:

```ts
protected readonly entityName = '<%= entity.name %>' as const;
```

That's it. From the YAML `entity.name`, emitted next to `readonly table = ...`.

## Priority 4 — add `searchable_columns:` to entity YAML schema

### `src/schema/entity-definition.schema.ts`

Add a new optional block to the entity manifest:

```yaml
entity:
  name: email
  pattern: Activity
  ...

searchable_columns:
  - subject
  - body
```

For has_many fan-out (e.g., transcripts searching through chunks):

```yaml
entity:
  name: transcript
  ...
relationships:
  chunks:
    type: has_many
    target: transcript_chunk
    foreign_key: transcript_id

searchable_columns:
  - title
  - participants
  - chunks.body         # dotted path resolved through the relationship
```

The registry template reads this block and emits `searchableColumns: [...]`
on the entity descriptor. The compiler's `expandTextMagic()` (already
implemented in the POC) does the OR fan-out.

## Priority 5 — vendor the pagination shim

### New: `runtime/http/pagination.ts`

The POC needed this because the kit's `search.ejs.t` template imports from
`@shared/http/pagination` but `codegen project init` doesn't vendor the
matching shim. Either:

(a) Move the import to `@shared/subsystems/query/pagination` and vendor it
    via the new query subsystem (cleaner), OR
(b) Vendor `runtime/http/pagination.ts` directly via `project init`

(a) is the right move — pagination is part of the query subsystem
conceptually.

## Migration story for existing kit consumers

For a consumer that already ran `codegen project init` on an older kit
version:

1. `bun update @pattern-stack/codegen` to the version with these
   contributions.
2. Re-run `codegen project init` to vendor updated shims (with diff-aware
   merge for the consumer-modified files).
3. `codegen subsystem install query` to drop the query subsystem.
4. Add `searchable_columns:` blocks to entity YAMLs that need text-magic.
5. `yes | codegen entity new --all` — regenerates `entityName` + the registry.
6. Import `QueryModule` in `AppModule`.

Total effort per consumer: ~15 minutes. The kit ships the substrate; the
consumer plugs it in.

## What stays consumer-defined

Even with all of the above lifted upstream:

- **The HTTP controllers** (`search.controller.ts`, `fetch.controller.ts`)
  stay consumer-side. They're how the consumer chooses to expose the
  primitive (REST / tRPC / MCP / gRPC / whatever).
- **The Zod request schemas** stay consumer-side. They depend on the
  entity-name enum which the kit COULD codegen but is consumer-shaped
  anyway.
- **The seed and demo scripts** stay consumer-side. They're test fixtures,
  not framework code.

## Estimated kit-side effort

| Priority | Lines added/changed in kit | Estimated time |
|---|---|---|
| 1 (base classes + token) | ~80 lines | 2 hours (incl. tests) |
| 2 (vendor FilterCompiler subsystem) | ~600 lines vendored from POC | 3 hours |
| 3 (registry + entityName templates) | ~200 lines (.ejs.t + JS) | 4 hours (incl. snapshot tests) |
| 4 (schema + manifest block) | ~30 lines | 1 hour |
| 5 (pagination shim) | ~30 lines | 30 min |
| **Total** | **~940 lines** | **~10.5 hours** |

Plus the kit's own integration test (`test/scaffold/`) needs to grow to
exercise the new query layer end-to-end. Estimate another 2 hours.

**Grand total: 1-2 days of kit work to make this generally available.**
