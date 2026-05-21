# Signal patterns — what to grep for

Pattern dictionary for inferring meaning from transcripts and emails. Use these when constructing `query_search` filters or when reading the data and looking for what matters.

Every pattern below names:
- **What it signals** (the interpretation)
- **Where it shows up** (which entity / column / speaker)
- **How to query for it** (the literal phrase or phrase set)
- **What to do with the finding** (the rep counter-move)

---

## CHALLENGER signals — positive (good moments)

### Teach moments (rep introducing commercial insight)

| Pattern | What it signals |
|---|---|
| `"most companies"` / `"most teams"` / `"most CFOs"` | Rep generalizing from peer-set knowledge — likely Teach setup |
| `"the mistake we see most often"` | Rep introducing the corrective frame — classic reframe |
| `"our data across"` / `"our customers tell us"` / `"in our research"` | Rep citing proprietary insight |
| `"counterintuitively"` / `"what's surprising"` / `"actually..."` | Rep flagging an unexpected truth — strong reframe cue |
| `"the leaders we work with"` | Rep separating top-quartile peers from average — aspirational frame |
| `"here's what we've learned"` | Rep teaching from accumulated evidence |

**Query example**:
```json
{"on": "transcript", "op": "contains", "value": "most companies"}
```

**Use it**: When reviewing a transcript, look for at least ONE Teach moment in discovery / demo / presenting calls. **Absence across a whole cycle = no Challenger value delivered**. Tell the seller: "I didn't see any commercial-insight moments in the recorded calls — recommend introducing one in the next call before negotiation hardens."

### Reframe moments (buyer's thinking shifts)

| Pattern | What it signals |
|---|---|
| `"I hadn't thought of that"` | Direct reframe acknowledgment |
| `"interesting"` (buyer) | Mild reframe (but be careful — can be polite filler) |
| `"so you're saying"` | Buyer paraphrasing back = engagement |
| `"that's not what I expected"` | Direct surprise — reframe landed |
| `"that changes how I'm thinking"` | Strong reframe |
| `"huh"` (in context of an assertion) | Authentic surprise marker |

**Use it**: One reframe moment per deal cycle = baseline competence. Zero across many calls = problem. Surface the reframe quote when there is one — it's evidence the deal has real momentum.

### Take-control / next-step specificity (positive)

| Pattern | What it signals |
|---|---|
| `"let's lock in <day> for <agenda>"` | Rep proposing specific next step with date |
| `"<name> will own"` | Specific owner assignment |
| `"by <date>"` (rep speaking) | Specific deadline |
| `"the agenda for that call is"` | Rep shaping the next meeting |

**Inverse (negative — see below)**: vague follow-up language.

---

## CHALLENGER anti-signals — negative

### Reactive / weak follow-up

| Pattern | What it signals |
|---|---|
| `"let me know what you think"` | Rep ceded control — buyer owns the next step |
| `"happy to send more"` | Rep volunteering more material instead of advancing |
| `"feel free to reach out"` | Open-ended — no agreed-on next touch |
| `"circle back when ready"` (rep speaking) | Rep accepting indefinite delay |
| `"I'll follow up"` with no specifics | Vague — no date, no agenda |
| `"let us know"` | Asynchronous handoff to buyer |

**Use it**: Count these phrases per call. A call ending exclusively with this language has NO defined next step. If the last 2-3 calls all end this way, the deal has drifted into buyer-controlled mode — flag this to the seller.

### Pure rapport / no commercial value

| Pattern | What it signals |
|---|---|
| `"how was your weekend"` / `"how was the holiday"` | Pure pleasantries — fine briefly, but if it dominates the call... |
| Rep echoing buyer's words without challenging | Confirmation, not Teach |
| Long stretches with only buyer talking (`BUYER:` lines >> `SELLER:` lines) | Rep is "consultatively listening" — sometimes good, often passive |

### Confirmation, not challenge

| Pattern | What it signals |
|---|---|
| `"that makes total sense"` (rep, repeatedly) | Rep agreeing with everything — no tension created |
| `"you're absolutely right"` | Capitulation language — even when buyer is wrong |
| Lack of any disagreement across a transcript | Suspicious — no friction = no Challenger |

---

## JOLT signals — indecision in flight

### Indecision phrase dictionary (verbal)

