# Session handoff — 2026-05-21

End-of-session ceremony. Captures what we built across a single long session,
where every artifact lives, the state of the codebase, and how to pick it
back up cold.

## At a glance

**Goal of the session:** prepare for a team meeting on the uniform domain
query surface proposal — and then validate the proposal end-to-end in a
working POC.

**State:**
- ✅ Planning + comparison docs written (live in `dealbrain-integrations`)
- ✅ POC built end-to-end (this repo) — 5 entities, FilterCompiler, repo-routed dynamic queries, snippets, expand, MCP integration
- ✅ Five commits on branch `feat/repo-based-architecture` (clean tree, ready to push or merge)
- ✅ Demo runnable via three transports: CLI, HTTP, MCP

**Current branch:** `feat/repo-based-architecture` @ `8e48c8c`
**Working directory clean:** yes
**Typecheck:** `bunx tsc --noEmit` exit 0
**All verification:** demos pass; MCP test passes 5/5

---

## The arc

The session started with prep for a 2026-05-20 meeting. We then turned the
proposal from that meeting into a working consumer of `pattern-stack/codegen-patterns`.

1. **Planning + memo prep** (Doug + Claude collaborative)
   - Worked through team feedback on the retrieval architecture
   - Settled on the framing: composability and uniform semantics across
     entities, not "use SQL specifically"
   - Wrote the architecture sketch + per-entity gap analysis + 5
     illustrative entity manifests for the meeting

2. **POC build** (autonomous)
   - Stood up a fresh consumer of `pattern-stack/codegen-patterns`
   - 5 entities (account, opportunity, email, transcript, transcript_chunk)
     with the architectural insight that chunked transcripts make WITHIN /
     ACROSS text search the same primitive
   - Hand-authored FilterCompiler that turns one JSON FilterExpression into
     Drizzle SQL with cross-entity JOIN resolution + has_many EXISTS subqueries
   - Seed + CLI demo
   - 18-assertion verification ledger

3. **HTTP API** (Doug pushed for it)
   - Added `POST /query` (then later split into `/search` + `/fetch`)
   - Same JSON shape over the wire — what an agent / frontend would actually
     call

4. **Repo-based architecture refactor** (the "linked cleanly" pivot)
   - Moved the dynamic-query layer behind the repository per `pattern-stack/codegen-patterns` ADR-002
   - HTTP → Controller → Service → Repository → FilterCompilerService
   - Generated `entityName` declaration on each repo; query-registry moved to
     `src/generated/` as a codegen-placeholder
   - Branched into `feat/repo-based-architecture`

5. **Documentation**
   - README, AGENTS.md, docs/architecture.md, docs/upstream-kit-contributions.md,
     docs/proposal-summary.md

6. **Snippets + expand**
   - Snippets: additive `_snippets` array on preview rows when a text op fires
   - `/fetch` expand: belongs_to + has_many relational hydration, up to 3 hops,
     batched IN queries

7. **MCP server**
   - Stdio MCP server exposing `query_search` + `query_fetch` (+ later `query_describe`)
   - Bootstraps NestJS via `NestFactory.createApplicationContext(AppModule)`; tool handlers go through Service → Repository → FilterCompilerService — same flow as the HTTP controllers (corrected from the initial direct-runSearch shortcut — see PROGRESS.md entry 2026-05-22 for context)
   - End-to-end verified via `src/mcp-test.ts`

---

## Planning + comparison docs (the meeting prep — START HERE)

These live in the sibling `dealbrain-integrations` workspace because they're
the canonical home for the proposal. They predate this POC and the POC
validates what they argue for.

📁 `/Users/dug/Projects/dealbrain-integrations/dealbrain-integrations/.ai-docs/discussions/2026-05-20/`

