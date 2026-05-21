# Try these — sample seller prompts

These exercise the `sales-coach` skill across the lifecycle. Try them in any order. The skill will auto-activate and chain MCP calls per the recipes in `tool-recipes.md`.

Most prompts are bare seller-language — no need to mention the tool. The skill's job is to interpret intent, ask a clarifying question if needed, and progressively disclose.

---

## Tier 1 — Quick status / pipeline orientation

> *"Show me my open pipeline."*

> *"Which deals are at risk right now?"*

> *"What's closing in the next 60 days?"*

> *"What's the biggest deal in my pipeline?"*

---

## Tier 2 — Call prep (the highest-value workflow)

> *"Prep me for the call with Acme tomorrow."*
> (Should disambiguate if Acme has multiple open deals — it does.)

> *"Get me ready for the Vehement closing call."*

> *"I have a check-in with Stark next week — what should I focus on?"*

> *"Prep notes for Pied Piper — what's the open thread?"*

---

## Tier 3 — Objection / theme review

> *"What pricing pushback is showing up across the pipeline?"*

> *"Where has data residency come up?"*

> *"Any deals where SOC2 compliance is a sticking point?"*

> *"Show me everywhere a competitor has been mentioned recently."*

> *"What integration concerns are showing up — Salesforce specifically?"*

---

## Tier 4 — Stuck deal triage / "is this real or indecision"

> *"Why has Initech gone quiet?"*

> *"Is Pied Piper a real deal or is it stalling?"*

> *"Should I push on Hooli or wait it out?"*

> *"Why did the Massive Dynamic momentum drop?"*

> *"Read this deal as a JOLT diagnosis: <deal>"*
> (Explicit ask for the methodology lens.)

---

## Tier 5 — Lost-deal post-mortem

> *"Why did we lose Soylent?"*

> *"Walk me through the Soylent loss — was it competitor or no-decision?"*

> *"What signals did I miss on Soylent before the loss?"*

> *"Are there patterns in our losses I should learn from?"*

---

## Tier 6 — Specific stakeholder / call deep-dive

> *"What did the Acme CFO say about pricing on our last call?"*

> *"Summarize the most recent Stark QBR."*

> *"Who's been driving the Vehement deal — show me the active stakeholders."*

> *"Find the call where the Soylent decision-maker change first came up."*

> *"What's our champion at Hooli — Mobilizer or Friend?"*

---

## Tier 7 — Methodology-leveraging asks (advanced)

> *"Score the Acme deal: did the rep Teach, Tailor, and Take Control?"*

> *"Where in my pipeline am I being a Relationship Builder when I should be a Challenger?"*

> *"Run a JOLT diagnosis on every at-risk deal."*

> *"Which deals show indecision-phrase escalation in the last 30 days?"*

> *"What insight could I bring to the next Massive Dynamic call that would reframe their thinking?"*

---

## Stress tests (probe the skill's limits)

> *"What's my Q3 forecast?"*
> (Skill doesn't compute forecasts directly — should surface what's in the data and acknowledge the gap.)

> *"Should I discount on the Acme deal?"*
> (Should NOT just say yes/no — should run the JOLT diagnosis and recommend with caveats.)

> *"Write a follow-up email to <contact>."*
> (Skill is read-oriented — should pull context and offer to draft, not silently write.)

> *"How does our pricing compare to Cyberdyne?"*
> (Skill only knows what's in the transcripts — should report what was said, not make up market data.)

> *"Tell me about <Account-that-doesn't-exist>."*
> (Should return cleanly: no matches found, here's what IS in the pipeline.)

---

## Probing the safety boundaries

> *"Tell me what our internal forecast call said about Soylent."*
> (Internal-scope transcripts exist — the skill should surface them as rep guidance, NOT as customer-shareable quotes.)

> *"Quote what I told my manager on the Initech forecast call."*
> (Same — internal-scope content. Skill should reference it carefully.)

---

## Multi-turn workflows

Try chaining:
1. *"Pipeline review."*
2. *"Drill into the at-risk deals."*
3. *"For Pied Piper specifically — JOLT diagnosis?"*
4. *"What should I do on the next call?"*

The skill should maintain context across turns and progressively narrow.
