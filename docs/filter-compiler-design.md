# FilterCompiler — design

The hand-authored layer that compiles `FilterExpression<E>` (JSON) into a Drizzle query. This is the substrate the codegen-patterns kit does NOT emit; it's the new work that proves the proposal.

## Inputs

```ts
interface DomainQueryRequest<E extends EntityName> {
  entity: E;
  filter?: FilterExpression<E>;
  sort?: Sort<E>[];
  search?: SearchExpression<E>;      // shortcut for text-column ILIKE; sugar over filter
  page?: { cursor?: string; limit?: number };
  expand?: ExpandSpec<E>;             // shallow joins to include in result
  include_sql?: boolean;
}

type FilterExpression<E> =
  | LeafFilter<E>
  | { and: FilterExpression<E>[] }
  | { or:  FilterExpression<E>[] }
  | { not: FilterExpression<E> };

interface LeafFilter<E> {
  on: FieldPath<E>;                   // 'stage' | 'account.industry' | 'chunks.body'
  op: Op;
  value: unknown;
}

type Op =
  | 'eq' | 'neq' | 'in' | 'nin'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'startswith' | 'endswith'  // ILIKE-backed text
  | 'exists' | 'is_null'
  | 'has_any';                                // for has_many — compiles to EXISTS subquery
```

## Architecture

```
DomainQueryRequest
       │
       ▼
┌─────────────────┐
│ FilterCompiler  │  loads entity manifest registry
└────────┬────────┘
         │
         ├─ resolve FieldPath → (column ref OR join chain)
         │  e.g. 'account.industry' → JOIN accounts ON opportunities.account_id = accounts.id, SELECT accounts.industry
         │       'chunks.body' (has_many) → EXISTS (SELECT 1 FROM transcript_chunks WHERE transcript_id = ... AND ...)
         │
         ├─ compile LeafFilter → Drizzle SQL fragment
         │
         ├─ compile composite (and/or/not) → bundled fragments
         │
         ├─ apply sort + page
         │
         ├─ apply expand → select-joins for included relations
         │
         └─ emit Drizzle query with where(), orderBy(), limit(), offset()
```

## Module layout

```
src/query/
├── types.ts                  # FilterExpression, Op, DomainQueryRequest, Sort, etc.
├── entity-registry.ts        # in-memory map: entityName → { table, columns, relationships }
├── field-path-resolver.ts    # 'a.b.c' → JoinChain | DirectColumn
├── leaf-compiler.ts          # LeafFilter → Drizzle SQL fragment (per op)
├── filter-compiler.ts        # composite (and/or/not) traversal
├── query-builder.ts          # ties it all together, returns Drizzle query
└── domain-query.service.ts   # NestJS service: query(req) → result + (optional) sql
```

## EntityRegistry shape

Populated from the YAML manifests at boot. Codegen could emit this automatically; for the POC, hand-write it once.

```ts
interface EntityDescriptor {
  name: string;                              // 'opportunity'
  table: PgTable;                            // Drizzle table reference
  columns: Record<string, PgColumn>;         // 'stage' → opportunities.stage
  relationships: Record<string, RelationshipDescriptor>;
}

type RelationshipDescriptor =
  | { type: 'belongs_to'; target: string; foreignKey: string }       // opportunity.account_id → account.id
  | { type: 'has_many';   target: string; foreignKey: string }       // transcript.id ← transcript_chunks.transcript_id
  | { type: 'has_one';    target: string; foreignKey: string };
```

## Field path resolution

For path `'account.industry'` rooted at `opportunity`:

1. Split into segments: `['account', 'industry']`
2. First segment `'account'`: look up in `opportunity.relationships` → `belongs_to account, fk=account_id`
3. Need a JOIN: `LEFT JOIN accounts ON opportunities.account_id = accounts.id`
4. Last segment `'industry'`: look up in `accounts.columns` → `accounts.industry`
5. Return: `{ joins: [accountsJoin], column: accounts.industry }`

For path `'chunks.body'` rooted at `transcript`:

1. Split: `['chunks', 'body']`
2. First segment `'chunks'`: look up → `has_many transcript_chunk, fk=transcript_id`
3. `has_many` means: filter compiles as `EXISTS (SELECT 1 FROM transcript_chunks WHERE transcript_id = transcripts.id AND body ILIKE ...)`. The leaf filter on `body` becomes the INNER WHERE.
4. Return: `{ kind: 'has_many_subquery', target: transcript_chunks, fk: transcript_id, inner_column: transcript_chunks.body }`

## Op → SQL mapping

| Op           | SQL fragment                                 |
|--------------|----------------------------------------------|
| `eq`         | `col = ?`                                    |
| `neq`        | `col != ?` (and `col IS NOT NULL` if needed) |
| `in`         | `col = ANY(?)`                               |
| `nin`        | `NOT (col = ANY(?))` AND `col IS NOT NULL`   |
| `gt/gte/lt/lte` | `col {>,>=,<,<=} ?`                       |
| `contains`   | `col ILIKE '%' || ? || '%'`                  |
| `startswith` | `col ILIKE ? || '%'`                         |
| `endswith`   | `col ILIKE '%' || ?`                         |
| `exists`     | (only meaningful at relationship paths)      |
| `is_null`    | `col IS NULL`                                |
| `has_any`    | `EXISTS (SELECT 1 FROM target WHERE fk=... AND <inner filter>)` |

## Org / user scoping

Every primitive call passes an actor context (`{ user_id, organization_id? }`). The query builder injects:

```sql
WHERE (entity.user_id = $actor.user_id OR entity.organization_id = $actor.organization_id)
AND <user-provided filter>
```

This is the single most important correctness property — verified by a test that calls `query_domain` as user A, requests opportunity belonging to user B, and asserts empty result.

For has_many subqueries (e.g., `chunks.body contains X`), the actor scope is inherited from the root entity — chunks aren't filtered by actor directly; they belong to a transcript that's filtered by actor.

## Test plan (minimal)

1. **Single-entity exact filter** — `entity: 'opportunity', filter: {on: 'stage', op: 'eq', value: 'closing'}` returns expected rows.
2. **Boolean composition** — and/or/not return correct rows.
3. **Cross-entity belongs_to** — `entity: 'opportunity', filter: {on: 'account.industry', op: 'eq', value: 'fintech'}` produces the right JOIN.
4. **has_many subquery** — `entity: 'transcript', filter: {on: 'chunks.body', op: 'contains', value: 'pricing'}` returns transcripts with at least one matching chunk.
5. **Two-hop cross-entity** — `entity: 'transcript_chunk', filter: {and: [{on: 'body', op: 'contains', value: 'pricing'}, {on: 'transcript.opportunity.stage', op: 'eq', value: 'closing'}]}` — the proof-point query.
6. **Org scope** — user A cannot see user B's data even with permissive filter.

## What this lets the agent do

Once the FilterCompiler is in place, the agent gets the *uniform retrieve* described in the proposal:

```json
// One call. Cross-entity. Composable. Text-searchable.
{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "body", "op": "contains", "value": "pricing" },
      { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
    ]
  },
  "expand": ["transcript", "transcript.opportunity"],
  "page": { "limit": 20 },
  "include_sql": true
}
```

That's the language layer the proposal argues for. Build that, demo it, the case is made.
