# Architecture — the 5-layer flow

The dynamic query layer is a stack of five thin layers, each with one job. The
top layer accepts HTTP from the network; the bottom layer reads Drizzle tables.
Every entity's metadata lives in exactly one place — the YAML, then the
generated registry.

## The stack

```
LAYER 4 — Controllers (HTTP/MCP/tRPC)
            accepts JSON, validates with Zod, routes by entity name
            files: src/query/{search,fetch}.controller.ts
                    │
                    ▼  injects repo(s) via DI
LAYER 3 — Per-entity Services  [PUBLIC per ADR-002]
            AccountService, OpportunityService, EmailService, ...
            ├── declared CRUD methods (codegen from queries: block)
            └── query() / search() / fetch()  ← inherited from BaseService
            files: src/modules/<plural>/<entity>.service.ts
                    │
                    ▼  delegates to this.repository ↓
LAYER 2 — BaseRepository<T>  [PRIVATE per ADR-002]
            ships from codegen-patterns runtime (MODIFIED — POC)
            knows: this.table, this.entityName
            query() / search() / fetch() call this.filterCompiler with this.entityName
            file: src/shared/base-classes/base-repository.ts
                    │
                    ▼  property-injected ↓
LAYER 1 — FilterCompilerService  (NestJS @Injectable, @Global() singleton)
            compiles { entity, filter } → Drizzle SQL → rows
            cross-entity path resolution happens HERE
            file: src/query/filter-compiler.service.ts
                    │
                    ▼  reads ↓
LAYER 0 — query-registry  (PLACEHOLDER — codegen would emit from YAML)
            Map<entityName, { table, columns, relationships, searchableColumns }>
            pure data. metadata only.
            file: src/generated/query-registry.ts
```

The registry is **metadata**, not a wrapper around the repos. It's a lookup
table the compiler reads. The repos are distinct NestJS providers. They USE
the compiler; they aren't wrapped by it.

## Flow 1 — same-entity query

`accountRepository.query({on: 'industry', op: 'eq', value: 'fintech'})`

```
controller
  → accountService.search(filter)                              [L4 → L3]
    → this.repository.search(filter)                           [L3 → L2]
      → this.filterCompiler.search({entity:'account', filter}) [L2 → L1]
        → runSearch(db, {entity:'account', filter})            [L1 → L0]
          → registry.account → table=accounts, no relationships needed
          → compile to: SELECT id, ... FROM accounts WHERE industry = 'fintech'
          → execute via Drizzle
        ← { ids, total, preview? }
      ← same
    ← same
  ← same
```

## Flow 2 — cross-entity query

`transcriptRepository.query({on: 'transcript.opportunity.stage', op: 'eq', value: 'closing'})`

```
controller
  → transcriptService.search(filter)
    → this.repository.search(filter)
      → this.filterCompiler.search({entity:'transcript', filter})
        → runSearch(db, ...)
          → registry.transcript
          → path 'opportunity.stage':
              - 'opportunity' is a belongs_to relationship → JOIN opportunities
              - registry.opportunity confirms 'stage' is a column
          → compile to:
              SELECT id, ... FROM transcripts
              LEFT JOIN opportunities ON transcripts.opportunity_id = opportunities.id
              WHERE opportunities.stage = 'closing'
          → execute
        ← { ids, total }
      ← same
    ← same
  ← same
```

**Key point**: the transcript service never knows the opportunities table
exists. The compiler reads the registry to learn about the relationship and
builds the JOIN. The metadata in the registry — generated from YAML — is what
allows the compiler to traverse.

## Flow 3 — multi-entity query

`POST /search { queries: [{entity:'email', filter:F}, {entity:'transcript', filter:F}] }`

```
controller
  → for each query in queries (parallel):
      serviceFor(query.entity).search(filter)
  → assemble { results: { email: {...}, transcript: {...} } }
```

In parallel, each service independently runs through L3 → L2 → L1 → L0.
Different tables. Different relationship graphs. Different searchable-column
expansions (if text-magic).

The response is **tagged by entity**, never unioned. The agent gets per-type
counts and per-type preview shapes — "3 emails matched, 4 transcripts
matched" — which is what it needs to decide what to hydrate next.

## Why this shape

### The registry is data, not behavior

Three reasons it's metadata-only:

1. **Drift resistance.** YAML manifest is the source of truth. Registry is
   regenerated from it. No parallel knowledge to maintain.
2. **Composition.** The compiler reads the registry to walk arbitrary paths.
   If the registry held repos, the compiler would need to call repos to
   traverse — re-introducing the use-case-composition pattern the kit
   explicitly forbids.
3. **Codegen lift.** When `pattern-stack/codegen` adds query-layer emission,
   it generates this one file from manifests. Nothing else needs to change.

### The repository is the entry point

Per `pattern-stack/codegen` ADR-002, services are the public DI surface. The
repository inherits `query()`/`search()`/`fetch()` from `BaseRepository`; the
service inherits the same names from `BaseService` and passes through. So
when a caller wants the dynamic-query layer for entity X, the natural API is
`xService.query(filter)` — same as `xService.findById(id)` or
`xService.list()`. No side-channel "domain query service."

### Cross-entity composition happens at L1

Each entity's repo and service have access only to their own table. Cross-
entity queries (e.g., `transcript.opportunity.stage`) need access to other
entities' tables and FK metadata.

The compiler at L1 is the only layer that has access to the full registry.
That's where path resolution and JOIN building happens. The repos delegate
because they can't reach across.

The fan-out for multi-entity search happens one layer up — the controller (or
a future coordinator) dispatches to N services in parallel. Each service's
compiler call is independent; the compiler doesn't need cross-entity
coordination because each query has exactly ONE root entity.

## What the codegen kit would emit (eventually)

When `@pattern-stack/codegen` adopts the dynamic query layer, three pieces
become generated, replacing today's hand-authored POC equivalents:

1. **`src/generated/query-registry.ts`** — emitted from `entities/*.yaml`,
   reads `relationships:` and `searchable_columns:` blocks per entity.
   Replaces today's hand-authored placeholder.
2. **`entityName` declaration on each `<entity>.repository.ts`** — one line,
   from `entity.name` in the YAML. Today hand-added per repo with a comment.
3. **Modified `base-repository.ts` + `base-service.ts`** vendored from a
   future kit version that ships `query/search/fetch` baked in.

See [`upstream-kit-contributions.md`](./upstream-kit-contributions.md) for the
full lift-into-kit plan.

## What lives where

| Concern | Layer | File(s) |
|---|---|---|
| HTTP routing, body validation | L4 | `src/query/{search,fetch}.controller.ts` |
| Per-entity public API | L3 | `src/modules/<plural>/<entity>.service.ts` (auto-generated; inherits) |
| Per-entity table + entityName | L2 | `src/modules/<plural>/<entity>.repository.ts` |
| Shared methods (`query/search/fetch`) | L2 | `src/shared/base-classes/base-repository.ts` |
| Pass-through pattern | L3 | `src/shared/base-classes/base-service.ts` |
| DI integration | L1 | `src/query/filter-compiler.service.ts` |
| Pure compiler | L0 | `src/query/compiler.ts`, `src/query/service.ts` |
| Cross-entity metadata | registry | `src/generated/query-registry.ts` |
| Text-magic fan-out | L0 (in `compile()`) | `src/query/compiler.ts` `expandTextMagic()` |
