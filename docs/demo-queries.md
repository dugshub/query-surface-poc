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
