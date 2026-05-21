# Tool recipes — chained-call patterns

Concrete query bodies for each common sales-lifecycle workflow. Copy + adapt.

Conventions used throughout:
- Always `preview: true` on first searches — the preview rows are cheap and carry most of the context.
- Sort by recency on call/email searches (`occurred_at desc`) and by deal value (`amount desc`) or recency (`updated_at desc`) on opportunity searches.
- `scope: external` on transcript searches when surfacing customer-shareable content. Include internal only when explicitly relevant.
- Limit defaults: 5-10 for prep; 20 for objection scans; 50 for pattern hunts.

---

## Recipe A — Call prep (most common workflow)

**Trigger**: *"Prep me for the call with <account> tomorrow"* / *"Get me ready for <deal>"*

### A1. Disambiguate the deal
First, find all open deals at the account. If only one open deal, proceed. If multiple, ASK before proceeding.

```json
// query_search
{
  "entity": "opportunity",
  "filter": {
    "and": [
      {"on": "account.name", "op": "eq", "value": "<Account Name>"},
      {"on": "is_closed", "op": "eq", "value": false}
    ]
  },
  "preview": true,
  "sort": [{"field": "updated_at", "dir": "desc"}]
}
```

If `total > 1`, surface the deal names + stages and ask which one. Don't pick for the seller.

### A2. Pull deal state
```json
// query_fetch (or use preview from A1 if it gave you everything)
{
  "entity": "opportunity",
  "ids": ["<opp_id>"]
}
```

Or — if preview from A1 already shows: name, stage, amount, state_of_deal_status, account_id, close_date — you may not even need this call. The preview rows are dense.

### A3. Recent transcripts on this deal (last 5)
```json
// query_search
{
  "entity": "transcript",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"on": "scope", "op": "eq", "value": "external"}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "desc"}],
  "page": {"limit": 5}
}
```

### A4. Recent emails on this deal (last 5)
```json
// query_search
{
  "entity": "email",
  "filter": {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "desc"}],
  "page": {"limit": 5}
}
```

A3 + A4 can be fired **in parallel** via multi-entity search if you prefer:
```json
{
  "queries": [
    {"entity": "transcript", "filter": {"and": [{"on": "opportunity_id", "op": "eq", "value": "<opp_id>"}, {"on": "scope", "op": "eq", "value": "external"}]}, "sort": [{"field": "occurred_at", "dir": "desc"}], "page": {"limit": 5}},
    {"entity": "email", "filter": {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"}, "sort": [{"field": "occurred_at", "dir": "desc"}], "page": {"limit": 5}}
  ],
  "preview": true
}
```

### A5. Objection / indecision scan on this deal
```json
// query_search — find transcripts where common objection keywords landed
{
  "entity": "transcript",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"or": [
        {"on": "text", "op": "contains", "value": "pricing"},
        {"on": "text", "op": "contains", "value": "data residency"},
        {"on": "text", "op": "contains", "value": "compliance"},
        {"on": "text", "op": "contains", "value": "integration"},
        {"on": "text", "op": "contains", "value": "circle back"},
        {"on": "text", "op": "contains", "value": "let me think"}
      ]}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "desc"}]
}
```

Tune the OR list per deal context. The `_snippets` give you the quotable context per match.

### A6. Output structure for the seller
```
**<Deal name> — <stage> — $<amount>**

LAST TOUCH: <transcript title> (<source>, <date>) — <summary>

OPEN OBJECTIONS / OPEN THREADS:
- <objection 1> — last raised on <date>, snippet: "<...>"
- <objection 2> — ...

STAKEHOLDERS ACTIVE IN LAST 30 DAYS: <names + roles inferred from attendees>

INDECISION RISK: <low / medium / high — based on JOLT signal frequency>
  - <2-3 specific signals from the data>

SUGGESTED POSTURE FOR THE CALL:
  - Open by acknowledging <last open thread> directly
  - Take control of next step: <specific proposed agenda / owner / date>
  - Insight to teach: <if applicable — connect to deal context>
  - If indecision shows up: <which JOLT move to deploy>

NEXT STEP CURRENTLY ON RECORD: <next_step field>
  - <missing? generic? — call out if so>
```

---

## Recipe B — Objection review across the pipeline

**Trigger**: *"What pricing pushback are we seeing"* / *"Where has data residency come up"* / *"Show me all the deals with integration concerns"*

