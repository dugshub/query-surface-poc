# Choosing an EAV storage shape (A vs B)

The query engine resolves **two EAV storage shapes** behind one agent contract. This note is how to
decide which a given entity should use. Implemented in `feat/eav-read-resolution` (Shape A: commit
`9936619`; Shape B: `8338389`). See also `docs/eav-shape-b-plan.md`.

## The framing that matters first

Both shapes sit behind the **identical agent contract**. `{ on: "StageName", op: "eq", value: "…" }`
and `{ on: "Industry", op: "eq", value: "…" }` look the same to the agent, the MCP tools, and
`query_describe` — regardless of how the value is stored. So this is **not** a paradigm choice. It is:

- a **storage / operations** decision (indexing, value shape, history),
- made **per entity** (one entity can be Shape A, another Shape B — they compose in one query),
- and **contract-stable** to change later (flipping the strategy is a data migration, not an API change).

The two shapes:

| | **Shape A** — typed columns (dealbrain) | **Shape B** — jsonb single value (codegen-patterns) |
|---|---|---|
| value storage | `value_text / value_number / value_date / value_boolean` | one `value jsonb` |
| value pick | real `PgColumn` chosen by data_type | `(value #>> '{}')::<cast>` SQL expression |
| temporal | none (history = separate table) | inline `valid_from` / `valid_to` |
| resolver path | `kind:'column'` (rides every existing op) | `kind:'eav_expr'` (parallel op compiler) |
| POC entity | `opportunity` | `account` |

## Decision criteria

| Axis | Lean **Shape A** | Lean **Shape B** |
|---|---|---|
| **Query load** | fields filtered / sorted heavily, at scale | mostly hydrate-by-entity; light filtering |
| **Indexing** | need real btree indexes on values | OK with seq-scan or per-field expression indexes |
| **Value shape** | scalars (text / number / date / bool) | nested objects, arrays, multipicklist, open-ended |
| **History** | history lives in a separate table | want value history inline (`valid_from`/`valid_to`) |
| **Schema ownership** | you own the DDL; want DB-level typing | codegen owns the table (it emits a single `value`) |
| **Match existing system** | dealbrain prod (is Shape A) | a fresh codegen-patterns app |

### The one technical hinge: indexability

Shape A stores values in typed columns, so `value_number > 50000` uses a plain btree index (the POC
adds `(field_definition_id, value_text)` and `(field_definition_id, value_number)` covering indexes).
Shape B filters via `(value #>> '{}')::numeric > 50000` — a **cast expression that won't use an index**
unless you add a per-field expression index, which is awkward to maintain. At small scale it's
irrelevant; on a hot filter field at production volume, Shape A wins clearly.

## Default recommendation

- **Shape A** when you control the schema *and* the entity's fields get queried / sorted at scale —
  the dealbrain reality (opportunities filtered by stage / amount / close-date constantly). Gives type
  integrity + indexes.
- **Shape B** when the value shape is open-ended, you need inline history, or **codegen owns the
  table** — today codegen-patterns emits only a single `value` column, so a generated EAV entity *is*
  Shape B until codegen learns a typed-column mode (tracked in dealbrain-integrations'
  `field_values.yaml` as issue #124).
- **Don't pick globally.** Choose per entity. The POC ships the split deliberately: `opportunity`
  (high-query, production-faithful) on Shape A; `account` (flexible custom fields) on Shape B; they
  compose in a single query (`opportunity where account.Industry = 'fintech'`).

## The mechanical knob

Per-entity `eav.kind` in `ENTITIES` (`src/query/build-registry.ts`):

```ts
// Shape A
eav: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'opportunity' }
// Shape B
eav: { kind: 'jsonb-value', valueTable: fieldValuesJsonb, entityTypeValue: 'account',
       valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' }
```

The compiler reads `kind` and routes; everything downstream (`query_describe`, preview, fetch, the
agent) is identical.

## Honest caveats

- **"Reversible" = contract-stable, not free.** Flipping an entity's shape is a **data migration**
  (rewrite its rows typed-columns ↔ jsonb). Cheap in the registry, real in the database.
- **Preview vs fetch numeric formatting** (both shapes): preview projects the raw/cast value (numeric
  arrives as a string over the wire); fetch coerces to a JS number. Cosmetic; the agent gets the
  number from fetch.
- **Shape B partial-unique** `(entity_id, field_definition_id) WHERE valid_to IS NULL` is created via
  raw SQL (drizzle 0.30 can't express it), so it's not in a migration file. The seed guarantees one
  current row per field regardless.
