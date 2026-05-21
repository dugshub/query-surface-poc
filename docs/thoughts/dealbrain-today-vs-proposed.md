# Dealbrain today vs. proposed uniform query surface

**Companion to:** [`position-memo.md`](./position-memo.md), [`uniform-query-surface-architecture.md`](./uniform-query-surface-architecture.md)

The goal of this doc is to make the gap concrete. For each CRM entity, what list/get/filter shape exists today (what the agent actually sees), what it *can't* express, and what the uniform-surface call would look like.

## How to read this

- **Today** = the current MCP tool, taken from [`apps/backend/src/core/mcp/TOOL_SURFACE.md`](../../../apps/backend/src/core/mcp/TOOL_SURFACE.md).
- **What the agent can't ask** = queries that would require either a new bespoke MCP tool or multi-call composition in the agent's context window.
- **Proposed** = the call shape the agent would make against `query_domain` (see [`uniform-query-surface-architecture.md`](./uniform-query-surface-architecture.md)).

---

## Deals (Opportunity)

**Today.** `list_deals` enumerates visible deals; `get_deal_state(deal_id, sections)` returns a curated structured view (fields / contacts / state_of_deal / recent_artifacts / upcoming_meetings / recent_emails). `get_deal_state` is the canonical "context dump" for the agent.

**Filter shape.** None to speak of. `list_deals` has no filter args in the public contract. The agent picks a deal by name from memory or has to grep through the list.

**What the agent can't ask:**
- "Deals in industry X currently in stage Y with no meeting in the last 14 days."
- "Deals where the latest fact classification is `risk` and the deal is in `Closing`."
- "Deals similar to deal Z" (the Nick example) — there's no comparable-cohort surface at all.

**Proposed.**

```json
{
  "entity": "deal",
  "filter": { "and": [
    { "on": "stage", "op": "eq", "value": "closing" },
    { "on": "account.industry", "op": "eq", "value": "fintech" },
    { "on": "meetings", "op": "has_any",
      "value": { "filter": { "on": "occurred_at", "op": "after", "value": "2026-05-05" } } }
  ]},
  "sort": [{ "field": "amount", "dir": "desc" }],
  "expand": ["account"]
}
```

---

## Contacts

**Today.** Not currently exposed as a first-class MCP entity. Contacts surface inside `get_deal_state.contacts` as denormalized rows on a deal. No `list_contacts` or `get_contact` tool. `get_contacts` is in the *future* table in `TOOL_SURFACE.md`.

**What the agent can't ask:**
- "All contacts at this account, across deals, with their last meeting date."
- "Champions in industry Y who have been involved in won deals."

**Proposed.**

```json
{
  "entity": "contact",
  "filter": { "and": [
    { "on": "account.industry", "op": "eq", "value": "fintech" },
    { "on": "deals", "op": "has_any",
      "value": { "filter": { "on": "stage", "op": "in", "value": ["won"] } } }
  ]},
  "expand": ["account", "deals"]
}
```

The bonus of doing contacts through the primitive layer is the (currently-future) `get_contacts` MCP tool gets to land as a convenience wrapper, not a from-scratch design.

---

## Artifacts

**Today.** `list_artifacts(deal_id, types, limit)` — chronological/type-filtered, defaults to 10. `get_artifact(artifact_id)` — full content (capped at 50K chars). Filter args are bespoke: type/source filters, time bounds, but no cross-entity reachability.

**Filter shape.** Per-deal, by type and time. No "artifacts whose extracted facts include classification X" without going through `search_deal_context`.

**What the agent can't ask:**
- "All emails from contact X across all their deals in the last 30 days."
- "Meeting transcripts where the buyer asked about feature Y" — has to go through `search_deal_context`, which mixes ranked retrieval with the question.

**Proposed.**

```json
{
  "entity": "artifact",
  "filter": { "and": [
    { "on": "type", "op": "eq", "value": "email" },
    { "on": "occurred_at", "op": "after", "value": "2026-04-19" },
    { "on": "contacts", "op": "has_any",
      "value": { "filter": { "on": "id", "op": "eq", "value": "contact_abc" } } }
  ]},
  "sort": [{ "field": "occurred_at", "dir": "desc" }]
}
```

Note: ranked retrieval of artifact content (the current `search_deal_context` capability) stays in `search_deal_context`. The uniform surface handles the *exact-filter* case that the existing tool struggles with.

---

## Facts

**Today.** `search_deal_context` — semantic + keyword + rerank, monolithic. Returns matching facts (and optionally matching artifact metadata). Can take direct `fact_ids` for non-ranked lookup. Has `include_historical` and lifecycle filters. Fact mutation lives in `manage_facts`.

**Filter shape.** Ranked. The agent can ask "facts about X" but not "facts of classification X and status active and on deal Y in this time window," at least not as a structured query — those filters exist inside the tool but the agent has to know to use them.

**What the agent can't ask:**
- "All `pain_point` facts across deals in industry X in the last quarter, grouped by which feature is mentioned." (Aggregation — Cube layer territory.)
- "Facts extracted from meetings where the contact role was `economic_buyer`." (Cross-entity join from fact → artifact → meeting → contact.)
- "Facts that contradict each other" — listed here for honesty; this isn't in scope of the primitive layer, but the surface unblocks the questions that would let us build it.