### B1. Multi-entity scan
```json
// query_search
{
  "queries": [
    {
      "entity": "transcript",
      "filter": {
        "and": [
          {"on": "text", "op": "contains", "value": "<objection keyword>"},
          {"on": "scope", "op": "eq", "value": "external"}
        ]
      },
      "sort": [{"field": "occurred_at", "dir": "desc"}],
      "page": {"limit": 20}
    },
    {
      "entity": "email",
      "filter": {"on": "text", "op": "contains", "value": "<objection keyword>"},
      "sort": [{"field": "occurred_at", "dir": "desc"}],
      "page": {"limit": 20}
    }
  ],
  "preview": true
}
```

### B2. Group hits by opportunity
The previews carry `opportunity_id`. Group the matches by opp:

| Deal | # transcripts | # emails | Most recent mention | Stage |
|---|---|---|---|---|

### B3. For each affected deal — pull state
```json
// query_fetch — pull all affected opps with account inline
{
  "entity": "opportunity",
  "ids": ["<opp_id_1>", "<opp_id_2>", "..."],
  "expand": ["account"]
}
```

### B4. Output structure
```
**<Objection keyword> — appears across <N> deals**

| Deal | Stage | Amount | Last mention | Trajectory |
|---|---|---|---|---|
| Acme — Q3 New Logo | closing | $250K | 2026-05-30 | Escalating (3 mentions in 30d) |
| Initech — Multi-loc | negotiation | $180K | 2026-04-15 | Resolved (last mention >30d ago, none since) |
| ...

PATTERNS NOTED:
- <e.g. "Pricing pushback is concentrated in deals where the buyer is a CFO, not procurement">
- <e.g. "Data residency comes up exclusively in EU-domiciled accounts">

REPRESENTATIVE QUOTES:
> "<snippet>" — <call title>, <date>
> "<snippet>" — <call title>, <date>
```

---

## Recipe C — Stuck deal triage ("is this real or indecision")

**Trigger**: *"Why has <deal> gone quiet"* / *"Is this deal real"* / *"Should I push on <deal>"*

### C1. Pull opp + state narrative
```json
{
  "entity": "opportunity",
  "ids": ["<opp_id>"]
}
```

Look at: `state_of_deal_status`, `state_of_deal` narrative, `next_step`, `updated_at` (when was the deal last touched). `next_step` missing or generic + `state_of_deal_status = at_risk` + `updated_at` >14 days ago = silent stall.

### C2. Indecision-phrase hunt over the deal's life
```json
// query_search — JOLT indecision phrase dictionary
{
  "entity": "transcript",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"or": [
        {"on": "text", "op": "contains", "value": "let me think"},
        {"on": "text", "op": "contains", "value": "circle back"},
        {"on": "text", "op": "contains", "value": "run it by"},
        {"on": "text", "op": "contains", "value": "review with the team"},
        {"on": "text", "op": "contains", "value": "not the right time"},
        {"on": "text", "op": "contains", "value": "next quarter"},
        {"on": "text", "op": "contains", "value": "hold off"},
        {"on": "text", "op": "contains", "value": "more time"},
        {"on": "text", "op": "contains", "value": "send more info"},
        {"on": "text", "op": "contains", "value": "another demo"},
        {"on": "text", "op": "contains", "value": "loop in"},
        {"on": "text", "op": "contains", "value": "more references"},
        {"on": "text", "op": "contains", "value": "sleep on it"}
      ]}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "asc"}]
}
```

Sort `asc` here so you see the timeline. The signal is the **trend**: are these phrases getting more frequent over time, or less?

### C3. Same hunt for emails (silent stalls hide in email gaps)
```json
{
  "entity": "email",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"on": "occurred_at", "op": "gte", "value": "<30 days ago ISO>"}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "desc"}]
}
```

Look for: ratio of outbound:inbound. If your last 4 outbound got no reply, that's the stall signal even without explicit indecision phrases.

### C4. Internal-scope check — does the rep already have a read?
```json
{
  "entity": "transcript",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"on": "scope", "op": "eq", "value": "internal"}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "desc"}],
  "page": {"limit": 3}
}
```

Internal forecast / deal-review calls often capture the rep's own at-risk read. Useful for you, not for sharing with the customer.

### C5. Output — diagnose then prescribe

