import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 09 — Vehement Capital Partners — Portfolio Analytics Tier closing with legal redlines
//
// Themes: pricing tier, SOC2 compliance / compliance review, integration concerns (Salesforce),
//         legal redlines / SOW, data residency
// Stage: closing  |  Amount: $560K  |  Status: closing

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000009',
    userId: USER_ID,
    name: 'Vehement Capital Partners',
    website: 'vehementcapital.example',
    externalId: 'sf-acct-009',
    providerMetadata: { industry: 'fintech', employee_count: 95 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000009',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000009',
    name: 'Vehement — Portfolio Analytics Tier',
    description:
      'Enterprise pricing tier rollout for portfolio analytics across Vehement Capital Partners. SOC2 compliance review wrapped; Salesforce integration scoping and legal SOW redlines are the remaining gating items.',
    stage: 'closing',
    amount: 56000000,
    closeDate: new Date('2026-06-22T00:00:00Z'),
    nextStep:
      'Deliver Salesforce integration scoping doc to VP Engineering by Wednesday, then circulate revised SOW after legal redlines are reconciled.',
    probability: 80,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'closing',
    stateOfDeal:
      'Large enterprise fintech deal with SOC2 compliance review and financial-services audit posture cleared. Pricing tier is locked at the enterprise level; remaining work is scoping Salesforce integration concerns and reconciling legal redlines on the SOW.',
    isVisible: true,
    emailDomains: ['vehementcapital.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc09000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      firstName: 'Marguerite',
      lastName: 'Halloran',
      email: 'marguerite.halloran@vehementcapital.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc09000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      firstName: 'Devraj',
      lastName: 'Iyengar',
      email: 'devraj.iyengar@vehementcapital.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      contactId: '00000000-0000-0000-0000-cccc09000001',
      occurredAt: new Date('2026-05-04T15:20:00Z'),
      subject: 'Re: Enterprise pricing tier — confirmed',
      bodyText:
        "Confirming we're aligned on the enterprise pricing tier at $560K annual — finance signed off this morning. The SOC2 compliance review came back clean from our auditors, which removes the last finance-side blocker. Please send the revised SOW once legal has incorporated their redlines so we can route it for signature.",
      fromAddress: 'marguerite.halloran@vehementcapital.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-vehement-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      contactId: '00000000-0000-0000-0000-cccc09000001',
      occurredAt: new Date('2026-05-12T22:05:00Z'),
      subject: 'Revised SOW — legal redlines incorporated',
      bodyText:
        "Attached is v3 of the SOW with the legal redlines from your counsel incorporated — specifically the indemnification cap, the data residency clause for EU-domiciled client data, and the SOC2 compliance review attestation language. The pricing tier and term remain unchanged from what finance confirmed last week. Let me know if your legal team wants a working session before signature, otherwise we're ready to route.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['marguerite.halloran@vehementcapital.example'],
      direction: 'outbound',
      threadId: 'thread-vehement-001',
      hasAttachments: true,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      contactId: '00000000-0000-0000-0000-cccc09000002',
      occurredAt: new Date('2026-05-14T13:42:00Z'),
      subject: 'Salesforce integration concerns before we sign',
      bodyText:
        "Following up on the integration review — my team has integration concerns about how the platform syncs into our Salesforce instance, particularly around bidirectional updates to the Opportunity object and how custom fields on the Account layout get reconciled. We also need clarity on data residency for any client portfolio data that transits through your integration layer. Can you put together a scoping doc that walks through the field mapping and the residency story so I can share it internally?",
      fromAddress: 'devraj.iyengar@vehementcapital.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-vehement-002',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      accountId: '00000000-0000-0000-0000-aaaa00000009',
      contactId: '00000000-0000-0000-0000-cccc09000002',
      occurredAt: new Date('2026-05-15T17:30:00Z'),
      subject: 'Re: Salesforce integration concerns — scoping doc proposal',
      bodyText:
        "Thanks Devraj — totally fair set of integration concerns. I'll have our solutions architect put together a Salesforce integration scoping doc covering the Opportunity and Account field mappings, the bidirectional sync behavior, and the data residency posture for client portfolio data (US-East primary, EU-West for EU-domiciled accounts). Target is to have it in your inbox by Wednesday so you can socialize it ahead of the SOW signature.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['devraj.iyengar@vehementcapital.example'],
      direction: 'outbound',
      threadId: 'thread-vehement-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee09000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-04-30T16:00:00Z'),
      title: 'Vehement — Compliance review',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time. I know the agenda is the SOC2 compliance review and the financial-services audit posture — happy to walk through both, and then we can talk about how that lands against the enterprise pricing tier we discussed last week.",
        },
        {
          speaker: 'buyer',
          text: "Yes, let's start with SOC2. Our auditors flagged three areas they want covered in the compliance review — access controls, change management, and the subprocessor list. If you can attest to all three in writing we can close that workstream today.",
        },
        {
          speaker: 'seller',
          text: "We can. Our latest SOC2 Type II report covers all three, and I'll send the bridge letter today. On the financial-services side, we're already in production with two other registered investment advisers, so the audit posture is well-trodden.",
        },
        {
          speaker: 'buyer',
          text: "Good. The other thing my CISO wants nailed down is data residency — specifically what happens to client portfolio data. We have a handful of EU-domiciled LPs and we can't have their data leaving the region.",
        },
        {
          speaker: 'seller',
          text: "Understood. Default residency is US-East, and we can pin EU-domiciled accounts to our EU-West region — that's covered in the SOW as a separate clause. I'll make sure your legal team sees that language when they do their redlines pass.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Assuming the SOC2 compliance review and the data residency clause both check out, finance is ready to sign off on the enterprise pricing tier. The remaining open item from my side is the Salesforce integration — but that's a separate conversation with Devraj.",
        },
        {
          speaker: 'seller',
          text: "Makes sense. I'll set up a dedicated integration review with Devraj for next week to surface any Salesforce-specific integration concerns before we get to SOW signature.",
        },
      ]),
      summary:
        'SOC2 compliance review and financial-services audit posture both cleared with the CFO. Data residency clause for EU-domiciled client data confirmed in the SOW; enterprise pricing tier accepted pending Salesforce integration review with VP Engineering.',
      enhancedNotes:
        'CFO ready to sign once legal redlines on SOW are reconciled; integration review scheduled with VP Eng.',
      externalId: 'gong-call-90901',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-05-09T18:00:00Z'),
      title: 'Vehement — Integration review',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for the time, Devraj. Marguerite mentioned the compliance review is wrapped and the pricing tier is locked, so today is really about working through your Salesforce integration concerns before we get to SOW signature.",
        },
        {
          speaker: 'buyer',
          text: "Right. My main integration concerns are bidirectional sync on the Opportunity object — we have a heavily customized layout — and how your platform handles our custom field on Account that tags fund vintage. If those round-trip cleanly I'm mostly satisfied.",
        },
        {
          speaker: 'seller',
          text: "We support custom field mapping out of the box, and the bidirectional sync is configurable per object. The honest gotcha on Salesforce is conflict resolution when both sides update the same record inside the sync window — we default to last-write-wins but you can flip it to source-of-truth.",
        },
        {
          speaker: 'buyer',
          text: "Source-of-truth is what we'd want, with Salesforce as the master for Opportunity. The other thing — and this came up in the compliance review too — is data residency for any client portfolio data that touches the integration layer. Where does that data live in transit?",
        },
        {
          speaker: 'seller',
          text: "The integration layer respects whatever residency you've pinned at the account level. So if you pin EU-domiciled clients to EU-West, the Salesforce sync workers in that region pick up those records — nothing crosses regions. I'll get that documented explicitly in the scoping doc.",
        },
        {
          speaker: 'buyer',
          text: "Okay, that addresses it. Can you put together a scoping doc that covers the field mapping, the conflict-resolution config, and the data residency story? I want to share it with my platform leads before we sign the SOW.",
        },
        {
          speaker: 'seller',
          text: "Yes — I'll have the scoping doc to you by Wednesday. Once you've socialized it, we can move forward with the SOW which already has the legal redlines incorporated.",
        },
        {
          speaker: 'buyer',
          text: "Sounds good. If the scoping doc lands clean, I don't see anything from engineering blocking signature.",
        },
      ]),
      summary:
        'Walked VP Engineering through Salesforce integration concerns — bidirectional sync on Opportunity, custom Account field mapping, conflict resolution, and data residency for client portfolio data. Agreed to deliver a scoping doc by Wednesday; no engineering blockers expected to SOW signature.',
      enhancedNotes:
        'VP Eng wants Salesforce as source-of-truth for Opportunity; scoping doc due Wednesday.',
      externalId: 'zoom-call-90902',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-01-27T15:00:00Z'),
      title: 'Vehement — Discovery',
      source: 'gong',
      duration: 32 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for taking the intro call. I've read the brief — you're evaluating portfolio analytics platforms ahead of a tooling consolidation. Where would you like to start?",
        },
        {
          speaker: 'buyer',
          text: "Let's start with fit. We're a 95-person fintech, registered investment adviser, and we run a lot of our LP reporting out of spreadsheets glued to Salesforce. That's not sustainable. I need a portfolio analytics layer that plugs into Salesforce and stands up to financial-services scrutiny.",
        },
        {
          speaker: 'seller',
          text: "That sounds squarely in our wheelhouse. A couple of clarifying questions — what does the buying group look like, and what would the gating items be from a security and integration standpoint?",
        },
        {
          speaker: 'buyer',
          text: "I'm the economic buyer. Devraj, our VP of Engineering, owns the Salesforce stack and would lead any integration concerns review. Our compliance officer would run a SOC2 compliance review before we sign anything. And legal will want a full pass with redlines on the MSA and SOW.",
        },
        {
          speaker: 'seller',
          text: "Understood. We have a SOC2 Type II report and a financial-services audit posture we can walk your compliance officer through. On pricing — for an org your size with the integration footprint you described, we'd be looking at our enterprise pricing tier. I'll bring an indicative range to the demo so it's not a surprise.",
        },
        {
          speaker: 'buyer',
          text: "Good. Let's set up a demo with Devraj on the call so engineering hears it at the same time. If the demo lands well I'll open up the compliance and legal workstreams in parallel.",
        },
      ]),
      summary:
        'Initial discovery with the CFO. Confirmed buying group (CFO economic buyer, VP Eng owns Salesforce integration, compliance officer runs SOC2 compliance review, legal handles redlines). Enterprise pricing tier flagged early. Demo scheduled with VP Eng attending.',
      enhancedNotes:
        'Strong inbound fit. Multi-threaded buying group already identified.',
      externalId: 'gong-call-90810',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-02-05T17:00:00Z'),
      title: 'Vehement — Demo (CFO + VP Eng)',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Today I'll run through the portfolio analytics workflows your team would live in day-to-day, then Devraj — I'll spend the back half on the Salesforce integration architecture so you can pressure-test it.",
        },
        {
          speaker: 'buyer',
          text: "Sounds good. Before you dive in — quick question on the pricing tier. Marguerite mentioned enterprise. What does that get me versus the next tier down?",
        },
        {
          speaker: 'seller',
          text: "The enterprise pricing tier unlocks the Salesforce bidirectional sync, the EU data residency option, dedicated CSM, and the SOC2 attestation package. For a 95-person fintech with LP reporting needs, anything below enterprise would gap on the integration and residency.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Devraj — anything jumping out from the integration side?",
        },
        {
          speaker: 'buyer',
          text: "A few integration concerns I want to flag now. Our Salesforce Opportunity object is heavily customized, and we tag fund vintage on Account. I'll want a deeper architecture session to walk through how those map. Also data residency — we have EU-domiciled LPs.",
        },
        {
          speaker: 'seller',
          text: "All three are addressable. Let's book a dedicated architecture deep-dive with your platform leads, and I'll loop in our security lead to walk through SOC2 and data residency on a separate session.",
        },
        {
          speaker: 'buyer',
          text: "Works for me. Marguerite, assuming the architecture session and the compliance review land cleanly, I don't see structural concerns from engineering.",
        },
        {
          speaker: 'buyer',
          text: "Great. Let's get those sessions scheduled and start the compliance review workstream in parallel.",
        },
      ]),
      summary:
        'Demo for CFO and VP Engineering. Walked product workflows and Salesforce integration architecture. Enterprise pricing tier scoped against requirements. VP Eng flagged Salesforce integration concerns (custom Opportunity layout, Account custom fields) and data residency for EU-domiciled LPs — agreed to follow-up architecture and compliance review sessions.',
      enhancedNotes:
        'Demo landed cleanly. No structural objections from VP Eng pending architecture deep-dive.',
      externalId: 'zoom-call-90815',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-02-17T16:30:00Z'),
      title: 'Vehement — Architecture deep-dive',
      source: 'google_meet',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Devraj, thanks for blocking 75 minutes. Our solutions architect Priya is on as well. The plan is to whiteboard the integration architecture end-to-end so your platform team can stress-test it before the compliance review starts.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. My biggest integration concerns are around the Salesforce sync model — specifically, what triggers writes, what the retry behavior looks like, and how you isolate tenants. We've been burned before.",
        },
        {
          speaker: 'seller',
          text: "Walking through it now. The sync runs out of a per-tenant worker pool, region-pinned for data residency. Writes are CDC-triggered from Salesforce via change events, with idempotent retries and a dead-letter queue surfaced in the admin console.",
        },
        {
          speaker: 'buyer',
          text: "Good. What about schema drift? If we add a custom field on Opportunity, what's the cycle time to surface that in your platform?",
        },
        {
          speaker: 'seller',
          text: "Schema refresh runs nightly and on-demand. Field mapping is admin-managed — new custom fields appear in the mapping UI within minutes of an on-demand refresh. No code change required on our side.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Last one — for the SOC2 compliance review, my CISO will want a network diagram and the subprocessor list. Can you share both in advance?",
        },
        {
          speaker: 'seller',
          text: "Yes. I'll send both today along with the SOC2 Type II report. We'll cover them formally in the compliance review session your team schedules.",
        },
        {
          speaker: 'buyer',
          text: "Great session. I'll let Marguerite know engineering is comfortable moving forward into the SOC2 and Salesforce scoping workstreams.",
        },
      ]),
      summary:
        'Architecture deep-dive with VP Engineering covering Salesforce sync model, retry/DLQ behavior, tenant isolation, schema drift handling, and data residency pinning. VP Eng signaled engineering comfort to move into formal SOC2 compliance review and Salesforce integration scoping workstreams.',
      enhancedNotes:
        'Engineering comfortable post-architecture session. SOC2 artifacts to be shared in advance of compliance review.',
      externalId: 'gmeet-call-90820',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-02-26T17:00:00Z'),
      title: 'Vehement — Salesforce integration scoping #1',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Goal today is to start the formal Salesforce integration scoping — enumerate objects in scope, field mappings, and the integration concerns your team has raised so far. We'll do a second technical deep-dive after this to lock the sync model.",
        },
        {
          speaker: 'buyer',
          text: "In-scope objects for v1 are Account, Opportunity, Contact, and our custom Fund object. Out of scope for v1 is the Activity history — we'll layer that in later.",
        },
        {
          speaker: 'seller',
          text: "Got it. On Opportunity, the integration concerns you flagged earlier were the custom layout and the bidirectional updates. For the scoping doc I want to confirm which fields are read-only from our side versus round-tripped.",
        },
        {
          speaker: 'buyer',
          text: "Read-only: Stage, Close Date, Amount, Owner. Round-tripped: Next Step, custom Fund Vintage field, and the LP commitment fields. Salesforce stays source-of-truth for the read-only set.",
        },
        {
          speaker: 'seller',
          text: "Perfect. And for data residency on these objects — we'll pin client portfolio data to the region you choose at the Account level. EU-domiciled accounts go to EU-West, US accounts to US-East. That handles the residency leg.",
        },
        {
          speaker: 'buyer',
          text: "Good. One more integration concern — what's the failure mode if Salesforce is down during a sync window? I don't want partial writes flowing into our analytics layer.",
        },
        {
          speaker: 'seller',
          text: "The sync is transactional at the record level. Partial-batch failures hold the batch and replay; we never half-commit a record. I'll get that explicit in the scoping doc.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Send the scoping doc once you've captured all of that and we'll book the technical deep-dive to close out the remaining items.",
        },
      ]),
      summary:
        'First Salesforce integration scoping session with VP Engineering. Enumerated in-scope objects (Account, Opportunity, Contact, custom Fund), agreed read-only vs round-tripped field sets, confirmed data residency pinning at Account level, and discussed failure-mode behavior. Second technical deep-dive scheduled.',
      enhancedNotes:
        'Field mapping draft agreed. Salesforce-as-source-of-truth confirmed for core Opportunity fields.',
      externalId: 'gong-call-90830',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-03-05T16:00:00Z'),
      title: 'Vehement — SOC2 Type II walkthrough',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Our security lead Aaron is joining for the SOC2 Type II walkthrough. The plan is to take your compliance officer's checklist top to bottom so the formal compliance review later is a rubber stamp.",
        },
        {
          speaker: 'buyer',
          text: "Good. The three areas our auditors care about most are access controls, change management, and the subprocessor list. If you can walk those in depth today we can move quickly.",
        },
        {
          speaker: 'seller',
          text: "Access controls first — SSO mandatory, MFA enforced, RBAC with least-privilege defaults, and quarterly access reviews logged in the audit trail. SOC2 Type II report has the testing evidence on page 42.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Change management?",
        },
        {
          speaker: 'seller',
          text: "Every production change goes through PR review, automated CI, staging deploy, and a signed-off release ticket. The auditors tested 30 changes in the period with zero exceptions.",
        },
        {
          speaker: 'buyer',
          text: "Subprocessor list — and specifically, anyone in the EU touching client data given the data residency requirement?",
        },
        {
          speaker: 'seller',
          text: "Subprocessor list has nine entries — I'll send the current version today. For EU-pinned tenants, only the EU-West infrastructure subprocessor touches the data; nothing crosses regions. That's also called out in the data residency clause of the SOW.",
        },
        {
          speaker: 'buyer',
          text: "Helpful. That should give my compliance officer everything she needs to schedule the formal compliance review.",
        },
      ]),
      summary:
        'SOC2 Type II walkthrough with CFO and our security lead. Covered access controls, change management, and subprocessor list against the auditor checklist. EU subprocessor mapping confirmed for data residency. Sets up the formal compliance review with their compliance officer.',
      enhancedNotes:
        'SOC2 walkthrough went clean. Compliance officer can schedule formal compliance review with confidence.',
      externalId: 'gong-call-90835',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-03-12T15:30:00Z'),
      title: 'Vehement — Financial-services audit posture review',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Today is the financial-services audit posture review. Even though SOC2 covers most of what your auditors care about, registered investment advisers have a few extra asks around recordkeeping and books-and-records access.",
        },
        {
          speaker: 'buyer',
          text: "Correct. Specifically — seven-year retention on anything that touches client communications or transaction records, and the ability to produce records on demand for an SEC exam.",
        },
        {
          speaker: 'seller',
          text: "We support configurable retention up to ten years on the enterprise pricing tier. Records-on-demand is an admin export with a chain-of-custody log. Two other RIAs are in production with the same configuration today.",
        },
        {
          speaker: 'buyer',
          text: "Good. What about the integration layer — if records flow from Salesforce through your platform, does the retention clock start on ingest or on the Salesforce-side record creation?",
        },
        {
          speaker: 'seller',
          text: "Ingest timestamp is preserved alongside the source-system timestamp. For audit purposes the SEC has accepted source-system timestamp from the Salesforce side as the authoritative date in two prior exams our customers have been through.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. That removes the financial-services audit posture as a gating item. The SOC2 compliance review and the Salesforce integration concerns are the only workstreams still open from a finance perspective.",
        },
      ]),
      summary:
        'Financial-services audit posture review with CFO. Confirmed seven-year retention, records-on-demand workflow, and authoritative timestamp handling across the Salesforce integration. Two RIA customer references for SEC-exam readiness. CFO removed audit posture as a gating item.',
      enhancedNotes:
        'Audit posture cleared. Remaining gating items from finance: SOC2 compliance review and Salesforce integration scoping.',
      externalId: 'gong-call-90840',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-03-19T16:00:00Z'),
      title: 'Vehement — Data residency review',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Dedicated data residency review session — both Marguerite and Devraj on, plus Aaron from our side. Goal is to lock the residency story end-to-end so it can be referenced in the SOC2 attestation and the SOW.",
        },
        {
          speaker: 'buyer',
          text: "From my side, the requirement is that client portfolio data for EU-domiciled LPs never leaves the EU — at rest, in transit, in logs, in backups, in support tooling. That's the bar.",
        },
        {
          speaker: 'seller',
          text: "Acknowledged. Walking through each layer — primary storage is region-pinned, replicas are intra-region, application logs are region-scoped, backups go to a region-local cold store, and our support tooling honors a residency flag that prevents cross-region reads.",
        },
        {
          speaker: 'buyer',
          text: "And the Salesforce integration layer? If a sync worker pulls an EU-pinned record, what's the residency path?",
        },
        {
          speaker: 'seller',
          text: "The sync worker that picks up an EU-pinned record runs in EU-West. The Salesforce API call originates from EU-West, the payload lands in EU storage, and nothing transits US infrastructure. We can demonstrate this with a packet-capture if your team wants that level of evidence.",
        },
        {
          speaker: 'buyer',
          text: "A packet capture would actually go a long way with our compliance officer. Can you arrange that ahead of the formal compliance review?",
        },
        {
          speaker: 'seller',
          text: "Yes — Aaron will run it next week and we'll share the artifact. Anything else open on data residency?",
        },
        {
          speaker: 'buyer',
          text: "That covers it. I want the data residency clause in the SOW to mirror exactly what we just walked through.",
        },
      ]),
      summary:
        'Data residency review with CFO and VP Engineering. Walked every layer (storage, replicas, logs, backups, support tooling, Salesforce sync workers) for EU-pinned client portfolio data. Agreed to provide packet-capture evidence ahead of the formal compliance review and to mirror the discussion in the SOW data residency clause.',
      enhancedNotes:
        'Data residency story locked. Packet-capture artifact promised for compliance review.',
      externalId: 'zoom-call-90845',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-03-26T15:30:00Z'),
      title: 'Vehement — Pen-test report review',
      source: 'gong',
      duration: 55 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Aaron is on with me for the pen-test report review. We're walking through the most recent third-party pen-test — findings, remediation status, and anything that intersects with the Salesforce integration surface.",
        },
        {
          speaker: 'buyer',
          text: "Send the executive summary first — what was the overall grade and how many criticals?",
        },
        {
          speaker: 'seller',
          text: "Zero criticals, two highs, both remediated. Five mediums, four remediated and one accepted with compensating control. The highs were both in the admin console — one auth edge case and one rate-limit gap. Full report on screen now.",
        },
        {
          speaker: 'buyer',
          text: "Walk me through the accepted medium. I need to understand the compensating control before I sign off.",
        },
        {
          speaker: 'seller',
          text: "It's a low-likelihood enumeration on a non-PII admin endpoint. Compensating control is WAF rate-limiting plus alerting on anomalous patterns. Risk owner is our CISO; re-evaluated quarterly.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Anything in the report that touches our Salesforce integration concerns specifically?",
        },
        {
          speaker: 'seller',
          text: "Nothing on the sync layer. The pen-testers exercised the integration endpoints and found no issues — that's documented on page 18. Doesn't change anything in the Salesforce scoping doc.",
        },
        {
          speaker: 'buyer',
          text: "Good. The pen-test isn't a blocker. I'll share the report with my CISO so it's in hand before the formal compliance review.",
        },
      ]),
      summary:
        'Pen-test report review with VP Engineering and our security lead. Zero criticals, two highs (both remediated), one accepted medium with documented compensating control. No findings against the Salesforce integration surface. Report shared with their CISO ahead of the formal compliance review.',
      enhancedNotes:
        'Pen-test cleared. Salesforce integration surface untouched in findings.',
      externalId: 'gong-call-90850',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-04-02T20:00:00Z'),
      title: 'Vehement — Internal forecast review',
      source: 'gong',
      duration: 28 * 60,
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
          text: "Vehement update for the forecast — $560K on the enterprise pricing tier, closing in Q2. Pen-test report cleared this week, SOC2 walkthrough done, data residency story locked. Three workstreams left: formal compliance review, Salesforce integration scoping deep-dive, and legal redlines on MSA and SOW.",
        },
        {
          speaker: 'buyer',
          text: "What's your confidence on the close date? You're forecasting June 22 — is that still real?",
        },
        {
          speaker: 'seller',
          text: "Real. CFO is the economic buyer and she's been ready to move since the financial-services audit posture review. The pacing is governed by legal redlines and the Salesforce scoping doc — both have firm owners and dates.",
        },
        {
          speaker: 'buyer',
          text: "Where's the risk? If something slips, where would it slip?",
        },
        {
          speaker: 'seller',
          text: "Two risks. First, legal redlines on the MSA — their counsel hasn't seen our paper yet, and we know they're heavy on indemnification language. Second, if any new Salesforce integration concerns surface in the second technical deep-dive that we haven't already addressed. Mitigation on the first is sending paper early; on the second, the architecture session already de-risked it.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Keep it at commit. Loop me in if legal redlines look messy when they come back.",
        },
        {
          speaker: 'seller',
          text: "Will do.",
        },
      ]),
      summary:
        'Internal forecast review with manager. $560K enterprise pricing tier deal held at commit for Q2 close. Risks identified: legal redlines on MSA (heavy indemnification expected) and any new Salesforce integration concerns surfacing in the second technical deep-dive. Mitigations in place for both.',
      enhancedNotes:
        'Held at commit. Manager wants visibility once legal redlines come back.',
      externalId: 'gong-call-90855',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-04-09T15:00:00Z'),
      title: 'Vehement — Pricing walkthrough (enterprise tier scope)',
      source: 'gong',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Formal pricing walkthrough today. I'll cover what's in scope at the enterprise pricing tier, the year-one number, and the multi-year option so finance has everything for sign-off.",
        },
        {
          speaker: 'buyer',
          text: "Go ahead. I want a clear line-of-sight from the SKUs to the $560K so I can defend it to my CEO.",
        },
        {
          speaker: 'seller',
          text: "Enterprise pricing tier base is $420K — that covers the platform, unlimited users, Salesforce bidirectional sync, EU data residency, dedicated CSM, and the SOC2 attestation package. Add-ons are the financial-services compliance module at $90K and premium support at $50K.",
        },
        {
          speaker: 'buyer',
          text: "Both add-ons are needed?",
        },
        {
          speaker: 'seller',
          text: "The compliance module is what gives you the seven-year retention and records-on-demand workflow we walked through in the financial-services audit posture review. Premium support is optional — but at your scale and given the Salesforce integration footprint, customers in your segment have all opted in.",
        },
        {
          speaker: 'buyer',
          text: "Keep both. What about a multi-year discount? My CFO peers tell me that's available.",
        },
        {
          speaker: 'seller',
          text: "A two-year commit unlocks 8% off year two; a three-year unlocks 12% off years two and three. We can layer that into the SOW if you want it called out as an option without committing today.",
        },
        {
          speaker: 'buyer',
          text: "Layer it in as an option. We'll likely take the two-year. Pricing tier is locked from my side — now it's compliance review and legal redlines closing us out.",
        },
      ]),
      summary:
        'Pricing walkthrough with CFO. Enterprise pricing tier $420K base plus financial-services compliance module ($90K) and premium support ($50K) = $560K year one. Multi-year discount option layered into the SOW for optionality. CFO confirmed pricing locked; remaining workstreams are formal compliance review and legal redlines.',
      enhancedNotes:
        'Pricing tier locked at $560K with multi-year option for years two/three.',
      externalId: 'gong-call-90860',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000013',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-04-16T14:00:00Z'),
      title: 'Vehement — Champion 1:1 with CFO',
      source: 'gong',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Quick informal check-in — no agenda except making sure you have what you need to drive this to signature on your side. Anything bubbling up I should know about?",
        },
        {
          speaker: 'buyer',
          text: "Two things. First, my CEO asked me at the partner meeting how we'd defend the enterprise pricing tier to the board. I have the math now from the pricing walkthrough but it would help to have a one-pager I can hand him.",
        },
        {
          speaker: 'seller',
          text: "Easy — I'll get you a one-pager keyed to your numbers by tomorrow. What's the second thing?",
        },
        {
          speaker: 'buyer',
          text: "Our legal team is going to be heavy on redlines. Specifically I expect them to push on the indemnification cap, the data residency clause, and the SOC2 attestation language. If you can prep your counsel for those three, we'll move faster.",
        },
        {
          speaker: 'seller',
          text: "Noted — I'll brief our counsel today. On the data residency clause specifically, the language already mirrors what we walked through in the residency review, so that one should be quick.",
        },
        {
          speaker: 'buyer',
          text: "Good. Last thing — Devraj wants one more Salesforce technical deep-dive before he signs off. I told him to schedule it directly with you. No new integration concerns, just due diligence on the sync model.",
        },
        {
          speaker: 'seller',
          text: "Already on the calendar for mid-May. Anything else before we wrap?",
        },
        {
          speaker: 'buyer',
          text: "That's it. Send the one-pager and we'll keep moving.",
        },
      ]),
      summary:
        'Informal champion 1:1 with CFO. Requested a board-ready one-pager defending the enterprise pricing tier. Pre-briefed on expected legal redlines around indemnification cap, data residency clause, and SOC2 attestation. Confirmed VP Engineering wants one more Salesforce technical deep-dive — no new integration concerns, just due diligence.',
      enhancedNotes:
        'CFO actively coaching us. One-pager owed; counsel pre-brief in flight.',
      externalId: 'gong-call-90865',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000014',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-05-14T16:00:00Z'),
      title: 'Vehement — Salesforce integration scoping #2 (technical deep-dive)',
      source: 'google_meet',
      duration: 65 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Second Salesforce integration scoping session — technical deep-dive. Priya's on with me. Goal is to walk the sync model end-to-end against your real Salesforce metadata so any remaining integration concerns surface today, not at signature.",
        },
        {
          speaker: 'buyer',
          text: "Good. I pulled the metadata for Account, Opportunity, Contact, and the Fund object. Let's walk each one and confirm the field-by-field mapping matches what was in the v1 scoping doc.",
        },
        {
          speaker: 'seller',
          text: "Starting with Opportunity — your custom Fund Vintage field maps to our fund_vintage attribute, round-tripped, Salesforce as source-of-truth. Stage, Close Date, Amount, Owner all read-only on our side. Next Step is round-tripped.",
        },
        {
          speaker: 'buyer',
          text: "Confirmed. One refinement — we just added a Stage 2 custom field for ESG flag. Can the mapping be added without a deploy on your side?",
        },
        {
          speaker: 'seller',
          text: "Yes — admin-managed via the schema refresh we walked through in the architecture session. ESG flag will be available in the mapping UI within minutes of an on-demand refresh.",
        },
        {
          speaker: 'buyer',
          text: "Account next. The Fund Vintage tag on Account is the one I really care about — that field drives our LP cohort analytics.",
        },
        {
          speaker: 'seller',
          text: "Mapped as round-tripped, Salesforce source-of-truth, propagates to the cohort analytics within five minutes of a Salesforce write. Same residency pinning we discussed — EU-domiciled Accounts stay in EU-West throughout the sync.",
        },
        {
          speaker: 'buyer',
          text: "Last one — what's your rollback story if a sync run goes sideways? I want to know what 'undo' looks like.",
        },
        {
          speaker: 'seller',
          text: "Each sync run is versioned. Admin console lets you roll back to the prior snapshot per object, scoped to a time window. We've never had to use it in anger but it's there.",
        },
        {
          speaker: 'buyer',
          text: "Okay. No new integration concerns. Salesforce scoping is closed from engineering. I'll write that up for Marguerite so legal can finalize the SOW.",
        },
      ]),
      summary:
        'Second Salesforce integration scoping session — full technical deep-dive against real Salesforce metadata. Walked Account, Opportunity, Contact, and custom Fund object field-by-field. Confirmed ESG flag and Fund Vintage mappings, residency pinning, and rollback semantics. VP Engineering declared Salesforce scoping closed with no new integration concerns.',
      enhancedNotes:
        'Salesforce scoping closed from engineering side. Cleared for SOW finalization.',
      externalId: 'gmeet-call-90870',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000015',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-05-18T15:00:00Z'),
      title: 'Vehement — Multi-stakeholder alignment (CFO + VP Eng + compliance)',
      source: 'zoom',
      duration: 55 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'devraj.iyengar@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Alignment call with the full buying group — Marguerite, Devraj, and your compliance officer Selene. Goal is to confirm we're at the same place on all four workstreams: pricing tier, SOC2 compliance review, Salesforce integration, and legal redlines.",
        },
        {
          speaker: 'buyer',
          text: "From finance — pricing tier is locked at $560K with the two-year option layered in. Financial-services audit posture cleared. The only thing I need is the SOW with legal redlines reconciled.",
        },
        {
          speaker: 'buyer',
          text: "From engineering — Salesforce integration scoping is closed. No remaining integration concerns. Devraj has signed off internally.",
        },
        {
          speaker: 'buyer',
          text: "From compliance — Selene here. The SOC2 compliance review came back clean. Data residency story for our EU-domiciled LPs is documented, and the pen-test report has been reviewed. I'm a yes.",
        },
        {
          speaker: 'seller',
          text: "Then the only open workstream is the legal redlines on the MSA and SOW. Our counsel has the first pass back from yours; we're scheduling the legal redlines walkthrough for later this week.",
        },
        {
          speaker: 'buyer',
          text: "Good. Once legal redlines are reconciled and the SOW is countersigned, we're done. Targeting signature by the 22nd of June so we hit the quarter.",
        },
        {
          speaker: 'seller',
          text: "Confirmed. I'll send the consolidated workstream tracker so everyone has the same status before the legal session.",
        },
      ]),
      summary:
        'Full buying-group alignment call (CFO, VP Engineering, compliance officer). All non-legal workstreams confirmed closed — pricing tier locked, Salesforce integration scoping closed, SOC2 compliance review and data residency cleared by compliance. Only remaining work is the legal redlines walkthrough on MSA and SOW.',
      enhancedNotes:
        'Three of four workstreams closed. Legal redlines only remaining gate.',
      externalId: 'zoom-call-90875',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000016',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-05-22T17:00:00Z'),
      title: 'Vehement — Legal redlines walkthrough #1 (MSA)',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Legal redlines walkthrough on the MSA. Our counsel Jonas is on. We have your counsel's redline document in front of us — let's go section by section.",
        },
        {
          speaker: 'buyer',
          text: "My counsel Owen is on as well. Main asks in our redlines are the indemnification cap, the limitation of liability carve-outs, and the termination-for-convenience window.",
        },
        {
          speaker: 'seller',
          text: "Indemnification first — your redlines move the cap from 1x annual fees to 2x. We can accept 1.5x as a midpoint, which is consistent with our other financial-services customers.",
        },
        {
          speaker: 'buyer',
          text: "1.5x works. Next is the carve-out language — we want explicit carve-outs for breach of confidentiality and breach of data security obligations, no cap on those.",
        },
        {
          speaker: 'seller',
          text: "Already in our standard paper but Jonas will confirm. Yes — uncapped carve-outs for confidentiality breach and security breach are accepted.",
        },
        {
          speaker: 'buyer',
          text: "Termination for convenience — your paper has 90 days, we asked for 60. Anywhere in between is fine.",
        },
        {
          speaker: 'seller',
          text: "75 days. Done. That's the MSA. The other half of the legal redlines — SOW and DPA — we'll cover next week.",
        },
        {
          speaker: 'buyer',
          text: "Agreed. I'll have Owen turn the MSA around as final-form within 48 hours.",
        },
      ]),
      summary:
        'Legal redlines walkthrough #1 on the MSA. Reconciled three open items: indemnification cap (1.5x annual fees), confidentiality and security breach carve-outs (uncapped, accepted), and termination-for-convenience window (75 days). MSA going to final-form within 48 hours. SOW and DPA covered next week.',
      enhancedNotes:
        'MSA legal redlines reconciled. SOW + DPA walkthrough next.',
      externalId: 'gong-call-90880',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000017',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-05-28T16:00:00Z'),
      title: 'Vehement — Legal redlines walkthrough #2 (SOW + DPA)',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'marguerite.halloran@vehementcapital.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Second legal redlines walkthrough — SOW and DPA. Both counsels on again. We have the v3 SOW with your redlines incorporated and the DPA draft.",
        },
        {
          speaker: 'buyer',
          text: "Owen here. On the SOW the open items are the data residency clause wording, the SOC2 attestation language, and the multi-year discount being clearly optional, not committed.",
        },
        {
          speaker: 'seller',
          text: "Data residency clause now reads verbatim from the residency review session — EU-domiciled accounts pinned to EU-West, no cross-region transit, packet-capture artifact attached as Exhibit C. Acceptable?",
        },
        {
          speaker: 'buyer',
          text: "Acceptable. SOC2 attestation language?",
        },
        {
          speaker: 'seller',
          text: "Updated to reference the SOC2 Type II report by date and to commit to annual bridge letters during the term. Standard language we use with the other RIAs.",
        },
        {
          speaker: 'buyer',
          text: "Good. Multi-year option — make sure that's clearly an option not a commitment.",
        },
        {
          speaker: 'seller',
          text: "Clause is in the optional-services appendix with explicit 'at customer's election' language. Jonas, confirm?",
        },
        {
          speaker: 'buyer',
          text: "DPA — the only redline on our side is the subprocessor change-notification window. You have 30 days, we want 60.",
        },
        {
          speaker: 'seller',
          text: "Accepted — 60 days. That closes the legal redlines workstream. Once Marguerite has the final-form SOW and DPA in hand alongside the MSA, we're at signature.",
        },
        {
          speaker: 'buyer',
          text: "I'll route all three for countersignature as soon as final-form lands. Targeting next week.",
        },
      ]),
      summary:
        'Legal redlines walkthrough #2 covering SOW and DPA. Resolved data residency clause wording (mirrors residency review, packet-capture as Exhibit C), SOC2 attestation language, multi-year option being explicitly optional, and DPA subprocessor change-notification window (extended to 60 days). All legal redlines closed; MSA + SOW + DPA going to final-form for countersignature.',
      enhancedNotes:
        'All legal redlines closed. Final-form documents going for countersignature.',
      externalId: 'gong-call-90885',
    },
    {
      id: '00000000-0000-0000-0000-eeee09000018',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000009',
      occurredAt: new Date('2026-06-04T19:00:00Z'),
      title: 'Vehement — Internal deal review',
      source: 'gong',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
        'vp-sales@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Final internal deal review on Vehement ahead of the executive sponsor call next week. State of the deal — $560K enterprise pricing tier, all four workstreams closed: pricing tier, SOC2 compliance review, Salesforce integration scoping, and legal redlines on MSA, SOW, and DPA.",
        },
        {
          speaker: 'buyer',
          text: "Anything outstanding? Any reason this slips past June 22?",
        },
        {
          speaker: 'seller',
          text: "Nothing outstanding from our side. Final-form documents are at their counsel for countersignature this week. CFO has committed to routing for signature as soon as final-form lands.",
        },
        {
          speaker: 'buyer',
          text: "What about the multi-year — are they taking it?",
        },
        {
          speaker: 'seller',
          text: "Indicated yes on the two-year at the alignment call, but it's structured as optional in the SOW so we'll know definitively at countersignature. Either way the year-one number is $560K.",
        },
        {
          speaker: 'buyer',
          text: "Good work multi-threading this one. The compliance review and the Salesforce integration scoping were the right places to spend time. Let's keep tight execution through close — nothing fancy in the executive sponsor call, just relationship.",
        },
        {
          speaker: 'seller',
          text: "Agreed. Executive sponsor call is on the calendar — Marguerite and our VP. Implementation planning preview is scheduled for the week after signature so handoff to CS is clean.",
        },
        {
          speaker: 'buyer',
          text: "Forecast this as commit-plus. Good to go.",
        },
      ]),
      summary:
        'Internal deal review with manager and VP Sales. All workstreams closed — pricing tier locked, SOC2 compliance review cleared, Salesforce integration scoping done, legal redlines (MSA + SOW + DPA) reconciled. Final-form documents at customer counsel for countersignature. Moved to commit-plus forecast. Executive sponsor call and implementation planning preview scheduled.',
      enhancedNotes:
        'Commit-plus. Clean execution through close; nothing outstanding from our side.',
      externalId: 'gong-call-90890',
    },
  ],
};