**Proposed (structured filter).**

```json
{
  "entity": "fact",
  "filter": { "and": [
    { "on": "status", "op": "eq", "value": "active" },
    { "on": "classification", "op": "in", "value": ["pain_point", "risk"] },
    { "on": "source_artifact.type", "op": "eq", "value": "meeting_transcript" },
    { "on": "source_artifact.meeting.deal.stage", "op": "in", "value": ["closing", "negotiation"] }
  ]},
  "expand": ["source_artifact"],
  "page": { "limit": 50 }
}
```

`search_deal_context` keeps the ranked-retrieval role; `query_domain(entity='fact', …)` handles the exact-filter role. The two are complementary, not redundant.

---

## Action Items

**Today.** `list_action_items` — has the most evolved filter shape of any current tool (`status`, `due_before`, `due_after`, `include_non_actionable`, pagination). `get_action_item(id)` for detail. `create_action_item` / `update_action_items` for mutation.

**Filter shape.** Closest of any current tool to what the uniform surface wants, but the filter dialect is bespoke (only valid on this tool) and doesn't compose with the rest of the domain.

**What the agent can't ask:**
- "Action items across deals in industry X assigned to seller Y."
- "Action items whose source artifact was a meeting with the economic buyer."

**Proposed.** `list_action_items` keeps its arguments and behavior; its registrar compiles to `query_domain(entity='action_item', filter=...)` internally. New cross-entity queries become possible via `query_domain` directly.

---

## Deal Updates (CRM proposals)

**Today.** `list_deal_updates` — Opportunity-scoped, returns pending proposals by default. Filter args: pending/rejected/approved, pagination, default-truncation. `manage_deal_updates` mutates.

**Filter shape.** Bespoke, tightly scoped to the CRM-proposal flow.

**What the agent can't ask:** Mostly fine for its current use case. Where it falls short: "deal updates pending across this seller's whole pipeline, grouped by deal stage" — useful for the pipeline-hygiene flow but currently requires N calls.

**Proposed.** Same pattern: `list_deal_updates` stays as a convenience wrapper. Cross-deal questions become a `query_domain` call.

---

## Meetings

**Today.** `list_meetings` — returns top-level `status` (`available` / `requires_reauth` / `not_set_up`); filters by date range, deal, event-type-defaults (hides focus blocks, OOO, solo events). `generate_meeting_brief` / `generate_meeting_debrief` for narrative output.

**Filter shape.** Decent — date range, deal scope, event-type opt-outs. Misses cross-entity reachability.

**What the agent can't ask:**
- "Meetings in the last 60 days for deals in industry X where the seller drove < 30% of talk time." (Talk-time isn't a fact today, but the *shape* of cross-entity meeting questions is the point.)
- "Meetings with the economic buyer where at least one `pain_point` fact was extracted."

**Proposed.** Same pattern. `list_meetings` stays. Cross-entity queries via `query_domain`.

---

## Drafts (Gmail)

**Today.** `list_draft_messages` / `get_draft_message` / `manage_draft_message`. Three-state external availability (`available` / `requires_reauth` / `not_set_up`).

**Out of scope for the uniform query surface in v1.** Drafts are a sync-to-external-system entity, not a CRM-domain entity. They might join the uniform surface later if useful (e.g., "all drafts referencing deal X"), but they're not a priority for the first slice.

---

## What this snapshot makes obvious

1. **Every entity has its own filter dialect.** No two `list_*` tools accept the same arguments. The agent learns a different sub-vocabulary per entity.
2. **Cross-entity reachability is the missing capability.** Almost every "what the agent can't ask" example is a query that traverses ≥ 1 relationship.
3. **The fact engine is doing two jobs.** Ranked retrieval (the unique value) and structured lookup (which a uniform surface would do better). Splitting those concerns lets each do its thing well.
4. **The convenience tools are mostly fine.** They don't need to go away. They need a substrate underneath them so they stop being the *only* path.

## Smallest first slice

Two entities, one relationship: `meeting` ↔ `deal` via `belongs_to`. Add `account` via `meeting.deal.account` (one hop further) to demonstrate the multi-hop join.

Concrete first-slice deliverable:

- `entities/meeting.yaml` — manifest with fields, relationships, queries, dimensions
- `MeetingQueryService` — primitive layer over Drizzle, exposing `query(filter, sort, search, page, expand)` with org + opportunity scoping
- `mcp-query-domain-registrar.ts` — single new MCP tool, `query_domain`, accepting `{entity: 'meeting', …}` in v1
- Eval: 10–20 labeled queries across "simple per-deal," "cross-entity with deal/account," and "compose-with-existing-tool" categories
- Validation: same 10–20 queries run against (A) current tools, (B) bash + markdown baseline, (C) the new `query_domain` slice — measure accuracy, latency, token cost, tool call count

That slice is the proof point — and the basis for deciding whether the substrate generalizes to facts and artifacts next.

— Doug