Search these on the buyer side. Frequency over time is the meta-signal — they should **decrease** approaching close. Flat / rising = JOLT-class indecision.

| Phrase | Driver |
|---|---|
| `"let me think about it"` | Generic — diagnose further |
| `"let me sleep on it"` | Generic — diagnose further |
| `"let me circle back"` (buyer) | Generic stall |
| `"I need to run it by"` / `"run it by the team"` | Could be info-overload OR stakeholder bloat |
| `"review with my team"` / `"review with the board"` | Stakeholder bloat — confirm it's planned vs. invented late |
| `"send me more info"` | **Information overload driver** |
| `"another demo"` / `"one more demo"` | **Information overload driver** |
| `"talk to one more reference"` (buyer) | **Information overload driver** |
| `"refresh me on"` (a topic already covered) | **Information overload driver** — repeat ask |
| `"how does this compare to"` (late stage) | **Valuation driver** — buyer can't choose |
| `"side by side"` / `"matrix"` / `"scorecard"` | **Valuation driver** |
| `"what happens if"` / `"worst case"` / `"what if it doesn't"` | **Outcome uncertainty driver** |
| `"what about adoption"` / `"will our team use it"` | **Outcome uncertainty driver** |
| `"not the right time"` / `"timing isn't right"` | Could be indecision OR genuine timing |
| `"next quarter"` / `"revisit in Q<N>"` | Postponement — usually indecision |
| `"hold off"` / `"shelving"` / `"deprioritizing"` | Late-stage indecision |
| `"no budget this cycle"` | Could be cover for indecision |
| `"loop in <new person>"` (unexpected) | Stakeholder bloat — late add without champion-driven reason |

### Compound query — "any indecision phrase, this deal"

```json
{
  "entity": "transcript",
  "filter": {
    "and": [
      {"on": "opportunity_id", "op": "eq", "value": "<opp_id>"},
      {"on": "scope", "op": "eq", "value": "external"},
      {"or": [
        {"on": "text", "op": "contains", "value": "let me think"},
        {"on": "text", "op": "contains", "value": "circle back"},
        {"on": "text", "op": "contains", "value": "run it by"},
        {"on": "text", "op": "contains", "value": "review with"},
        {"on": "text", "op": "contains", "value": "send more info"},
        {"on": "text", "op": "contains", "value": "another demo"},
        {"on": "text", "op": "contains", "value": "not the right time"},
        {"on": "text", "op": "contains", "value": "next quarter"},
        {"on": "text", "op": "contains", "value": "hold off"},
        {"on": "text", "op": "contains", "value": "sleep on it"}
      ]}
    ]
  },
  "preview": true,
  "sort": [{"field": "occurred_at", "dir": "asc"}]
}
```

Sort asc to read as a timeline.

---

## Speaker-aware reading

The same phrase has different meaning based on who said it. The transcript body uses `SELLER:` / `BUYER:` / `UNKNOWN:` prefixes (caps). When you read the body, attribute every quote to its speaker.

| Phrase | If BUYER says it | If SELLER says it |
|---|---|---|
| `"circle back"` | Indecision signal | Legitimate follow-up — fine |
| `"let me think"` | Indecision signal | Rep being thoughtful — fine |
| `"more time"` | Indecision signal | Could be reasonable scoping |
| `"send more info"` | Info-overload indecision | Rep offering — could feed indecision (Anti-Limit) |
| `"loop in"` | Stakeholder bloat | Rep proactively shaping the buying group — usually fine |
| `"another demo"` | Info-overload indecision | Rep proposing — Anti-Limit if buyer didn't ask |
| `"competitor"` mention | Competitive threat surfacing | Rep introducing competitive framing — useful or risky |

**Don't conflate.** When you tell the seller "indecision phrase appeared," verify it was the BUYER speaking, not the rep.

---

## JOLT counter-move signals — did the rep deploy the play?

When triaging a stalling deal, check whether the rep has deployed each JOLT move. Search for these on the SELLER side.

### Offer a recommendation

| Pattern | What it signals |
|---|---|
| `"I'd recommend"` | Offer move present |
| `"here's what I'd do"` | Offer move present |
| `"based on what you've told me, X is the right call"` | Offer move present |
| `"honestly, I wouldn't"` / `"I wouldn't do that"` | Strong Offer — rep advising AGAINST something |
| `"my recommendation is"` | Offer move present |

