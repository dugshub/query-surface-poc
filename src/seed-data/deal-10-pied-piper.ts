import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 10 — Pied Piper — startup deal at risk on pricing + technical concerns
//
// Themes: pricing pushback / pricing tier, pilot results / pilot extension,
//         technical concerns (compression / scaling), startup budget
// Stage: negotiation  |  Amount: $75K  |  Status: at_risk

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000010',
    userId: USER_ID,
    name: 'Pied Piper',
    website: 'piedpiper.example',
    externalId: 'sf-acct-010',
    providerMetadata: { industry: 'saas', employee_count: 45 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000010',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000010',
    name: 'Pied Piper — Startup Tier',
    description:
      'Small SaaS startup (45 employees) evaluating us against their internal compression stack. CEO is pushing back on pricing given startup budget; CTO has technical concerns about how our compression scales beyond the pilot dataset.',
    stage: 'negotiation',
    amount: 7500000, // $75K
    closeDate: new Date('2026-07-10T00:00:00Z'),
    nextStep:
      'Propose pilot extension terms + schedule technical deep-dive with CTO on compression / scaling, by Monday.',
    probability: 60,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'at_risk',
    stateOfDeal:
      'Small startup deal with real pricing pushback — CEO says the current pricing tier is outside their startup budget and is asking for a pilot extension to validate technical fit. CTO has open technical concerns about compression performance and scaling that need a deeper review before they will sign.',
    isVisible: true,
    emailDomains: ['piedpiper.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc10000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000010',
      firstName: 'Richard',
      lastName: 'Hendricks',
      email: 'richard@piedpiper.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc10000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000010',
      firstName: 'Bertram',
      lastName: 'Gilfoyle',
      email: 'gilfoyle@piedpiper.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      accountId: '00000000-0000-0000-0000-aaaa00000010',
      contactId: '00000000-0000-0000-0000-cccc10000001',
      occurredAt: new Date('2026-05-04T15:20:00Z'),
      subject: 'Re: Pied Piper pricing — startup budget reality check',
      bodyText:
        "Hey — appreciate the proposal but I have to be straight with you: at $75K this is a real stretch for our startup budget. We love the pilot results so far, but I need a pricing tier that actually fits a 45-person company that hasn't closed our Series B yet. Can we talk about a startup-tier discount, or extending the pilot another 60 days so we can prove out the numbers internally? Gilfoyle also has some technical concerns he wants to dig into before we commit.",
      fromAddress: 'richard@piedpiper.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-pied-piper-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      accountId: '00000000-0000-0000-0000-aaaa00000010',
      contactId: '00000000-0000-0000-0000-cccc10000001',
      occurredAt: new Date('2026-05-07T17:45:00Z'),
      subject: 'Pied Piper — startup-tier proposal + pilot extension',
      bodyText:
        "Richard — heard you loud and clear on the pricing pushback. I'm putting together a startup-tier package that drops the annual to a number that should work for the budget you described, with the option to roll up to the standard pricing tier once you close the B round. I'm also fine extending the pilot by 60 days so we can validate the pilot results against a bigger dataset. Separately, I'd love to get Gilfoyle on a technical deep-dive next week to work through the compression and scaling questions head-on.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['richard@piedpiper.example'],
      direction: 'outbound',
      threadId: 'thread-pied-piper-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      accountId: '00000000-0000-0000-0000-aaaa00000010',
      contactId: '00000000-0000-0000-0000-cccc10000002',
      occurredAt: new Date('2026-05-12T22:08:00Z'),
      subject: 'Technical concerns before we sign anything',
      bodyText:
        "Look — pilot results were fine on the 200GB sample, but I have real technical concerns about your compression algorithms holding up at our actual production scale. Our hot path pushes ~6TB/day and your benchmarks fall off a cliff past ~1TB based on what you sent. Before Richard signs anything I want to walk through your compression internals and how you handle scaling past a single-node deployment. If the answer is 'shard it' I'm going to have a problem with that.",
      fromAddress: 'gilfoyle@piedpiper.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-pied-piper-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee10000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-04-26T16:00:00Z'),
      title: 'Pied Piper — Product demo',
      source: 'zoom',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'richard@piedpiper.example',
        'gilfoyle@piedpiper.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time. I want to walk through the pilot results from the 200GB sample, and then leave plenty of room for technical concerns — Gilfoyle, I know you've got a list.",
        },
        {
          speaker: 'buyer',
          text: "Yeah, I do. Pilot results looked good on paper but I want to talk about the compression curve. It flattens hard past a terabyte and that's exactly where we live.",
        },
        {
          speaker: 'seller',
          text: "Fair. The compression algorithm we shipped in the pilot is tuned for the sub-TB range — we've got a different codec path for the multi-TB case that wasn't enabled in your pilot environment. I can get you a benchmark from a customer running ~8TB/day.",
        },
        {
          speaker: 'buyer',
          text: "Okay, that's at least an answer. Richard's other thing is the pricing tier — we're a 45-person startup, the number you quoted is rough for our budget.",
        },
        {
          speaker: 'buyer',
          text: "Right, and just to be blunt: pricing pushback is going to come from our board too. If we can extend the pilot another month or two while we figure out budget, that buys us time on both sides.",
        },
        {
          speaker: 'seller',
          text: "I hear you on the startup budget. A pilot extension is doable — I'd rather do that than lose the deal on a number. Let me come back with a startup-tier proposal and an extension scope by end of week.",
        },
        {
          speaker: 'buyer',
          text: "Works for me. Gilfoyle — anything else on the technical concerns side before we wrap?",
        },
        {
          speaker: 'buyer',
          text: "Yeah, I want a real conversation about scaling past one node. Not a slide — an engineer-to-engineer call. Bring whoever owns the compression internals.",
        },
      ]),
      summary:
        'Demo + pilot review. Pilot results positive on the 200GB sample but CTO has technical concerns about compression performance and scaling past 1TB. CEO raised pricing pushback and asked about pilot extension to fit startup budget.',
      enhancedNotes:
        'Action items: send startup-tier pricing proposal, scope pilot extension, schedule technical deep-dive on compression internals with CTO.',
      externalId: 'gong-call-71001',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-05-06T18:30:00Z'),
      title: 'Pied Piper — Pricing discussion',
      source: 'google_meet',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['richard@piedpiper.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for jumping on. I want to talk pricing tier and pilot extension — those are the two things blocking us from getting this to a signature.",
        },
        {
          speaker: 'buyer',
          text: "Appreciated. Look, the pricing pushback is real. We're 45 people, we haven't closed the B, and $75K out of our startup budget right now is a big swing.",
        },
        {
          speaker: 'seller',
          text: "Understood. I can move you to a startup-tier structure — lower year-one number, step-up when you hit a headcount or revenue trigger. The catch is I'd want a two-year commit to make that math work for us.",
        },
        {
          speaker: 'buyer',
          text: "Two years is a lot for a startup. I'd rather extend the pilot another 60 days, validate the pilot results against our real production load, and then commit. Otherwise I'm signing on a hope.",
        },
        {
          speaker: 'seller',
          text: "Pilot extension is fine. I'd want it scoped — same environment, expanded data volume, and a checkpoint at day 30 with Gilfoyle on the technical concerns side.",
        },
        {
          speaker: 'buyer',
          text: "That's reasonable. Gilfoyle still wants the compression and scaling deep-dive before we even talk paper. If that goes sideways the pricing tier doesn't matter.",
        },
        {
          speaker: 'seller',
          text: "Agreed. I'll line up the technical deep-dive for next week, and send the startup-tier proposal and pilot extension scope by Monday so you've got both in front of you at the same time.",
        },
      ]),
      summary:
        'Pricing-focused call. CEO confirmed pricing pushback driven by startup budget and asked for a pilot extension instead of signing on current pricing tier. Rep agreed to scope a startup-tier proposal + 60-day extension, contingent on CTO technical deep-dive resolving compression / scaling concerns.',
      enhancedNotes:
        'Deal is gated on (1) startup-tier pricing proposal and (2) technical deep-dive resolving compression / scaling concerns. Pilot extension agreed in principle.',
      externalId: 'gong-call-71002',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-02-28T17:00:00Z'),
      title: 'Pied Piper — Initial intake',
      source: 'zoom',
      duration: 22 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['richard@piedpiper.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for taking the intro call. Tell me a bit about Pied Piper and what got you looking at us.",
        },
        {
          speaker: 'buyer',
          text: "Sure — we're 45 people, mostly engineers. We built our own compression stack internally and it's getting expensive to maintain. I'd rather have my team building product than maintaining a codec.",
        },
        {
          speaker: 'seller',
          text: "Got it. So you've got a real point of view on compression already — that's helpful. What's the trigger making you look now vs six months ago?",
        },
        {
          speaker: 'buyer',
          text: "Honestly, headcount math. I'm watching our startup budget and I can't justify two full-time engineers on internal infrastructure anymore. But I want to flag now — whatever the pricing tier ends up at, it has to fit a pre-Series-B startup.",
        },
        {
          speaker: 'seller',
          text: "Understood. Let me get a pilot scoped on a sample dataset so we can show you the compression performance against your real workload before we even get to a pricing conversation. Sound reasonable?",
        },
        {
          speaker: 'buyer',
          text: "That's the right order of operations. I'll loop in Gilfoyle, our CTO. He's going to have technical concerns and I'd rather surface them now than in week eight.",
        },
      ]),
      summary:
        "Initial intake with CEO. Small startup (45 people) replacing an internal compression stack. CEO flagged startup budget constraint up front and wants pilot before pricing tier conversation. CTO Gilfoyle to be looped in for technical concerns.",
      enhancedNotes:
        'Action items: scope pilot on sample dataset, get Gilfoyle on next call, defer pricing tier discussion until after pilot results.',
      externalId: 'gong-call-71003',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-03-09T16:30:00Z'),
      title: 'Pied Piper — Discovery (pre-demo)',
      source: 'zoom',
      duration: 35 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'richard@piedpiper.example',
        'gilfoyle@piedpiper.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Goal today is discovery before next week's demo. Walk me through your data shape and where the pain actually lives.",
        },
        {
          speaker: 'buyer',
          text: "Hot path is roughly 6TB a day of structured event data. Our internal compression gets us ~4.2x on it. Anything you show me has to beat that, or this is a non-starter.",
        },
        {
          speaker: 'seller',
          text: "Noted. What does the access pattern look like — is it write-heavy, or are you re-reading the compressed segments?",
        },
        {
          speaker: 'buyer',
          text: "Both. Write-heavy on ingest, then a long tail of analytical reads going back ~90 days. The scaling story is what kills us — our codec falls over past a single node and we end up sharding manually.",
        },
        {
          speaker: 'buyer',
          text: "Adding to that — I don't want to spend six months and a stretched startup budget on something that just moves the scaling problem from our codec to yours.",
        },
        {
          speaker: 'seller',
          text: "Fair. For next week I'll bring our compression numbers on a similar workload, and our architect can speak to multi-node scaling directly so we're not hand-waving.",
        },
        {
          speaker: 'buyer',
          text: "Good. Bring real numbers, not a marketing deck. I'll send over a 200GB sample for the pilot results to be meaningful.",
        },
      ]),
      summary:
        "Discovery call ahead of demo. CTO set bar at 4.2x compression and flagged scaling past single node as the real risk. CEO reiterated startup budget context. Agreed to ingest a 200GB sample for pilot results.",
      enhancedNotes:
        'Bring real benchmarks + architect for scaling discussion at demo. Receive 200GB sample from Gilfoyle this week.',
      externalId: 'gong-call-71004',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-03-18T19:00:00Z'),
      title: 'Pied Piper — Founder-to-founder',
      source: 'fathom',
      duration: 28 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'richard@piedpiper.example',
        'rep@findtempo.co',
        'ceo@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Richard, thanks for doing this off-cycle. Our CEO wanted to say hi founder-to-founder — no pitch, just context.",
        },
        {
          speaker: 'buyer',
          text: "Appreciated. I'll be honest — I'm at the stage where every vendor relationship feels load-bearing, so meeting the person at the top actually matters to me.",
        },
        {
          speaker: 'seller',
          text: "Same on our side. We started small too. The reason I wanted to talk directly is — we want Pied Piper as a logo even if the pricing tier has to bend, because the compression story you're solving is exactly the use case our roadmap is pointed at.",
        },
        {
          speaker: 'buyer',
          text: "That's good to hear. The startup budget is real, and I'd rather have a partner who flexes on year one than one who squeezes us and we churn in eighteen months.",
        },
        {
          speaker: 'seller',
          text: "Understood. We won't squeeze. What I'd ask in return is — if the pilot results land well, you become a public reference. That's the trade.",
        },
        {
          speaker: 'buyer',
          text: "Fair trade. Gilfoyle still has to bless the technical concerns side, but on the commercial side, that framing works for me.",
        },
      ]),
      summary:
        "Founder-to-founder call. Our CEO signalled willingness to flex pricing tier in exchange for Pied Piper as a public reference logo. CEO accepted framing pending CTO clearing technical concerns and strong pilot results.",
      enhancedNotes:
        'Commercial framing aligned at founder level: flexible startup-tier in exchange for reference. Still gated on CTO technical sign-off.',
      externalId: 'fathom-call-71005',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-04-02T17:30:00Z'),
      title: 'Pied Piper — First pricing conversation',
      source: 'zoom',
      duration: 26 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['richard@piedpiper.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "I want to put a rough number in front of you so we're not surprising each other later. Our standard pricing tier for your shape lands around $120K a year.",
        },
        {
          speaker: 'buyer',
          text: "Yeah — that's not happening. Just being direct. That's a third of what our infra spend is supposed to be for the year. Pricing pushback starts here.",
        },
        {
          speaker: 'seller',
          text: "Heard. What number does fit the startup budget you're working with — even directionally?",
        },
        {
          speaker: 'buyer',
          text: "Sub-$80K for year one. Ideally with a glide path so when we close the B round you can re-rate us at a real pricing tier.",
        },
        {
          speaker: 'seller',
          text: "That's workable in principle. I'd want to pair it with a longer commit or a public reference. But before I formalize anything I want to make sure the pilot results are clean and Gilfoyle's technical concerns are addressed — no point sweating pricing if the tech doesn't land.",
        },
        {
          speaker: 'buyer',
          text: "Agreed. Get the pilot strong, get Gilfoyle off our back on compression and scaling, and I'll fight internally for the number.",
        },
      ]),
      summary:
        'First explicit pricing conversation. CEO set sub-$80K target year-one within startup budget with a glide path to standard pricing tier post-Series-B. Pricing pushback formalized; rep gated commercial movement on clean pilot results and CTO sign-off.',
      enhancedNotes:
        'Target landing zone: sub-$80K Y1 with step-up trigger. Commercial flex tied to longer commit or reference.',
      externalId: 'gong-call-71006',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-04-10T16:00:00Z'),
      title: 'Pied Piper — Pilot scoping',
      source: 'google_meet',
      duration: 32 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gilfoyle@piedpiper.example',
        'richard@piedpiper.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Let's nail down what success looks like for the pilot, so when we get to pilot results everyone agrees what 'passing' means.",
        },
        {
          speaker: 'buyer',
          text: "Three things from me. One — beat 4.2x compression on the 200GB sample. Two — sustained ingest at 80MB/s without backpressure. Three — a credible scaling story past single node, not a slide.",
        },
        {
          speaker: 'seller',
          text: "Good list. I'd add a fourth — operational footprint. If this thing requires three engineers to keep alive, it doesn't fit your startup budget regardless of license cost.",
        },
        {
          speaker: 'buyer',
          text: "Agreed. Add operational simplicity as criterion four. And if any of those four fail, that's grounds for a pilot extension, not a no-decision.",
        },
        {
          speaker: 'seller',
          text: "Reasonable. Pilot extension is on the table if compression or scaling needs more data, not as a delay tactic. Let's write that down explicitly so we don't relitigate it later.",
        },
        {
          speaker: 'buyer',
          text: "Works. Richard — you good on the commercial side staying parked until we've got pilot results in hand?",
        },
        {
          speaker: 'buyer',
          text: "Yeah. Pricing tier conversation freezes until Gilfoyle signs the success criteria sheet.",
        },
      ]),
      summary:
        'Pilot scoping. Four success criteria agreed: 4.2x compression beat, 80MB/s sustained ingest, credible multi-node scaling story, operational simplicity. Pilot extension explicitly allowed if criteria need more data. Pricing tier conversation parked pending pilot results.',
      enhancedNotes:
        'Write success criteria sheet, circulate for Gilfoyle signature. Pricing discussions on hold pending pilot results.',
      externalId: 'gong-call-71007',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-04-20T22:00:00Z'),
      title: 'Pied Piper — Compression check-in with CTO',
      source: 'zoom',
      duration: 38 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gilfoyle@piedpiper.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Mid-pilot check-in. How's the compression looking against your 4.2x bar?",
        },
        {
          speaker: 'buyer',
          text: "Sub-TB it's beating us — 4.7x on the structured slice. The technical concerns start above that. Throughput drops noticeably and I haven't been able to figure out if that's the codec or the I/O path.",
        },
        {
          speaker: 'seller',
          text: "That's the multi-TB codec path I mentioned at demo. It wasn't enabled in your pilot environment — let me get our engineer to flip it on for the rest of the pilot window so the scaling numbers are honest.",
        },
        {
          speaker: 'buyer',
          text: "Fine, but I want it documented. If you ship a different codec for sub-TB vs multi-TB, that's a deployment-time decision I need visibility into. I don't want surprise behavior at our scale.",
        },
        {
          speaker: 'seller',
          text: "Totally reasonable — I'll get the architecture doc that covers codec selection over to you. Anything else surfacing on the scaling side?",
        },
        {
          speaker: 'buyer',
          text: "One thing. Your ingest backpressure semantics aren't documented anywhere I can find. At our scaling profile that's not a nice-to-have, that's a launch-blocker.",
        },
      ]),
      summary:
        'Mid-pilot technical check-in. Compression beat the 4.2x bar in the sub-TB regime (4.7x) but technical concerns emerged on multi-TB throughput. Rep to enable multi-TB codec path and supply architecture doc. CTO flagged undocumented ingest backpressure as launch-blocker.',
      enhancedNotes:
        'Enable multi-TB codec for remainder of pilot. Send codec-selection architecture doc + backpressure semantics doc to Gilfoyle.',
      externalId: 'gong-call-71008',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-05-01T17:00:00Z'),
      title: 'Pied Piper — Pilot debrief',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'richard@piedpiper.example',
        'gilfoyle@piedpiper.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Pilot debrief — let's go through the four criteria and call each one pass, fail, or needs-more-data.",
        },
        {
          speaker: 'buyer',
          text: "Compression: pass, with the asterisk that it's the multi-codec story doing the work. Ingest at 80MB/s: pass. Scaling past single node: needs more data — I don't trust the curve yet. Operational simplicity: tentative pass.",
        },
        {
          speaker: 'seller',
          text: "Two passes, one tentative pass, one needs-more-data. That's the path-to-yes shape, not the path-to-no shape.",
        },
        {
          speaker: 'buyer',
          text: "Don't celebrate. My technical concerns on scaling are still real. I want a pilot extension specifically to push the scaling test past where we ran it. Otherwise I'm signing on an extrapolation.",
        },
        {
          speaker: 'buyer',
          text: "From the commercial side — the pilot results are good enough that I'm willing to engage on pricing tier seriously, but only paired with the extension Gilfoyle is asking for.",
        },
        {
          speaker: 'seller',
          text: "That's the deal then — pilot extension to close out the scaling question, parallel-track the startup-tier pricing proposal. I'll send both this week.",
        },
        {
          speaker: 'buyer',
          text: "And document what 'pass' looks like on the extension. Same rigor as the original criteria sheet. I'm not doing this twice.",
        },
      ]),
      summary:
        'Pilot debrief against the four-criterion sheet: compression pass (multi-codec), ingest pass, scaling needs-more-data, ops tentative pass. CTO requested pilot extension specifically to validate scaling beyond pilot envelope. CEO greenlit serious pricing tier engagement paired with extension.',
      enhancedNotes:
        'Send pilot extension scope (scaling-focused, with explicit pass criteria) + startup-tier pricing proposal in parallel this week.',
      externalId: 'gong-call-71009',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-05-14T21:30:00Z'),
      title: 'Pied Piper — Compression deep-dive with architect',
      source: 'zoom',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'gilfoyle@piedpiper.example',
        'rep@findtempo.co',
        'architect@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Engineer-to-engineer call, as requested. Architect's here to go through compression internals and the scaling design end-to-end.",
        },
        {
          speaker: 'buyer',
          text: "Good. Start with codec selection. Why two codecs? What's the cutover? Is it adaptive or deployment-time?",
        },
        {
          speaker: 'seller',
          text: "Deployment-time today, adaptive on the roadmap for Q3. The sub-TB codec optimizes for CPU, the multi-TB codec optimizes for I/O parallelism. We pick at install based on declared throughput.",
        },
        {
          speaker: 'buyer',
          text: "Okay, that's an honest answer. Next — scaling. Walk me through what happens when one node saturates. Don't tell me 'horizontal scale', show me the actual coordination protocol.",
        },
        {
          speaker: 'seller',
          text: "It's a consistent-hash partitioner with a gossip-based rebalancer. Rebalance is online — no stop-the-world. Backpressure is per-partition and exposed as a metric so you can alert on it.",
        },
        {
          speaker: 'buyer',
          text: "That's better than I expected. I still want to see it on the extended pilot under real load. But preliminarily — most of my technical concerns just dropped a level.",
        },
        {
          speaker: 'seller',
          text: "Appreciate that. Anything you want us to instrument specifically during the pilot extension to give you the scaling evidence you need?",
        },
        {
          speaker: 'buyer',
          text: "Rebalance latency under sustained ingest, and tail latency on reads during a rebalance. If those numbers hold, we're done arguing about compression and scaling.",
        },
      ]),
      summary:
        "Engineer-to-engineer compression deep-dive. CTO's technical concerns substantially reduced after seeing codec selection rationale and gossip-based rebalancer for scaling. Asked for rebalance latency + read tail latency during rebalance to be instrumented in pilot extension.",
      enhancedNotes:
        'Instrument rebalance latency + read tail latency for pilot extension. Adaptive codec selection on roadmap Q3 — share roadmap doc.',
      externalId: 'gong-call-71010',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-05-20T15:00:00Z'),
      title: 'Pied Piper — Internal forecast / deal review',
      source: 'zoom',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
        'ceo@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Pied Piper status for the forecast: pilot extension agreed, compression deep-dive landed well, CTO's technical concerns mostly resolved. Pricing tier is the open question.",
        },
        {
          speaker: 'seller',
          text: "CEO's pricing pushback is real but it's not bluster — they're a 45-person pre-B startup and the startup budget framing has been consistent across every call.",
        },
        {
          speaker: 'seller',
          text: "I'm forecasting this at $75K, status at-risk. Realistic landing zone is probably $70-78K with a step-up trigger when they close the B.",
        },
        {
          speaker: 'seller',
          text: "Logo value here matters more than ACV. Pied Piper as a public reference on compression at scale is a marquee win even at a discount.",
        },
        {
          speaker: 'seller',
          text: "Risks: pilot results on scaling could still surprise us in the extension window, and there's a small chance Richard's board pushes back even harder once we put paper down.",
        },
        {
          speaker: 'seller',
          text: "Plan: ship the startup-tier proposal Monday, run the extension in parallel, target signature by end of June.",
        },
      ]),
      summary:
        'Internal forecast review on Pied Piper. Rep walked manager + CEO through state-of-deal: pilot extension agreed, technical concerns largely resolved, pricing tier the open gating item. Forecast $75K at-risk; realistic $70-78K with step-up. Logo value emphasized — exec wants this for reference.',
      enhancedNotes:
        'Ship startup-tier proposal Monday. Run pilot extension in parallel. Target close end of June. Flag any board-level pricing pushback fast.',
      externalId: 'gong-call-71011',
    },
    {
      id: '00000000-0000-0000-0000-eeee10000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000010',
      occurredAt: new Date('2026-05-25T18:00:00Z'),
      title: 'Pied Piper — Startup-tier counter-proposal',
      source: 'google_meet',
      duration: 33 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['richard@piedpiper.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Walking through the startup-tier proposal. Year-one at $72K, step-up trigger on Series B close or 100-employee headcount, whichever comes first.",
        },
        {
          speaker: 'buyer',
          text: "The number's inside what I told the board. Step-up trigger — I'd want a ceiling on the step-up so we don't get re-rated to something punitive the day after we close.",
        },
        {
          speaker: 'seller',
          text: "Fair. We can cap the year-two step-up at 1.4x. Above that requires a renegotiation, not an auto-bump.",
        },
        {
          speaker: 'buyer',
          text: "That works. Two-year commit?",
        },
        {
          speaker: 'seller',
          text: "Two-year, with a 90-day out clause if pilot extension results don't hold. That covers both of us — you're not trapped if compression or scaling regresses, we're not exposed if you sign and bounce.",
        },
        {
          speaker: 'buyer',
          text: "Reasonable. I need to take this to the board next week. Pricing pushback from them is possible, but I think this lands. Gilfoyle's already signaled he's comfortable on the technical concerns side as long as the pilot extension closes clean.",
        },
        {
          speaker: 'seller',
          text: "Good. I'll send paper reflecting this structure tomorrow so you've got something concrete for the board. Pilot extension runs in parallel — pilot results from that come back to you before signature.",
        },
      ]),
      summary:
        'Startup-tier counter-proposal walkthrough. Y1 $72K, step-up trigger on Series B or 100 headcount, 1.4x cap on Y2 step-up, two-year term with 90-day out clause tied to pilot extension results. CEO took it to board; CTO comfortable pending clean pilot extension.',
      enhancedNotes:
        'Send paper reflecting agreed structure tomorrow. CEO presenting to board next week. Pilot extension runs in parallel and gates the 90-day out clause.',
      externalId: 'gong-call-71012',
    },
  ],
};
