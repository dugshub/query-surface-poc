import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 07 — Wayne Enterprises — early-stage health pilot, HIPAA + ROI case in flight
//
// Themes: HIPAA / compliance review, ROI case, stakeholder mapping, discovery
// Stage: prospect  |  Amount: $25K  |  Status: healthy

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000007',
    userId: USER_ID,
    name: 'Wayne Enterprises',
    website: 'wayneenterprises.example',
    externalId: 'sf-acct-007',
    providerMetadata: { industry: 'health', employee_count: 5000 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000007',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000007',
    name: 'Wayne — Pilot Engagement',
    description:
      'Early-stage pilot conversation with Wayne Enterprises health division. Entry-point contact is VP Operations; HIPAA compliance review is a hard gate before any procurement motion, and the ROI case is still being assembled from comparable health customers.',
    stage: 'prospect',
    amount: 2500000,
    closeDate: new Date('2026-11-30T00:00:00Z'),
    nextStep: 'Send sample ROI case from a similar health customer this week.',
    probability: 15,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'healthy',
    stateOfDeal:
      'Very early-stage discovery — VP Operations is the entry-point contact and HIPAA compliance is a hard requirement. ROI case is still being built; need stakeholder mapping before we can pull in clinical IT or procurement.',
    isVisible: true,
    emailDomains: ['wayneenterprises.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc07000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000007',
      firstName: 'Lucius',
      lastName: 'Fox',
      email: 'lucius.fox@wayneenterprises.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      accountId: '00000000-0000-0000-0000-aaaa00000007',
      contactId: '00000000-0000-0000-0000-cccc07000001',
      occurredAt: new Date('2026-05-11T16:30:00Z'),
      subject: 'Recap from yesterday — HIPAA, ROI case, and stakeholder mapping',
      bodyText:
        "Lucius — thanks again for the time yesterday. Quick recap from our discovery: any pilot will need to clear your HIPAA compliance review up front, so I'll loop our security team in early and send over our standard BAA template this week. I'll also pull a sample ROI case from a comparable health customer (similar headcount, similar ops footprint) so you have something concrete to share internally. On stakeholder mapping — who beyond you and clinical IT should we get in the room for the next conversation? Happy to send a short questionnaire if that's easier than another call.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['lucius.fox@wayneenterprises.example'],
      direction: 'outbound',
      threadId: 'thread-wayne-001',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee07000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-05-10T17:00:00Z'),
      title: 'Wayne — Initial discovery',
      source: 'granola',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['lucius.fox@wayneenterprises.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Appreciate you making time, Lucius. I know this is a discovery call so I want to keep it loose — get a sense of what operations looks like at Wayne today, where the pain is, and whether what we do is even a fit.",
        },
        {
          speaker: 'buyer',
          text: "Sure. I'll be upfront — before we go too deep, anything we pilot has to clear a HIPAA compliance review. That's non-negotiable on our side. Our security team gates every vendor through it and turnaround can be six to eight weeks if we're not careful.",
        },
        {
          speaker: 'seller',
          text: "Totally fair, and we've been through HIPAA reviews with similar-sized health orgs — happy to send our BAA and the security packet ahead of time so it's not a bottleneck later. What does success look like for you if we did run a pilot? I'm trying to figure out the ROI case we'd need to build.",
        },
        {
          speaker: 'buyer',
          text: "Honestly the ROI case is the harder problem. I can sponsor a small pilot out of my budget — we're talking maybe twenty-five thousand for a first engagement — but to expand it I need to walk into the COO's staff meeting with hard numbers. Hours saved, error rate down, something defensible.",
        },
        {
          speaker: 'seller',
          text: "Got it. I'll pull a sample ROI case from a comparable health customer — similar employee count, similar ops setup — so you've got an apples-to-apples reference. The other thing I want to figure out is stakeholder mapping. Beyond you and the COO, who else needs to be bought in before this is real?",
        },
        {
          speaker: 'buyer',
          text: "Good question. Clinical IT will need to weigh in on anything that touches PHI, and procurement gets involved over fifty thousand. There's also a VP of compliance who runs the HIPAA review — she's not a decision maker but she can absolutely kill it. I should probably introduce you to her early.",
        },
        {
          speaker: 'seller',
          text: "That's really helpful. Let me put together a short recap email — HIPAA path, ROI case I'll send this week, and a proposed stakeholder mapping doc so we can be deliberate about who we pull in and when. Sound good?",
        },
        {
          speaker: 'buyer',
          text: "Works for me. Send the ROI sample first if you can — that's the thing I can actually do something with internally while the compliance review runs in parallel.",
        },
      ]),
      summary:
        'Initial discovery with VP Operations Lucius Fox at Wayne Enterprises. HIPAA compliance review is a hard prerequisite; ROI case needs to be built using a comparable health customer; stakeholder mapping surfaced clinical IT, a VP of compliance, and procurement as additional players.',
      enhancedNotes: 'Send sample ROI case this week; BAA + security packet to follow.',
      externalId: 'granola-call-70001',
    },
    {
      id: '00000000-0000-0000-0000-eeee07000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-04-25T15:00:00Z'),
      title: 'Wayne — Inbound intake call',
      source: 'zoom',
      duration: 20 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['lucius.fox@wayneenterprises.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the inbound, Lucius — saw the form fill come in yesterday. Before we get into anything, what made you reach out? I want to make sure we use this twenty minutes well.",
        },
        {
          speaker: 'buyer',
          text: "Honestly we found you online — one of my directors flagged a write-up about your platform and said it might solve a workflow problem we've been chewing on. I'm not committing to anything today, this is more of a fact-finding call on my side.",
        },
        {
          speaker: 'seller',
          text: "Totally fine — I treat the first call as pure discovery on both sides. Can you give me a one-minute version of the workflow problem? I'll tell you straight up if it's a fit or not.",
        },
        {
          speaker: 'buyer',
          text: "Operations side of a regional health system. Lots of manual reconciliation between systems, lots of hand-offs. We're a HIPAA-regulated shop so any tool we bring in has to survive a real compliance review, which is a lift.",
        },
        {
          speaker: 'seller',
          text: "That's squarely in our wheelhouse — we work with health customers and we've cleared HIPAA review at orgs your size. If it's useful, I can schedule a light demo next week, no pressure, just to show you what the platform actually does so you can judge.",
        },
        {
          speaker: 'buyer',
          text: "Let's do that. Keep it short — thirty minutes max. If it looks interesting I'll spend more time on it. I'll also want an ROI case eventually but that's a later conversation.",
        },
        {
          speaker: 'seller',
          text: "Done. I'll send a calendar hold for next Friday and a short pre-read so you're not walking in cold.",
        },
      ]),
      summary:
        'Inbound intake call with Lucius Fox, VP Operations at Wayne Enterprises. Found us online via one of his directors. Manual reconciliation pain in a HIPAA-regulated health system; agreed to a short demo and flagged ROI case as a later conversation.',
      enhancedNotes: 'Send light-demo calendar hold + pre-read; flag HIPAA early.',
      externalId: 'zoom-call-70002',
    },
    {
      id: '00000000-0000-0000-0000-eeee07000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-05-03T16:00:00Z'),
      title: 'Wayne — Light product walkthrough',
      source: 'google_meet',
      duration: 35 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['lucius.fox@wayneenterprises.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Quick framing before I share my screen — this isn't a full demo, more of a walkthrough so you can sanity-check whether it's worth a deeper discovery conversation. I'll skip the slideware and just show you the product.",
        },
        {
          speaker: 'buyer',
          text: "Appreciate that. Show me the reconciliation flow first — that's the pain point I described last week.",
        },
        {
          speaker: 'seller',
          text: "Here's a sanitized tenant from a comparable health customer. You can see how the reconciliation queue works, the audit trail on every action — which matters for your compliance review — and how the operator-facing view rolls up.",
        },
        {
          speaker: 'buyer',
          text: "The audit trail is important. Our HIPAA review will absolutely ask about who touched what record and when. Can you export that out for an auditor?",
        },
        {
          speaker: 'seller',
          text: "Yes — full audit log export, scoped by date range or user, in CSV or via API. We can also restrict PHI visibility per role. I'll include that in the security packet I send.",
        },
        {
          speaker: 'buyer',
          text: "Good. Look — this is more interesting than I expected. I'd like to schedule a deeper discovery call where I can ask the harder questions, and I want to start thinking about the ROI case in parallel.",
        },
        {
          speaker: 'seller',
          text: "Perfect. I'll send times for a longer discovery slot next week, and I'll start pulling an ROI case from a similar customer so we have something concrete to anchor on.",
        },
      ]),
      summary:
        'Light product walkthrough for Lucius Fox. Focused on reconciliation flow + audit trail; buyer confirmed audit log export will matter for HIPAA review. Agreed to schedule a deeper discovery call and to begin assembling an ROI case in parallel.',
      enhancedNotes: 'Pull ROI case from comparable health customer; book longer discovery slot.',
      externalId: 'gmeet-call-70003',
    },
    {
      id: '00000000-0000-0000-0000-eeee07000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-05-18T17:30:00Z'),
      title: 'Wayne — HIPAA / compliance Q&A',
      source: 'granola',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['lucius.fox@wayneenterprises.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I pulled our standard compliance review questionnaire — wanted to walk you through the questions I know our VP of compliance is going to ask. If you can answer most of these live I can pre-frame her before the formal HIPAA review starts.",
        },
        {
          speaker: 'seller',
          text: "Good idea. Fire away — I'd rather hit the hard questions now than have them surface six weeks into a review.",
        },
        {
          speaker: 'buyer',
          text: "First one: where does PHI live? Single-tenant, multi-tenant, US-only, sub-processors?",
        },
        {
          speaker: 'seller',
          text: "Logically isolated per tenant, physically in US-East and US-West regions, no offshore sub-processors for any PHI workload. We can give you the full sub-processor list as part of the security packet.",
        },
        {
          speaker: 'buyer',
          text: "Okay, that'll satisfy her. Next — encryption at rest, encryption in transit, key management?",
        },
        {
          speaker: 'seller',
          text: "AES-256 at rest, TLS 1.3 in transit, KMS-backed keys with optional customer-managed keys on the enterprise tier. We've passed HIPAA review at three health systems your size in the last year.",
        },
        {
          speaker: 'buyer',
          text: "Good. Last big one — and this is the one she always asks — what's your incident response and breach notification commitment?",
        },
        {
          speaker: 'seller',
          text: "Seventy-two hour notification commitment in the BAA, twenty-four hours for confirmed PHI exposure. I'll send the BAA template today so you can route it ahead of the formal compliance review. And while we're on it — that ROI case I promised is ready, I'll attach it to the same email.",
        },
      ]),
      summary:
        'Compliance Q&A with Lucius Fox ahead of the formal HIPAA review. Walked through PHI residency, encryption, and incident response. Buyer plans to pre-frame the VP of compliance before opening the formal compliance review. ROI case and BAA going out same day.',
      enhancedNotes: 'Send BAA + security packet + ROI case in single follow-up email.',
      externalId: 'granola-call-70004',
    },
    {
      id: '00000000-0000-0000-0000-eeee07000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-05-25T16:00:00Z'),
      title: 'Wayne — Stakeholder mapping conversation',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['lucius.fox@wayneenterprises.example', 'rep@findtempo.co'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "I want to spend this call entirely on stakeholder mapping — no product, no pricing. Just figuring out who needs to be in the room and when. Sound good?",
        },
        {
          speaker: 'buyer',
          text: "Yes, this is exactly the conversation I needed. I've been ad-hoc about it and it's going to bite us. Let me sketch it out for you.",
        },
        {
          speaker: 'seller',
          text: "Walk me through who you'd put in each bucket — economic buyer, technical buyer, compliance gatekeeper, end users, blockers.",
        },
        {
          speaker: 'buyer',
          text: "Economic buyer is the COO once we're over fifty thousand, but for this twenty-five-thousand pilot it's me. Technical buyer is our director of clinical IT — he hasn't been in any call yet. Compliance gatekeeper is the VP of compliance who runs HIPAA review. End users are my ops directors, two of them. Blocker is procurement — they have a vendor-onboarding process that adds about a month if you don't pre-clear it.",
        },
        {
          speaker: 'seller',
          text: "Helpful. Question — should we pull clinical IT into the next discovery conversation, or keep that one-on-one with you for now?",
        },
        {
          speaker: 'buyer',
          text: "Pull him in. He'll have technical questions I can't answer and I'd rather get them on the table now than late. I'll set up the intro this week. I'll also send the ROI case you put together over to the COO so it starts seeding internally.",
        },
        {
          speaker: 'seller',
          text: "Perfect. I'll draft a stakeholder mapping doc with everyone you named, what they care about, and the right moment to engage them — send it over tomorrow for your edits.",
        },
        {
          speaker: 'buyer',
          text: "Send it. And ping me if you want me to make any of the intros warm rather than cold — easier coming from me.",
        },
      ]),
      summary:
        'Stakeholder mapping working session with Lucius Fox. Identified economic buyer (Lucius for pilot, COO for expansion), technical buyer (director of clinical IT — not yet engaged), compliance gatekeeper (VP of compliance), end users (two ops directors), and procurement as the primary blocker. Lucius will broker warm intros and share the ROI case with the COO.',
      enhancedNotes: 'Draft stakeholder mapping doc + schedule clinical IT intro this week.',
      externalId: 'zoom-call-70005',
    },
    {
      id: '00000000-0000-0000-0000-eeee07000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000007',
      occurredAt: new Date('2026-05-30T20:00:00Z'),
      title: 'Wayne — Internal discovery debrief',
      source: 'granola',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'manager@findtempo.co', 'se@findtempo.co'],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Quick internal huddle on Wayne Enterprises — wanted to debrief discovery so far and align on next moves. We're at six touchpoints, still prospect stage, twenty-five-thousand pilot in play.",
        },
        {
          speaker: 'buyer',
          text: "Where are we on the HIPAA piece? That's the gating risk in my head.",
        },
        {
          speaker: 'seller',
          text: "I sent the BAA and security packet last week, walked Lucius through the compliance review questionnaire live. He's going to pre-frame the VP of compliance before formal review opens — so we should buy two to three weeks of cycle time there.",
        },
        {
          speaker: 'buyer',
          text: "Good. What's the ROI case look like? I want to make sure we're not just sending a generic deck.",
        },
        {
          speaker: 'seller',
          text: "Pulled the case from the comparable health customer we landed last year — same employee count, same ops footprint, hours-saved math is defensible. Lucius is going to send it up to the COO so it starts seeding before the expansion conversation.",
        },
        {
          speaker: 'buyer',
          text: "And stakeholder mapping? I don't want this to be a single-threaded deal at prospect stage.",
        },
        {
          speaker: 'seller',
          text: "That was the conversation last Monday — we've got named people in every bucket now: COO as economic buyer for expansion, clinical IT director as technical buyer, VP of compliance as gatekeeper, two ops directors as end users, procurement as the blocker. Clinical IT intro lands this week. I'd say the deal is no longer single-threaded by mid-June.",
        },
        {
          speaker: 'buyer',
          text: "Okay. My ask: keep the discovery momentum, don't let it stall waiting on compliance review. Get clinical IT in the room fast and start widening the conversation.",
        },
      ]),
      summary:
        'Internal debrief on Wayne Enterprises after the first six touchpoints. Status: HIPAA path is being pre-framed by Lucius, ROI case landed and is going up to the COO, stakeholder mapping produced named people in every bucket with clinical IT intro pending. Manager direction: keep discovery momentum, do not stall on compliance review, widen the conversation past Lucius.',
      enhancedNotes: 'Push clinical IT intro this week; do not let compliance review block discovery momentum.',
      externalId: 'granola-call-70006',
    },
  ],
};
