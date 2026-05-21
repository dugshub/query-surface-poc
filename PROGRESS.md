# Progress

Running log. Newest on top. Updated each phase.

## 2026-05-21 — API shape decision (Doug + Claude, mid-drive call)

**Locked in. Build queue:**

### Round 1 — meeting-ready build

Split `/query` into two endpoints:

**`POST /search`** — finds things, returns IDs by default
- Accepts a single entity OR an array of per-entity queries (option (a) — explicit shape)
- Multi-entity response is tagged by type: `{transcript: {ids, total}, email: {ids, total}}`
- Optional `preview` flag returns `[{id, title?, snippet?, occurred_at?}]` so the agent can browse before hydrating

**`POST /fetch`** — hydrates IDs into full rows
- `{entity, ids, expand?, filter?}` — optional filter for refinement
- Refinement filter lets the agent say "of these 200 IDs, give me only the ones in stage=closing" without a fresh search trip

This delivers:
- Column-level search (existing leaf filter shape)
- Cross-entity filtering via dotted paths (already works — proven by Q6)
- Sequential composition (IDs from `/search` feed `{on: 'id', op: 'in', value: [...]}` into next `/search` or `/fetch`)
- Nested composition (single nested filter in one shot)
- Multi-entity root (the new bit)
- Two-stage IDs-then-full pattern

Estimated time: ~1.5h from cold.

### Fast-follow — same-filter fan-out across entity types

For when the agent wants "find 'pricing' anywhere across emails and transcripts" without spelling out each entity's column mapping:

1. **Entity manifests declare searchable columns.** Either per-field `searchable: true` or entity-level `search: { default_columns: [...] }`. Lean toward per-field — composes naturally; multiple columns OR together.
   - `email.body searchable: true`, `email.subject searchable: true`
   - `transcript_chunk.body searchable: true` (transcript inherits via has_many fan-out)
2. **Magic field name `text` on filters.** `{on: 'text', op: 'contains', value: 'pricing'}` against entity X expands to `OR(searchable_columns)` for that entity.
3. Multi-entity call becomes: `{entity: ['email','transcript'], filter: {on: 'text', op: 'contains', value: 'pricing'}}` — engine handles the per-entity expansion.

Result: caller can be explicit (when filters differ per entity) OR use the magic field (when one search applies across types). Same substrate, two ergonomic shapes.

Estimated time: ~30-45 min.

---

## 2026-05-21 ~15:00 PT — 🎉🎉 HTTP API ADDED — surface is now network-exposed, not local-only

Added `POST /query` via NestJS. Now the *same* JSON FilterExpression can be sent over HTTP — what an agent / frontend / external service would actually call. The CLI demo was the test harness; this is the real interface.

### Files added

- `src/query/query.controller.ts` — `@Controller('query')` with Zod-validated body, BadRequest on compile errors
- `src/query/query.module.ts` — module wrapper
- `src/app.module.ts` — adds `QueryModule` to imports

### What it looks like from outside

```bash
# Q6 — the proof point — over HTTP, no SQL knowledge needed by the caller
curl -X POST http://localhost:3577/query -H 'Content-Type: application/json' -d '{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "body", "op": "contains", "value": "pricing" },
      { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
    ]
  },
  "include_sql": true
}'

# Response: { "rows": [...8 chunks...], "count": 8, "sql": "...", "params": [...] }
```

### Verified end-to-end over HTTP

| Query | Counts (HTTP) | Counts (CLI) | Match |
|-------|---------------|--------------|-------|
| Q1 | 2 | 2 | ✓ |
| Q2 | 2 | 2 | ✓ |
| Q3 | 2 | 2 | ✓ |
| Q4 | 4 | 4 | ✓ |
| Q5 | 5 | 5 | ✓ |
| Q6 | 8 | 8 | ✓ |

### Error paths verified

```bash
# Invalid op  → 400 { "error": "invalid_request", "issues": {...zod tree...} }
# Bad path    → 400 { "error": "compile_error",  "message": "Field path 'banana' invalid..." }
# Unknown entity → 400 with Zod's enum-value-mismatch message listing valid options
```

### One side-fix in service.ts

The earlier row-unwrap heuristic (`desc.name + 's'`) broke for `opportunity → opportunities` and returned rows wrapped as `{opportunities: {...}, accounts: {...}}`. Replaced with `getTableName(compiled.rootTable)` from drizzle-orm — same pattern that fixed the join dedup earlier. Now responses are flat root-entity rows regardless of how many JOINs were used internally.

### Boot the server

```bash
cd /Users/dug/Projects/dealbrain-integrations/query-surface-poc
docker-compose up -d                                          # if Postgres isn't up
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp PORT=3577 bun src/main.ts
# → "Application listening on http://localhost:3577"
```

Then `POST /query` is the entire interface.