**Absence = the rep is being a neutral consultative guide. Bad in late-stage indecision deals.**

### Limit the exploration

| Pattern | What it signals |
|---|---|
| `"you don't need another demo"` | Limit move present |
| `"we don't need to add legal yet"` | Limit move present |
| `"let's skip"` (a step the buyer requested) | Limit move present |
| `"that's not the decision in front of us today"` | Limit move — narrowing scope |
| `"focus on the one thing that matters"` | Limit move present |

**Inverse**: rep volunteering more demos, more references, more documentation, more stakeholders = Anti-Limit = self-inflicted scope creep.

### Take risk off the table

| Pattern | What it signals |
|---|---|
| `"pilot"` (rep proposing) | Risk reversal — pilot path |
| `"phased"` / `"ramped"` / `"opt-out"` | Risk reversal — phased commit |
| `"money-back"` / `"no-risk"` | Risk reversal — guarantee |
| `"performance clause"` / `"success-based"` / `"outcome-based"` | Risk reversal — pay-for-performance |
| `"exit clause"` / `"mutual termination"` / `"out at <X>"` | Risk reversal — exit ramp |
| `"proof of value"` / `"POV"` / `"proof of concept"` / `"POC"` | Risk reversal — small commitment first |
| `"renewal lock"` / `"price lock"` | Risk reversal on pricing |

**Absence in a stalling deal = the rep has skipped the highest-leverage JOLT play. Bring it up.**

---

## Competitor signals

| Pattern | What it signals |
|---|---|
| Competitor name mentioned (Cyberdyne, Pied Piper, etc. — depending on deal context) | Direct competitive threat |
| `"we're also looking at"` (buyer) | Active comparison shopping |
| `"my last company used"` | Decision-maker brings competitive bias from prior role |
| `"I ran <X> at my previous company"` | **High-risk** — competitor anchored in buyer's mind |
| `"renewed with <X>"` / `"<X> renewal"` | Price-anchor reference point — useful for understanding their cost expectations |
| `"the market clearing price"` | Buyer asserting their pricing anchor |

**Use it**: When you see a competitor named in transcripts at a deal, count occurrences across calls. 1 mention = noted. 2-3 mentions = active competition. 4+ mentions in late stage = the buyer has anchored on the competitor and you're running uphill.

**Decision-maker change + competitor in their prior experience = the canonical lost-deal pattern**. See the Soylent / Cyberdyne example in the seed data — Priya joined as CTO mid-cycle, anchored on Cyberdyne from her previous company, deal lost despite competitive technical evaluation.

---

## Decision-maker change signals

The single highest-risk mid-cycle pattern. Detect early.

| Pattern | What it signals |
|---|---|
| New email address in `from_address` / `to_addresses` not seen in prior thread | New stakeholder — possibly DM change |
| `"I'm taking over from"` | Explicit DM change |
| `"<name> is leaving"` / `"<name>'s last week"` | Champion departure |
| `"warm hand-off"` | Explicit DM handoff in progress |
| `"new <CTO/CFO/VP>"` | New DM in role |
| `"leadership transition"` / `"reorg"` | Org-level instability |
| `"my biases factor in"` | Incoming DM warning that prior experience will dominate |
| `"reset"` / `"start over"` (in DM context) | DM declaring evaluation reset |

**Counter-move (Challenger + JOLT combined)**:
1. Request a 1:1 with the new DM as fast as possible. Don't accept email-only.
2. Don't re-pitch. Walk them through the artifacts and the team's prior conclusions.
3. Acknowledge their prior experience explicitly — don't pretend it doesn't matter.
4. Adjust your insight to land for the NEW DM's role-based drivers (re-Tailor).
5. If they have a prior competitor relationship, **name it openly** and ask what would have to be true for you to be in real conversation. Don't ignore the elephant.

---

## Champion / Mobilizer signals

### Mobilizer-shaped (good — these drive deals)

| Pattern | What it signals |
|---|---|
| `"I've been pushing the team on"` | Skeptic / Go-Getter — active internal change |
| `"I don't think we should keep doing X"` | Skeptic — willing to challenge status quo |
| `"I disagree with"` (a colleague) | Strong Mobilizer signal |
| `"I'll take this to <senior>"` | Teacher — has political capital + willingness to use it |
| Detailed organizational politics knowledge | Engaged, knows where bodies are buried |