| File | Lines | Purpose |
|---|---|---|
| [`uniform-query-surface-architecture.md`](../dealbrain-integrations/.ai-docs/discussions/2026-05-20/uniform-query-surface-architecture.md) | 254 | The proposal in detail — three layers (primitive / convenience / Cube analytics), entity manifest shape, `FilterExpression` type, two example calls, org/tenant scoping, mapping to AloeVera and codegen-patterns analogs. |
| [`dealbrain-today-vs-proposed.md`](../dealbrain-integrations/.ai-docs/discussions/2026-05-20/dealbrain-today-vs-proposed.md) | 199 | Per-entity gap analysis vs. the current dealbrain MCP surface. Each existing entity gets: today's filter shape, what the agent CAN'T ask, what the proposed `query_domain` call would look like. |
| `entities/account.yaml` | 64 | Illustrative manifest — CRM family, EAV dynamic fields |
| `entities/contact.yaml` | 66 | Illustrative manifest — CRM family |
| `entities/opportunity.yaml` | 117 | Illustrative manifest — CRM family, EAV honesty for stage/amount, cross-package relationships |
| `entities/meeting.yaml` | 80 | Illustrative manifest — Activity family, cross-package opportunity reach |
| `entities/fact.yaml` | 101 | Illustrative manifest — Knowledge family, lifecycle (active/historical/retracted) |

**Total:** 881 lines of planning + comparison material.

---

## POC docs (what we built — for picking up the build)

📁 `/Users/dug/Projects/dealbrain-integrations/query-surface-poc/`

### Top-level

| File | Purpose |
|---|---|
| [`README.md`](./README.md) | Human entry point — quickstart, API table, proof-point curl, MCP setup |
| [`AGENTS.md`](./AGENTS.md) | Agent entry point — scope, commands, 5-layer architecture, file layout, conventions, gotchas, how-to-work-with-this-repo |
| [`PROGRESS.md`](./PROGRESS.md) | Chronological build log — dogfood bugs hit + fixed, refactor milestones, MCP milestone, verification ledger |
| [`PLAN.md`](./PLAN.md) | Original scope + autonomous decisions made |
| [`HANDOFF.md`](./HANDOFF.md) | This file |

### docs/

| File | Purpose |
|---|---|
| [`docs/architecture.md`](./docs/architecture.md) | 5-layer flow with 3 example traces (same-entity, cross-entity, multi-entity), what-lives-where reference |
| [`docs/upstream-kit-contributions.md`](./docs/upstream-kit-contributions.md) | What to lift into `@pattern-stack/codegen` — 5 prioritized contributions, ~10.5h kit work to make this generally available |
| [`docs/proposal-summary.md`](./docs/proposal-summary.md) | 1-page version of what this POC validates, with cross-links to the planning docs |
| [`docs/filter-compiler-design.md`](./docs/filter-compiler-design.md) | FilterCompiler internals — FieldPath resolution, op→SQL table, org scoping, test plan |
| [`docs/demo-queries.md`](./docs/demo-queries.md) | The 6 escalating example queries used in the legacy CLI demo |
| [`docs/mcp-integration.md`](./docs/mcp-integration.md) | Claude Code MCP setup walkthrough, tool reference, troubleshooting |

---

## Commit chain (`feat/repo-based-architecture`)

```
8e48c8c  feat: MCP server with query_search + query_fetch tools
60ae193  feat: snippet extraction + /fetch expand semantics
ce2dc36  docs: README, AGENTS.md, architecture + upstream-kit-contributions + proposal-summary
dce9384  refactor: route dynamic queries through repositories per ADR-002
704d924  feat: query-surface-poc — HTTP-exposed uniform domain query primitive
```

Each commit's body documents what it delivered. `git log --stat feat/repo-based-architecture` for a per-commit file map.

`main` is the pre-refactor baseline with the side-channel `runQuery` direct path. `git diff main..feat/repo-based-architecture` shows the full architectural transition.

---

## Three transport surfaces — same JSON shape

| Transport | File(s) | How to drive it |
|---|---|---|
| **CLI** (legacy, direct function call) | `src/demo.ts` | `bun src/demo.ts` |
| **HTTP** (`POST /search` + `POST /fetch`) | `src/main.ts`, `src/query/{search,fetch}.controller.ts` | `bun src/main.ts` then `bun src/demo-api.ts` |
| **MCP** (stdio — Claude Code) | `src/mcp-server.ts` | Configure Claude Code per `docs/mcp-integration.md`, or `bun src/mcp-test.ts` for end-to-end verification |

Three transports. One JSON shape. One compiler.

---

## How to re-enter cold

If you come back to this in two weeks, this is the shortest path back:

```bash
cd /Users/dug/Projects/dealbrain-integrations/query-surface-poc

# Make sure deps + Postgres are up
bun install
docker-compose up -d

# Schema + seed (idempotent — drops + reseeds)
bunx drizzle-kit push
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/seed.ts

# Pick a transport
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/demo.ts           # legacy CLI
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp PORT=3577 bun src/main.ts # HTTP (in another terminal: bun src/demo-api.ts)
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/mcp-test.ts        # MCP end-to-end test
```

If nothing works, read `PROGRESS.md` — it has the full build log including
every dogfood bug we hit and the fix.

---

## Outstanding follow-ups (not done in this session)

In priority order if/when we come back:

1. **Upstream contributions to `@pattern-stack/codegen`** — full plan in `docs/upstream-kit-contributions.md`. ~10.5 hours of kit-side work to make the dynamic query layer generally available. Five priorities:
   1. Modify base-repository.ts + base-service.ts (query/search/fetch methods)
   2. Vendor FilterCompiler as a kit subsystem (`runtime/subsystems/query/`)
   3. Emit `query-registry.ts` from entity YAMLs (new template)
   4. Add `searchable_columns:` block to the entity YAML schema
   5. Vendor the pagination shim

2. **`expand` on `/search` previews** — currently expand is `/fetch` only. Reasonable arg for adding it to `/search` so the agent can browse with relations already attached. v2.

3. **Snippet extraction for has_many text matches** — when a `transcript` matches because `chunks.body` contains X, optionally attach the matching child chunk IDs alongside the parent preview row. v2.

4. **Cube analytics layer** — the proposal includes an aggregation/measure layer via Cube. The POC skipped this; it's a separate ~half-day of work to wire Cube schemas from the entity manifests and expose a third MCP tool `query_analytics`.

5. **True `expand` snippet enrichment** — when both `expand` and a text filter are present, also snippet-extract from the expanded children. Edge case but useful for "show me chunks with the matched line highlighted, plus the full transcript context."

6. **Auth + tenant scoping** — every primitive call should be actor-scoped per the proposal. The POC seed data uses a single user_id. Real consumers would inject the actor context via the FilterCompilerService.

---

## What's hosted vs. what would be production

| Aspect | POC | Production (after upstreams land) |
|---|---|---|
| Entity manifests | `entities/*.yaml` (hand-authored) | Same — YAML is source of truth |
| Drizzle tables + repos + services | Codegen-emitted ✓ | Same |
| `entityName` on each repo | Hand-added (one line each, marked with comment) | Codegen-emitted from manifest's `entity.name` |
| `src/generated/query-registry.ts` | Hand-authored placeholder | Codegen-emitted from YAML manifests |
| `BaseRepository.query/search/fetch` | Vendored shim, modified for POC | In `@pattern-stack/codegen` runtime |
| `BaseService.query/search/fetch` | Vendored shim, modified for POC | In kit's runtime |
| `FilterCompilerService` + types + compiler | Hand-authored in `src/query/` | Vendored from `codegen subsystem install query` |
| HTTP controllers | Hand-authored — consumer responsibility | Same — controllers stay consumer-side |
| MCP server | Hand-authored — consumer responsibility | Same — exposure layer stays consumer-side |

---

## Memory entries written this session

Cross-session learnings saved to `/Users/dug/.claude/projects/.../memory/`:

- [`feedback_no_provocative_framings.md`](/Users/dug/.claude/projects/-Users-dug-Projects-dealbrain-crm-dealbrain/memory/feedback_no_provocative_framings.md) — in cross-team comms, avoid "we already learned this" / "I planned this and we deferred it" framings even when technically true; replace narrative with factual shapes

---

## Branches in this repo

```
main                             pre-refactor baseline (POST /query direct)
feat/repo-based-architecture     CURRENT HEAD — repo-routed flow + snippets + expand + MCP
```

Neither branch has been pushed (per memory entry — Doug runs stacked-branch local review, no PRs).

Working tree clean.

---

## Final tally

- **5 commits** on `feat/repo-based-architecture`
- **~70 generated TS files** across 5 entity modules
- **15 hand-authored TS files** in `src/query/` + `src/mcp-server.ts` + `src/mcp-test.ts` + demo scripts
- **9 markdown docs** in this repo (~7,500 words)
- **3 narrative docs + 5 entity manifests** in the planning workspace (~977 lines)
- **Three transports** (CLI / HTTP / MCP) over one substrate
- **One JSON shape** does it all