---

## 2026-05-21 ~14:35 PT — 🎉 DEMO WORKING END-TO-END

**All 6 demo queries pass against the seeded data. Q6 — the proof point — emits exactly the SQL the proposal claims it should.**

### Quick start when you wake

```bash
cd /Users/dug/Projects/dealbrain-integrations/query-surface-poc
docker-compose up -d                                    # if Postgres isn't running
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/demo.ts
# Or just read the captured output:
cat demo-output.txt
```

### Demo result row counts

| Query | What | Rows | Notes |
|-------|------|------|-------|
| Q1 | `stage = closing` | 2 | Single entity, exact filter |
| Q2 | `account.industry = fintech` (1-hop belongs_to) | 2 | Cross-entity JOIN works |
| Q3 | `(stage IN ['closing','negotiation']) AND (account.industry IN ['fintech','saas']) AND (amount > 30K)` | 2 | Boolean composition + numeric op |
| Q4 | `transcripts WHERE chunks.body contains 'pricing'` (has_many subquery) | 4 | EXISTS subquery — ACROSS search |
| Q5 | `chunks WHERE transcript_id = X AND body contains 'pricing'` | 5 | WITHIN search — same primitive, different root |
| **Q6** | **`chunks WHERE body contains 'pricing' AND transcript.opportunity.stage = 'closing'`** | **8** | **TWO LEFT JOINS + ILIKE + categorical — one call** |

### Q6 — what the agent emits, what gets compiled

The agent says:
```json
{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "body", "op": "contains", "value": "pricing" },
      { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
    ]
  },
  "sort": [{ "field": "position", "dir": "asc" }],
  "page": { "limit": 20 }
}
```

Compiles to:
```sql
SELECT transcript_chunks.*, transcripts.*, opportunities.*
FROM "transcript_chunks"
LEFT JOIN "transcripts"    ON transcript_chunks.transcript_id = transcripts.id
LEFT JOIN "opportunities"  ON transcripts.opportunity_id = opportunities.id
WHERE (transcript_chunks.body ILIKE '%pricing%' AND opportunities.stage = 'closing')
ORDER BY transcript_chunks.position asc
LIMIT 20
```

That's the language layer the proposal argues for: one composable primitive that spans entities, text search, and structured filters. **No special operators, no per-entity dialects, no per-query helper tool.**

### Build phases — actual outcomes

- [x] Recovery + audit of discussion docs (8 files restored, audit clean)
- [x] POC dir created, design docs written (PLAN.md, FilterCompiler design, demo queries)
- [x] Research: codegen-patterns digest (subagent)
- [x] Scaffold consumer: package.json (drizzle 0.30 pinned, NestJS 10, bun), tsconfig (with @shared / @gen / @modules / @generated aliases — @shared had to be repointed to ./src/shared after init vendored there), drizzle.config (pointed at src/schema.ts), codegen.config.yaml (clean-lite-ps), .env, docker-compose
- [x] `codegen project init` — vendored shims (base classes, tokens, OpenAPI registry, app.module shell, main.ts)
- [x] Added missing peer deps: @nestjs/swagger, yaml
- [x] Hand-wrote `src/shared/http/pagination.ts` — kit didn't vendor it but search use-cases need it
- [x] Dropped events/generated dir — no entities emit events
- [x] 5 entity YAMLs written: account, opportunity, email, transcript, transcript_chunk
  - Type fixes: `timestamp` → `datetime`, `text` → `string` (kit's Zod schema doesn't include those legacy names)
- [x] `codegen entity new --all` — 5/5 generated, one ADR-021 warning (cascade on soft_delete = no-op; non-blocking)
- [x] `drizzle-kit push` — 5 tables created with proper FK cascades + enum types
- [x] FilterCompiler implemented at `src/query/{types,registry,compiler,service,index}.ts`
  - Ops: eq/neq/in/nin/gt/gte/lt/lte/contains/startswith/endswith/is_null/is_not_null
  - Composites: and/or/not
  - Dotted FieldPath resolution: belongs_to → LEFT JOIN; has_many → EXISTS subquery
  - Sort by dotted paths (joins reused from filter)
  - Page (limit/offset)
  - include_sql for debug
- [x] Seed: 3 accounts × 6 opps × 5 emails + 4 transcripts × 24 chunks
- [x] Demo CLI: 6 escalating queries, prints JSON FilterExpression + compiled SQL + result preview
- [ ] MCP tool (stretch) — left for later. CLI demo is enough to land the proposal.

### Dogfood bugs hit and fixes

