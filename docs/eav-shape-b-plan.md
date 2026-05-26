# Implementation plan — EAV Shape B (jsonb single-value) alongside Shape A

**Status:** proposed · **Prereq:** Shape A shipped (commit `9936619`, branch `feat/eav-read-resolution`)
**Audience:** the next implementer (human or agent). Self-contained — read this + the cited files and you can execute.

---

## 1. Goal

The POC resolves EAV reads against **Shape A** today — dealbrain's `field_values` with four
typed value columns (`value_text/value_number/value_date/value_boolean`). We now want the engine to
*also* support **Shape B** — the codegen-patterns layout: a single `value jsonb` column with inline
temporal validity (`valid_from`/`valid_to`). Both shapes must coexist in one running engine,
selected **per entity** by a strategy descriptor. The agent contract does not change: `{ on:
"StageName", op: "eq", value: "Negotiation/Review" }` looks identical regardless of storage shape.

Why both: dealbrain prod is Shape A (what we replace first); codegen-patterns emits Shape B (the
shape future apps get). Proving both in one engine is what makes the read-side resolver a credible
upstream contribution to codegen-patterns.

### The two shapes (verified, see `docs/` + live DBs)

| | Shape A (dealbrain) — **done** | Shape B (codegen-patterns) — **this plan** |
|---|---|---|
| value storage | 4 typed cols | single `value jsonb` |
| value pick | `valueColumnForDataType()` → real `PgColumn` | jsonb extraction + cast → **SQL expression** |
| temporal | none (history = separate table) | inline `valid_from`/`valid_to` |
| current row | the only row | the row with `valid_to IS NULL` |
| data_type vocab | text/longtext/money/percentage/date/datetime/boolean/select/reference/email/url | string/integer/decimal/boolean/date/datetime/json/reference/picklist/multipicklist |
| unique (current) | `(entity_id, entity_type, field_definition_id)` | partial: `(entity_id, field_definition_id) WHERE valid_to IS NULL` |

---

## 2. The one hard difference

Shape A's value is a real `PgColumn`, so resolution returns `{ kind: 'column', column, joins }` and
**every existing op compiles unchanged** (`eq(col, v)`, `gt(col, v)`, `ilike(col, …)`, `asc(col)`).

Shape B's value is `value jsonb`. A comparison needs a **cast expression**, e.g.
`(fv.value #>> '{}')::numeric > $1` or `fv.value #>> '{}' = $1`. That is **not** a `PgColumn`, so
`eq(col, v)` / `gt(col, v)` / `asc(col)` can't take it. Shape B therefore needs:

1. a new resolution kind — `eav_expr` — carrying an `SQL` value expression + the joins, and
2. a parallel op-compilation path — `compileLeafOpExpr(expr, op, value, dataType)` — that builds
   `SQL` fragments against an arbitrary expression instead of a column.

Everything else (the actor-scoped field map, describe folding, read-merge, preview projection,
expand) generalizes with small per-shape branches. **Do not** try to force jsonb onto the
`kind:'column'` path — that's the trap; the expression path is the clean seam.

---

## 3. Design — discriminated strategy

Today (`src/query/build-registry.ts`):

```ts
export interface EavStrategy {        // implicitly Shape A
  valueTable: PgTable;
  entityTypeValue: string;
}
```

Make it a discriminated union:

```ts
export type EavStrategy =
  | { kind: 'typed-columns';            // Shape A
      valueTable: PgTable;
      entityTypeValue: string; }
  | { kind: 'jsonb-value';              // Shape B
      valueTable: PgTable;
      entityTypeValue: string;
      valueColumn: string;              // 'value'
      currentOnly: boolean;             // true → join predicate adds `valid_to IS NULL`
      validToColumn?: string; };        // 'validTo'
```

The **dynamic field map** (`src/query/field-map.ts`, `{ fieldDefinitionId, dataType, selectOptions,
label }`) is shape-agnostic — no change. Only the entity-level strategy + value resolution diverge,
exactly as predicted in the original briefing.

`ENTITIES` in `build-registry.ts` grows a per-entity strategy choice. For the demo, back a **second**
entity with Shape B (recommend `account` or `contact`; `opportunity` stays Shape A). E.g.:

```ts
{ name: 'account', table: accounts, relations: accountsRelations,
  eav: { kind: 'jsonb-value', table: fieldValuesJsonb, entityTypeValue: 'account',
         valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' } },
```

(Adjust the `ENTITIES` registration shape — currently `eavEntityType?: string`; replace with an
optional `eav?: EavStrategyInput` so each entity declares kind + table.)

---

## 4. Work breakdown