```
**<Deal> — stall diagnosis**

CURRENT STATE: <stage> / <state_of_deal_status>
LAST TOUCH: <call or email — date — type>
DAYS SINCE LAST INBOUND BUYER ACTIVITY: <N>

DIAGNOSIS (Challenger + JOLT lens):

  Indecision driver (J):
    □ Valuation — <evidence: matrix requests, side-by-side asks, scope creep>
    □ Information overload — <evidence: repeated demo asks, more reference requests, repeated questions>
    □ Outcome uncertainty — <evidence: what-if questions, adoption fears, success-metric asks>
    □ (Or: not indecision — competitive threat with explicit competitor mention)

  Challenger gaps (look back at the early-stage calls):
    □ No reframe / insight delivered → buyer never had conviction in the first place
    □ Tailoring missing → some stakeholder is still un-pitched
    □ Champion is Friend-shaped, not Mobilizer-shaped

PRESCRIPTION:
  1. <Most specific actionable move — usually the JOLT move matching the diagnosed driver>
  2. <Next step proposal — specific, with a name and a date>
  3. <Risk reversal option to put on the table if appropriate>

WORD OF CAUTION: <e.g. "Don't crank urgency here — this is indecision, not stall-bias">
```

---

## Recipe D — Lost-deal post-mortem

**Trigger**: *"Why did we lose <deal>"* / *"What went wrong on Soylent"*

### D1. Pull the whole deal — opp + all transcripts (including internal) + all emails
```json
// 3 calls in parallel
{
  "queries": [
    {"entity": "transcript", "filter": {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"}, "sort": [{"field": "occurred_at", "dir": "asc"}], "page": {"limit": 50}},
    {"entity": "email", "filter": {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"}, "sort": [{"field": "occurred_at", "dir": "asc"}], "page": {"limit": 50}}
  ],
  "preview": true
}
```

Sort `asc` for the post-mortem — you want the timeline.

### D2. Pull the closing internal-scope call(s) — these often hold the rep's own diagnosis
The lost-deal debrief is usually `scope: external` (rep + customer) and the AT-RISK / post-mortem internal call is `scope: internal`. Both are valuable.

### D3. Disambiguate the loss type

Search the lost-deal transcripts + emails for:
- **Competitive language**: *"going with"*, *"selected"*, competitor names (Cyberdyne, Pied Piper, etc.)
- **No-decision language**: *"hold off"*, *"not the right time"*, *"shelving"*, *"next quarter"*, *"no budget"*, *"priorities shifted"*

If BOTH appear → composite loss (the most common case). Try to identify which dominated.

### D4. Reconstruct the Challenger + JOLT failure points

Walk through the timeline:
- **Was there ever a reframe / insight moment?** (Challenger)
- **Did the rep recommend confidently?** (JOLT — Offer)
- **Did the rep ever Limit (cap demos, references, stakeholders)?** (JOLT — Limit)
- **Did the rep propose risk reversal?** (JOLT — Take risk off)
- **Was there a decision-maker change** mid-cycle? (high-risk pattern — search for new stakeholder emails)

### D5. Output
```
**<Deal> — lost-deal post-mortem**

LOSS TYPE: <Competitive | No-decision | Composite> — <brief diagnosis>

TIMELINE OF SIGNALS:
  - <date>: <first warning sign — e.g. "first 'pricing pushback' mention">
  - <date>: <decision-maker change / new stakeholder>
  - <date>: <indecision phrase frequency spike>
  - <date>: <call where loss became likely>
  - <date>: <closure call>

WHAT THE FRAMEWORKS SUGGEST WENT WRONG:
  Challenger (early-stage):
    - <observation about insight / reframe / control>

  JOLT (late-stage):
    - <observation about recommendation / limit / risk reversal>

WHAT THE REP DID WELL:
  - <honest credit where due>

LESSONS FOR FUTURE DEALS IN THIS PATTERN:
  - <specific, transferable>
```

---

## Recipe E — Pipeline overview / pattern hunt

**Trigger**: *"Pipeline review"* / *"How does the quarter look"* / *"What patterns are showing up"*

### E1. Pipeline shape
```json
// query_search — all active deals, sorted by amount
{
  "entity": "opportunity",
  "filter": {"on": "is_closed", "op": "eq", "value": false},
  "preview": true,
  "sort": [{"field": "amount", "dir": "desc"}]
}
```

### E2. At-risk concentration
```json
// query_search — at-risk active deals
{
  "entity": "opportunity",
  "filter": {
    "and": [
      {"on": "is_closed", "op": "eq", "value": false},
      {"on": "state_of_deal_status", "op": "eq", "value": "at_risk"}
    ]
  },
  "preview": true,
  "sort": [{"field": "amount", "dir": "desc"}]
}
```