1. **`@shared/*` alias mis-pointed** — init vendors to `src/shared/`, my tsconfig had it at `./shared/`. Fixed in tsconfig.
2. **`@shared/http/pagination` not vendored** — kit's search.ejs.t imports it but init doesn't drop it. Wrote a minimal shim (PaginationSchema + Page<T> + paginated()).
3. **`Page<T>.has_more` required vs kit emits without** — made `has_more` optional in the shim.
4. **`src/shared/subsystems/events/generated/*` had unresolved sibling imports** (`events.tokens`, `events-errors`) — those exist in the kit's `runtime/subsystems/events/` but init didn't vendor them. None of my entities emit events; dropped the dir.
5. **`type: timestamp` rejected** — kit's Zod schema accepts `datetime`. Fixed.
6. **`type: text` rejected** — kit accepts `string`. Fixed.
7. **`transcript_chunks` table export is snake_case** (not `transcriptChunks` camelCase as I'd guessed) — kit emits `<plural>` literal as the table variable name. Fixed registry import.
8. **EXISTS subquery missing parens** — Drizzle's `exists()` helper doesn't paren raw `sql\`\`` templates. Switched to literal `sql\`exists (select 1 …)\``.
9. **Join dedup keyed off wrong identifier** — was using `_.name` which doesn't exist on Drizzle tables; all tables hashed to the same key, so second JOIN was dropped silently. Used `getTableName(table)` from drizzle-orm. **This was the Q6 blocker.**

### Decisions logged (autonomous, override later)

See PLAN.md "Autonomous decisions made" table. Highlights:
1. Chunked transcripts, not chunked emails ✓ delivered as designed
2. ILIKE not ts_vector for text search ✓
3. Sandbox at `dealbrain-integrations/query-surface-poc/` ✓
4. CLI demo before MCP ✓ (MCP deferred)
5. Stage + amount as real columns on opportunity ✓
6. TypeScript + NestJS + Drizzle + Postgres + bun ✓
7. `pattern: Knowledge` doesn't fit for transcript_chunk (empty stub) — used `pattern: Base` instead ✓

### What this proves

The proposal isn't theoretical. The same JSON primitive expresses:
- Single-entity exact filters (Q1)
- Cross-entity 1-hop traversals (Q2)
- Boolean composition with numeric/categorical/cross-entity all together (Q3)
- Text search across a corpus via has_many subquery (Q4)
- Text search within a known parent (Q5)
- Cross-entity 2-hop + text search composed (Q6 — proof point)

All compile to clean Drizzle SQL. All return real rows. **No special operators, no per-entity dialects, no per-query helper tool.** The agent learns the FilterExpression vocabulary once and reuses it for everything.

The next move (when you decide to invest) is the MCP tool — wrap `runQuery` as a single tool, expose it to Claude Code, and the demo becomes "open Claude Code, ask the proof-point question in natural language, watch the model emit Q6's JSON and get back data."

---

## 2026-05-21 ~10:25 PT — Scaffolding shell + design docs done; awaiting research

Kit-agnostic scaffolding landed:
- `PLAN.md` — full POC scope, entity model, proof-point query, autonomous decisions, risks
- `README.md` — quick-start + the proof-point query
- `docker-compose.yml` — Postgres 16 on port 5532 (offset from dealbrain's)
- `.gitignore`, `.env`, `.env.example`
- `docs/filter-compiler-design.md` — full design of the hand-authored layer (FieldPath resolution, op→SQL table, org scoping, test plan)
- `docs/demo-queries.md` — the 6 demo queries with JSON FilterExpressions, escalating composability, culminating in the proof-point query

Subagent (general-purpose) dispatched to research codegen-patterns deeply. Will return: minimum consumer file set, exact entity YAML Zod schema, family base classes + methods, dogfood bugs surviving to main, search/Cube emission status, CLI commands, justfile shape.

### Phase status

- [x] Recovery + audit of discussion docs
- [x] POC dir created, scaffolding shell (env, docker, .gitignore)
- [x] PLAN.md + design docs written (FilterCompiler, demo queries)
- [ ] **Research: codegen-patterns digest** (subagent running — non-blocking; doing non-overlapping work meanwhile)
- [ ] Scaffold: package.json, codegen.config.yaml, tsconfig, justfile, app.module shell (BLOCKED on research for kit versions + YAML schema)
- [ ] YAMLs: 5 entity manifests (BLOCKED on research for exact schema)
- [ ] Codegen run + dogfood fixes
- [ ] FilterCompiler implementation
- [ ] Seed + demo CLI
- [ ] MCP tool (stretch)

### Decisions logged (autonomous, override later)

See PLAN.md "Autonomous decisions made" table. Highlights:
1. Chunked transcripts, not chunked emails
2. ILIKE not ts_vector for text search
3. Sandbox at `dealbrain-integrations/query-surface-poc/`
4. CLI demo before MCP
5. Stage + amount as real columns on opportunity (this is POC, not dealbrain)
6. TypeScript + NestJS + Drizzle + Postgres + bun
