# Progress

Running log. Newest on top. Updated each phase.

## 2026-05-22 — MCP server now routes through repositories (architectural correction)

The original 2026-05-21 MCP build chose direct `runSearch`/`runFetch` imports
over the repo-routed Service → Repository → FilterCompilerService stack. The
reasoning at the time ("same code path as the HTTP controllers") was true at
the pure-function layer but **false at the repo/service layer** — MCP bypassed
the repos entirely. That made the "repo is the API" claim half-true: HTTP
honored it, MCP didn't.

This corrects the divergence. Both transports now share the full 5-layer flow.

### What changed

`src/mcp-server.ts`:
- Bootstraps NestJS via `NestFactory.createApplicationContext(AppModule, { logger: false })` at startup
- Resolves the 5 entity services (`AccountService`, `OpportunityService`, `ContactService`, `EmailService`, `TranscriptService`) from the DI graph
- Tool handlers call `serviceFor(entity).search/fetch(...)` exactly like the HTTP controllers do
- Multi-entity dispatch uses `Promise.all` over services (same pattern as `SearchController`)
- `query_describe` stays out of Nest — pure metadata read off `agent-schema.ts`
- Shutdown calls `app.close()` instead of `closeDb()` — the DatabaseModule owns the Drizzle pool now
- `logger: false` is critical: stdout is the MCP transport, Nest's default logger would corrupt the protocol

### What this buys

- Any cross-cutting concern added at the repo layer (soft-delete filtering, actor scoping, audit logging) automatically applies to both MCP and HTTP
- The proposal claim "the repository is the entry point" is now true end-to-end — not just over HTTP
- Future Nest interceptors / guards / pipes apply to MCP too

### Cost

- ~300-500ms cold-boot per MCP server spawn (Nest module scan). Claude Code keeps the subprocess alive across calls, so paid once per editor session.

### Verified

`bun src/mcp-test.ts` — 5/5 pass with identical counts to the pre-refactor
direct-import version:
- Proof-point query: 29 transcripts in closing-stage deals (same)
- Multi-entity: 13 emails + 65 transcripts mentioning "pricing" (same)
- 3-hop expand chain: same hydrated shape

`bun src/demo-api.ts` against `bun src/main.ts` HTTP server: same 5 scenes
all pass — HTTP path unchanged.

---

## 2026-05-22 — Compiler date / number / boolean coercion

Bug: `compileLeafOp` passed JSON values straight to Drizzle's `eq/gt/...`
helpers with `as never` casts. Date strings on timestamp columns broke
because Drizzle expects `Date` objects.

Fix: `coerceForColumn(col, value)` reads Drizzle's `col.dataType`
(`'date'|'number'|'boolean'|'string'`) and coerces JSON values accordingly:
- ISO date strings → `Date` (validated via `Number.isNaN(d.getTime())`)
- Numeric strings on integer columns → `Number(value)`
- `'true'`/`'1'` / `'false'`/`'0'` → `boolean`
- Per-element for arrays (`in`/`nin`/`between` work transparently)
- ILIKE ops (`contains`/`startswith`/`endswith`) skip coercion — always want string patterns

Validated live with date `gte`, date `between`, integer string on `amount`,
boolean string on `is_won`, and combined date + cross-entity reach.

---

## 2026-05-22 — Dealbrain schema migration + 10-deal seed corpus

Branched `feat/dealbrain-schema` off `feat/repo-based-architecture`. Major
shape change to match dealbrain's live tables:

- **Dropped `transcript_chunk` entity.** Body lives inline in `transcripts.transcript` text column (matches production).
- **Added `contact` entity** (minimal — proves `account.has_many.contacts`).
- **Cheat: `transcripts.opportunityId` direct FK** (production routes via meetings M2M; M2M compiler support deferred).
- **EAV flattened**: `opportunity` carries canonical Salesforce defaults (`stage`, `amount`, `closeDate`, `nextStep`, `probability`, `isClosed`, `isWon`, `description`) as real columns + dealbrain-native columns (`stateOfDeal`, `stateOfDealStatus`, `isVisible`, `emailDomains`, `providerMetadata`). EAV resolution is a v2 compiler lift — same shape as cross-entity reach, JOIN through `field_values`.
- **Email body** stored as plaintext (production wraps in `jsonb<EncryptedPayload>` — orthogonal to search semantics).
- **Kept pgEnums** for POC simplicity (production uses varchar per dealbrain's no-enum rule — known divergence, doesn't affect SQL).

