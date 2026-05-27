import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 03 — Initech Systems — multi-location rollout in negotiation, at risk on pricing
//
// Themes: pricing pushback (15%), legal redlines / SOW / MSA, data residency, procurement involvement
// Stage: negotiation  |  Amount: $180K  |  Status: at_risk

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000003',
    userId: USER_ID,
    name: 'Initech Systems',
    website: 'initech.example',
    externalId: 'sf-acct-003',
    providerMetadata: { industry: 'retail', employee_count: 1200 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000003',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000003',
    name: 'Initech — Multi-location Rollout',
    description:
      'Rollout across 48 retail locations; procurement-led negotiation with legal redlines on the MSA and a 15% pricing pushback tied to their quarter-close.',
    stage: 'negotiation',
    amount: 18000000, // $180K in cents
    closeDate: new Date('2026-07-31T00:00:00Z'),
    nextStep:
      'Go back internally on the 15% pricing ask, rep, by end of next week.',
    probability: 55,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'at_risk',
    stateOfDeal:
      'Procurement involvement is heavy — they are pushing a 15% pricing reduction tied to a quarter-close deadline. Liability cap was resolved via mutual indemnification, but SOW redlines and a data residency question still need to land before signature.',
    isVisible: true,
    emailDomains: ['initech.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc03000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000003',
      firstName: 'Marguerite',
      lastName: 'Okafor',
      email: 'marguerite.okafor@initech.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc03000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000003',
      firstName: 'Dimitri',
      lastName: 'Vlachos',
      email: 'dimitri.vlachos@initech.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      accountId: '00000000-0000-0000-0000-aaaa00000003',
      contactId: '00000000-0000-0000-0000-cccc03000001',
      occurredAt: new Date('2026-05-11T16:20:00Z'),
      subject: 'Pricing alignment ahead of quarter-close',
      bodyText:
        'Following up after our procurement review — we still need to land at a 15% reduction off the $180K number to get this approved this quarter. I know that is a real pricing pushback but our category benchmarks for the retail vertical are firm, and procurement involvement is non-negotiable on a deal this size. Can you come back by end of next week with what is possible? If we slip past July 31 the budget rolls and we restart from scratch in Q4.',
      fromAddress: 'marguerite.okafor@initech.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-initech-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      accountId: '00000000-0000-0000-0000-aaaa00000003',
      contactId: '00000000-0000-0000-0000-cccc03000002',
      occurredAt: new Date('2026-05-14T13:05:00Z'),
      subject: 'SOW redlines + MSA data residency clause',
      bodyText:
        'Sending over our legal redlines on the SOW and a marked-up section of the MSA. Two things I want to flag: we are comfortable with the mutual indemnification language you proposed for the liability cap — that one is resolved. The remaining open item is data residency; our retail customer records cannot leave the EU, so we need an explicit clause naming Frankfurt as the primary region with no failover outside the EEA. Please loop your counsel and let me know if any of the redlines are non-starters.',
      fromAddress: 'dimitri.vlachos@initech.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-initech-002',
      hasAttachments: true,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee03000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-05-05T18:00:00Z'),
      title: 'Initech — Legal alignment',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'dimitri.vlachos@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks for making the time — I know we have a lot to get through. I want to use this hour for the three open items: the liability cap, data residency, and the pricing reduction procurement raised last week.',
        },
        {
          speaker: 'buyer',
          text: 'That works. On the liability cap — I think we can land on mutual indemnification. If your counsel agrees to symmetric language we can close that one out today and move on.',
        },
        {
          speaker: 'seller',
          text: 'Great, mutual indemnification is fine on our side. I will get that into the SOW redlines tonight so it is reflected in the next turn of the MSA.',
        },
        {
          speaker: 'buyer',
          text: 'On data residency — and Dimitri can speak to this — our retail customer data has to stay in the EU. We need Frankfurt named as primary in the contract, no US failover. That is a hard line from our DPO.',
        },
        {
          speaker: 'buyer',
          text: 'To add to that, on pricing — procurement involvement is mandatory on anything over $150K here. They came back asking for a 15% reduction off the $180K. I know it is real pricing pushback but the quarter-close deadline is July 31 and they will not approve at list.',
        },
        {
          speaker: 'seller',
          text: 'Understood. The data residency clause we can do — Frankfurt-primary, EEA-only, I will get explicit language in the MSA. On the 15% I need to go back internally; that is below the floor I can sign off on alone.',
        },
        {
          speaker: 'buyer',
          text: 'Fair. If you can come back by end of next week with a number we have a real shot at hitting July 31. Anything past that and the budget rolls and we are restarting the procurement cycle in October.',
        },
        {
          speaker: 'seller',
          text: 'Got it. End of next week on pricing, redlined MSA with the residency clause and the mutual indemnification language back to Dimitri in parallel. I will send a recap with the three items and owners right after this.',
        },
      ]),
      summary:
        'Liability cap resolved via mutual indemnification. Open: data residency (Frankfurt-primary, EEA-only clause needed in the MSA) and 15% pricing pushback from procurement tied to a July 31 quarter-close deadline. Rep to come back internally on pricing by end of next week.',
      enhancedNotes:
        'Procurement involvement is mandatory above $150K; quarter-close is a hard date.',
      externalId: 'gong-call-30501',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-02-20T17:00:00Z'),
      title: 'Initech — Discovery call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks for the time, Marguerite. Before we get into capabilities I want to understand what is driving the evaluation and how decisions get made at Initech for a project at this scale.',
        },
        {
          speaker: 'buyer',
          text: 'Sure. We run 48 retail locations and our current point solution is end-of-life next year. We have a hard requirement to replace it before holiday peak. I lead procurement so I will be quarterbacking the vendor selection, but IT and Legal will both be involved.',
        },
        {
          speaker: 'seller',
          text: 'Got it. Roughly when does the buying process need to land, and is there a budget cycle we should be conscious of?',
        },
        {
          speaker: 'buyer',
          text: 'Our fiscal Q2 closes July 31. Anything that needs cap-ex sign-off has to be inked by then or it rolls into the next budget cycle. So realistically we want a contract by mid-July.',
        },
        {
          speaker: 'seller',
          text: 'Understood. And on requirements — anything that you already know is a must-have versus nice-to-have?',
        },
        {
          speaker: 'buyer',
          text: 'Multi-location reporting and a clean rollout sequence are the table stakes. We looked at Looker for the analytics layer but it does not give us the operational reporting at the location level we need — Looker is great for BI but not for this kind of ops use case. We do not have specific commercial terms yet — that will come from procurement once we are further along. I will say our category benchmarks are tight, so price will matter when we get there.',
        },
        {
          speaker: 'seller',
          text: 'Helpful flag. Let me set up a demo focused on the multi-location reporting story and we can pull in your IT counterpart for that round.',
        },
      ]),
      summary:
        'Initial intake with Marguerite (Procurement Director). 48 retail locations, replacing end-of-life system before holiday peak. Hard fiscal Q2 close on July 31. IT and Legal will be involved later. No pricing pushback yet but signaled tight category benchmarks.',
      enhancedNotes:
        'Procurement-led process. July 31 is the budget-cycle deadline.',
      externalId: 'zoom-call-31001',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-03-05T16:30:00Z'),
      title: 'Initech — Product demo',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Today I want to walk through the multi-location rollout flow end-to-end, then spend the last fifteen minutes on the reporting layer that you flagged in discovery.',
        },
        {
          speaker: 'buyer',
          text: 'Sounds good. I have one of our regional ops leads listening in but she will not speak — she is just here to validate the workflow against how the stores actually run.',
        },
        {
          speaker: 'seller',
          text: 'Perfect. Here is the location templating screen — you define a canonical configuration once and then push it to a cohort of stores. We typically see retailers do this in waves of ten to fifteen.',
        },
        {
          speaker: 'buyer',
          text: 'That matches how we would think about it. We would do a pilot wave of five flagship stores, then waves of fifteen. Can the rollout be paused if a wave has issues?',
        },
        {
          speaker: 'seller',
          text: 'Yes — pause is a one-click action and the next wave will not auto-promote until you release it. Let me show the reporting view now.',
        },
        {
          speaker: 'buyer',
          text: 'This is good. The reporting is what I needed to see. Next step on my side is to bring in IT for a deeper review and start the procurement intake so we are not blocked on paperwork later.',
        },
        {
          speaker: 'seller',
          text: 'Great — I will send over the vendor questionnaire and we can target IT for the following week.',
        },
      ]),
      summary:
        'Demo of multi-location rollout flow and reporting layer. Marguerite confirmed it matches their wave-based pilot plan. Next: vendor questionnaire for procurement and IT review session.',
      enhancedNotes:
        'Regional ops lead silently validated workflow. No objections raised on functionality.',
      externalId: 'zoom-call-31102',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-03-18T17:00:00Z'),
      title: 'Initech — Pricing discussion (initial)',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'I sent over the indicative pricing on Monday — wanted to use this call to walk through it and get your initial reaction before we get into a formal proposal.',
        },
        {
          speaker: 'buyer',
          text: 'I saw it. I will be direct — the $180K number is going to land hard with procurement. I am already hearing pricing pushback from our category team before they have even seen it formally.',
        },
        {
          speaker: 'seller',
          text: 'Help me understand what is driving the pushback — is it the absolute number, the per-location math, or how it benchmarks against your other vendors in the category?',
        },
        {
          speaker: 'buyer',
          text: 'It is the benchmark. Our retail vertical benchmarks for tools in this category sit roughly 15% below where you are landing. Procurement will not approve at list — that is a non-starter once they get involved formally.',
        },
        {
          speaker: 'seller',
          text: 'Okay. I would rather get ahead of that than have it blow up in formal procurement. Can you walk me through what would unlock the deal commercially — is it a discount on the headline number, payment terms, ramp, something else?',
        },
        {
          speaker: 'buyer',
          text: 'Honestly it is the headline number. Multi-year terms and pre-pay are interesting but they will not substitute for getting the per-year price into our benchmark range. I would prep your side for a real conversation on the 15%.',
        },
        {
          speaker: 'seller',
          text: 'Understood. Let me take this back internally and come prepared with options when we have the next pricing round.',
        },
      ]),
      summary:
        'First pricing discussion. Marguerite surfaced pricing pushback tied to category benchmarks ~15% below list. Multi-year and pre-pay flagged as not substitutes for headline-number relief. Procurement involvement formally upcoming.',
      enhancedNotes:
        'Pricing pushback now an explicit risk; tied to retail-vertical benchmarks.',
      externalId: 'zoom-call-31203',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-03-25T15:00:00Z'),
      title: 'Initech — Procurement intake / vendor questionnaire walkthrough',
      source: 'google_meet',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: 'I have our procurement analyst joining for the first twenty minutes — she will run the questionnaire formally and I will stay on for the back half to talk timing.',
        },
        {
          speaker: 'seller',
          text: 'Perfect. I have the questionnaire pulled up — happy to walk through section by section.',
        },
        {
          speaker: 'buyer',
          text: 'Just to set context for you: procurement involvement at Initech is mandatory above $150K. The questionnaire output drives whether we can move to legal or whether we have to recycle. So please be precise on the security and data-handling answers.',
        },
        {
          speaker: 'seller',
          text: 'Understood. On hosting and data: our platform is multi-region. For EU customers we default to Frankfurt. We can document that explicitly in the MSA if you need it.',
        },
        {
          speaker: 'buyer',
          text: 'That is the right answer but Legal will want it written into the contract, not just an answer in a questionnaire. Make a note — data residency will be a redline item when we get to that stage.',
        },
        {
          speaker: 'seller',
          text: 'Noted. I will flag it for our counsel now so we are not surprised. On the pricing question in section 4 — should I put the indicative number or wait for the formal proposal?',
        },
        {
          speaker: 'buyer',
          text: 'Put indicative. Procurement will use it to start the internal benchmarking and that is where you should expect the 15% pricing pushback to surface formally next week.',
        },
        {
          speaker: 'seller',
          text: 'Understood. I will get the completed questionnaire back by Friday.',
        },
      ]),
      summary:
        'Formal procurement intake. Procurement involvement mandatory above $150K. Data residency flagged as a future contractual redline (not just questionnaire answer). Pricing pushback expected to surface formally next week once procurement runs internal benchmarks.',
      enhancedNotes:
        'Marguerite is openly coaching the rep on what will happen procedurally.',
      externalId: 'gmeet-call-31504',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-04-02T16:00:00Z'),
      title: 'Initech — Multi-location IT review',
      source: 'zoom',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: 'Our head of retail IT is joining today. He will not be a contract signatory but his sign-off is required before procurement will green-light the technical fit section of the vendor file.',
        },
        {
          speaker: 'seller',
          text: 'Great. I have the rollout architecture deck up. I will start with how we segment stores into waves and then move to the data-flow diagram.',
        },
        {
          speaker: 'buyer',
          text: 'Hold on the data-flow diagram. Our customer records — names, loyalty data, transaction history — cannot leave the EU. Our DPO has been explicit about that. Where do those records physically sit in your architecture?',
        },
        {
          speaker: 'seller',
          text: 'For an EU-domiciled tenant they sit in our Frankfurt region. Backups also remain in-region. No US failover for primary customer records.',
        },
        {
          speaker: 'buyer',
          text: 'That answer is fine technically but it has to be a contractual commitment. We need an explicit data residency clause in the MSA: Frankfurt-primary, EEA-only, no replication outside the EEA, with the right to audit. Anything short of that will not pass our DPO.',
        },
        {
          speaker: 'seller',
          text: 'Understood. Marguerite, I will flag for Dimitri ahead of legal redlines that data residency is a hard-line redline item, not negotiable, and pre-draft the clause so the redlines round is faster.',
        },
        {
          speaker: 'buyer',
          text: 'That would help compress the timeline. While we are here — talk through your incident-response SLAs for the EU region specifically.',
        },
        {
          speaker: 'seller',
          text: 'Same severity tiers and response targets globally, with EU-region on-call paged from the Dublin team. I will put that in writing in the SOW so it is referenceable.',
        },
      ]),
      summary:
        'Technical fit review with head of retail IT. Data residency surfaced as a hard-line contractual requirement: Frankfurt-primary, EEA-only, no replication out of the EEA, audit rights. Will be a non-negotiable MSA redline. Incident-response SLAs to be referenced in the SOW.',
      enhancedNotes:
        'DPO mentioned as the ultimate enforcer of data residency.',
      externalId: 'zoom-call-31805',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-04-09T18:00:00Z'),
      title: 'Initech — Reference call with peer retailer',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
        'reference-customer@example.com',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks both for the time. Marguerite, this is our reference customer — they run a 60-location retail footprint across the EU and the UK and went live with us last year. I will let them introduce themselves and then I will get out of the way.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate this. I will jump straight in — how did you handle the multi-location rollout sequencing? We are planning waves of fifteen after a pilot of five.',
        },
        {
          speaker: 'buyer',
          text: 'We did almost exactly that — five-store pilot, then waves of twelve. The wave-pause feature was the difference for us; we paused twice during the second wave because of a tax-config issue and it saved us from breaking eighteen more stores.',
        },
        {
          speaker: 'buyer',
          text: 'Helpful. And on the legal side — did you go through heavy legal redlines on the MSA, particularly on data residency?',
        },
        {
          speaker: 'buyer',
          text: 'We did. Our counsel pushed for an EEA-only residency clause and the vendor came back with explicit language naming Frankfurt as primary. It took two turns of redlines but it landed. Honestly the SOW was the more painful negotiation in our case.',
        },
        {
          speaker: 'buyer',
          text: 'That mirrors where we expect to land. Last one — anything you wish you had pushed harder on commercially?',
        },
        {
          speaker: 'buyer',
          text: 'Probably the multi-year ramp. We took a flat three-year and in hindsight a ramped commitment would have matched our rollout curve better. If procurement involvement is heavy on your side they may already be considering that.',
        },
        {
          speaker: 'seller',
          text: 'Thanks for the candid view. Marguerite, anything else?',
        },
        {
          speaker: 'buyer',
          text: 'No, that was exactly what I needed. Thank you.',
        },
      ]),
      summary:
        'Reference call with peer 60-location EU/UK retailer. Validated wave-based rollout (pilot of 5, then waves of 12-15), the value of wave-pause, and the EEA-only data residency clause approach via 2 redlines turns. Reference flagged SOW as more painful than MSA and suggested ramped multi-year commitment.',
      enhancedNotes:
        'Strong reference; mirrored Initech situation closely.',
      externalId: 'zoom-call-32006',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-04-15T22:00:00Z'),
      title: 'Initech — Internal forecast review + escalation',
      source: 'zoom',
      duration: 20 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'vp-sales@findtempo.co',
        'deal-desk@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Wanted to walk you both through Initech before the forecast call tomorrow. It is at $180K, negotiation stage, July 31 close. Status is at-risk because of pricing pushback.',
        },
        {
          speaker: 'seller',
          text: 'Procurement is asking for a 15% reduction tied to their fiscal Q2 close. Their stated rationale is retail-vertical category benchmarks. The champion is the Procurement Director herself which is unusual but she has been coaching me through their process.',
        },
        {
          speaker: 'seller',
          text: 'On legal — the liability cap is resolved via mutual indemnification. Open items are a data residency clause in the MSA (Frankfurt-primary, EEA-only) and SOW redlines from their counsel. Neither feels existential.',
        },
        {
          speaker: 'seller',
          text: 'What I need from this room: approval to come back with 10% off list as a counter, with the additional 5% gated on a 3-year commitment with ramp. That gets us to their headline expectation without blowing the floor on year-one.',
        },
        {
          speaker: 'seller',
          text: 'If we cannot land at 10% I want to escalate to the VP before next week — the procurement involvement is heavy and they will not move past quarter-close without a real number.',
        },
        {
          speaker: 'seller',
          text: 'Risks: if we slip past July 31 the budget rolls and we restart in October. Confidence at the proposed structure is 55%; without the discount frame I would put it at 30%.',
        },
      ]),
      summary:
        'Internal forecast prep. Rep proposed counter: 10% off list, additional 5% gated on 3-year ramped commitment. Escalation path discussed if 10% does not land. Slip past July 31 means budget roll and restart in October. Confidence 55% at proposed structure.',
      enhancedNotes:
        'Internal-only call — forecast/escalation alignment ahead of VP review.',
      externalId: 'zoom-call-32107',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-04-20T16:00:00Z'),
      title: 'Initech — Pricing counter-proposal',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'I took the pricing pushback back internally as promised. The shape I can come back with today is 10% off list flat, or up to 15% off if we structure as a three-year ramped commitment.',
        },
        {
          speaker: 'buyer',
          text: 'Okay — that is the right direction. Walk me through the ramp shape. We do not want to be carrying a year-three number we cannot defend internally when the time comes.',
        },
        {
          speaker: 'seller',
          text: 'Year one would land at $153K, year two $162K, year three $170K. Blended you are below the benchmark you cited; year one is well below. The 15% off is calculated on the year-one number against the original list.',
        },
        {
          speaker: 'buyer',
          text: 'That works for me. I cannot speak for procurement until they see it on paper but the structure is defensible. The piece I want to flag — they may still come back asking for the 15% off year-one specifically, not blended.',
        },
        {
          speaker: 'seller',
          text: 'Understood. I would push back on that if it comes up — the ramp is what unlocks the additional 5%. Without the multi-year commitment we are at 10%.',
        },
        {
          speaker: 'buyer',
          text: 'Fair. I will message procurement that you came back constructively and the structure is the trade. The other thing — Dimitri wants to start legal redlines in parallel rather than serially, to protect our July 31. Is that okay your side?',
        },
        {
          speaker: 'seller',
          text: 'Yes — better in parallel. I will get our counsel to expect MSA redlines this week and the SOW shortly after.',
        },
      ]),
      summary:
        'Pricing counter delivered: 10% flat or up to 15% off year-one as part of a 3-year ramp (Y1 $153K, Y2 $162K, Y3 $170K). Marguerite positive on structure; flagged risk that procurement will ask for 15% off year-one un-bundled. Legal redlines to start in parallel to protect July 31.',
      enhancedNotes:
        'Champion supportive of structure; procurement still to formally accept.',
      externalId: 'gong-call-32208',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-04-27T15:00:00Z'),
      title: 'Initech — Legal redlines walkthrough (MSA)',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'dimitri.vlachos@initech.example',
        'rep@findtempo.co',
        'counsel@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Thanks for the marked-up MSA. I have our counsel on the line. I want to walk through your legal redlines section by section, agree what we accept, and flag the ones we will need to negotiate.',
        },
        {
          speaker: 'buyer',
          text: 'Good. The three I care most about, in priority order: data residency, limitation of liability, and termination for convenience. The other redlines are mostly clean-up language.',
        },
        {
          speaker: 'seller',
          text: 'On data residency — we accept your clause. Frankfurt-primary, EEA-only, no replication outside the EEA, and the audit-rights paragraph you proposed. Our counsel reviewed it last week and it is workable.',
        },
        {
          speaker: 'buyer',
          text: 'Excellent. That was the one I expected to fight on. On limitation of liability — your default is 12 months of fees. We want it lifted to 24 months for data-related incidents specifically.',
        },
        {
          speaker: 'seller',
          text: 'We can carve out 24 months for data-incident liability. General cap stays at 12 months. Our counsel will draft the carve-out language and send it back tomorrow.',
        },
        {
          speaker: 'buyer',
          text: 'Acceptable. Termination for convenience — your draft requires 180 days notice. We need 90 with a wind-down obligation, mostly so we are not stuck if the rollout stalls operationally.',
        },
        {
          speaker: 'seller',
          text: 'We can land at 120 days with wind-down. 90 is below our floor because of the rollout-services cost we carry up-front.',
        },
        {
          speaker: 'buyer',
          text: 'I can take 120 back to my team. Let me confirm by Friday. The remaining redlines are clean-up and I do not see anything that should not be in the next turn.',
        },
      ]),
      summary:
        'MSA legal redlines walkthrough. Three priority items: data residency (ACCEPTED — Frankfurt-primary EEA-only clause), limitation of liability (carve-out to 24 months for data incidents, general cap stays 12), termination for convenience (Initech asked 90 days, vendor offered 120 with wind-down — Dimitri to confirm by Friday). Remaining redlines clean-up.',
      enhancedNotes:
        'Data residency now contractually agreed in principle; LoL carve-out being drafted.',
      externalId: 'zoom-call-32509',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-05-01T13:30:00Z'),
      title: 'Initech — Champion 1:1 with Marguerite',
      source: 'zoom',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.okafor@initech.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Wanted to grab a quick informal check-in before the big alignment call next week. How are things landing on your side internally?',
        },
        {
          speaker: 'buyer',
          text: 'Honest read — the ramped pricing structure is going to land. My internal procurement team came back receptive once they saw the year-one number. There is still some grumbling about not getting 15% off year-one flat but the structure is defensible.',
        },
        {
          speaker: 'seller',
          text: 'Good to hear. Anything I should be doing differently in how I am showing up with your team?',
        },
        {
          speaker: 'buyer',
          text: 'Two things — one tactical, one strategic. Tactical: when you write the recap email after the multi-party call, copy our DPO directly on the data residency confirmation. She has been hearing about it secondhand and it would help her sign off faster.',
        },
        {
          speaker: 'buyer',
          text: 'Strategic: do not let the SOW lag. The MSA is mostly there but the SOW has more open items than people realize and it is the bottleneck for July 31. Push your counsel to send the SOW redline turn this week.',
        },
        {
          speaker: 'seller',
          text: 'Both very helpful. I will get our counsel on the SOW turn by Wednesday and I will copy your DPO on the residency recap after the next call.',
        },
        {
          speaker: 'buyer',
          text: 'Perfect. One more thing — quietly, the 15% number was always going to be aspirational. As long as you land in the structure we discussed, procurement involvement at this stage is a formality. The real risk is the SOW and the calendar, not pricing anymore.',
        },
      ]),
      summary:
        'Informal champion check-in. Marguerite signaled the pricing pushback is effectively resolved at the ramped structure (15% aspirational, not a hard line). Real remaining risks are the SOW redlines and the July 31 calendar. Tactical asks: copy DPO on data residency recap; push SOW redlines this week.',
      enhancedNotes:
        'Champion gave the rep a private read on what procurement will actually accept.',
      externalId: 'zoom-call-32610',
    },
    {
      id: '00000000-0000-0000-0000-eeee03000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000003',
      occurredAt: new Date('2026-05-14T16:00:00Z'),
      title: 'Initech — Legal redlines walkthrough (SOW + DPA)',
      source: 'gong',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'dimitri.vlachos@initech.example',
        'rep@findtempo.co',
        'counsel@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Picking up where we left off — the MSA is in a good place pending the termination-notice language. Today I want to focus the hour on the SOW and the data processing addendum.',
        },
        {
          speaker: 'buyer',
          text: 'Agreed. On the SOW, the redlines I sent over yesterday have three categories: acceptance criteria for each wave, change-order pricing, and the incident-response SLAs from the IT review session. The DPA is shorter — mostly an extension of the data residency clause from the MSA.',
        },
        {
          speaker: 'seller',
          text: 'On acceptance criteria — we accept the wave-pause language and the criteria you proposed. The one piece we cannot accept is the open-ended remediation window. We need a defined cap on remediation cycles, say two per wave, before it triggers a commercial conversation.',
        },
        {
          speaker: 'buyer',
          text: 'Two per wave is reasonable. I will write that back in. On change-order pricing — we want a not-to-exceed framework. Your draft has it as time-and-materials with no ceiling and our finance partners will not approve that.',
        },
        {
          speaker: 'seller',
          text: 'We can do not-to-exceed at the change-order level, with a 10% variance band built in. Beyond that band requires a new SOW amendment. That is the standard we use across the retail book.',
        },
        {
          speaker: 'buyer',
          text: 'Workable. Incident-response SLAs — your draft references the MSA SLA table. We want them restated in the SOW with the EU-specific paging line your team referenced in the IT review.',
        },
        {
          speaker: 'seller',
          text: 'Yes — counsel can lift that in. On the DPA, the residency clause carries over verbatim from the MSA and we add the sub-processor list. Your DPO will need to review the sub-processor list specifically.',
        },
        {
          speaker: 'buyer',
          text: 'I will route the DPA to her this week. If the sub-processors are all EEA-domiciled this is a one-week turn. If any of them are not, that becomes its own redlines round and we may not hit July 31.',
        },
        {
          speaker: 'seller',
          text: 'Sub-processors for EU tenants are all EEA-domiciled. I will get the list to you and the DPO by tomorrow so the clock starts.',
        },
        {
          speaker: 'buyer',
          text: 'Good. If we close the SOW redlines and the DPA in the next ten days, we land July 31. That is the path.',
        },
      ]),
      summary:
        'SOW + DPA legal redlines walkthrough. SOW: wave-pause acceptance criteria agreed; remediation capped at 2 cycles per wave; change-order pricing moved to not-to-exceed with 10% variance band; EU-specific incident-response SLAs to be restated in SOW. DPA: data residency clause carries from MSA; sub-processor list to be routed to DPO (all EEA-domiciled). 10-day path to July 31 if both close.',
      enhancedNotes:
        'SOW and DPA on track; DPO sub-processor review is the critical-path item.',
      externalId: 'gong-call-32811',
    },
  ],
};
