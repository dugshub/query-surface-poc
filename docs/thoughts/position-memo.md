# Position memo: agentic retrieval — direction, divergence, proposal

**For:** eng team (Jeff, Thiago, Doug, Evan D., Nick) — meeting 2026-05-20
**Author:** Doug
**Companions:** [`uniform-query-surface-architecture.md`](./uniform-query-surface-architecture.md), [`dealbrain-today-vs-proposed.md`](./dealbrain-today-vs-proposed.md)

## TL;DR

Alexis was largely right and we should change course toward agentic retrieval — but **not for the reason he gave**. The lesson is *composability and familiar semantics*, not *bash and SQL specifically*. Our existing fact engine was the right call for the moment; what we should build next is a **uniform, composable domain query surface across our CRM entities** — the same shape I built in AloeVera's analytics engine and that I've since productized into our `pattern-stack/codegen-patterns` kit (with Cube as the semantic-layer engine). I'm asking for approval to start building this layer; ablation testing — including Alexis's "just throw markdown at bash" baseline — is part of the validation plan, not a precondition to begin.

## Where we agree with Alexis

1. **More agentic, less pre-computed.** Hand-tuned semantic queries, embedding rerankers, and bespoke per-question pipelines are losing leverage as models get stronger. Letting a smart agent compose targeted lookups against a clean surface is producing better results in more places.
2. **Composability matters more than cleverness.** The reason a Claude session with bash + ripgrep + SQLite can outperform a custom MCP stack is that the agent can pipe one result into the next call inside the language layer, instead of carrying state through its own context window.
3. **High-value, cross-entity questions are where we have the most upside.** Nick's product-request mining and similar-deal lookup examples in the conversation are the kinds of questions our current surface can't really do — and they're the kinds enterprises will pay for.
4. **The two questions are separate.** Alexis's clearest line in the room: *"you've coupled two issues that are separate — pulling data out of irritating APIs, and presenting it to the AI."* The connector work we've done is real and valuable. The retrieval shape on top is the open question.

## Where the framing diverges

Alexis's causal story was: *bash and SQL win because the model was pre-trained on millions of examples of them, so we should fall back to them or things that look like them.* I think that's correlation, not causation.

The real properties that make bash + SQL strong agentic interfaces are:

- **Composability.** Any output can be piped into any input. The agent expresses intent in one composed expression rather than chaining tool calls through its own brain.
- **Schema-uniformity.** The same operators (`=`, `LIKE`, `IN`, `JOIN`) work across every table. The agent learns the verb set once, reuses it everywhere.
- **Universal accessibility.** They work over the *entire* environment without special enablement per data source.
- **Self-describing.** The schema is queryable — the agent can introspect it cheaply when it doesn't know.

A custom retrieval surface that has all four of those properties will perform identically to a SQL/bash surface. A custom retrieval surface that doesn't won't — even if it's "based on" SQL underneath.

Pre-training familiarity is a real second-order effect, and we shouldn't dismiss it — but it's mitigated cheaply if our DSL resembles SQL semantics (`equals` / `in` / `before` / `joined_to`, boolean composition, list-then-get-then-search patterns). Our agent will learn it in-context in one round-trip and reuse the vocabulary for the rest of the session. That's the *price of admission*, not a structural disadvantage.

## What I'm proposing we build

A **uniform domain query surface** across our CRM entities (Deal, Account, Contact, Artifact, Fact, ActionItem, Meeting), with three layers:

1. **Entity primitive layer** — every domain entity exposes the same shape: `list(filter, sort, search, page)` and `get(id, expand)`, with a shared operator vocabulary and **cross-entity joinable filters**. ("Meetings where `deal.account.industry IN [...] AND fact.classification = 'pain_point'`.")
2. **Semantic / analytics layer (Cube)** — composable measures and dimensions across entities, supporting the cross-deal / cross-time questions our current surface can't express. ("Count of `pain_point` facts by industry × stage in the last 90 days.")
3. **Convenience tool layer** — observed common queries get named MCP tools (today's `list_action_items`, `search_deal_context`, `list_deal_updates`, etc.) that compile down to the primitives. The bespoke tools remain — they just sit on top of a shared substrate instead of each inventing their own filter dialect.

The full shape, including operator vocabulary, filter algebra, expand semantics, and the MCP-surface integration, is in [`uniform-query-surface-architecture.md`](./uniform-query-surface-architecture.md). A concrete gap analysis of the existing per-entity MCP surface is in [`dealbrain-today-vs-proposed.md`](./dealbrain-today-vs-proposed.md). Five illustrative entity manifests across both packages are in [`entities/`](./entities/) — these make the YAML-driven shape concrete for opportunity / account / contact / meeting / fact.

This is not a rewrite of the fact engine. It's an **expansion of the retrieval surface around it** that lets the agent do the kinds of cross-entity, composable lookups that the current bespoke per-tool shape can't express — and that, separately, lets us simplify or retire pipeline complexity that the new surface makes unnecessary.

## Where it attaches

This is the natural next layer on top of the integrations-package migration we've been shipping through Phase 2. The CRM domain entities (`opportunity`, `account`, `contact`, `opportunity-contact`, `account-contact`), their repository interfaces, the concrete Drizzle implementations, the unified `crm.surface.ts`, and the entity graph already live in `packages/integrations/src/domain/crm/`. The uniform query surface attaches there.

The legacy CRM repos in `apps/backend/src/infrastructure/database/repositories/{opportunity,account,contact,opportunity-contact}.repository.ts` are the migration's remaining tail — the dual-sync transition we've been managing. Cutting them over and layering the uniform query primitive on top of the package's domain layer happen in the same sweep. We're not starting a new architectural move; we're completing one.

The app-specific entities the new surface needs to reach (`meeting`, `artifact`, `fact`, `activity`, `action-item`) live in `apps/backend/src/domain/` and `apps/backend/src/infrastructure/database/repositories/`. The uniform query primitive's value is **spanning both packages** — declaring relationships symbolically across the boundary so a `meeting → opportunity → account` filter compiles to a single query regardless of which package owns each entity.

## Why I think it works (three rungs of evidence)

1. **It's where my head's been all along.** Domain-modeled retrieval with a semantic layer has been in my own pre-onboard planning notes from before I joined (Jan 2026) — those notes weren't shared with the team, they're just where this shape first crystallized for me, building on the AloeVera precedent below. We aligned in light touches early on that integrations were the right focus, and they've rightly stayed front-and-center through Phase 2 — none of this was put forward and held back. Calling out the pre-work so the proposal doesn't read as a reaction to Alexis: the conversation with him is a useful catalyst, not the originator of the thinking.
2. **Working precedent.** AloeVera's `analytics_engine` (Python, SQLAlchemy) implements this exact shape end-to-end: `Entity` registrations with dimensions, measures, and relationship paths; `FilterCondition` with fluent boolean algebra (`&`/`|`/`~`) compiling to SQL; `EntityRegistry` for cross-entity shared dimensions; `ReportingService.get_measure_data(entity, measure, dimensions, filters, include_sql=True)` as the uniform retrieve interface. Layered on top, `aloevera_reporting_agent` is a PydanticAI agent that gets predefined report tools (the convenience layer) **plus** a generic `custom_query` (the composable escape hatch) **plus** a metadata endpoint that self-describes the available entities/dimensions/measures into the system prompt. The agent uses both — convenience when it matches, custom-query when it doesn't.
3. **Evolved kit on our exact stack.** `pattern-stack/codegen-patterns` (TypeScript, NestJS, Drizzle, Postgres) generates this shape from YAML entity definitions. The `queries:` block compiles to typed repository methods, use-case classes, and NestJS module wiring; entity families (`crm`, `activity`, `metadata`, `knowledge`) ship pre-built query patterns; `analytics: cube` wires a Cube semantic-layer surface against the same entity definitions. The kit is mid-evolution (the `DOGFOOD-LOG.md` is candid about its rough edges), but the structural pieces match what we want and we already understand them.

The proposal is not "I have a magic bullet." It's "this is a shape I've built before in different stacks, evolved into a codegen kit for our exact stack, and now want to apply to dealbrain."

## The test we should commit to

Alexis explicitly recommended an ablation, and we should run it. Three arms, same fixture set, same eval queries:

- **(A) Current state** — embeddings + rerank + the existing bespoke MCP tools.
- **(B) Raw markdown + bash baseline** — Alexis's strawman. Pull a representative slice of artifacts to disk as markdown; expose `bash` to Claude; let it rip with grep / find / awk. (Cheap — we already have the markdown in the DB.)
- **(C) Uniform query surface (this proposal)** — even a thin slice. One MCP tool (`query_domain`) over two or three entities (Deal, Artifact, Fact) with cross-entity joinable filters.

Evaluate on: accuracy on a labeled eval set, latency, token cost, number of tool calls per query (Alexis's qualitative tell — high call count = agent finding traction), and qualitative coherence on a few high-value queries (product-request mining, similar-deal lookup, state-of-deal recall, evidence retrieval).

The expected result, honestly stated up front:
- **(B) beats (A)** on simple recall queries → confirms the bitter lesson Alexis described; the rerank + embed pipeline isn't pulling its weight on the simple end.
- **(C) beats (B)** on cross-entity / structured queries → confirms the proposal: composability + domain-shaped semantics matter on the hard end.

If those results don't hold, that's information and we adapt. If they do, we have ground truth to justify what we build next, and an honest answer to "couldn't a customer with Claude and our markdown just do this themselves?" — which is the question we're all going to keep hearing.

## What I'm asking for tomorrow

1. **Approval to start building the uniform query layer** — beginning with one entity slice end-to-end (entity primitive → MCP tool → eval) rather than a big bang.
2. **Buy-in on running the three-arm ablation in parallel** — at minimum (B) vs (C) on a defined eval set; (A) included if Thiago's bandwidth allows since he owns the current pipeline.
3. **Alignment on what we're *not* doing right now**: not ripping out the fact engine, not deprecating bespoke MCP tools, not promising cross-deal analytics in the first slice. The current surface keeps working while we build the substrate beneath it.

## Risks I want named

- **Cube adds a real dependency.** Bringing in a semantic-layer engine is non-trivial — schema, deployment, query compilation. It's the right tool but we should size the lift before committing to *this specific* engine.
- **Codegen-patterns is mid-evolution.** I've been dogfooding it and the log is honest about the rough edges. We can adopt the kit's *shape* without adopting the kit itself — generate by hand for one entity, see if the shape holds, then automate.
- **Cross-entity queries may surface tenant/scoping issues** that the bespoke tools currently sidestep by being entity-local. The first slice has to prove the org/tenant filter propagates correctly through joins.
- **It's tempting to over-scope.** I want one entity slice, one MCP tool, and one eval as the first milestone. Not all-entities-everywhere.

## What changes about how we work, if we say yes

- New entities arrive through a uniform path: YAML definition → generated primitives → automatic uniform-query exposure → optional convenience tools layered on top for observed patterns. We stop writing each new `list_X` tool with bespoke filter args.
- The fact engine becomes one consumer of the surface, not the only retrieval path. Embeddings/rerank stay where they earn their cost (similarity search, fuzzy recall) and don't get applied where exact filter semantics serve.
- "Inter-deal" questions (Nick's product-request mining, similar-deal lookup) become possible without bolting a second pipeline next to the fact engine.

— Doug