### B0 — Schema + seed (Shape B table)
- `src/query/eav-schema.ts`: add `fieldValuesJsonb` table — `id, entityId, entityType,
  fieldDefinitionId, userId, value jsonb, validFrom timestamp null, validTo timestamp null,
  createdAt, updatedAt`. Partial unique index `(entityId, fieldDefinitionId) WHERE valid_to IS NULL`.
  Drizzle 0.30 partial unique: use `.where()` on the index builder, or a raw SQL migration if the
  builder can't express it — verify against drizzle-kit (it was finicky with the array-form config;
  use the object-return `(t) => ({...})` form as elsewhere in this file).
- Export from `src/schema.ts` (NOT the generated barrel).
- `bunx drizzle-kit push` (additive — no prompt expected).
- Seed: extend `src/seed-data/build-eav.ts` (or a sibling `build-eav-jsonb.ts`) to emit
  `field_definitions` (Shape B data_type vocab) + `field_values_jsonb` rows for the chosen entity.
  Store `value` as native JSON (`{ value: 'Acme Industries' }` → pg jsonb). All rows `valid_to: null`
  (current). `field_definitions` is shared — its `data_type` is `varchar`, so it holds both vocabs;
  just use Shape B data_types for the Shape-B entity's defs.
- Decision: **one shared `field_definitions` table** for both shapes (simpler; the value table is
  what differs). Confirm the `(user_id, entity_type, key)` unique still holds across both entity types.

### B1 — Registry
- `build-registry.ts`: the discriminated `EavStrategy` (§3); set per entity in `ENTITIES`; populate
  `desc.eav` accordingly. Import `fieldValuesJsonb`.

### B2 — Compiler (the core)
`src/query/compiler.ts`:
- `PathResolution` gains a third variant:
  ```ts
  | { kind: 'eav_expr'; expr: SQL; joins: {table,on}[]; coerceAs: string }
  ```
- In `resolvePath`, the EAV branch switches on `finalDesc.eav.kind`:
  - `typed-columns` → unchanged (returns `kind:'column'`).
  - `jsonb-value` → build the aliased join. **Join predicate** = `entity_id = parentPk AND
    entity_type = X AND field_definition_id = <uuid>` **AND** (if `currentOnly`) `validTo IS NULL`.
    Build the value expression by data_type via a new `jsonbValueExpr(aliasedValueCol, dataType)`:
    ```ts
    // string/text/select/reference/email/url/picklist  →  text
    sql`${col} #>> '{}'`
    // integer/decimal/number/money/percentage           →  numeric
    sql`(${col} #>> '{}')::numeric`
    // boolean                                            →  boolean
    sql`(${col} #>> '{}')::boolean`
    // date/datetime                                      →  timestamp
    sql`(${col} #>> '{}')::timestamptz`
    ```
    Return `{ kind:'eav_expr', expr, joins, coerceAs: dataType }`.
- Add `compileLeafOpExpr(expr: SQL, op: Op, rawValue, coerceAs?): SQL` mirroring `compileLeafOp` but
  emitting against `expr` with `sql` fragments (reuse `coerceForColumn`-style coercion via
  `coercionCategory`). Map:
  - `eq` → `sql`${expr} = ${v}``; `neq` → `<>`; `gt/gte/lt/lte` → operators;
  - `between` → `sql`${expr} between ${lo} and ${hi}``;
  - `in`/`nin` → `sql`${expr} in (${sql.join(vals, sql`, `)})`` (and `not in`);
  - `contains/startswith/endswith` → `sql`${expr} ilike ${pattern}``;
  - `is_null/is_not_null` → `sql`${expr} is null` / is not null`.
  Note: under the LEFT JOIN, an absent current row → `value` NULL → these behave like a nullable
  column, same invariant as Shape A.
- In `compileLeaf`, dispatch on resolution kind: `column` → `compileLeafOp`; `eav_expr` →
  `compileLeafOpExpr`; `has_many` → unchanged.
- `compileSort`: allow `eav_expr` → `sort.dir === 'desc' ? sql`${expr} desc` : sql`${expr} asc``
  (drizzle accepts `SQL` in `orderBy`).
- Preview projection (`compile()` previewFields loop): for `eav_expr`, the projected value is an
  expression — store it in `eavPreview` and have `runSearch` select it as `expr.as(fieldKey)`.
  Widen `eavPreview` to `Record<string, PgColumn | SQL.Aliased>` and the select-shape typing
  accordingly (drizzle allows mixed column/sql selects).

### B3 — Read-merge (fetch / expand)
`src/query/eav-read.ts`: branch on `desc.eav.kind`.
- `typed-columns` → unchanged (uses `extractTypedValue`).
- `jsonb-value` → query `fieldValuesJsonb` (filter `entityType = X AND entityId IN (…) AND validTo IS
  NULL`), and the decoded value is **already native** (pg returns jsonb as JS) — assign
  `row[key] = fv.value` directly (optionally re-coerce numbers/dates to match Shape A's typed output;
  jsonb numbers come back as JS numbers, dates as strings → coerce dates with `new Date(...)` if you
  want `Date` parity). Keep the batched single-query shape.

### B4 — Surfaces
- `agent-schema.ts` `eavDataTypeToColumnType`: already covers Shape B's vocab (string/integer/
  decimal/picklist/multipicklist) — verify `multipicklist → enum`, `json → json`. No structural change.
- `query_describe` merge is shape-agnostic (reads the field map). Nothing to do beyond confirming
  the Shape-B entity's defs surface.
- `preview.ts`: add the chosen Shape-B entity's curated fields to `PREVIEW_FIELDS`; `previewEavFields`
  already keys off the field map + `registry[entity].eav`, so it works once the strategy is set.

### B5 — Verify (mirror Shape A's verification)
On the Shape-B entity: `eq`, `in`, range (`gt` on a numeric jsonb field), `contains` on a text jsonb
field, sort by a jsonb field, `is_null`. Then cross-entity (a relation that reaches the Shape-B
entity), preview projection, fetch + expand merge. Add a **mixed multi-entity** query in one call
(opportunity=Shape A + the Shape-B entity) to prove both paths in one dispatch. Gate: `bunx tsc
--noEmit` = 0; `bun src/demo.ts`, `bun src/demo-api.ts` (server up), `bun src/mcp-test.ts` all green.
Add 1–2 Shape-B scenes to a demo so it's visible.

---

## 5. Files touched (checklist)

```
src/query/eav-schema.ts        + fieldValuesJsonb table (+ partial unique)
src/schema.ts                  + export
src/query/build-registry.ts    EavStrategy → union; per-entity strategy; import jsonb table
src/query/compiler.ts          eav_expr resolution kind; jsonbValueExpr(); compileLeafOpExpr();
                               dispatch in compileLeaf/compileSort; preview expr projection
