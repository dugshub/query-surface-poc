import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 04 — Hooli — Platform replacement, early-stage discovery vs Pied Piper
//
// Themes: pilot results / pilot extension, competitor (Pied Piper),
//         stakeholder mapping / champion, ROI case
// Stage: qualifying  |  Amount: $95K  |  Status: healthy

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000004',
    userId: USER_ID,
    name: 'Hooli',
    website: 'hooli.example',
    externalId: 'sf-acct-004',
    providerMetadata: { industry: 'saas', employee_count: 600 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000004',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000004',
    name: 'Hooli — Platform Replacement',
    description:
      'Replace incumbent internal platform with Findtempo across product + eng. Pilot underway with Head of Product as champion; competing head-to-head with Pied Piper.',
    stage: 'qualifying',
    amount: 9500000, // $95K in cents
    closeDate: new Date('2026-09-30T00:00:00Z'),
    nextStep:
      'Scope pilot extension parameters with the Head of Product this week (success metrics + added seats).',
    probability: 30,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'healthy',
    stateOfDeal:
      'Early-stage discovery; champion identified (Head of Product) and pilot extension being scoped. Evaluating against Pied Piper as competitor — both vendors ran parallel pilots and Hooli is comparing results before committing.',
    isVisible: true,
    emailDomains: ['hooli.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc04000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000004',
      firstName: 'Gavin',
      lastName: 'Belson',
      email: 'gavin.belson@hooli.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc04000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000004',
      firstName: 'Patrice',
      lastName: 'Okonkwo',
      email: 'patrice.okonkwo@hooli.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      accountId: '00000000-0000-0000-0000-aaaa00000004',
      contactId: '00000000-0000-0000-0000-cccc04000001',
      occurredAt: new Date('2026-04-22T22:15:00Z'),
      subject: 'Recap — Hooli discovery + pilot results so far',
      bodyText:
        'Gavin, thanks for the time today. Quick recap: we walked the stakeholder mapping (you as champion, Patrice covering platform-eng, and the CFO as the eventual approver), reviewed pilot results from the first three weeks, and you flagged Pied Piper as the competitor running in parallel. Next step on our side is to draft a pilot extension scope — added seats, two more workflows, and a clear ROI case the CFO can sign off on. I will send a one-pager by Friday.',
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['gavin.belson@hooli.example'],
      ccAddresses: ['patrice.okonkwo@hooli.example'],
      direction: 'outbound',
      threadId: 'thread-hooli-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      accountId: '00000000-0000-0000-0000-aaaa00000004',
      contactId: '00000000-0000-0000-0000-cccc04000001',
      occurredAt: new Date('2026-04-28T13:42:00Z'),
      subject: 'Re: pilot extension terms?',
      bodyText:
        'Quick one — what would a pilot extension look like commercially? We are getting strong signal internally and I want to bring something concrete to the exec review next week. Specifically: can we extend another 6 weeks, add ~15 seats, and keep pricing flat until we make the platform call? Pied Piper is pushing for a decision but I would rather extend than rush. Also need help framing the ROI case for the CFO — anything you have from comparable saas customers would help.',
      fromAddress: 'gavin.belson@hooli.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-hooli-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee04000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-22T20:00:00Z'),
      title: 'Hooli — Discovery call',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Appreciate the time today. I want to use this for stakeholder mapping and to get a real read on the pilot results so far — who is in the room on your side for the platform decision, and how are people reacting?',
        },
        {
          speaker: 'buyer',
          text: 'Sure. I am the champion on this — Head of Product. Patrice runs platform-eng and is on the call. The CFO will be the final approver on a 12-month commit, and there is a small steering group with two PM leads who care about the workflow side. We run Gong for call intelligence today and the sales team is married to it, so whatever platform we choose needs to integrate cleanly with Gong.',
        },
        {
          speaker: 'seller',
          text: 'Got it. And on the pilot — three weeks in, what is landing and what is not?',
        },
        {
          speaker: 'buyer',
          text: 'Honestly the pilot results are strong. The product team adopted faster than I expected. The friction is that we are also running a parallel pilot with Pied Piper as the competitor, and the eng team likes some of their lower-level APIs. So it is not a slam dunk yet.',
        },
        {
          speaker: 'seller',
          text: 'That is fair. What would make this a slam dunk for the CFO? I am hearing you need a tighter ROI case, and probably a pilot extension to gather a couple more weeks of signal before the commit.',
        },
        {
          speaker: 'buyer',
          text: 'Exactly that. A pilot extension — maybe six more weeks, add seats — and a ROI case I can put in front of the CFO that shows hard hours saved, not vibes. Pied Piper is pushing hard for a decision in May; I would rather extend and choose right than rush and choose wrong.',
        },
        {
          speaker: 'seller',
          text: 'Makes sense. I will scope a pilot extension proposal this week — seats, workflows, success criteria — and pair it with an ROI model using comparable saas customers in your employee band. Patrice, anything specific from the platform-eng side I should include?',
        },
        {
          speaker: 'buyer',
          text: 'Yes — please cover the API surface comparison vs Pied Piper directly, and how the pilot extension would let us test two more integrations. If we can answer that, I think the champion-CFO-eng triangle lines up.',
        },
      ]),
      summary:
        'Discovery call with Hooli. Mapped stakeholders (Head of Product as champion, platform-eng lead, CFO as approver), reviewed pilot results, and confirmed Pied Piper as the parallel competitor. Agreed next step is a scoped pilot extension proposal plus an ROI case for the CFO.',
      enhancedNotes:
        'Champion is clearly Gavin (Head of Product). Pied Piper is the only named competitor. Decision blocked on ROI case + pilot extension scope.',
      externalId: 'gong-call-40401',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-02T16:00:00Z'),
      title: 'Hooli — Initial intake call',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks for hopping on — this is meant to be a 30-minute fit check before we sink real time into a discovery. Tell me what is pulling Hooli toward looking at a new platform now.',
        },
        {
          speaker: 'buyer',
          text: 'Sure. Our internal tooling has been bolted-on for three years and product velocity is suffering. We are looking at two vendors — you, and Pied Piper. I am told to run both through a short pilot and bring back a recommendation.',
        },
        {
          speaker: 'seller',
          text: 'Got it. Who is the decision-maker, and what does success look like for the evaluation?',
        },
        {
          speaker: 'buyer',
          text: 'I would be the champion internally — I am the Head of Product. CFO signs the check; my platform-eng counterpart Patrice will weigh in heavily on the technical side. Success is: clear pilot results, side by side, with enough signal to back a 12-month decision.',
        },
        {
          speaker: 'seller',
          text: 'That is a clean setup. Before I propose a pilot, I want a proper discovery so we scope the right workflows. Can we get 45 minutes with you and Patrice in the next two weeks?',
        },
        {
          speaker: 'buyer',
          text: 'Yes, my assistant will send times. Also — be ready to talk ROI case. The CFO is sharp and will not approve on feature parity alone.',
        },
      ]),
      summary:
        'Pre-discovery intake call. Confirmed Hooli is actively evaluating Findtempo vs Pied Piper, that Gavin will be champion, and that the CFO will require an ROI case to approve.',
      enhancedNotes:
        'Earliest touchpoint in the cycle. Established the two-vendor bake-off (us vs Pied Piper) and surfaced the CFO as the eventual ROI gate.',
      externalId: 'zoom-call-40201',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-09T17:30:00Z'),
      title: 'Hooli — Demo #1 (product walkthrough)',
      source: 'google_meet',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Today is a full-platform walkthrough — I will move fast across the surface area, then we will pick two areas to deep-dive in Demo #2. Stop me anywhere.',
        },
        {
          speaker: 'buyer',
          text: 'Sounds good. I want to see the workflow builder and the analytics layer especially — those are the two pieces Pied Piper has been pitching hard.',
        },
        {
          speaker: 'seller',
          text: 'Perfect. Starting with the workflow builder — here is how a product manager would compose a multi-step approval flow without engineering involvement.',
        },
        {
          speaker: 'buyer',
          text: 'That is cleaner than what we saw from Pied Piper. Patrice — does this hold up for you on the API side?',
        },
        {
          speaker: 'buyer',
          text: 'It looks fine at this level. I want to see how this serializes under load and what the webhook story is. That is Demo #2 for me.',
        },
        {
          speaker: 'seller',
          text: 'Noted — I will queue a technical deep-dive for Patrice. For Gavin, anything else from this pass that you want to walk back to your champion conversation with the CFO?',
        },
        {
          speaker: 'buyer',
          text: 'The reporting view. If I can show the CFO that view alongside pilot results, that is half the ROI case already.',
        },
      ]),
      summary:
        'First product demo. Covered the full surface area with focus on workflow builder and analytics. Patrice flagged needing a technical deep-dive (Demo #2). Gavin called out the reporting view as a key element of the ROI case.',
      enhancedNotes:
        'Demo went well; Gavin made a direct comparison to Pied Piper and favored our workflow builder. Tee-up for Demo #2 as a technical deep-dive.',
      externalId: 'gmeet-call-40901',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-16T18:00:00Z'),
      title: 'Hooli — Demo #2 (workflow + API deep-dive)',
      source: 'google_meet',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Demo #2 — narrower scope. We are going deep on the workflow execution engine and the public API, which is what Patrice asked for last time.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate it. Show me the webhook retry semantics and the rate-limit behavior under burst. Those are the two things Pied Piper handled poorly in their demo.',
        },
        {
          speaker: 'seller',
          text: 'Sure — here is the retry ladder with exponential backoff, configurable per endpoint. And here is the burst dashboard from a similar saas customer with comparable traffic.',
        },
        {
          speaker: 'buyer',
          text: 'That is materially better than what we have today. Honestly, on the technical merits, this is ahead of Pied Piper. My concern is migration cost — that goes straight into the ROI case.',
        },
        {
          speaker: 'buyer',
          text: 'Agreed on migration. We need to fold that into the pilot extension if we go that route — let us use the extension to actually test a migration of one production workflow.',
        },
        {
          speaker: 'seller',
          text: 'Great idea. I will include that as a pilot extension success criterion. Anything else from the technical side I should bring back?',
        },
        {
          speaker: 'buyer',
          text: 'Documentation depth, and SSO behavior with our IdP. Cover those and Patrice is bought in.',
        },
      ]),
      summary:
        'Technical deep-dive demo focused on workflow execution and API behavior. Patrice positioned Findtempo as ahead of Pied Piper technically; migration cost flagged as the key ROI case input. Agreed to include a production workflow migration as a pilot extension success criterion.',
      enhancedNotes:
        'Technical win against Pied Piper. Eng champion (Patrice) is leaning our way; migration cost is the remaining risk to address in the ROI case.',
      externalId: 'gmeet-call-41601',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-23T15:00:00Z'),
      title: 'Internal — Hooli discovery debrief with manager',
      source: 'granola',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Quick debrief on the Hooli discovery yesterday. Champion is clearly Gavin — Head of Product. Patrice on platform-eng is leaning our way after Demo #2. CFO is the gate. Pied Piper is the competitor, running a parallel pilot.',
        },
        {
          speaker: 'buyer',
          text: 'Good. Where are pilot results landing right now?',
        },
        {
          speaker: 'seller',
          text: 'Pilot results are strong on adoption and on workflow throughput. Gavin used the word "slam dunk would require" — meaning we are not there yet but the gap is closable. Two things hold him back: ROI case for the CFO and a sharper view of migration cost.',
        },
        {
          speaker: 'buyer',
          text: 'And the recommendation?',
        },
        {
          speaker: 'seller',
          text: 'I want to push a pilot extension — six weeks, add fifteen seats, flat pricing — and use it to test one production workflow migration. That gives us a real ROI case input and starves Pied Piper of decision oxygen. Stakeholder mapping is clean: champion, eng validator, CFO approver. No surprise stakeholders.',
        },
        {
          speaker: 'buyer',
          text: 'I like it. Make sure the pilot extension proposal has crisp success criteria — I do not want this to drift another quarter.',
        },
        {
          speaker: 'seller',
          text: 'On it. Sending the one-pager to Gavin by Friday.',
        },
      ]),
      summary:
        'Internal debrief with sales manager after Hooli discovery. Aligned on pushing a six-week pilot extension with crisp success criteria including a production workflow migration to feed the ROI case. Stakeholder mapping confirmed: champion (Gavin), eng validator (Patrice), CFO approver.',
      enhancedNotes:
        'Internal-only call. Strategy: extend pilot, lock success criteria, starve Pied Piper of decision oxygen.',
      externalId: 'granola-call-42301',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-04-29T17:00:00Z'),
      title: 'Hooli — Champion 1:1 with Head of Product',
      source: 'gong',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Wanted a quieter 1:1 — you are the champion on this and I want to be useful to you, not just sell to you. Where are you with the internal narrative right now?',
        },
        {
          speaker: 'buyer',
          text: 'Honestly? Leaning toward Findtempo. Pilot results are clearly better than Pied Piper on workflow side. But I cannot walk into the exec review without an ROI case that survives the CFO.',
        },
        {
          speaker: 'seller',
          text: 'Understood. What is the CFO actually going to ask?',
        },
        {
          speaker: 'buyer',
          text: 'Three things. One: hours saved, defensible. Two: migration cost — one-time and ongoing. Three: what happens if we pick Pied Piper instead — opportunity cost. If I cannot answer all three I lose the room.',
        },
        {
          speaker: 'seller',
          text: 'Got it. The pilot extension is the vehicle for one and two — we will instrument hours saved and run a real migration during the extension. For three, I can build a counterfactual using two reference customers who chose us over Pied Piper. Would that survive your CFO?',
        },
        {
          speaker: 'buyer',
          text: 'Yes. Get me the reference customer intros and I will set up the exec review for late May. Also — Pied Piper has started reaching out directly to my CFO. Just so you know.',
        },
        {
          speaker: 'seller',
          text: 'Noted, thank you. I will move on references this week.',
        },
      ]),
      summary:
        'Champion 1:1 with Gavin. He is leaning Findtempo on pilot results but needs an ROI case that survives the CFO across hours saved, migration cost, and counterfactual vs Pied Piper. Action: line up reference customers + instrument pilot extension to deliver the ROI inputs. Pied Piper has started lobbying the CFO directly.',
      enhancedNotes:
        'Strong champion signal. Competitive risk: Pied Piper now selling around our champion to the CFO. Reference customers are the next unlock.',
      externalId: 'gong-call-42901',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-05-04T18:30:00Z'),
      title: 'Hooli — Engineering deep-dive with platform-eng',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
        'se@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Patrice, this hour is yours. I brought our solutions engineer. Drive us wherever you want — assume Gavin is the champion on the business side and you are the eng validator.',
        },
        {
          speaker: 'buyer',
          text: 'Good framing. I want to cover three things: webhook reliability at our volume, SSO + SCIM with our IdP, and the migration path off our current platform. Pied Piper handwaved on the third one and it cost them with me.',
        },
        {
          speaker: 'seller',
          text: 'On webhooks — here is a customer running 2x your peak volume. P99 retry success is 99.7%. On SSO + SCIM, we are certified with your IdP and have a reference deployment we can introduce you to.',
        },
        {
          speaker: 'buyer',
          text: 'That is concrete. Now migration — what does a one-workflow migration look like in the pilot extension?',
        },
        {
          speaker: 'seller',
          text: 'We pick one production workflow, run it in shadow mode for two weeks, then cut over. Our migration engineer pairs with one of yours. That gives you a hard data point for the ROI case on migration cost.',
        },
        {
          speaker: 'buyer',
          text: 'That is the right shape. Add it to the pilot extension scope. Honestly the technical evaluation is heading your way — Pied Piper does not have a credible answer here.',
        },
        {
          speaker: 'seller',
          text: 'Appreciate that. We will get the pilot extension scope finalized this week with Gavin.',
        },
      ]),
      summary:
        'Hour-long technical deep-dive with Patrice. Covered webhook reliability, SSO/SCIM, and migration. Agreed to include a shadow-mode one-workflow migration as part of the pilot extension to feed the ROI case. Eng validator leaning Findtempo over Pied Piper.',
      enhancedNotes:
        'Strong technical signal from Patrice. Pied Piper rated weak on migration story.',
      externalId: 'zoom-call-50401',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-05-08T16:00:00Z'),
      title: 'Hooli — Pilot extension scoping',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Goal today: lock the pilot extension scope. I have a draft — six weeks, fifteen added seats, three success criteria. Let us pressure-test it.',
        },
        {
          speaker: 'buyer',
          text: 'Walk me through the success criteria. These are what the CFO will read first.',
        },
        {
          speaker: 'seller',
          text: 'One: measured hours saved across product team workflows, target 20% lift over baseline. Two: one production workflow fully migrated, with cutover time and error rate documented. Three: a documented ROI case using the above two inputs plus reference customer benchmarks.',
        },
        {
          speaker: 'buyer',
          text: 'Add a fourth — adoption rate among the added fifteen seats. If new users do not adopt, the platform decision is wrong regardless of pilot results.',
        },
        {
          speaker: 'buyer',
          text: 'And from eng — add SSO + SCIM enabled in production as a gating item. I do not want to extend if we are not running on real auth.',
        },
        {
          speaker: 'seller',
          text: 'Both reasonable. Updated scope: four user-facing success criteria, one eng gating item, six weeks, fifteen seats, flat pricing. I will send the one-pager today.',
        },
        {
          speaker: 'buyer',
          text: 'Good. Once that is signed I will tell Pied Piper they are out of the running for the May decision and we will revisit in Q3 only if pilot results disappoint.',
        },
      ]),
      summary:
        'Locked pilot extension scope: six weeks, fifteen added seats, flat pricing. Four user-facing success criteria (hours saved, workflow migration, adoption, ROI case) plus one eng gating item (SSO/SCIM in production). Gavin will tell Pied Piper they are paused pending May decision once scope is signed.',
      enhancedNotes:
        'Pilot extension scope is now signable. Champion explicitly framed Pied Piper as paused once we counter-sign.',
      externalId: 'zoom-call-50801',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-05-13T17:00:00Z'),
      title: 'Hooli — Competitive bake-off review vs Pied Piper',
      source: 'gong',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'patrice.okonkwo@hooli.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Asked for this call because I heard you ran an internal bake-off review last week. I want to hear it straight — where are we strong against Pied Piper, where are we weak.',
        },
        {
          speaker: 'buyer',
          text: 'Fair ask. Strengths: workflow builder is a clear win, pilot results on adoption beat Pied Piper by a wide margin, migration story is materially better. Weaknesses: their analytics layer is more mature, and their pricing came in 12% lower on a 12-month commit.',
        },
        {
          speaker: 'seller',
          text: 'Helpful. On analytics — what is the specific gap, so I can bring product receipts back?',
        },
        {
          speaker: 'buyer',
          text: 'Cohort retention views and custom dashboarding. Pied Piper has both out of the box; you have one, not the other.',
        },
        {
          speaker: 'seller',
          text: 'Custom dashboarding ships in our June release — I can show you the beta this week. On pricing, what is the right shape? I would rather solve it with structure than discount.',
        },
        {
          speaker: 'buyer',
          text: 'A multi-year commit with a step-up on seats would be palatable to the CFO. The ROI case has to lead though — pricing is the closer, not the opener.',
        },
        {
          speaker: 'seller',
          text: 'Agreed. ROI case first, then commercial structure. I will get the dashboarding beta on your screen this week and draft a multi-year option ahead of the exec review.',
        },
      ]),
      summary:
        'Competitive bake-off review vs Pied Piper. Strengths: workflow builder, pilot results adoption, migration. Weaknesses: analytics (custom dashboarding gap closes in June) and 12% pricing delta. Plan: show dashboarding beta, draft multi-year commercial structure, lead with ROI case.',
      enhancedNotes:
        'Direct competitive read-out. Pied Piper edges on analytics maturity and price; we win on workflow, adoption, and migration. Pricing solved with structure, not discount.',
      externalId: 'gong-call-51301',
    },
    {
      id: '00000000-0000-0000-0000-eeee04000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000004',
      occurredAt: new Date('2026-05-18T19:00:00Z'),
      title: 'Hooli — Reference customer call (similar saas)',
      source: 'google_meet',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gavin.belson@hooli.example',
        'reference@customer.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks both. Quick intro — our reference customer is a 700-person saas that ran a parallel pilot of Findtempo and Pied Piper last year and chose us. Gavin is in the same evaluation now. I will mostly stay quiet.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate the time. Honest question: what did the pilot results actually show you that the demos did not?',
        },
        {
          speaker: 'buyer',
          text: 'Two things. The workflow adoption curve was steeper on Findtempo — our PMs were self-serving in week two, on Pied Piper they were still asking eng. And migration was real — we moved twelve workflows in eight weeks. Pied Piper underestimated migration in their pitch.',
        },
        {
          speaker: 'buyer',
          text: 'That matches what we are seeing. How did you frame the ROI case for your CFO?',
        },
        {
          speaker: 'buyer',
          text: 'Three lines. Hours saved on PM and eng. Cost avoidance from sunsetting two internal tools. And a risk-adjusted comparison vs Pied Piper that priced in the migration delta. CFO signed on the second draft.',
        },
        {
          speaker: 'buyer',
          text: 'That is exactly the structure I need. Any regrets a year in?',
        },
        {
          speaker: 'buyer',
          text: 'None on the platform choice. One regret on the pilot extension — we should have extended six weeks like you are, not three. You are doing it the right way.',
        },
        {
          speaker: 'seller',
          text: 'Thank you both. Gavin — happy to draft the ROI case using that three-line structure for your exec review.',
        },
      ]),
      summary:
        'Reference call between Gavin and a similar 700-person saas customer who chose Findtempo over Pied Piper. Reference validated stronger adoption curve, materially better migration, and shared the three-line ROI case structure (hours saved, cost avoidance, risk-adjusted vs Pied Piper) that won their CFO.',
      enhancedNotes:
        'Strong reference. Concrete ROI case template for Gavin to bring to his exec review. Reference also validated the six-week pilot extension length.',
      externalId: 'gmeet-call-51801',
    },
  ],
};
