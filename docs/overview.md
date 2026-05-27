# Query Surface — a lightweight semantic query layer for LLM agents

**What it is.** A consumer-agnostic primitive that gives an agent three tools —
**`describe` / `query` / `fetch`** — over any Drizzle schema. The agent composes a
*structured filter*, never raw SQL; the engine compiles it to safe, parameterized
SQL. Point it at a schema and it auto-exposes a typed, governed catalog of what's
queryable.

**Why it beats text-to-SQL.** The agent *can't* write invalid SQL — it emits a typed
`FilterExpression` constrained by the catalog, which compiles deterministically (no
injection, no hallucinated columns). Three properties make it drop-in:
- **Introspection-first** — types, enums, relationships, searchable columns are read
  from Drizzle at boot; zero hand-declaration, can't drift.
- **Governed exposure** — field metadata decides what the agent can see; toggle entities/fields live.
- **EAV-native** — dynamic/custom fields are queried exactly like real columns.

**The three tools.**
| tool | does |
|---|---|
| `describe` | typed field catalog — entities, fields, types, enums, relationships, + provenance |
| `query` | structured filter → IDs (+ preview rows, text snippets, the compiled SQL). Cross-entity dotted paths, text fan-out, EAV |
| `fetch` | hydrate IDs → full rows (+ inline relational `expand`) |

**One metadata layer, two homes.** Per-field semantics (label, description, searchable,
preview, visibility) live either **inline on the Drizzle column** (`qField`) or as
**`field_definitions` rows** (EAV / dynamic) — *same vocabulary*, merged into one catalog.
This is the `Field()`-drives-everything model, in TypeScript: one source feeds the agent
catalog, the UI, and (next) the metric layer.

**Dynamic ERD.** *Which* entities/relationships are exposed is **data**, not code — a
runtime registry you can toggle live, or `registerSchema(db)` to auto-expose an entire
schema with no per-entity wiring.

**The walkthrough (web UI).** `Catalog` (fields + provenance) → `Query → compiled SQL`
→ *"% of deals mentioning competitor X"* (two counts, combined) → `Govern` (toggle what's
exposed). The same `describe/query/fetch` framed as agent tools.

**Predicate convergence (with `dealbrain-integrations#174`).** The workflow predicate in
#174 is the *same* op-tree paradigm as our `FilterExpression`. Plan: **one predicate
language**, with this engine as its SQL/Drizzle compile target — the piece #174 stubs.

**Metrics next (Cube).** Aggregation stays in **Cube** (already built in `codegen-patterns`;
its missing piece is the schema *compiler*). Extending the field metadata with
`measure`/`dimension` facets makes **one metadata source feed both `describe` and the Cube
schema**. "% mention X" is the primitives version of Cube's `ratio` metric.

**Status (shipped on `main`).** `describe/query/fetch`, introspection-first catalog, EAV,
`qField` metadata, runtime registry, schema auto-expose, the web UI. The core
(`src/query/*`) is extraction-bounded — ready to become a standalone package.
