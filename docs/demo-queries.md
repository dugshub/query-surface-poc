# Demo queries

The 6 queries `bun demo.ts` runs against the seeded data, in escalating-composability order.

Each query prints:
1. The natural-language framing (what a seller would ask)
2. The JSON `FilterExpression` (what the agent emits)
3. The compiled SQL (debug, `include_sql: true`)
4. The result rows (truncated to first 5)

## Q1 — Single entity, exact filter

> *"List all opportunities in stage 'closing'."*

```json
{
  "entity": "opportunity",
  "filter": { "on": "stage", "op": "eq", "value": "closing" },
  "sort": [{ "field": "amount", "dir": "desc" }],
  "page": { "limit": 10 }
}
```

**Baseline. Proves the kit's CRUD + the FilterCompiler's leaf-op resolution.**

## Q2 — Cross-entity belongs_to

> *"List opportunities at accounts in the 'fintech' industry."*

```json
{
  "entity": "opportunity",
  "filter": { "on": "account.industry", "op": "eq", "value": "fintech" },
  "expand": ["account"]
}
```

**Proves cross-entity JOIN resolution from dotted-path FieldPath.**

## Q3 — Boolean composition

> *"List opportunities in stage 'closing' OR 'negotiation' at accounts that are fintech, where the amount exceeds $50K."*

```json
{
  "entity": "opportunity",
  "filter": {
    "and": [
      { "on": "stage", "op": "in", "value": ["closing", "negotiation"] },
      { "on": "account.industry", "op": "eq", "value": "fintech" },
      { "on": "amount", "op": "gt", "value": 50000 }
    ]
  },
  "expand": ["account"]
}
```

**Proves `and` composition + `in` list + numeric `gt`.**

## Q4 — Text search ACROSS (the "grep over the corpus" demo)

> *"Find transcripts where pricing was discussed."*

```json
{
  "entity": "transcript",
  "filter": {
    "on": "chunks.body",
    "op": "contains",
    "value": "pricing"
  },
  "expand": ["opportunity"]
}
```

**Proves the `has_any` subquery on a `has_many` relationship. ACROSS search falls out of cross-entity filter — no special operator.**

Expected SQL (paraphrased):
```sql
SELECT t.* FROM transcripts t
WHERE EXISTS (
  SELECT 1 FROM transcript_chunks c
  WHERE c.transcript_id = t.id
  AND c.body ILIKE '%pricing%'
)
```

## Q5 — Text search WITHIN (the "grep inside the document" demo)

> *"In transcript {id}, find the chunks where pricing was discussed."*

```json
{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "transcript_id", "op": "eq", "value": "<seeded-transcript-id>" },
      { "on": "body", "op": "contains", "value": "pricing" }
    ]
  },
  "sort": [{ "field": "position", "dir": "asc" }]
}
```

**Proves WITHIN is the same primitive as ACROSS — just a different root entity. No grep-specific tool needed.**

## Q6 — The proof point

> *"Find transcript chunks where pricing was discussed, in transcripts of opportunities currently in stage 'closing'."*

```json
{
  "entity": "transcript_chunk",
  "filter": {
    "and": [
      { "on": "body", "op": "contains", "value": "pricing" },
      { "on": "transcript.opportunity.stage", "op": "eq", "value": "closing" }
    ]
  },
  "expand": ["transcript", "transcript.opportunity"],
  "page": { "limit": 20 }
}
```

**Composes:**
- ILIKE text filter on `transcript_chunk.body`
- Two-hop JOIN: `transcript_chunk → transcript → opportunity`
- Categorical filter on `opportunity.stage`

**One call. This is the unlock the proposal argues for.**

If the team sees this work end-to-end — with the compiled SQL and real result rows — the proposal is concrete.

## Stretch — MCP tool

If time permits: register a `query_domain` MCP tool exposing the FilterCompiler. Then:

> Open Claude Code → *"Hey, find transcript chunks where pricing came up in deals that are closing."* → Watch the model emit the JSON FilterExpression from Q6 → Watch the tool return real data.

That's the demo that lands.

---

# Agent test questions — exercising the tool to its fullest

