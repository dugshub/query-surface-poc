import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 02 — Globex Industries — Plant modernization closed-won, kickoff next
//
// Themes: pricing alignment (past), implementation timeline, integration concerns (MES + Salesforce), expansion
// Stage: won  |  Amount: $480K  |  Status: healthy

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000002',
    userId: USER_ID,
    name: 'Globex Industries',
    website: 'globex.example',
    externalId: 'sf-acct-002',
    providerMetadata: { industry: 'manufacturing', employee_count: 1500 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000002',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000002',
    name: 'Globex — Plant Modernization',
    description:
      'Closed-won plant modernization program for Globex Industries. Phase 1 covers two production plants with integration into their existing MES system; implementation kickoff is scheduled and IT has flagged Salesforce integration concerns to work through during onboarding.',
    stage: 'won',
    amount: 48000000,
    closeDate: new Date('2026-05-12T00:00:00Z'),
    nextStep:
      'Kickoff prep — confirm implementation timeline owner internally before the May 14 kickoff call',
    probability: 100,
    isClosed: true,
    isWon: true,
    stateOfDealStatus: 'healthy',
    stateOfDeal:
      'Deal closed-won on May 12 after DocuSign completion. Implementation kickoff is scheduled and integration with their existing MES system is in scope for phase 1.',
    isVisible: true,
    emailDomains: ['globex.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc02000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000002',
      firstName: 'Marlene',
      lastName: 'Okafor',
      email: 'marlene.okafor@globex.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc02000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000002',
      firstName: 'Devan',
      lastName: 'Mistry',
      email: 'devan.mistry@globex.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      accountId: '00000000-0000-0000-0000-aaaa00000002',
      contactId: '00000000-0000-0000-0000-cccc02000001',
      occurredAt: new Date('2026-05-12T17:42:00Z'),
      subject: 'Re: Globex MSA — DocuSign complete',
      bodyText:
        "Confirming DocuSign came through on our side this afternoon — countersigned copy is in the thread. Glad we landed where we did on pricing alignment; it made the final approval lap with our CFO painless. Looking forward to kickoff next week and getting the implementation timeline locked.",
      fromAddress: 'marlene.okafor@globex.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-globex-001',
      hasAttachments: true,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      accountId: '00000000-0000-0000-0000-aaaa00000002',
      contactId: '00000000-0000-0000-0000-cccc02000001',
      occurredAt: new Date('2026-05-13T13:10:00Z'),
      subject: 'Kickoff scheduling — Thursday May 14?',
      bodyText:
        "Congrats again on getting this across the line. Proposing Thursday May 14 at 10am PT for the implementation kickoff — 60 minutes on Zoom. I'll bring our solutions lead so we can walk the implementation timeline and start scoping the MES touchpoints. Let me know if Devan from your IT team can join — he flagged some integration concerns last week I'd like to put on the agenda.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['marlene.okafor@globex.example'],
      ccAddresses: ['devan.mistry@globex.example'],
      direction: 'outbound',
      threadId: 'thread-globex-002',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      accountId: '00000000-0000-0000-0000-aaaa00000002',
      contactId: '00000000-0000-0000-0000-cccc02000002',
      occurredAt: new Date('2026-05-13T20:55:00Z'),
      subject: 'Integration concerns ahead of kickoff — MES + Salesforce',
      bodyText:
        "Marlene looped me in on Thursday's kickoff. Wanted to flag the integration concerns I've got before we meet so we can use the hour well. Our MES system is a heavily-customized Wonderware install — the connector docs I read assume a vanilla setup, and I want to understand what custom mapping work falls on my team. Also: any handoff between your platform and our Salesforce instance needs to round-trip account IDs cleanly, that's been a sore spot with previous vendors.",
      fromAddress: 'devan.mistry@globex.example',
      toAddresses: ['rep@findtempo.co'],
      ccAddresses: ['marlene.okafor@globex.example'],
      direction: 'inbound',
      threadId: 'thread-globex-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee02000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-05-14T17:00:00Z'),
      title: 'Globex — Implementation kickoff',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'devan.mistry@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time so quickly after signature. Quick agenda: walk the implementation timeline at a high level, then dig into the MES integration questions Devan raised, and close on owners.",
        },
        {
          speaker: 'buyer',
          text: "Sounds good. And just to put it behind us — really glad the pricing alignment conversation is done. Our CFO was a tough room, but we got there.",
        },
        {
          speaker: 'seller',
          text: "Same here. So on implementation timeline: we're targeting first plant live in eight weeks, second plant six weeks behind that. The long pole is going to be the MES connector work, which is exactly where I want Devan's input.",
        },
        {
          speaker: 'buyer',
          text: "Right, so the integration concerns I emailed about — our Wonderware install isn't stock. We've got fifteen years of custom tag mappings. I don't want my team rebuilding all of that to fit your connector's assumptions.",
        },
        {
          speaker: 'seller',
          text: "Understood, and that's fair. We've got a customization layer in the connector specifically for this case — our solutions architect can do a one-day discovery against your live MES next week and come back with a delta. The other thing I want to flag: Salesforce integration. You mentioned account ID round-tripping has burned you before.",
        },
        {
          speaker: 'buyer',
          text: "Yes. Last vendor's sync would drop the external ID on update and we'd end up with orphaned records in Salesforce. If you can show me the field mapping during that discovery I'll sleep better.",
        },
        {
          speaker: 'buyer',
          text: "One more thing — Marlene here. Assuming phase one goes well, we're already looking at expansion to the other three plants in the back half of the year. I'd like the implementation team to have that in their heads, not as scope, but so we're not painting ourselves into a corner on naming or environment structure.",
        },
        {
          speaker: 'seller',
          text: "Great signal, and exactly the right time to raise it. I'll have our SA design the environment scheme assuming expansion to five plants total — costs us nothing now and saves a migration later. I'll send a recap with owners by EOD.",
        },
      ]),
      summary:
        "Implementation kickoff for the closed-won Globex plant modernization. Pricing alignment confirmed as settled. Team aligned on an 8-week implementation timeline for plant one; integration concerns about Globex's customized MES (Wonderware) and Salesforce account-ID round-tripping will be de-risked via a one-day discovery next week. VP Ops flagged future expansion to three additional plants — environment scheme will be designed accordingly.",
      enhancedNotes:
        'Owner action: rep to send recap by EOD; SA to scope MES discovery for week of May 18.',
      externalId: 'gong-call-20214',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-02-10T16:00:00Z'),
      title: 'Globex — Discovery call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the time, Marlene. To frame the call — I'd love to understand what's driving the plant modernization initiative, and where you're feeling the most pain today.",
        },
        {
          speaker: 'buyer',
          text: "Sure. We've got eight plants, five of them running OT stacks that haven't been touched since 2011. Downtime visibility is the headline pain — we lose a shift's worth of output a month and can't tell you why without a phone call to the floor.",
        },
        {
          speaker: 'seller',
          text: "Got it. And when you say plant modernization, is the scope a full rip-and-replace or a layer on top of what's there?",
        },
        {
          speaker: 'buyer',
          text: "Layer on top. We're not replacing the MES system — too much custom work in Wonderware. We need something that reads from it cleanly and gives operations a real-time picture. And it has to play nicely with Salesforce because our service org lives there.",
        },
        {
          speaker: 'seller',
          text: "Helpful. Two early flags I'd want to validate: how customized your MES install is, and what your Salesforce object model looks like. Both shape how big the integration concerns become.",
        },
        {
          speaker: 'buyer',
          text: "Devan in IT owns both. I'll loop him in on the next call. Timeline-wise, leadership wants something live by mid-year, so we're moving.",
        },
        {
          speaker: 'seller',
          text: "Understood. I'll send a demo invite for next week and pull Devan in for a technical thread after. Appreciate the candor on scope.",
        },
      ]),
      summary:
        "Discovery call with VP Ops Marlene Okafor. Plant modernization scope is a layer over their existing Wonderware MES (not a replacement); Salesforce round-trip is a must. Leadership wants live by mid-year. Devan Mistry (IT) will own the integration concerns thread.",
      enhancedNotes: 'Next step: demo + loop Devan in for technical deep-dive.',
      externalId: 'zoom-call-30001',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-02-19T17:00:00Z'),
      title: 'Globex — Product demo',
      source: 'gong',
      duration: 55 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'devan.mistry@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Today I'll walk the operator console first, then the integration side for Devan. I'll lean into the MES system connector and Salesforce sync, since those are the two integration concerns we surfaced last week.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. I want to see what a plant supervisor sees on shift change.",
        },
        {
          speaker: 'seller',
          text: "Here's the shift-change view — downtime reasons rolled up, top-three OEE drags, and a one-click drill into the line. All driven off the MES system tags via our connector.",
        },
        {
          speaker: 'buyer',
          text: "That's the picture we don't have today. Devan — how hard is it to map our tags into this?",
        },
        {
          speaker: 'buyer',
          text: "Depends on the connector's flexibility. Show me how custom tag names get handled — that's where every vendor demo falls apart.",
        },
        {
          speaker: 'seller',
          text: "Fair test. Here's the mapping UI — you import a tag dictionary, alias anything non-standard, and the connector reads against the aliases. No code. On the Salesforce side, here's the account sync — bi-directional, external ID preserved on update.",
        },
        {
          speaker: 'buyer',
          text: "External ID preserved on update is what I needed to see. Last vendor lost it and we cleaned up orphans for a quarter.",
        },
        {
          speaker: 'seller',
          text: "Noted. I'll send the connector spec sheet and a sandbox we can point at a staging MES if Devan wants to kick the tires before we get to pricing.",
        },
      ]),
      summary:
        "Product demo with VP Ops + Director of IT. Operator console resonated with Marlene; Devan probed the MES system connector's handling of custom tag names and Salesforce external ID round-tripping — both demoed cleanly. Sandbox offered for IT to validate before pricing alignment.",
      enhancedNotes: 'Send connector spec + sandbox access to Devan.',
      externalId: 'gong-call-30215',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-03-04T18:00:00Z'),
      title: 'Globex — Technical deep-dive (MES + Salesforce)',
      source: 'google_meet',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devan.mistry@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "I brought our solutions architect today. Goal: work through your specific integration concerns end-to-end so we de-risk before pricing.",
        },
        {
          speaker: 'buyer',
          text: "Appreciated. Let's start with the MES system. Our Wonderware install has roughly 4,000 custom tags across the two phase-one plants. I need to know what your connector does and doesn't handle.",
        },
        {
          speaker: 'seller',
          text: "Walk-through: the connector reads OPC-UA off Wonderware, applies your tag dictionary, and writes to our internal schema. For your 4,000 tags, we'd run a one-day automated import then a half-day human review for the non-standard subset.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Salesforce next — we run a custom Account object with about a dozen extra fields. Your sync needs to not blow those away on update.",
        },
        {
          speaker: 'seller',
          text: "Our sync is field-scoped. You whitelist the fields we write; everything else is read-only from our side. External ID is a required handshake field, so no orphaning.",
        },
        {
          speaker: 'buyer',
          text: "That's the answer I wanted. What's the failure mode if Salesforce is unreachable mid-sync?",
        },
        {
          speaker: 'seller',
          text: "Queued retries with exponential backoff for 24 hours, then a dead-letter that pages your admin. We can show you the runbook.",
        },
        {
          speaker: 'buyer',
          text: "Good. I'm comfortable enough to greenlight this from IT. The integration concerns are addressable. Marlene's side will own the implementation timeline question with leadership.",
        },
      ]),
      summary:
        "Technical deep-dive with Devan (IT) and our SA. Walked the MES system connector against Globex's 4,000 custom Wonderware tags and the Salesforce sync against their custom Account object. All integration concerns addressed; IT signaled willingness to greenlight.",
      enhancedNotes: 'IT effectively a soft yes. Pricing alignment next.',
      externalId: 'meet-call-30310',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-03-13T16:30:00Z'),
      title: 'Globex — Internal forecast review',
      source: 'granola',
      duration: 20 * 60,
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
          text: "Quick Globex update for forecast. IT signed off on integration concerns last week — MES system connector and Salesforce sync both demoed clean. Marlene at VP Ops level is bought in.",
        },
        {
          speaker: 'buyer',
          text: "Where's the risk?",
        },
        {
          speaker: 'seller',
          text: "Pricing alignment with their CFO. We're at $520K on the proposal; they've signaled $450K is the ceiling without escalation. Working a $480K landing with a phased payment.",
        },
        {
          speaker: 'buyer',
          text: "Probability?",
        },
        {
          speaker: 'seller',
          text: "75% for the quarter. Implementation timeline is the only other variable — they want live by mid-year and we're scoping eight weeks for plant one.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Hold it at 75 in the forecast. Flag if pricing slides past March 31.",
        },
      ]),
      summary:
        "Internal forecast sync. Rep walked manager through Globex state: IT cleared, VP Ops sponsoring, pricing alignment with CFO is the remaining gate. Held at 75% probability.",
      enhancedNotes: 'Internal — not for customer share.',
      externalId: 'granola-note-30401',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-03-19T17:00:00Z'),
      title: 'Globex — Pricing alignment call',
      source: 'zoom',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Today's focus is purely pricing alignment. I want to land somewhere both sides can defend. What did your CFO actually push back on?",
        },
        {
          speaker: 'buyer',
          text: "Two things. The headline number — $520K reads high against the OT modernization budget she set in January. And the payment timing — full annual upfront is a problem when our fiscal Q1 is already committed.",
        },
        {
          speaker: 'seller',
          text: "Both addressable. I can take $40K off the headline by removing the premium support tier — you don't need 24/7 in phase one with only two plants. That puts us at $480K. On payment, I can move to 50/50 split — half on signature, half at plant-one go-live.",
        },
        {
          speaker: 'buyer',
          text: "That's a real concession on both. $480K with a phased payment I can take to her without flinching. The premium support — we can add it back when we get to expansion?",
        },
        {
          speaker: 'seller',
          text: "Yes. When we expand to plants three through five, premium support gets bundled in the uplift. That's the natural moment for it anyway.",
        },
        {
          speaker: 'buyer',
          text: "Good. I'll walk this in tomorrow. If she nods, we're aligned and you can send paper.",
        },
        {
          speaker: 'seller',
          text: "Standing by. Implementation timeline doesn't change with this — eight weeks for plant one, still.",
        },
      ]),
      summary:
        "Pricing alignment call. Landed at $480K (down from $520K) by removing premium support for phase one, plus a 50/50 payment split. Marlene to walk to CFO. Implementation timeline unchanged.",
      enhancedNotes: 'Pricing alignment resolved pending CFO sign-off.',
      externalId: 'zoom-call-30502',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-04-02T17:00:00Z'),
      title: 'Globex — Multi-stakeholder pitch (Ops + IT + Plant Manager)',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'devan.mistry@globex.example',
        'plant.manager@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Goal today is to bring the plant manager into the room and validate that what Marlene and Devan have been scoping actually solves your problem on the floor.",
        },
        {
          speaker: 'buyer',
          text: "Plant manager here. I'll be honest, I'm skeptical. Every modernization pitch I've sat through promises real-time and delivers a dashboard nobody on the floor uses.",
        },
        {
          speaker: 'seller',
          text: "Fair. Let me show you the floor view, not the exec view. Here's what your shift supervisor sees on a tablet at the line — downtime reasons, current OEE, last-hour trend. One screen, no login dance.",
        },
        {
          speaker: 'buyer',
          text: "That's actually usable. The reason codes — those come from our MES system tags?",
        },
        {
          speaker: 'seller',
          text: "Yes. Devan's team already validated the connector handles your custom tags. Reason codes pass through unchanged.",
        },
        {
          speaker: 'buyer',
          text: "Marlene here — I want to underscore for the plant manager: this isn't just a phase-one bet. We're modeling expansion to all five core plants on success. The implementation timeline for plant one is eight weeks; we'd stage the rest behind that.",
        },
        {
          speaker: 'buyer',
          text: "Okay. I'm in if you bring me into kickoff and the operator training rounds. I don't want to be told what was decided after the fact.",
        },
        {
          speaker: 'seller',
          text: "Done. Plant manager on the kickoff invite and on the training sessions. Appreciate the directness.",
        },
      ]),
      summary:
        "Multi-stakeholder pitch added plant manager to the buying group. Showed floor-level view (not exec dashboard) and won skeptical endorsement. Marlene framed expansion narrative across five plants. Plant manager will be invited to kickoff and operator training.",
      enhancedNotes: 'Plant manager onboard. Buying group complete.',
      externalId: 'zoom-call-30615',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-04-15T17:00:00Z'),
      title: 'Globex — Reference call with Initrode Manufacturing',
      source: 'zoom',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'devan.mistry@globex.example',
        'ref.contact@initrode.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for hosting this reference. Quick intros, then I'll get out of the way and let Globex drive the questions.",
        },
        {
          speaker: 'buyer',
          text: "Initrode here — we run six plants on the platform, went live eighteen months ago, similar starting point with Wonderware. Happy to answer anything.",
        },
        {
          speaker: 'buyer',
          text: "Marlene here. Honest answer — did the implementation timeline they quoted hold?",
        },
        {
          speaker: 'buyer',
          text: "First plant: yes, almost to the day. Plants two and three: we slipped a week each because of our own change-control process, not the vendor. Plants four through six were faster than the initial estimates.",
        },
        {
          speaker: 'buyer',
          text: "Devan here. Integration concerns — the MES system connector and the Salesforce sync. How are they holding up in production?",
        },
        {
          speaker: 'buyer',
          text: "MES side has been quiet. We had one Salesforce hiccup early — they pushed a fix within a week. Field-scoped sync model has been solid; we haven't lost a record.",
        },
        {
          speaker: 'buyer',
          text: "Last one — would you do it again?",
        },
        {
          speaker: 'buyer',
          text: "Yes. The expansion math is where the value really lands — once plant one is in, the rest are mostly templated.",
        },
        {
          speaker: 'seller',
          text: "Really appreciate the time. I'll get out of your way.",
        },
      ]),
      summary:
        "Reference call with Initrode Manufacturing (six-plant deployment, 18 months in). Initrode validated implementation timeline holds, MES system connector and Salesforce sync are stable in production, and expansion economics improve plant-over-plant.",
      enhancedNotes: 'Strong reference. Removed last buyer doubt.',
      externalId: 'zoom-call-30702',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-04-28T16:00:00Z'),
      title: 'Globex — Procurement intake',
      source: 'google_meet',
      duration: 35 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'procurement@globex.example',
        'marlene.okafor@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "Procurement here. I've got your MSA, the order form at $480K, and the data processing addendum. Walking the redlines.",
        },
        {
          speaker: 'seller',
          text: "Go ahead — happy to take them in any order.",
        },
        {
          speaker: 'buyer',
          text: "Liability cap — your standard is 12 months fees. We need 24 months for anything touching the MES system.",
        },
        {
          speaker: 'seller',
          text: "I can get to 18 months without legal escalation. 24 needs a sign-off lap on my side that adds about a week to the implementation timeline kickoff if we go that route.",
        },
        {
          speaker: 'buyer',
          text: "18 months works. Next — termination for convenience with 60 days notice during year one.",
        },
        {
          speaker: 'seller',
          text: "We don't do termination for convenience in year one; we do a service credit framework if we miss SLAs. I can share that language.",
        },
        {
          speaker: 'buyer',
          text: "Acceptable. Last item — data residency. All customer data needs to stay US-region.",
        },
        {
          speaker: 'seller',
          text: "Standard for us. I'll mark that explicitly in the order form so there's no ambiguity.",
        },
        {
          speaker: 'buyer',
          text: "Good. I'll get the marked-up versions back to you by Thursday. Pricing alignment is settled on our side — CFO already signed off.",
        },
      ]),
      summary:
        "Procurement intake. Three redlines: liability cap (landed at 18 months), termination for convenience (replaced with SLA service credits), data residency (US-region confirmed). Pricing alignment confirmed signed off by CFO.",
      enhancedNotes: 'Paper moving. Implementation timeline unaffected.',
      externalId: 'meet-call-30810',
    },
    {
      id: '00000000-0000-0000-0000-eeee02000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000002',
      occurredAt: new Date('2026-05-08T17:00:00Z'),
      title: 'Globex — Verbal commit / final negotiation',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marlene.okafor@globex.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Wanted to close the loop before I send the final paper. Anything still outstanding on your side?",
        },
        {
          speaker: 'buyer',
          text: "Nothing material. Procurement closed the redlines. CFO is good on pricing alignment at $480K with the 50/50 payment. Devan signed off on the integration concerns weeks ago. We're a yes.",
        },
        {
          speaker: 'seller',
          text: "Appreciate that. So the verbal is — we sign this week, kickoff the week after, eight-week implementation timeline to plant one.",
        },
        {
          speaker: 'buyer',
          text: "Confirmed. I want to flag one thing for kickoff so it doesn't surface as a surprise: we're already directionally planning expansion to three more plants before year-end. Not contractually committed yet, but I want your implementation team to design with it in mind.",
        },
        {
          speaker: 'seller',
          text: "Good signal. I'll brief the SA before kickoff so the environment design assumes five-plant expansion.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Send the DocuSign — I'll route it Monday.",
        },
        {
          speaker: 'seller',
          text: "Sending today. Congrats — this has been a clean cycle.",
        },
      ]),
      summary:
        "Verbal commit call. Marlene confirmed all blockers closed: pricing alignment at $480K, integration concerns cleared by IT, procurement redlines done. DocuSign to go out same day. Expansion to three additional plants flagged for kickoff design consideration.",
      enhancedNotes: 'Verbal yes. Paper out today.',
      externalId: 'zoom-call-30901',
    },
  ],
};