### E3. Closing-near-term
```json
// deals with close_date in the next 60 days
{
  "entity": "opportunity",
  "filter": {
    "and": [
      {"on": "is_closed", "op": "eq", "value": false},
      {"on": "close_date", "op": "between", "value": ["<today ISO>", "<+60d ISO>"]}
    ]
  },
  "preview": true,
  "sort": [{"field": "close_date", "dir": "asc"}]
}
```

### E4. Cross-pipeline pattern hunt (themes across all open deals)
```json
// "What topics keep coming up across the pipeline?"
{
  "queries": [
    {"entity": "transcript", "filter": {"and": [{"on": "text", "op": "contains", "value": "pricing"}, {"on": "scope", "op": "eq", "value": "external"}, {"on": "opportunity.is_closed", "op": "eq", "value": false}]}, "page": {"limit": 50}},
    {"entity": "transcript", "filter": {"and": [{"on": "text", "op": "contains", "value": "compliance"}, {"on": "scope", "op": "eq", "value": "external"}, {"on": "opportunity.is_closed", "op": "eq", "value": false}]}, "page": {"limit": 50}},
    {"entity": "transcript", "filter": {"and": [{"on": "text", "op": "contains", "value": "integration"}, {"on": "scope", "op": "eq", "value": "external"}, {"on": "opportunity.is_closed", "op": "eq", "value": false}]}, "page": {"limit": 50}}
  ],
  "preview": true
}
```

### E5. Output
```
**Pipeline overview — <N> open deals, $<total amount> open ACV**

BY STAGE:
  prospect:    <N>
  qualifying:  <N>
  presenting:  <N>
  negotiation: <N>
  closing:     <N>

AT-RISK CONCENTRATION:
  - <deal>: <amount> — <one-line why>
  - <deal>: <amount> — <one-line why>
  TOTAL AT-RISK ACV: $<X>

CLOSING IN 60 DAYS:
  - <deal>: <close date> — <state>
  - ...

THEMES SURFACING ACROSS THE PIPELINE:
  1. Pricing pushback — <N deals affected> — <pattern observation>
  2. Compliance / SOC2 — <N deals affected> — <pattern observation>
  3. Integration concerns — <N deals affected> — <pattern observation>

RECOMMENDED FOCUS THIS WEEK:
  - <highest-impact deal-level action>
  - <highest-impact theme-level action>
```

---

## Recipe F — Reference call match (for warm intro asks)

**Trigger**: *"Who's a good reference for <prospect>"* / *"Find me a closed-won deal at a <industry> account I can introduce to <prospect>"*

### F1. Find won deals matching the prospect's profile
```json
{
  "entity": "opportunity",
  "filter": {
    "and": [
      {"on": "stage", "op": "eq", "value": "won"},
      {"on": "account.provider_metadata", "op": "contains", "value": "<industry>"}  // best-effort — providerMetadata is jsonb
    ]
  },
  "preview": true,
  "sort": [{"field": "close_date", "dir": "desc"}]
}
```

(Note: `provider_metadata` is JSONB — the `contains` op on a JSONB column matches the string representation. Not ideal but works for the POC. In a real system you'd structure this better.)

### F2. Hydrate the candidate accounts + their contacts
```json
{
  "entity": "opportunity",
  "ids": ["<opp_id>"],
  "expand": ["account"]
}
```

```json
{
  "entity": "contact",
  "filter": {"on": "account_id", "op": "eq", "value": "<account_id>"},
  "preview": true
}
```

### F3. Identify the strongest reference contact
From the contacts at the won account, pick by:
- Last email/transcript activity (recent = warm)
- Title / role hints in name / email
- Whether they were in the most recent transcript (still engaged)

Don't recommend a reference contact who hasn't been touched in 6+ months — they may not remember the deal warmly.

---

## When to break the pattern

These recipes are defaults. Break them when:

- **The seller is mid-flow and asking quick follow-ups** — skip describe; you have schema in context. Skip preview if you only need the IDs (e.g. for a subsequent fetch). Optimize for response speed.
- **The seller is asking a one-shot question that doesn't need persistence** — don't run the full call-prep flow if they just asked "what's stage on Acme."
- **You already have the data from a previous turn** — don't re-fetch. Reference your own prior output.
- **The data set is genuinely small** — e.g. there are only 3 deals total at the account. Skip pagination, fetch all.
- **A field-specific query is more efficient than a text search** — e.g. `direction: 'inbound'` filter is faster than text-magic when you specifically want inbound emails.

The recipes assume a cold start. Most actual interactions are warm — adjust accordingly.