The demo queries above show what the *compiler* can do. This section is for
**testing whether an agent (Claude Code, etc.) over MCP can actually compose
the right call from a natural-language question**. Each test reports the
expected behaviour so you know whether the agent succeeded.

The corpus seeded by `just seed` (10 deals / 19 contacts / 27 emails /
125 transcripts) has deliberate keyword overlap. Many questions have multiple
valid solution shapes — the test isn't "did the agent emit the exact JSON I
predicted" but "did the agent return the right answer in a reasonable shape."

If a question stumps the agent, the failure mode tells you something:
- Wrong entity choice → registry descriptions aren't strong enough
- Picked has_many when belongs_to was needed → relationship naming is unclear
- Didn't use `expand` → tool description under-sells the feature
- Skipped `query_describe` and guessed at column names → that tool needs to be more discoverable

## How to use this section

1. Boot the MCP server in Claude Code (see [`mcp-integration.md`](./mcp-integration.md))
2. Open a fresh chat (no prior context)
3. Paste the question verbatim
4. Compare the agent's answer + the tool calls it made against the **Expected** notes

---

## Tier 1 — Single-tool basics (warm up)

Each of these can be solved with a single `query_search` call (no expand, no fetch).

### T1.1 — Direct column filter

> *"Which opportunities are currently in stage closing?"*

**Expected:** one `query_search` on `opportunity` with `{on: 'stage', op: 'eq', value: 'closing'}`. Returns 3 opportunities (Acme Q3 New Logo, Stark Year-3 Renewal, Vehement Portfolio Analytics).

**Tests:** simplest possible call, agent doesn't over-engineer.

### T1.2 — Numeric range

> *"Show me opportunities over $300K."*

**Expected:** `{on: 'amount', op: 'gt', value: 30000000}` on `opportunity`. **Watch for:** does the agent realize amount is in cents? If it sends `300000` it returns too many results. Agent should call `query_describe` first OR have it cached from earlier.

**Tests:** unit awareness; sniffs whether agent reads the field-level hints from `query_describe`.

### T1.3 — Date range with ISO strings

> *"What transcripts happened in May 2026?"*

**Expected:** `{and: [{on: 'occurred_at', op: 'gte', value: '2026-05-01'}, {on: 'occurred_at', op: 'lt', value: '2026-06-01'}]}` OR a `between` op. Either works — the compiler coerces ISO strings to Dates.

**Tests:** does the agent send native Dates (not possible over JSON) or ISO strings (correct)? Validates the date-coercion path.

### T1.4 — Enum membership

> *"List opportunities that are not yet closed — anything in prospect, qualifying, presenting, or negotiation."*

**Expected:** either `{on: 'stage', op: 'in', value: [...4 stages]}` OR `{on: 'is_closed', op: 'eq', value: false}`. Both are correct; the second is shorter.

**Tests:** does the agent notice `is_closed` is a denormalized convenience and prefer it?

---

## Tier 2 — Cross-entity reach (1 hop)

Each requires a dotted field path resolving belongs_to or has_many.

### T2.1 — belongs_to traversal

> *"Find emails sent about opportunities currently in stage closing."*

**Expected:** `query_search` on `email` with `{on: 'opportunity.stage', op: 'eq', value: 'closing'}`. Returns emails attached to the 3 closing-stage opps. Compiler emits LEFT JOIN.

### T2.2 — Account-rooted

> *"Show me every opportunity at Acme Corp."*

**Expected:** `query_search` on `opportunity` with `{on: 'account.name', op: 'eq', value: 'Acme Corp'}`. Returns 1 (each account has 1 opp in this corpus).

**Watch for:** does the agent try to root at `account` and use `has_many` instead? Both work but produce different shapes.

### T2.3 — Reverse direction (has_many EXISTS)

> *"Find accounts that have a contact whose email contains 'cto@'."*

**Expected:** `query_search` on `account` with `{on: 'contacts.email', op: 'contains', value: 'cto@'}`. The compiler emits `EXISTS (SELECT 1 FROM contacts ...)`.

**Tests:** has_many path resolution.

---

## Tier 3 — Text search variants

### T3.1 — Single-column text search

> *"Which transcripts mention 'compression'?"*

**Expected:** `{on: 'transcript', op: 'contains', value: 'compression'}` on entity `transcript`. Returns ~5-8 transcripts from the Pied Piper deal (compression is their core tech).