Session complete. Sleep well.

— Doug + Claude Opus 4.7

---

## Addendum — 2026-05-21 (later) — dealbrain schema migration

Branched `feat/dealbrain-schema` off `feat/repo-based-architecture`. Migrated
the POC's schema to mirror dealbrain's live tables
(`/Users/dug/Projects/dealbrain-crm/dealbrain/packages/db/src/server/schema.ts`).

### Decisions

- **Dropped `transcript_chunk` entity entirely.** Transcript body lives inline
  in the `transcript` text column (matches production). ACROSS/WITHIN
  search distinction collapses — single-column ILIKE handles both. The
  chunked-transcripts insight is preserved in commit history on
  `feat/repo-based-architecture` for reference.
- **Added `contact` entity** (minimal — firstName/lastName/email/accountId),
  to demonstrate `account.has_many.contacts`.
- **Direct FK cheat: `transcripts.opportunityId`.** Production routes through
  `opportunity_meetings` (M2M) → `meetings` ← `transcript.meetingId`. The
  compiler doesn't model M2M yet; that's a future capability.
- **EAV flattened.** `opportunity.stage`, `amount`, `closeDate`, `nextStep`,
  `probability`, `isClosed`, `isWon`, `description` ported as real columns,
  matching the canonical Salesforce defaults (`STANDARD_OPPORTUNITY_SF_FIELDS`
  in dealbrain's `salesforce.types.ts`). EAV resolution in the compiler is
  a v2 lift — same architectural shape as cross-entity reach, just a JOIN
  through `field_values`. Documented at registry-level with a `TODO`.
- **Email body stored as plaintext.** Production wraps it in
  `jsonb<EncryptedPayload>`. Per Doug, "we'd pre-encrypt the search term
  anyway" — encryption is orthogonal to search semantics. Skipped for
  ergonomics.
- **Kept `pgEnum`s.** Production uses varchar (no-enum rule). Demo SQL is
  identical either way; not worth the codegen churn for this branch.

### What still works (verified)

- `bunx tsc --noEmit` exit 0
- `bun src/seed.ts` → 3 accounts / 6 opps / 6 contacts / 5 emails / 4 transcripts
- `bun src/demo.ts` → 6 escalating queries all return expected counts
- `bun src/mcp-test.ts` → 5/5 MCP tests pass; proof-point now finds 3
  transcripts (Acme discovery + Acme pricing + Globex pilot — all opps in
  stage=closing where transcript mentions pricing)

### Proof-point now reads

> *"Find transcripts discussing 'pricing' for opportunities in stage closing."*
>
> `{transcript contains 'pricing' AND opportunity.stage = 'closing'}` → 3 hits

Compiles to a 2-hop LEFT JOIN (transcripts → opportunities) + ILIKE.
A stronger demo than the prior 8-chunk count because it cleanly maps to
how dealbrain agents actually compose queries today.

### Open EAV note (worth bringing back to the proposal narrative)

Earlier framing — "the application service resolves EAV post-retrieval" —
is the architecture the proposal is trying to **replace**, not the target.
The corrected model: EAV is just a third field-path shape the compiler
resolves (column / cross-entity / EAV), driven by registry metadata. Same
pattern as belongs_to/has_many, different table topology. This actually
strengthens the proposal: one vocabulary, three shapes, all resolved at
the compiler layer. See the chat transcript for the dialog that landed this.

### Outstanding follow-ups (still relevant)

The list from the original handoff still applies, with these adjustments:

- ~~Snippet extraction for has_many text matches~~ — N/A now (no has_many
  text searches in scope; chunks are gone)
- **New:** type-driven searchable-columns inference — replace explicit
  `searchableColumns` arrays in the registry with a column-type read off
  Drizzle's PgColumn metadata. Matches dealbrain's frontend filter pattern.
  ~half-day. Marked `TODO` in `query-registry.ts`.
- **New:** M2M relationship support in the compiler — needed before we can
  drop the `transcripts.opportunityId` direct-FK cheat and route through
  `meetings` + `opportunity_meetings` like production does.
- **New:** EAV resolution — the v2 lift described above. Same shape as
  cross-entity reach.
