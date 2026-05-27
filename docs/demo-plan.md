# Demo hardening plan — semantic query layer for LLM agents

**For a fresh executing agent.** Goal: harden the existing query-surface POC into a
clean, narratable walkthrough of a *lightweight semantic query layer for LLM agents*.
Make the web UI **visualize** cataloging, what's exposed, structured-query→deterministic-SQL,
the "% of deals mentioning competitor X" example, and live exposure toggles.
**No metric/aggregation primitive** — metrics are handled separately by Cube.js and will
snap on later; do not build aggregation here.

## Current state (main, all merged)
- `QueryApplicationService` exposes **describe / query / fetch** (`src/query/`). Introspection-first
  catalog, EAV fields, `qField`/`field_definitions` metadata, runtime registry, **auto-expose**
  (`registerSchema`/`registerFromDb`, `src/query/schema-registry.ts`).
- Web adapter: **`src/server.ts`** (Bun.serve, no framework) auto-exposes the schema; serves
  **`src/web/index.html`** (dependency-free, describe-driven UI). Run:
  `DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/server.ts` → http://localhost:3577.
  API: `GET /api/describe`, `GET /api/describe/:entity`, `POST /api/query`, `POST /api/fetch`.
- `query` returns `{ ids, total, has_more, preview?, sql?, params? }` (sql/params only when `include_sql`).
- `describe` returns `EntityCatalog[]`; each `fields[]` has `sources` (per-facet provenance:
  `drizzle` | `field_definition` | `field_meta` | `derived`), `type`, `enumValues`, `eav`,
  `searchable`, `preview`, `label`, `note`.

## Key facts / gotchas
- **Entity names are PLURAL** (auto-expose uses table names): `opportunities`, `transcripts`,
  `accounts`, `emails`, `contacts`, `transcript_observations`.
- has_many relation on `opportunities` is `transcripts`; dotted path `transcripts.transcript`
  compiles to an EXISTS subquery. Two-hop works: `opportunity.account.name` (from emails/transcripts).
- **Do NOT run `drizzle-kit push`** — it's interactive and truncates `field_definitions`
  (cascades to `field_values`). Tables already exist on the dev DB. Only `bun src/seed.ts`.
  `seed.ts` is idempotent (TRUNCATE+insert) and does NOT touch `entity_registrations`.
- **SDLC git gate**: a hook blocks any Bash command containing both `git push` and `main`.
  Push with the explicit branch name in its OWN command; run `gh pr create --base main` separately.

## Tasks

### T1 — backend wires (`src/server.ts`)
- `/api/query`: pass `include_sql: true` into `q.query(...)` so responses carry `sql` + `params`.
- Add `POST /api/expose` with body `{ exclude: string[] }`: re-call
  `registerSchema(schema, { eav, exclude })` (keep the same `eav` overlay constant) +
  `q.resetCache()`; respond with the fresh `await q.describe()`. Drives live exposure toggles.

### T2 — seed competitor mentions (`src/seed-data/`)
- Edit several deals' transcript text (deal-*.ts) to mention real competitors
  (e.g. **Looker, Gong, Salesforce, Tableau**) across ~3–4 of the 10 deals, varied, so
  "what % of deals mention X" returns believable non-zero numbers for a few competitors.
- Re-run `bun src/seed.ts`; verify with
  `query('opportunities', { on:'transcripts.transcript', op:'contains', value:'Looker' })` → `total` > 0.

### T3 — frontend (`src/web/index.html`, vanilla, reuse existing style)
1. **Provenance badges** in the field catalog from `fields[].sources` (color/tag introspected vs
   EAV vs metadata vs derived) + a small legend. Header: "what the agent sees, and where it comes from."
2. **SQL panel**: after each query render the compiled `sql` (+ params) in a `<pre>`. Story:
   "the agent never writes SQL — it composes a typed filter, we compile deterministic, parameterized SQL."
3. **Canned-example gallery** (buttons that fill the builder + run): (a) EAV —
   `opportunities` StageName in [Negotiation/Review, Proposal/Price Quote] AND Amount gt 100000;
   (b) text-magic — `transcripts` text contains 'pricing' (preview on → snippets);
   (c) has_many cross-entity — `opportunities` where transcripts.transcript contains 'security';
   (d) two-hop — `emails` where opportunity.account.name eq <a real account name from describe/seed>;
   (e) the competitor %.
4. **"% mention competitor" combiner**: pick/enter a competitor → run
   `query('opportunities', { on:'transcripts.transcript', op:'contains', value:X })` and
   `query('opportunities', {})`; render "**X of Y deals (Z%)**" + show both compiled SQLs.
5. **Exposure toggles**: a checkbox per entity (from describe) → `POST /api/expose { exclude }` →
   re-render the catalog/sidebar. Story: "govern what the agent can see (Field visibility)."
6. **Agent-tools panel**: small static panel showing describe / query / fetch as agent tool
   definitions (name + one-line + JSON arg shape). Story: "drop these 3 tools into any agent env."
7. **Narrative section headers**: Catalog → Query→SQL → Govern, so the flow is easy to follow.

### T4 — verify
- `bunx tsc --noEmit` clean.
- Boot server; curl-check: `/api/describe` (sources present), `/api/query` (sql returned),
  the competitor % (non-zero post-seed), `/api/expose` toggles the catalog.
- Leave the server runnable; the user opens http://localhost:3577.

### T5 — ship
- Branch `feat/demo-hardening` off `main`; commit; push (explicit branch, own command);
  `gh pr create --base main` (separate command).

## Walkthrough
1. **Catalog** — "point it at the Drizzle schema → auto-exposed typed catalog." Click an entity;
   show fields + provenance badges + relationships. "This is what the agent sees; it's governed."
2. **Query → SQL** — click a canned example (the cross-entity competitor one); show results +
   the compiled SQL. "The agent composes the filter; we compile safe, deterministic SQL — it
   *can't* write invalid SQL."
3. **Money shot** — "What % of deals mention [Looker]?" → one click → "X of Y deals (Z%)".
   Exactly the competitor example, on primitives (two counts), no metric layer needed.
4. **Govern** — toggle an entity off → the catalog/agent view updates live.
5. **Framing** — describe/query/fetch = 3 tools droppable into any agent environment. The
   **metric layer snaps on top via the SAME Field metadata** (see Cube context below).

## Cube / metric layer context (framing only — do NOT build here)
codegen-patterns already **ships the Cube runtime** (analytics protocol, `CubeAnalyticsBackend`,
`AnalyticsModule.forRoot`, a `WithAnalytics` mixin on every service) **and** the semantic
field/entity metadata schema (`measure` + `analytics_aggregation`; `dimension`/`dimension_type`;
`simple`/`derived`/`ratio`/`cumulative` metric defs). What it's **missing is the compiler/bridge** —
nothing walks field metadata → emits a Cube schema (ParsedEntity doesn't even carry the analytics
block). That bridge is exactly a *Field-metadata-on-Drizzle* layer — i.e. **our `qField` extended
with `measure`/`dimension` facets**. So ONE Field-metadata source would feed both the agent's
`describe` and the Cube schema generator. Two more alignments: our `FilterExpression`
(contains / gt / in / cross-entity dotted paths) is strictly richer than Cube's equals-only flat
filters and could translate into Cube's `where`; and "% of deals mentioning X" is the primitives
version of Cube's `ratio` metric. (Framing only — not built here.)

## Out of scope (explicit)
- No aggregation/metric primitive (Cube handles metrics).
- No `drizzle-kit push` / schema changes. No relocation of the sales-coach example.