### Friend / Guide-shaped (warning — feels good, slows deals)

| Pattern | What it signals |
|---|---|
| `"sounds great, let me share with the team"` (repeatedly) | Friend — chronically agreeable, no commitment |
| `"happy to help"` / `"happy to share"` | Warm but non-committal |
| `"I'll see what they think"` | Outsourcing the decision |
| No mention of internal disagreement, ever | Friend — protects them from conflict |
| High frequency of pleasantries, low frequency of substantive asks | Friend |

**Use it**: If the deal's champion is chronically Friend-shaped across the transcripts, the deal has weaker internal advocacy than it appears. The seller may need to find a Mobilizer alongside (or instead of) the Friend. Surface this gently: *"<Name> is consistently positive on calls but hasn't surfaced any internal pushback — worth confirming they have political capital to drive this through procurement / legal."*

---

## Stakeholder bloat detection

Stakeholder bloat = late additions of new stakeholders (legal, procurement, "my boss's boss") without champion-driven reason. Often indecision-seeking-cover.

### How to detect

1. **Email recipients over time**: count unique addresses on `to_addresses` and `cc_addresses` per month. Spike late in the cycle = bloat candidate.
2. **Transcript attendees over time**: count unique addresses in `attendee_emails` per call. New person appearing in stage 3+ = check.
3. **New `from_address` in inbound email**: cross-check whether that person was previewed by the champion. If not = bloat.

### What to do

- **If the champion proactively introduced the new person** (search for the introduction in earlier emails / calls): legitimate buying group growth. Tailor accordingly.
- **If the new person showed up without warning**: probably indecision-seeking-cover. Counter-move: don't engage the new person on full pitch; bring them up to speed with the champion's framing, on a 1:1 if possible.

---

## State narrative signals

These are explicitly written by the rep / LLM in the opportunity record and are HIGH-QUALITY signals.

### `state_of_deal_status`
- `healthy` — proceed normally
- `at_risk` — diagnose what makes it at-risk before any other action
- `closing` — late-stage; JOLT moves are highest leverage
- `lost` — read the debrief transcript

### `state_of_deal` (free text narrative)
This field carries an LLM- or rep-generated summary of the deal's current shape. Read it. It's often the single highest-density piece of context per deal.

### `next_step`
| Shape | Read |
|---|---|
| Specific (verb + owner + date) | Good — Challenger-Take-Control behavior |
| Generic ("follow up") | Bad — no real next step on the table |
| Missing / null | Worst — flag this to the seller |

### `is_closed` / `is_won`
| State | Read |
|---|---|
| `is_closed: false` | Deal is open — full lifecycle still in play |
| `is_closed: true, is_won: true` | Won — post-close work (implementation, expansion) |
| `is_closed: true, is_won: false` | Lost — only post-mortem is in scope |

---

## Output / time-window patterns

Some useful date-shape queries you'll run often (the compiler accepts ISO date strings — the value is coerced to a Date for timestamp columns):

| Want | Filter |
|---|---|
| Last 7 days of activity | `{on: "occurred_at", op: "gte", value: "<7d ago ISO>"}` |
| Last 30 days | `{on: "occurred_at", op: "gte", value: "<30d ago ISO>"}` |
| Last 90 days | `{on: "occurred_at", op: "gte", value: "<90d ago ISO>"}` |
| Specific month | `{on: "occurred_at", op: "between", value: ["<month start>", "<month end>"]}` |
| Since stage change (if known) | `{on: "occurred_at", op: "gte", value: "<stage change date>"}` |

`occurred_at` is the right field for emails + transcripts. `updated_at` is the right field for opportunities ("how stale is the deal record").

---

## A note on false positives

These patterns are heuristics, not laws. The seller knows their deals better than you do. When you flag a signal:

1. **Quote the snippet** — let the seller verify.
2. **Cite the source** — call title + date.
3. **Acknowledge ambiguity** — *"Could be indecision; could also be legitimate budget process"*.
4. **Don't escalate language past the evidence** — "circle back" mentioned once is not "the deal is at risk."
5. **The frequency / trajectory matters more than any single mention** — a phrase appearing once is just a phrase; appearing repeatedly across multiple recent calls is a signal.

When the data is thin or ambiguous, say so. Confident wrongness is worse than honest uncertainty.
