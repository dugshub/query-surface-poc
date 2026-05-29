import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 01 — Acme Corp — CFO pricing pushback, procurement looping in, legal redlines pending
//
// Themes: pricing pushback / volume discount / pricing tier, renewal lock,
//         procurement involvement, legal redlines / data residency
// Stage: closing  |  Amount: $250K  |  Status: at_risk

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000001',
    userId: USER_ID,
    name: 'Acme Corp',
    website: 'acme.example',
    externalId: 'sf-acct-001',
    providerMetadata: { industry: 'fintech', employee_count: 250 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000001',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000001',
    name: 'Acme — Q3 New Logo',
    description:
      'New logo opportunity at Acme Corp (fintech, ~250 employees). CFO-led pricing pushback in late stage; revised SOW with a volume discount tier is being routed through procurement while legal works through redlines on data residency.',
    stage: 'closing',
    amount: 25000000,
    closeDate: new Date('2026-06-30T00:00:00Z'),
    nextStep:
      'Send revised SOW with the 250-seat volume discount tier to procurement by Fri; schedule follow-up pricing call with CFO + procurement next week.',
    probability: 75,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'at_risk',
    stateOfDeal:
      'CFO pushing back on list pricing and asking for a volume discount at the 250-seat tier; we proposed a revised SOW reflecting the new tier. Procurement sign-off is still pending and legal has open redlines on data residency, so the June 30 close is at risk.',
    isVisible: true,
    emailDomains: ['acme.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc01000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000001',
      firstName: 'Priya',
      lastName: 'Raghavan',
      email: 'priya.raghavan@acme.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc01000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000001',
      firstName: 'Marcus',
      lastName: 'Holloway',
      email: 'marcus.holloway@acme.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      accountId: '00000000-0000-0000-0000-aaaa00000001',
      contactId: '00000000-0000-0000-0000-cccc01000001',
      occurredAt: new Date('2026-04-20T14:12:00Z'),
      subject: 'Re: Acme pricing — pushback on list rate',
      bodyText:
        "Thanks for sending the proposal over. To be direct: there's real pricing pushback on our side at the list rate — for 250 seats we expected to land in a different pricing tier. Can you come back with a volume discount that reflects the seat count? I'd also like to loop procurement into the next pricing call before we go further.",
      fromAddress: 'priya.raghavan@acme.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-acme-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      accountId: '00000000-0000-0000-0000-aaaa00000001',
      contactId: '00000000-0000-0000-0000-cccc01000001',
      occurredAt: new Date('2026-04-21T16:45:00Z'),
      subject: 'Re: Acme pricing — pushback on list rate',
      bodyText:
        "Totally hear you on the pricing pushback. I'm putting together a revised SOW that drops you into our 250-seat volume discount tier — should have it in your inbox by Friday. Happy to bring procurement into the next call; want me to send an invite for early next week so we can walk through the new pricing tier together?",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['priya.raghavan@acme.example'],
      direction: 'outbound',
      threadId: 'thread-acme-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      accountId: '00000000-0000-0000-0000-aaaa00000001',
      occurredAt: new Date('2026-04-23T11:05:00Z'),
      subject: 'Acme legal redlines — data residency + DPA',
      bodyText:
        "Forwarding the legal redlines on the MSA from our outside counsel. The biggest open items are around data residency — we need customer data kept in the EU region — and a couple of clauses in the DPA that we'd like tightened. Can your team turn these around alongside the revised SOW so we're not sequencing them?",
      fromAddress: 'legal@acme.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-acme-002',
      hasAttachments: true,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee01000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-01T15:00:00Z'),
      title: 'Acme — Discovery call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'marcus.holloway@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time. I'd love to start with what's driving the evaluation on your side — what's the trigger that put this on the roadmap this quarter?",
        },
        {
          speaker: 'buyer',
          text: "Sure. We're a fintech, about 250 employees, and our finance ops team is drowning in manual reconciliation. Marcus on the engineering side has been pushing to standardize tooling, and I'm the budget owner.",
        },
        {
          speaker: 'buyer',
          text: "I'll flag up front — we've been burned on pricing before, so expect some pricing pushback once we see the proposal. We'll want to see a pricing tier that reflects our actual seat count, not the list rate.",
        },
        {
          speaker: 'seller',
          text: "Understood, and appreciated. We do have volume discount tiers — 250 seats lands you in a real one, not a token discount. What does the buying committee look like on your side once we get there?",
        },
        {
          speaker: 'buyer',
          text: "It's me as CFO, Marcus as CTO, and procurement gets pulled in at the contract stage. Legal will also want a pass — data residency matters to us given our regulator.",
        },
        {
          speaker: 'seller',
          text: "Good to know. On data residency — we can support EU region pinning, which I'll flag to our legal team early so we're not surprised at redline time.",
        },
        {
          speaker: 'buyer',
          text: "Helpful. Send over a proposal and we'll get on a pricing review once Marcus and I have digested it.",
        },
      ]),
      summary:
        'Discovery with Acme CFO (Priya Raghavan) and CTO (Marcus Holloway). Drivers: manual finance ops reconciliation; ~250 seats. CFO flagged anticipated pricing pushback and that procurement + legal will be involved; data residency (EU) called out early.',
      enhancedNotes: 'Next step: send proposal, schedule pricing review.',
      externalId: 'gong-call-10001',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-18T17:00:00Z'),
      title: 'Acme — Pricing review',
      source: 'google_meet',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'rep@findtempo.co',
      ],
      // invited ≠ attended: Marcus was invited but declined and didn't show;
      // procurement was invited, never responded, and didn't show. Neither
      // appears in attendeeEmails. (Priya, conversely, attended without an
      // explicit invitee row — she showed up off the back of the thread.)
      invitees: [
        { email: 'marcus.holloway@acme.example', name: 'Marcus Holloway', response: 'declined', attended: false },
        { email: 'procurement@acme.example', name: 'Acme Procurement', response: 'no_response', attended: false },
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the time. I want to walk through the proposal, hear your reaction, and figure out where we go from here.",
        },
        {
          speaker: 'buyer',
          text: "I'll be honest — there's real pricing pushback. At 250 seats the list rate doesn't reflect the commitment we're making, and I need a volume discount before this gets to procurement.",
        },
        {
          speaker: 'seller',
          text: "Fair. I can move you into our 250-seat volume discount tier and rebuild the SOW around it. What's the right shape — a one-year, or are you open to a longer commit?",
        },
        {
          speaker: 'buyer',
          text: "We'd consider multi-year if there's a renewal lock — I don't want to land a great rate this year and get hit with a step-up at renewal. A renewal lock at the same tier would unlock budget conversation faster.",
        },
        {
          speaker: 'seller',
          text: "We can do a renewal lock at the discounted tier across the term. I'll bake that into the revised SOW.",
        },
        {
          speaker: 'buyer',
          text: "Good. On next steps — I want procurement involvement in our next pricing call. They'll have their own questions on payment terms and they need to bless the discount structure before we sign anything.",
        },
        {
          speaker: 'seller',
          text: "Makes sense. I'll send the revised SOW with the volume discount tier and the renewal lock language, and I'll work with you to set up a call with procurement next week. Legal is already looking at the data residency redlines in parallel.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Get me the SOW by Friday and I'll route it internally.",
        },
      ]),
      summary:
        'Pricing review with Acme CFO. CFO pushed back on list pricing; agreed to revised SOW at the 250-seat volume discount tier with a renewal lock for a multi-year term. CFO requested procurement involvement in the next pricing call; legal redlines on data residency tracking in parallel.',
      enhancedNotes: 'Send revised SOW by Fri; schedule procurement-included pricing call next week.',
      externalId: 'gong-call-10002',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-03-15T14:00:00Z'),
      title: 'Internal — Acme account prep before discovery',
      source: 'zoom',
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
          text: "Quick prep before the Acme discovery call next week. Inbound from their CFO Priya Raghavan — fintech, ~250 employees. CTO Marcus Holloway is in the loop too.",
        },
        {
          speaker: 'unknown',
          text: "Anything we know about the buying motion? Fintechs at that size usually have procurement involvement and a real legal review.",
        },
        {
          speaker: 'seller',
          text: "Right. I'd assume procurement loops in late and legal will care about data residency given the regulator angle. I want to surface volume discount expectations early so we don't get sandbagged at the pricing review.",
        },
        {
          speaker: 'unknown',
          text: "Smart. Get the buying committee mapped on the first call — CFO, CTO, procurement, legal — and flag EU residency before they redline us.",
        },
        {
          speaker: 'seller',
          text: "Plan is to ask about pricing pushback patterns up front and confirm seat count so we can position the 250-seat tier on the proposal.",
        },
        {
          speaker: 'unknown',
          text: "Good. Send me a recap after discovery and we'll align on the proposal shape.",
        },
      ]),
      summary:
        'Internal prep call between rep and manager ahead of Acme discovery. Plan: map the buying committee (CFO, CTO, procurement, legal), surface pricing pushback expectations early, and flag EU data residency before legal redlines.',
      enhancedNotes: 'Internal sync — no buyer attendees.',
      externalId: 'gong-call-10003',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-03-22T19:30:00Z'),
      title: 'Acme — Voicemail follow-up to CFO',
      source: 'gong',
      duration: 2 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'priya.raghavan@acme.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Hi Priya, it's the rep from Tempo. Just leaving a quick voicemail to follow up on our discovery thread.",
        },
        {
          speaker: 'seller',
          text: "I'm putting the proposal together now with a 250-seat volume discount tier baked in, so you shouldn't see list pricing on it.",
        },
        {
          speaker: 'seller',
          text: "I'd love to get a pricing review on the calendar for the week of April 14 — give me a call back or grab a slot and we'll walk through it together.",
        },
        {
          speaker: 'seller',
          text: "Thanks, talk soon.",
        },
      ]),
      summary:
        'Voicemail left for Acme CFO confirming the proposal will include a 250-seat volume discount tier; rep requested a pricing review the week of April 14.',
      enhancedNotes: 'Voicemail — no response yet.',
      externalId: 'gong-call-10004',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-05T16:00:00Z'),
      title: 'Acme — Product demo (CTO technical deep-dive)',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marcus.holloway@acme.example',
        'rep@findtempo.co',
        'se@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Marcus, today I want to spend most of the hour on the engineering side — APIs, data model, deployment topology. Sound good?",
        },
        {
          speaker: 'buyer',
          text: "Perfect. The thing I really need to validate is the data residency story. Our customer data has to stay in the EU region — full stop. If that doesn't hold up the rest of the demo doesn't matter.",
        },
        {
          speaker: 'seller',
          text: "Understood. We have a dedicated EU tenant — separate control plane, separate data plane, no cross-region replication. I'll show you the architecture diagram now.",
        },
        {
          speaker: 'buyer',
          text: "Good. What about the ingestion pipeline — does any metadata leave the region for telemetry?",
        },
        {
          speaker: 'seller',
          text: "Telemetry is scrubbed at the edge and aggregated in-region. We can share the SOC2 report and the data flow diagram with your security team.",
        },
        {
          speaker: 'buyer',
          text: "That'll help. Priya is the budget owner but if I can't sign off on residency she won't get past procurement.",
        },
        {
          speaker: 'seller',
          text: "Let's get a security review on the calendar next week with your team. I'll bring our security engineer.",
        },
        {
          speaker: 'buyer',
          text: "Done. Send the invite.",
        },
      ]),
      summary:
        'Technical demo with Acme CTO. Heavy focus on data residency — EU tenant isolation, no cross-region replication, in-region telemetry. CTO will not sign off without residency assurance. Next step: schedule security review with both security teams.',
      enhancedNotes: 'Send SOC2 + data flow diagram before next call.',
      externalId: 'gong-call-10005',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-10T15:00:00Z'),
      title: 'Acme — Security review (SOC2 + data residency)',
      source: 'zoom',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marcus.holloway@acme.example',
        'security@acme.example',
        'rep@findtempo.co',
        'se@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks all. Our security engineer is on — I'll let her drive the SOC2 and data residency sections, then we'll open it up to questions.",
        },
        {
          speaker: 'unknown',
          text: "We're SOC2 Type II, audited annually. The EU region is a fully isolated tenant; no customer data crosses the Atlantic. Encryption is AES-256 at rest, TLS 1.3 in transit, customer-managed keys are supported.",
        },
        {
          speaker: 'buyer',
          text: "On customer-managed keys — what's the rotation story? Our policy is 90 days.",
        },
        {
          speaker: 'unknown',
          text: "Rotation is customer-controlled via your KMS; we re-wrap data keys on rotation. 90 days is well within what we support.",
        },
        {
          speaker: 'buyer',
          text: "And subprocessors? Anyone with access to customer data outside the EU?",
        },
        {
          speaker: 'unknown',
          text: "Full subprocessor list in the DPA — all EU-resident processors for the EU tenant. We'll include that with the legal redlines pack.",
        },
        {
          speaker: 'buyer',
          text: "Good. I think we can clear data residency from my side. Legal will still want to redline the DPA but I'm satisfied technically.",
        },
        {
          speaker: 'seller',
          text: "Great. I'll make sure the DPA and subprocessor list go to your legal team alongside the revised SOW.",
        },
      ]),
      summary:
        'Security review with Acme CTO + security team. Walked through SOC2 Type II, EU tenant isolation, CMK rotation, and the EU-only subprocessor list. CTO cleared data residency technically; legal will still redline the DPA.',
      enhancedNotes: 'Send DPA + subprocessor list with revised SOW.',
      externalId: 'gong-call-10006',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-14T16:30:00Z'),
      title: 'Acme — Champion 1:1 with Priya (CFO)',
      source: 'google_meet',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the 1:1. I wanted to check in informally before the formal pricing review later this week — what's the temperature internally?",
        },
        {
          speaker: 'buyer',
          text: "Honestly? Mixed. Marcus is sold on the product side after the security review. My concern is still pricing — and I'm going to push back hard at the review on Friday.",
        },
        {
          speaker: 'seller',
          text: "I expected that. What's the number in your head that gets this past procurement without a fight?",
        },
        {
          speaker: 'buyer',
          text: "I need a meaningful volume discount at 250 seats and a renewal lock so I'm not explaining a 30% step-up next year. If you bring both, I can defend it.",
        },
        {
          speaker: 'seller',
          text: "That's doable. I'll come into Friday with the volume discount tier and renewal lock language already built in. What else should I know about how procurement evaluates these?",
        },
        {
          speaker: 'buyer',
          text: "Procurement looks at payment terms and benchmark comparisons. They'll want net-60 and they'll ask for two reference customers in our segment.",
        },
        {
          speaker: 'seller',
          text: "Noted. I'll line up the references and we can talk payment terms during the procurement call.",
        },
      ]),
      summary:
        'Champion 1:1 with Acme CFO ahead of formal pricing review. CFO confirmed she will push back on pricing; needs volume discount + renewal lock to defend internally. Procurement will want net-60 payment terms and reference customers in segment.',
      enhancedNotes: 'Line up two reference customers; prep net-60 position for procurement.',
      externalId: 'gong-call-10007',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-22T14:00:00Z'),
      title: 'Internal — Acme pricing escalation sync',
      source: 'fathom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
        'deals@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Need to escalate the Acme pricing. CFO is asking for the 250-seat volume discount plus a renewal lock across a multi-year term. I want approval before I send the revised SOW.",
        },
        {
          speaker: 'unknown',
          text: "What's the discount delta off list?",
        },
        {
          speaker: 'seller',
          text: "Roughly 22% off list at the tier, with the renewal lock holding that rate through year three.",
        },
        {
          speaker: 'unknown',
          text: "That's within deal desk authority if we hold the renewal lock at tier — not at the discounted dollar amount. Make sure the language is clear: lock at tier, not at price, so we still capture seat growth.",
        },
        {
          speaker: 'seller',
          text: "Understood. I'll phrase the renewal lock as 'discount tier preserved' rather than 'price preserved.' That should keep us covered on expansion.",
        },
        {
          speaker: 'unknown',
          text: "Approved. Get the SOW out by Friday. What's the legal status?",
        },
        {
          speaker: 'seller',
          text: "Legal sent redlines on the MSA — mostly data residency and DPA tightening. Our legal team has them and is turning around within the week so we're not sequencing legal behind pricing.",
        },
        {
          speaker: 'unknown',
          text: "Good. Procurement involvement next week — make sure they're in the room when we walk through the discount structure.",
        },
      ]),
      summary:
        'Internal pricing escalation for Acme. Deal desk approved 22% off list at the 250-seat volume discount tier with a renewal lock framed as "discount tier preserved" (not price), protecting expansion economics. Legal redlines on data residency tracking in parallel.',
      enhancedNotes: 'Internal sync — deal desk approval logged.',
      externalId: 'gong-call-10008',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-04-28T15:00:00Z'),
      title: 'Acme — Procurement intake call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'procurement@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for joining. Priya asked us to bring procurement in early — happy to walk through the revised SOW and answer process questions.",
        },
        {
          speaker: 'unknown',
          text: "Appreciate that. Standard intake: I'll need your W-9, SOC2 report, DPA, subprocessor list, and a vendor security questionnaire. Payment terms — what are you proposing?",
        },
        {
          speaker: 'seller',
          text: "We're flexible. Standard is net-30 but I have authority to go net-60 for Acme given the volume discount tier we've structured.",
        },
        {
          speaker: 'unknown',
          text: "Net-60 works. On the volume discount — how does the renewal lock language read? We've been burned where 'lock' means the discount disappears.",
        },
        {
          speaker: 'seller',
          text: "Our renewal lock preserves the discount tier through the term — so as you grow seats, you stay in the same discounted tier rather than jumping back to list. Priya and I aligned on that shape last week.",
        },
        {
          speaker: 'buyer',
          text: "That matches what we discussed. Procurement, the tier-preservation framing is what unblocked my internal sign-off.",
        },
        {
          speaker: 'unknown',
          text: "Good. I'll route the SOW through legal once I have the security pack. Legal already has the redlines from your team — they're working through data residency clauses now.",
        },
        {
          speaker: 'seller',
          text: "Perfect. I'll send the full security pack today.",
        },
      ]),
      summary:
        'Procurement intake call at Acme with CFO + procurement. Agreed on net-60 payment terms; procurement validated the renewal lock framing (discount tier preserved across term). Procurement to route SOW through legal once security pack is delivered.',
      enhancedNotes: 'Send security pack (SOC2, DPA, subprocessor list, VSQ) today.',
      externalId: 'gong-call-10009',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-05-02T17:00:00Z'),
      title: 'Acme — Legal redlines review (MSA + DPA)',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'legal@acme.example',
        'counsel@findtempo.co',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the time. Our counsel is on — I'd suggest we walk the redlines from your outside firm clause by clause. The biggest items are data residency and the DPA.",
        },
        {
          speaker: 'unknown',
          text: "Agreed. On data residency — your draft says 'primary processing in EU.' We need that hardened to 'all customer data processed and stored exclusively in EU region, with no cross-region replication or transfer.'",
        },
        {
          speaker: 'unknown',
          text: "We can accept that language. The EU tenant is architected exactly that way — no cross-region replication is already a technical guarantee, so we're comfortable contracting to it.",
        },
        {
          speaker: 'unknown',
          text: "Good. On the DPA — clause 7.3 on subprocessor notification: we want 30 days prior notice with right to object, not the 14 days you have.",
        },
        {
          speaker: 'unknown',
          text: "30 days is fine. We'll update the clause.",
        },
        {
          speaker: 'unknown',
          text: "Last big one — limitation of liability. We need the cap raised to 2x annual fees for data breach claims specifically.",
        },
        {
          speaker: 'unknown',
          text: "I'd need to take that one back. 2x for data breach specifically is workable but I want to align with our risk team before we paper it.",
        },
        {
          speaker: 'seller',
          text: "On the SOW side, the pricing tier and renewal lock language is already aligned with procurement, so legal shouldn't need to touch that.",
        },
        {
          speaker: 'unknown',
          text: "Acknowledged. We'll send a clean v2 of the redlines once your counsel gets back on the LoL cap.",
        },
      ]),
      summary:
        'Legal redlines review between counsels. Agreed: hardened EU data residency language ("processed and stored exclusively in EU"), 30-day subprocessor notification. Open: 2x annual fees LoL cap for data breach — Tempo counsel taking back to risk team.',
      enhancedNotes: 'Resolve LoL cap with risk team this week; receive v2 redlines.',
      externalId: 'gong-call-10010',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-05-08T15:00:00Z'),
      title: 'Acme — Multi-stakeholder pricing sync (CFO + CTO + procurement)',
      source: 'zoom',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'marcus.holloway@acme.example',
        'procurement@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks all. Goal today is to get the four of us aligned on the revised SOW so we can move toward signature. I'll walk the highlights and then open it up.",
        },
        {
          speaker: 'seller',
          text: "Recap: 250-seat volume discount tier — 22% off list — renewal lock at the tier across the three-year term, net-60 payment terms, EU-resident data, DPA with 30-day subprocessor notice.",
        },
        {
          speaker: 'buyer',
          text: "From a finance standpoint that addresses my pricing pushback. The renewal lock framing is what makes this defensible — I can take this to the board.",
        },
        {
          speaker: 'buyer',
          text: "Engineering side is good. Data residency cleared in the security review, and the redlines pack mirrors what we discussed.",
        },
        {
          speaker: 'unknown',
          text: "Procurement is comfortable with payment terms and the discount structure. Pending the LoL cap close-out with legal, I can move this to signature workflow.",
        },
        {
          speaker: 'seller',
          text: "Our counsel is closing the LoL cap with our risk team this week. Expect v2 redlines by Friday.",
        },
        {
          speaker: 'buyer',
          text: "Good. I'm going to need to brief our board chair before signature — let's plan on a pre-board alignment call later this month.",
        },
        {
          speaker: 'seller',
          text: "Happy to. I'll get a slot on the calendar.",
        },
      ]),
      summary:
        'Multi-stakeholder alignment call at Acme: CFO, CTO, procurement all aligned on revised SOW (22% off list, renewal lock at tier, net-60, EU data residency). Signature pending LoL cap close-out with legal and a pre-board alignment call with CFO.',
      enhancedNotes: 'Close LoL cap; schedule pre-board alignment call.',
      externalId: 'gong-call-10011',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-05-13T16:00:00Z'),
      title: 'Acme — Reference customer intro call',
      source: 'google_meet',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'procurement@acme.example',
        'rep@findtempo.co',
        'reference.cfo@northwindfin.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time. Quick intros — Priya is CFO at Acme, procurement is on the line, and we have the CFO of Northwind Financial, a similar-size fintech who deployed Tempo last year.",
        },
        {
          speaker: 'unknown',
          text: "Happy to share. We were at about 220 seats when we signed, similar volume discount tier. The renewal lock has held — we just renewed at year two and the tier preserved exactly as written.",
        },
        {
          speaker: 'buyer',
          text: "That's the specific thing I wanted to validate. How did your procurement team feel about the payment terms and subprocessor language at signing?",
        },
        {
          speaker: 'unknown',
          text: "Net-60 was standard for us. On subprocessors, the 30-day notice is what unblocked our legal team — it gives us real time to evaluate.",
        },
        {
          speaker: 'unknown',
          text: "On the data residency side — we're an EU-regulated entity, and the EU tenant has held up under our internal audit and one regulator inquiry. No cross-region issues.",
        },
        {
          speaker: 'buyer',
          text: "That's reassuring. Last thing — any surprises in implementation we should plan for?",
        },
        {
          speaker: 'unknown',
          text: "The biggest thing was getting our finance ops team trained early — Tempo's onboarding team was great, but we underinvested on internal change management for the first two weeks. Don't repeat that.",
        },
        {
          speaker: 'seller',
          text: "Noted — we'll bake change management into the implementation plan for Acme.",
        },
      ]),
      summary:
        'Reference customer intro: Northwind Financial CFO spoke with Acme CFO + procurement. Validated renewal lock holding at tier, net-60 + 30-day subprocessor notice, EU tenant stability under regulator inquiry. Lesson: invest in internal change management early during implementation.',
      enhancedNotes: 'Bake change management into Acme implementation plan.',
      externalId: 'gong-call-10012',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000013',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-05-18T17:00:00Z'),
      title: 'Acme — ROI / business case review',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'finance.analyst@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Priya, I want to walk through the ROI model we built for Acme so you can use it directly in your board materials.",
        },
        {
          speaker: 'buyer',
          text: "Yes — I need a clean one-pager. The board chair will ask about payback period specifically.",
        },
        {
          speaker: 'seller',
          text: "Based on your finance ops team size and the manual reconciliation hours you shared, the model shows a 9-month payback at the 250-seat volume discount tier. Three-year NPV is just over $1.4M.",
        },
        {
          speaker: 'unknown',
          text: "What are the assumptions on hours saved per analyst per week?",
        },
        {
          speaker: 'seller',
          text: "Conservative — 6 hours per analyst per week, blended rate of $85/hour. Northwind reported 9 hours; I dialed it down for the model.",
        },
        {
          speaker: 'buyer',
          text: "Good — I want to defend conservative assumptions to the board. The renewal lock means year-two and year-three economics are stable, which makes the NPV credible.",
        },
        {
          speaker: 'seller',
          text: "Exactly. And because the renewal lock preserves the discount tier rather than the dollar amount, your expansion to 400 seats next year still stays in the discounted tier.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Send me the model and the one-pager by Wednesday so I can include them in the board pre-read.",
        },
      ]),
      summary:
        'ROI review with Acme CFO + finance analyst. Modeled 9-month payback, $1.4M three-year NPV using conservative 6 hrs/analyst/week savings. Renewal lock at tier stabilizes year-two and year-three economics for the board case.',
      enhancedNotes: 'Send ROI model + one-pager by Wednesday for board pre-read.',
      externalId: 'gong-call-10013',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000014',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-05-30T14:00:00Z'),
      title: 'Acme — Pre-board alignment with CFO',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'priya.raghavan@acme.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Priya, you have the board on Wednesday — what do you need from me to walk in confident?",
        },
        {
          speaker: 'buyer',
          text: "The board is going to push on three things: pricing, lock-in risk, and the legal exposure on data residency. I need a crisp answer to each.",
        },
        {
          speaker: 'seller',
          text: "On pricing: 22% off list at the 250-seat volume discount tier. Northwind validated the renewal lock holds. On lock-in: the renewal lock preserves the tier, not the price — so seat growth stays discounted rather than reverting. On data residency: contractually exclusive EU processing, technically architected that way, validated by Marcus's security team.",
        },
        {
          speaker: 'buyer',
          text: "Good. The renewal lock framing is the one that's hardest to explain — can you give me a single sentence?",
        },
        {
          speaker: 'seller',
          text: "Try this: 'The discount tier is locked through the term, so as we expand seats we stay in the discounted band rather than jumping back to list.'",
        },
        {
          speaker: 'buyer',
          text: "That works. Last thing — when can we sign? I want to tell the board signature is in flight, not theoretical.",
        },
        {
          speaker: 'seller',
          text: "Legal closed the LoL cap last Friday. Procurement is in signature workflow. If the board approves Wednesday, we can sign by end of week.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. I'll bring this home.",
        },
      ]),
      summary:
        'Pre-board alignment with Acme CFO. Equipped CFO with crisp answers on pricing (22% off list at 250-seat tier), lock-in risk (renewal lock preserves tier not price), and data residency (contractually + technically EU-exclusive). Signature targeted for end of week post-board approval.',
      enhancedNotes: 'CFO confident to walk in; signature targeted by EoW.',
      externalId: 'gong-call-10014',
    },
    {
      id: '00000000-0000-0000-0000-eeee01000015',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000001',
      occurredAt: new Date('2026-06-03T16:00:00Z'),
      title: 'Acme — Implementation planning kickoff prep',
      source: 'fathom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marcus.holloway@acme.example',
        'priya.raghavan@acme.example',
        'rep@findtempo.co',
        'cs@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Assuming signature lands this week, I want to walk through what kickoff looks like so you're not flat-footed Monday. Our CS lead is on to drive the plan.",
        },
        {
          speaker: 'unknown',
          text: "Week one is provisioning the EU tenant, identity federation, and a workshop with your finance ops leads. Week two is data ingestion from your source systems and a first reconciliation dry-run.",
        },
        {
          speaker: 'buyer',
          text: "On data ingestion — same EU residency story applies, right? Nothing transits through US infra during onboarding?",
        },
        {
          speaker: 'unknown',
          text: "Correct. Onboarding runs entirely against the EU tenant. Our implementation engineer for your account is EU-based.",
        },
        {
          speaker: 'buyer',
          text: "Good. The Northwind feedback was to invest in change management early — what's your recommendation?",
        },
        {
          speaker: 'unknown',
          text: "We recommend you name an internal change owner — usually a finance ops manager — who runs weekly stand-ups with the analysts for the first six weeks. We'll provide enablement materials and office hours.",
        },
        {
          speaker: 'buyer',
          text: "I'll name someone before kickoff. Marcus, can engineering free up someone for the identity federation work in week one?",
        },
        {
          speaker: 'buyer',
          text: "Yes — I'll line up one of our platform engineers. Send me the technical prereqs and I'll have them ready Monday.",
        },
        {
          speaker: 'seller',
          text: "Perfect. We'll send the kickoff packet the day signature lands.",
        },
      ]),
      summary:
        'Implementation planning prep with Acme CFO + CTO. Walked through two-week onboarding plan (EU tenant provisioning, identity federation, finance ops workshop, ingestion + dry-run). Reinforced EU-only onboarding path. Acme to name internal change owner + dedicate a platform engineer for week one.',
      enhancedNotes: 'Send kickoff packet the day signature lands.',
      externalId: 'gong-call-10015',
    },
  ],
};