**Watch for:** does the agent use the magic `text` field instead? That also works but ILIKEs five columns. Either is correct.

### T3.2 — Magic text fan-out across columns

> *"Find any transcripts that mention 'data residency' — could be in the title, body, summary, or notes."*

**Expected:** `{on: 'text', op: 'contains', value: 'data residency'}` on entity `transcript`. ORs across all 5 declared text columns. Returns transcripts from Initech + Massive Dynamic + Vehement (3 deals seed this theme).

**Tests:** text-magic awareness.

### T3.3 — Multi-entity text fan-out

> *"Where has 'SOC2' come up — emails, transcripts, anywhere?"*

**Expected:** multi-entity `query_search` with `queries: [{entity: 'email', filter: {on: 'text', op: 'contains', value: 'SOC2'}}, {entity: 'transcript', ...}]`. Returns tagged-by-entity counts (Massive Dynamic + Vehement deals).

**Tests:** does the agent know about the multi-entity shape, or fall back to two serial calls?

---

## Tier 4 — Composition (the proof points)

### T4.1 — The two-hop proof point

> *"Find transcripts discussing 'pricing' for opportunities that are in stage closing."*

**Expected:** `query_search` on `transcript` with `{and: [{on: 'transcript', op: 'contains', value: 'pricing'}, {on: 'opportunity.stage', op: 'eq', value: 'closing'}]}`. Returns ~29 transcripts across Acme + Stark + Vehement.

**Watch for:** snippet extraction in the preview rows when `preview: true` — each match should carry a `_snippets` array.

### T4.2 — Three-way boolean

> *"Show me opportunities that are at fintech accounts, in stage closing or negotiation, with amount over $200K."*

**Expected:** `{and: [{on: 'account.providerMetadata.industry', op: ...}` — wait, that's EAV-shaped. Agent should hit a wall here because **industry isn't a real column** — it's nested in `providerMetadata` JSONB.

**Tests:** how the agent fails gracefully when a field is buried in JSONB. The right answer in this corpus is to filter on `account.name` IN `['Acme Corp', 'Vehement Capital Partners']` (the two fintech accounts) — but the agent has to either know or check via `query_describe`.

### T4.3 — Mixed date + cross-entity + text

> *"Any transcripts from after May 1 where the buyer mentioned 'procurement' in a deal that's still at risk?"*

**Expected:** `{and: [{on: 'occurred_at', op: 'gte', value: '2026-05-01'}, {on: 'transcript', op: 'contains', value: 'procurement'}, {on: 'opportunity.stateOfDealStatus', op: 'eq', value: 'at_risk'}]}`.

**Tests:** combining a date filter, a text op, AND a cross-entity reach in one call.

### T4.4 — Negation

> *"Show me opportunities that aren't lost or won — still in motion."*

**Expected:** `{not: {on: 'stage', op: 'in', value: ['lost', 'won']}}` OR equivalently `{and: [{on: 'is_closed', op: 'eq', value: false}]}`.

**Tests:** `not` clause; alternate formulation awareness.

---

## Tier 5 — Two-stage and expand

### T5.1 — IDs first, then hydrate

> *"Find the top 5 transcripts about 'renewal lock' and show me the full body of each."*

**Expected:** First call `query_search` with `{on: 'transcript', op: 'contains', value: 'renewal lock'}` + `page: {limit: 5}` + `preview: true`. Then `query_fetch` with the returned IDs.

**Watch for:** does the agent fetch all 5 in one `query_fetch`, or N separate calls? The single-fetch is correct.

### T5.2 — Expand chain (3 hops)

> *"Pull the transcripts where Cyberdyne was mentioned, with the full opportunity + account context inline."*

**Expected:** `query_search` for `{on: 'transcript', op: 'contains', value: 'Cyberdyne'}` (returns Soylent transcripts), then `query_fetch` with `expand: ['opportunity', 'opportunity.account']`. Returns transcripts with the deal + customer attached.

**Tests:** `expand` syntax, multi-hop relational hydration.

### T5.3 — Refinement at fetch time

> *"Of these 10 opportunity IDs <ids>, give me only the ones currently in stage closing — full records."*