### Seed corpus — 10 deals, 125 transcripts

- Per-deal files under `src/seed-data/deal-NN-<slug>.ts`, aggregated by barrel
- 10 deals across all 7 stages, $25K–$560K, 5 industries
- Deliberate theme overlap: "pricing" → 65 transcript hits / 7 deals; "Cyberdyne" in Soylent only; "data residency", "SOC2", "renewal lock", "pilot extension" each span 2–3 deals
- Authored via 10 parallel agents per persona; transcript-expansion via 10 parallel agents brought corpus from 14 → 125

### `query_describe` MCP tool

Third tool exposing entity/column/relationship/enum metadata + per-entity
examples — agents self-discover the schema instead of guessing.
`src/query/agent-schema.ts` carries the agent-facing schema (separate from
`query-registry.ts` which is the compiler's metadata).

---

## 2026-05-21 — MCP server live (`query_search` + `query_fetch`)

Standalone stdio MCP server exposing the uniform query primitive as two tools.
Claude Code (or any MCP client) can call them in natural language.

### What's running

```
Claude Code → spawns → bun src/mcp-server.ts (stdio)
                          │
                          ▼
                       in-process: McpServer + 2 tools
                          │
                          ▼
                       runSearch / runFetch / runSearchMulti (no HTTP)
                          │
                          ▼
                       Drizzle + Postgres
```

The MCP server imports the pure compiler functions directly — no HTTP layer,
no NestJS bootstrap, one process, one DB connection.

### Tools

- **`query_search`**: same shape as `POST /search` — accepts single-entity inline or `queries: [...]` array. Returns IDs + total + optional preview rows with `_snippets`.
- **`query_fetch`**: same shape as `POST /fetch` — accepts IDs + optional filter refinement + optional `expand` array. Returns hydrated rows with relations attached inline.

Both tools return `{ content: [{ type: 'text', text: <json> }], structuredContent: <parsed> }` so any MCP client (text-only or structured-aware) gets the data.

### Verified end-to-end

`bun src/mcp-test.ts` runs as an MCP client against the spawned server. 5 tests pass:

1. `tools/list` returns both tools with descriptions
2. `query_search` proof-point returns 8 matches + per-row `_snippets` with match offsets
3. `query_fetch` with 3-hop expand chain returns transcript_chunk → transcript → opportunity → account inline
4. Multi-entity `query_search` dispatches email + transcript in parallel
5. Error path (`expand: ['banana']`) returns `isError: true` + structured `compile_error`

### Files added

- `src/mcp-server.ts` — McpServer + StdioServerTransport, two `server.tool()` registrations
- `src/mcp-test.ts` — spawns the server via Client + StdioClientTransport, exercises both tools
- `docs/mcp-integration.md` — Claude Code setup walkthrough, tool reference, troubleshooting

### Dependencies

- `@modelcontextprotocol/sdk@1.29.0`

### Architectural decision

Chose **in-process** (direct function imports) over **HTTP proxy** (POSTs to the running NestJS server). Reasons:
- Removes the HTTP dependency — MCP server runs without the Nest app being up
- One process, one DB connection — cleaner lifecycle
- Same code path as the HTTP controllers (both call the same `runSearch`/`runFetch`)
- Cost: duplicates the input validation (the controllers' Zod schemas are reused but the surrounding error-classification is per-transport)

If we ever want the MCP server to share the NestJS DI graph (e.g., to use the same auth context as the HTTP layer), the path is straightforward: bootstrap Nest in the MCP server's main(), inject the FilterCompilerService. Deferred for now — the demo doesn't need shared auth.

---

## 2026-05-21 — Snippets + expand on /fetch landed

### Snippet extraction (additive `_snippets`)

When `preview: true` AND a text op (`contains`/`startswith`/`endswith`) fires
in the filter, each matching preview row gets an additional `_snippets` array:

```json
{
  "id": "...",
  "subject": "Re: Pricing for Q3 deal",          // unchanged
  "body": "Thanks for the breakdown...",          // unchanged
  "_snippets": [
    {
      "column": "body",
      "snippet": "…breakdown. The pricing tier feels high — can we discuss volume…",
      "match": { "start": 30, "end": 37 },       // offsets WITHIN snippet (incl. leading ellipsis)
      "full_length": 106                          // length of source column for "fetch more" awareness
    }
  ]
}
```

Properties verified:
- Additive — `subject`/`body` etc. stay untouched
- Multi-column for text-magic fan-out (subject + body both get entries when both match)
- Case-insensitive (mirrors ILIKE)
- Skipped silently for rows with no per-row match
- Skipped for has_many matches (transcript→chunks.body — child column not in parent preview; v2 could attach matching chunk IDs)
- Skipped when no text op fires (no `_snippets` array)
- Auto-extends preview SELECT to pull matched columns even when not in the entity's default preview field list (e.g. email's `body` joins the preview when searched)

Implementation:
- `src/query/snippets.ts` — pure function `buildSnippets(row, descriptors, contextChars=60)`
- Compiler tracks direct-column text-op leaves in `CompileContext.textMatches`, deduped by `column|op|pattern`. Joined-column matches (e.g. `account.industry contains 'fin'` on transcript root) excluded for v1 to keep the runtime simple
- `runSearch` extends preview SELECT shape with any matched column, runs the substring search post-query, attaches `_snippets` only when matches were found

### `/fetch` expand semantics

`expand: ['opportunity', 'opportunity.account', 'chunks']` now actually
enriches rows inline:

```json
{
  "entity": "transcript_chunk",
  "rows": [
    {
      "id": "...", "position": 0, "speaker": "seller", "body": "...",
      "transcript": {
        "id": "...", "title": "Acme — Pricing review", ...,
        "opportunity": {
          "id": "...", "name": "Acme — Q3 New Logo", "stage": "closing",
          "account": { "id": "...", "name": "Acme Corp", "industry": "fintech" }
        }
      }
    }
  ]
}
```

Behavior:
- **belongs_to** → inline object on row (`row.opportunity = {...}` or `null`)
- **has_many** → array on row (`row.chunks = [...]`)
- **Nested paths** (`opportunity.account`) → recursive expansion on attached children
- **Multi-path** — `['transcript', 'transcript.opportunity', 'transcript.opportunity.account']` works (paths share intermediate batches via tree-structured spec)
- **Batched**: ONE `WHERE id IN (...)` per expand segment. No N+1.
- **Depth-limited at 3 hops** — throws 400 `compile_error` with the offending entity in the message
- **Invalid path** (`expand: ['banana']`) — throws 400 `compile_error` listing available relationships

Implementation:
- `src/query/expand.ts` — `parseExpandPaths()` builds the tree, `expandRows()` walks it with batched IN queries, recurses for nested
- Threaded through: `FetchController.fetch()` → `BaseService.fetch()` → `BaseRepository.fetch()` → `FilterCompilerService.fetch()` → `runFetch()` → `expandRows()`
- Initial bug: controller/service/repo `fetch()` opts didn't include `expand` — silently dropped. Fixed in the plumbing layer (all four layers now thread it through).

### Demo composition

The two features compose naturally:

```bash
# Search with snippets — find chunks discussing pricing in closing-stage deals
curl -X POST /search -d '{
  "entity": "transcript_chunk",
  "filter": { "and": [
    { "on": "body", "op": "contains", "value": "pricing" },
    { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
  ]},
  "preview": true
}'
# → IDs + per-row snippets with match offsets

# Fetch hydrated with full ancestor chain
curl -X POST /fetch -d '{
  "entity": "transcript_chunk",
  "ids": [...from above...],
  "expand": ["transcript", "transcript.opportunity", "transcript.opportunity.account"]
}'
# → full rows + transcript + opportunity + account, all nested inline
```

Same JSON shape across `/search` and `/fetch`. Caller gets snippet-aware
browse → ID-driven hydrate with full relational context.

---

## 2026-05-21 ~16:00 PT — 🎉🎉🎉 REPO-BASED ARCHITECTURE LIVE (branch: feat/repo-based-architecture)

Refactor complete and verified. The dynamic query layer now flows through the
generated repositories rather than calling a side-channel service directly.
Architecture matches the "linked cleanly" vision Doug articulated.

### Flow (top → bottom)

```
HTTP request
   │
   ▼
SearchController / FetchController         (./src/query/*.controller.ts)
   │  validate with Zod
   │  dispatch by entity name to the right SERVICE (ADR-002 — services are public)
   ▼
AccountService / OpportunityService / …    (./src/modules/<plural>/<entity>.service.ts)
   │  inherits .query() / .search() / .fetch() from BaseService
   │  delegates to this.repository
   ▼
AccountRepository / OpportunityRepository / … (./src/modules/<plural>/<entity>.repository.ts)
   │  inherits .query() / .search() / .fetch() from BaseRepository
   │  uses this.entityName + this.filterCompiler (property-injected via FILTER_COMPILER token)
   ▼
FilterCompilerService                       (./src/query/filter-compiler.service.ts)
   │  @Global() singleton — provided by QueryModule
   │  wraps the pure runQuery / runSearch / runFetch functions
   ▼
runSearch / runFetch / runQuery             (./src/query/service.ts)
   │  build Drizzle queries via compiler.ts
   │  resolve cross-entity paths via the registry
   ▼
query-registry                              (./src/generated/query-registry.ts)
   │  AUTO-GENERATED placeholder; in production codegen emits from entity YAMLs
   │  the SINGLE source of metadata (relationships + searchable columns)
```

### What changed

| File | Change |
|---|---|
| `src/shared/constants/tokens.ts` | Added `FILTER_COMPILER` token |
| `src/shared/base-classes/base-repository.ts` | Added abstract `entityName`, property-injected `filterCompiler`, `query()` / `search()` / `fetch()` methods that delegate via the compiler |
| `src/shared/base-classes/base-service.ts` | Added `query()` / `search()` / `fetch()` pass-throughs that call the repository; extended `IBaseRepository` interface |
| `src/modules/{accounts,opportunities,emails,transcripts,transcript_chunks}/<entity>.repository.ts` | Declared `entityName` on each (one line each) |
| `src/query/filter-compiler.service.ts` | NEW — `@Injectable` facade over the pure compiler functions |
| `src/query/query.module.ts` | `@Global()`, registers `FilterCompilerService` against `FILTER_COMPILER` token, imports all 5 entity modules so controllers can inject their services |
| `src/query/search.controller.ts` | Routes via `serviceFor(entity).search(...)` instead of calling `runSearch` directly |
| `src/query/fetch.controller.ts` | Same pattern via `serviceFor(entity).fetch(...)` |
| `src/generated/query-registry.ts` | MOVED from `src/query/registry.ts` — header reframed as "AUTO-GENERATED placeholder; codegen would emit this from YAMLs" |

### Properties this gives you

- **No parallel knowledge**: every entity's metadata (relationships, searchable columns) lives in exactly one place — the YAML, then the generated registry. The hand-authored compiler never names a specific entity.
- **Repo is the API**: `accountRepository.query(filter)` is where you go for that entity. No side-channel "domain query service." Services expose the same methods one level up (the public per-ADR-002 surface).
- **Cross-entity reach still works**: the compiler reads the registry to resolve dotted paths (`opportunity.stage`, `chunks.body`). No coupling between entity modules.
- **Test isolation preserved**: BaseRepository's `@Optional()` injection means unit tests can construct repos without a Nest container; only `query()`/`search()`/`fetch()` need the container.
- **Codegen lift-path is clear**: the only hand-authored pieces in production would be the kit emitting (a) `entityName` on each concrete repo, (b) the `query-registry.ts` from the YAML manifests. The other 95% of this refactor lives in `@pattern-stack/codegen` runtime base classes.

### Verified end-to-end

`bun src/demo-api.ts` against the running NestJS server passes all 5 scenes
with identical row counts to the pre-refactor version:

| Scene | Counts |
|---|---|
| 1 (multi-entity text search across email + transcript) | 3 email + 4 transcript |
| 2 (Scene 1 + cross-entity narrow to stage=closing) | 2 email + 3 transcript |
| 3 (pivot to transcript_chunk, WITHIN search) | 8 chunks |
| 4 (/search → /fetch IDs-then-rows pattern) | 3 hydrated |
| 5 (/fetch with refinement filter narrowing 4 → 2) | 2 of 4 |

`bunx tsc --noEmit` exit 0.

---

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