src/query/eav-read.ts          branch jsonb-value (native value, valid_to IS NULL)
src/query/service.ts           preview select accepts SQL.Aliased (type widening)
src/query/preview.ts           PREVIEW_FIELDS for the Shape-B entity
src/query/agent-schema.ts      (verify data_type → ColumnType coverage only)
src/seed-data/build-eav*.ts    Shape-B field_definitions + field_values_jsonb seed
src/seed.ts                    truncate + insert the jsonb value table
docs/…                         note Shape B in architecture/README
```

---

## 6. Open decisions (resolve before/while coding)

1. **Which entity is Shape B?** Recommend `account` or `contact` (keeps opportunity = Shape A as the
   production-faithful anchor). Pick one with a believable custom-field story.
2. **Shared vs separate `field_definitions`?** Recommend shared (one table, `data_type` varchar holds
   both vocabularies). Confirm no key collisions across entity types (the unique is per
   `(user_id, entity_type, key)`, so fine).
3. **jsonb extraction operator:** `#>> '{}'` (jsonb → text, then cast) is robust for scalars. `->>'…'`
   is for object keys — not what we want for a scalar `value`. Use `#>> '{}'`.
4. **Temporal in v1:** `currentOnly: true` everywhere → join predicate carries `valid_to IS NULL`;
   seed only current rows. A future `as_of: <ts>` arg would swap that predicate for
   `valid_from <= ts AND (valid_to IS NULL OR valid_to > ts)` — out of scope now, but the
   predicate-injection point is the natural hook.
5. **Numeric/date parity on read-merge:** decide whether Shape B fetched values should match Shape A's
   coerced types (numbers/`Date`) exactly, or pass jsonb-native (numbers fine, dates as ISO strings).
   Recommend coercing dates for parity; document either way.

---

## 7. Effort & risk

- **Effort:** ~0.5–1 day. The compiler expression path (B2) is the only real design work; B0/B1/B3/B4
  are mechanical and mirror Shape A.
- **Risk — low/contained:** the expression path is additive (Shape A untouched, dispatched by
  `kind`). Main gotchas: (a) drizzle 0.30 partial-unique-index expression — fall back to a raw SQL
  index if needed; (b) `sql` fragment correctness for `in`/`between` (use `sql.join`); (c) preview
  select type-widening to accept `SQL.Aliased`. None are architectural.
- **Perf note:** Shape B's `(value #>> '{}')::numeric` casts are **not** index-friendly without
  per-field expression indexes — strictly worse than Shape A's typed columns. Document it; for the
  POC's data volume it's irrelevant.

---

## 8. Definition of done

- A second entity resolves its fields through Shape B (jsonb) with the **same** `{on,op,value}`
  contract; `query_describe` shows its fields; preview/fetch/expand carry them inline.
- A single multi-entity query filters a Shape-A entity and a Shape-B entity together and returns both.
- `tsc` clean; CLI + HTTP + MCP demos green. Shape A behavior unchanged (regression check).
- The agent still cannot tell which storage shape backs any field — the seam is invisible for both.
```