(Where `<ids>` is the list of all 10 seed opportunity IDs — `bbbb00000001` through `bbbb00000010`.)

**Expected:** `query_fetch` with the IDs + `filter: {on: 'stage', op: 'eq', value: 'closing'}`. Returns 3.

**Tests:** does the agent know `/fetch` accepts a refinement filter, or does it do a fresh `/search` then `/fetch`?

---

## Tier 6 — Harder reasoning (where agents tend to stumble)

### T6.1 — Ambiguous entity root

> *"Who's been complaining about pricing the most?"*

**Expected:** there's no single "right" answer — the agent has to pick. Reasonable picks: `transcript` (most signal), `email` (also valid), or fan out across both. Bonus points if the agent groups results by deal/account in its narration.

**Tests:** does the agent reason about entity choice instead of guessing?

### T6.2 — Negative search across overlapping themes

> *"Find deals where pricing came up but NOT compliance or legal — the budget-only objections."*

**Expected:** something like `{and: [{on: 'text', op: 'contains', value: 'pricing'}, {not: {on: 'text', op: 'contains', value: 'compliance'}}, {not: {on: 'text', op: 'contains', value: 'legal'}}]}`. Or two separate searches + set subtraction.

**Tests:** `not` compositions with text ops; reasoning about partial overlap.

### T6.3 — Find an "outlier"

> *"Which deal looks most off-pattern — anything that doesn't match the typical sales cycle for its stage?"*

**Expected:** an open-ended request. Best response: use multiple `query_search` calls (e.g. transcripts per opportunity, email counts per opportunity) and reason about outliers. Wayne Enterprises has only 1 email + 6 transcripts for a prospect-stage deal — pretty light. Soylent is `lost` but has 10 transcripts — heavy for a loss.

**Tests:** can the agent compose multiple queries to *analyse*, not just *retrieve*?

### T6.4 — Cross-deal pattern

> *"What's the most common reason deals are at risk right now?"*

**Expected:** `query_search` opp where `stateOfDealStatus = at_risk`, then `query_fetch` for those opp's stateOfDeal narratives (or transcript bodies via expand). Agent should synthesize across the narratives — pricing pushback is the dominant theme.

**Tests:** retrieval → synthesis loop; agent doesn't just dump data.

### T6.5 — Find the champion

> *"Who's our champion at Stark Industries — what makes them a champion vs. a regular contact?"*

**Expected:** `query_search` contacts where `account.name = 'Stark Industries'` to enumerate. Then either `query_search` transcripts where `opportunity.account.name = 'Stark Industries'` and `text contains 'champion'`, OR fetch transcripts with expand and look for which contact is in attendee_emails most often.

**Tests:** combining `contact` enumeration with text/relational reach.

---

## Tier 7 — Stress tests

### T7.1 — All-stages-survey

> *"For each stage, tell me how many opportunities are in it and the total dollar value."*

**Expected:** seven `query_search` calls (one per stage) OR one fetch of all opportunities with client-side group-by. There's no `count(*)` op in the primitive — that's an intentional limit of the proof-of-concept.

**Tests:** does the agent realize there's no aggregation op and adapt? Or does it ask for one?

### T7.2 — Snippet quality

> *"What's the most surprising thing said in any transcript about renewals?"*

**Expected:** `query_search` on transcript with `text contains 'renewal'` + `preview: true`, look at the `_snippets` array for windowed context, pick the most interesting one. Agent should NOT hydrate full transcripts (too long).

**Tests:** is the agent disciplined about preview vs full fetch?

### T7.3 — Re-entry / continuation

> *(Run T6.4 first; then)* — *"OK pull the full narratives for the two highest-risk deals."*

**Expected:** the agent should remember the at-risk IDs from the prior call and use `query_fetch` directly, not re-search.

**Tests:** session-state awareness across turns.

---

## Test results template

When running these against an MCP client, capture per-question:

```
T2.1 — belongs_to traversal
  Tool calls:    [query_search]
  Result count:  N
  Correct?       yes / partial / no
  Notes:         e.g. "agent skipped query_describe, guessed column name"
```

A clean run of T1–T5 (~20 questions) takes 15 minutes with Claude Code. T6
and T7 are exploratory — failures there are usually more interesting than
successes.
