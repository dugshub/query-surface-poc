import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 05 — Massive Dynamic — Enterprise SaaS, security review in progress
//
// Themes: SOC2 compliance, data residency, procurement involvement, multi-tenant isolation
// Stage: presenting  |  Amount: $320K  |  Status: healthy

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000005',
    userId: USER_ID,
    name: 'Massive Dynamic',
    website: 'massivedynamic.example',
    externalId: 'sf-acct-005',
    providerMetadata: { industry: 'saas', employee_count: 400 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000005',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000005',
    name: 'Massive Dynamic — Enterprise Tier',
    description:
      'Enterprise Tier deal with Massive Dynamic. Active SOC2 compliance review with the CISO office; procurement involvement underway on contract terms; open questions on EU/US data residency and multi-tenant isolation concerns.',
    stage: 'presenting',
    amount: 32000000,
    closeDate: new Date('2026-08-15T00:00:00Z'),
    nextStep: 'Deliver SOC2 Type 2 report + sub-processor list, by Friday',
    probability: 45,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'healthy',
    stateOfDeal:
      "Security review (SOC2) in progress with the CISO's team and procurement is engaged on contract terms. Data residency requirements (EU + US separation) are being discussed alongside multi-tenant isolation concerns from engineering.",
    isVisible: true,
    emailDomains: ['massivedynamic.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc05000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000005',
      firstName: 'Nina',
      lastName: 'Sharp',
      email: 'nina.sharp@massivedynamic.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc05000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000005',
      firstName: 'Brandon',
      lastName: 'Fayette',
      email: 'brandon.fayette@massivedynamic.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      accountId: '00000000-0000-0000-0000-aaaa00000005',
      contactId: '00000000-0000-0000-0000-cccc05000001',
      occurredAt: new Date('2026-04-29T13:45:00Z'),
      subject: 'SOC2 compliance review — documentation request',
      bodyText:
        "Following yesterday's call, my team is opening the formal SOC2 compliance review on our side. Please send the latest SOC2 Type 2 report, your sub-processor list, and any documentation you have on multi-tenant isolation at the storage layer. We will also need a written statement on data residency — specifically how EU customer data is kept separate from US workloads. Procurement is looped in and will reach out separately on contract terms.",
      fromAddress: 'nina.sharp@massivedynamic.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-massive-dynamic-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      accountId: '00000000-0000-0000-0000-aaaa00000005',
      contactId: '00000000-0000-0000-0000-cccc05000001',
      occurredAt: new Date('2026-04-30T16:20:00Z'),
      subject: 'Re: SOC2 compliance review — documentation request',
      bodyText:
        "Nina — attaching our SOC2 Type 2 report, sub-processor list, and a short architecture note covering multi-tenant isolation (per-tenant encryption keys, logical DB separation, network policy boundaries). On data residency: EU tenants run in our Frankfurt region with no cross-region replication into US infrastructure; happy to walk Brandon's team through the topology on a follow-up. Let me know what else procurement needs and I'll get it over today.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['nina.sharp@massivedynamic.example'],
      direction: 'outbound',
      threadId: 'thread-massive-dynamic-001',
      hasAttachments: true,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      accountId: '00000000-0000-0000-0000-aaaa00000005',
      occurredAt: new Date('2026-05-04T18:10:00Z'),
      subject: 'Massive Dynamic procurement — contract terms questions',
      bodyText:
        "Hi — I'm Janet from Massive Dynamic procurement, looped in by Nina Sharp on the Enterprise Tier engagement. We have a few standard items before we can move forward: data residency language in the DPA, an uptime SLA with credits, and a clause covering notice of any sub-processor changes. Can you send your current MSA + DPA templates this week so we can mark them up? Procurement involvement on our side typically adds 2–3 weeks once we have the redlines.",
      fromAddress: 'janet.tubbs@massivedynamic.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-massive-dynamic-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee05000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-04-28T15:00:00Z'),
      title: 'Massive Dynamic — Security review',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'brandon.fayette@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "Thanks for making time. I want to keep today focused on the SOC2 compliance review — my team needs to sign off before procurement can move. Brandon's also here from engineering with isolation concerns I want him to raise directly.",
        },
        {
          speaker: 'seller',
          text: "Makes sense. I have our SOC2 Type 2 report ready to send, and I can walk through the control mapping at whatever depth you want. Where do you want to start — controls, sub-processors, or the data residency piece?",
        },
        {
          speaker: 'buyer',
          text: "Data residency first. We sell into the EU and the US, and our policy is that EU customer data cannot transit US infrastructure, even for backups. How is that handled in your multi-tenant setup?",
        },
        {
          speaker: 'seller',
          text: "Two separate regional deployments — Frankfurt for EU, us-east for US. No cross-region replication. Each region has its own object store, its own KMS keys, its own backup pipeline. Tenants are pinned to a region at provisioning and we don't move them.",
        },
        {
          speaker: 'buyer',
          text: "Brandon, this is the multi-tenant isolation piece you flagged — go ahead.",
        },
        {
          speaker: 'buyer',
          text: "Yeah, my isolation concerns are mostly at the data plane. You're multi-tenant per database, right? What stops a bad query from one tenant pulling another tenant's rows? I've seen row-level security bypassed before when an ORM gets clever.",
        },
        {
          speaker: 'seller',
          text: "Fair concern. We use row-level security in Postgres plus a per-tenant encryption key at the application layer — even if RLS were bypassed, the rows decrypt to garbage without the right key. I can share the threat model doc; it covers exactly that scenario.",
        },
        {
          speaker: 'buyer',
          text: "Okay, send that with the SOC2 report. Last thing — procurement involvement is going to be heavier on this one because of the dollar size. Janet will email you about DPA and MSA redlines this week. Realistically we're looking at end of July to close if security and procurement both move clean.",
        },
      ]),
      summary:
        "Security review call covering SOC2 compliance, EU/US data residency separation, and multi-tenant isolation concerns from engineering. Buyer agreed to proceed once SOC2 Type 2 report, sub-processor list, and threat model are delivered; procurement involvement will follow on DPA/MSA redlines targeting a late-July close.",
      enhancedNotes:
        'Next step: send SOC2 Type 2 + sub-processor list + multi-tenant threat model by Friday; expect procurement DPA/MSA redlines next week.',
      externalId: 'gong-call-50051',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-03-02T16:00:00Z'),
      title: 'Massive Dynamic — Discovery',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Appreciate you taking the intro call, Nina. I want to understand your current stack, pain points, and what a 'good' evaluation looks like for the CISO office before we go further.",
        },
        {
          speaker: 'buyer',
          text: "Sure. We're 400 people, mostly SaaS, with a mature security org. Anything new that touches customer data goes through a SOC2 compliance review on our side, plus a separate data residency check because we have EU customers under contract for in-region storage.",
        },
        {
          speaker: 'seller',
          text: "Got it. What's pushing you to look right now — replacing something, or net-new capability?",
        },
        {
          speaker: 'buyer',
          text: "Net-new. Engineering wants to roll this out to four product teams, which means multi-tenant isolation inside our org matters too — we don't want team A able to see team B's data. And expect procurement involvement at this dollar range; legal is going to want DPA redlines.",
        },
        {
          speaker: 'seller',
          text: "Understood. I'll plan two security sessions and a procurement intake, and bring our SOC2 Type 2 report to the first one.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Brandon Fayette from engineering will join the technical sessions. He's the gatekeeper on the isolation question.",
        },
      ]),
      summary:
        'Discovery call with CISO Nina Sharp. Established that any evaluation requires a formal SOC2 compliance review, data residency check for EU customers, and procurement involvement on DPA terms. Engineering lead Brandon Fayette to join technical sessions on multi-tenant isolation.',
      enhancedNotes:
        'Map deal plan to three workstreams: security (SOC2 + isolation), legal/procurement (DPA), and EU residency. Loop Brandon into technical sessions.',
      externalId: 'gong-call-50010',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-03-10T17:00:00Z'),
      title: 'Massive Dynamic — Initial product demo',
      source: 'zoom',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'brandon.fayette@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "I'll do a 20-minute product walkthrough, then leave time for technical questions. Stop me anytime.",
        },
        {
          speaker: 'buyer',
          text: "Before you start — Brandon and I both want to flag that anything you show today, we're going to want to see how it maps to SOC2 controls and multi-tenant isolation guarantees later. Just so you know what we're listening for.",
        },
        {
          speaker: 'seller',
          text: "Noted. I'll call out the controls inline where they're relevant.",
        },
        {
          speaker: 'buyer',
          text: "On the admin screen — when you say 'workspace' here, is each workspace its own tenant from your platform's perspective? Or is it logical only?",
        },
        {
          speaker: 'seller',
          text: "Each workspace is a logical tenant with its own encryption key. Storage is shared multi-tenant, with row-level security plus per-tenant key envelope encryption. We'll go deep on that in the architecture session.",
        },
        {
          speaker: 'buyer',
          text: "Okay. And data residency — if I provision an EU workspace today, you're telling me nothing about it ever lands in a US region, including logs?",
        },
        {
          speaker: 'seller',
          text: "Correct. Logs stay in-region. The only cross-region traffic is anonymized product usage metrics, and we can disable that per tenant.",
        },
        {
          speaker: 'buyer',
          text: "Good. Send your SOC2 Type 2 report ahead of the next call so we can pre-read.",
        },
      ]),
      summary:
        'Initial product demo. Buyer pre-framed every feature against SOC2 controls and multi-tenant isolation. Confirmed each workspace is a logical tenant with per-tenant encryption keys and that EU data residency holds for logs as well as primary data.',
      enhancedNotes:
        'Send SOC2 Type 2 report before next session. Schedule security architecture deep-dive #1 within two weeks.',
      externalId: 'gong-call-50018',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-03-18T15:30:00Z'),
      title: 'Massive Dynamic — Security architecture deep-dive #1',
      source: 'zoom',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'security-team@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I have two of my security engineers on this one. We're going to grill you on the SOC2 controls and how they actually map to running code. Compliance review on our side is paperwork-heavy, so we'd rather find gaps now than in week six.",
        },
        {
          speaker: 'seller',
          text: "Absolutely. I'll share screen and pull up the controls matrix.",
        },
        {
          speaker: 'buyer',
          text: "Start with access control. CC6 — how do you enforce least privilege for your own engineers touching production where our data sits?",
        },
        {
          speaker: 'seller',
          text: "No standing production access. Every prod action goes through a break-glass system with a Jira ticket, manager approval, and an automatic 4-hour expiry. All sessions are recorded and reviewed weekly.",
        },
        {
          speaker: 'buyer',
          text: "And the recordings — those are kept how long, and where? If they include EU tenant data on screen, data residency rules apply.",
        },
        {
          speaker: 'seller',
          text: "Stored in-region, 90 days, encrypted with a separate KMS key. EU sessions stay in Frankfurt.",
        },
        {
          speaker: 'buyer',
          text: "Good. Next — change management. Who can deploy to prod, and how is that tied back to SOC2 evidence?",
        },
        {
          speaker: 'seller',
          text: "All deploys go through CI with two-person approval on anything touching the data plane. We export the approval log nightly into our SOC2 evidence vault — auditor can pull it directly.",
        },
        {
          speaker: 'buyer',
          text: "Okay. Let's set up a second session focused purely on multi-tenant isolation and the data plane — that's the part Brandon cares about most.",
        },
      ]),
      summary:
        "Security architecture deep-dive with CISO and two security engineers focused on SOC2 controls: access control (CC6), break-glass production access, in-region session recording, and change management evidence. Compliance review proceeding cleanly; second session scheduled to cover multi-tenant isolation in detail.",
      enhancedNotes:
        'No blocking findings. Schedule architecture deep-dive #2 for multi-tenant isolation with Brandon Fayette.',
      externalId: 'gong-call-50027',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-03-25T16:00:00Z'),
      title: 'Massive Dynamic — Security architecture deep-dive #2 (multi-tenant isolation)',
      source: 'zoom',
      duration: 90 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'brandon.fayette@massivedynamic.example',
        'nina.sharp@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I want to spend this whole session on multi-tenant isolation. Pretend I'm hostile and walk me through every layer where one tenant could touch another tenant's data.",
        },
        {
          speaker: 'seller',
          text: "Fair. Four layers: network, application, database, and storage. I'll go through each with the attack and the control.",
        },
        {
          speaker: 'buyer',
          text: "Start with the database layer. That's where I've seen the most real incidents in multi-tenant systems.",
        },
        {
          speaker: 'seller',
          text: "Postgres with row-level security policies tied to a tenant_id claim in the JWT. Every connection sets a session GUC for tenant context; RLS policies reject any query that doesn't match. We have property-based tests that fuzz this on every PR.",
        },
        {
          speaker: 'buyer',
          text: "RLS gets bypassed when someone runs as a superuser or via a connection pool that doesn't re-set the GUC. How do you handle the pooler case?",
        },
        {
          speaker: 'seller',
          text: "Transaction-mode pooling with a RESET at transaction boundary, plus the application enforces the tenant claim on every query via the ORM middleware. Even if both layers failed, the row payloads are encrypted per-tenant — the bytes returned would be garbage without the right key.",
        },
        {
          speaker: 'buyer',
          text: "Defense in depth, fine. What about the storage layer — S3 buckets, object isolation?",
        },
        {
          speaker: 'seller',
          text: "One bucket per region, prefix-isolated per tenant, bucket policy denies any cross-tenant prefix access via IAM condition keys. Pre-signed URLs are scoped to tenant prefix and expire in 15 minutes.",
        },
        {
          speaker: 'buyer',
          text: "Okay. This is the cleanest multi-tenant story I've seen this quarter. Send the threat model doc and I'll close out the isolation portion of the compliance review.",
        },
        {
          speaker: 'seller',
          text: "Will do — sending today.",
        },
      ]),
      summary:
        "Deep technical session on multi-tenant isolation with Brandon Fayette (Director of Engineering) and CISO Nina Sharp. Walked through network, application, database (RLS + pooler), and storage layers. Brandon called it 'the cleanest multi-tenant story I've seen this quarter' and agreed to close the isolation portion of the compliance review on receipt of the threat model doc.",
      enhancedNotes:
        'Send threat model doc same day. Isolation portion of compliance review effectively closed pending document delivery.',
      externalId: 'gong-call-50034',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-04-02T15:00:00Z'),
      title: 'Massive Dynamic — SOC2 Type 2 report walkthrough',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'auditor-liaison@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "We've read the SOC2 Type 2 report end to end. I want to walk through the four exceptions noted in section IV and understand the remediation status for each.",
        },
        {
          speaker: 'seller',
          text: "Happy to. None are CC6 or CC7 — they're all in CC1 (org governance) and CC8 (change). All four are closed as of last month; I have the remediation evidence.",
        },
        {
          speaker: 'buyer',
          text: "Walk me through the CC8 exception — the one about deploy approvals.",
        },
        {
          speaker: 'seller',
          text: "Auditor found two deploys in the sample where the second approver was the same person as the author due to a bot misconfiguration. We fixed the bot, added a CI check that fails the deploy if author == approver, and back-tested the prior 90 days — no other instances.",
        },
        {
          speaker: 'buyer',
          text: "Good. Send the bridge letter from the auditor confirming remediation and we can call the SOC2 portion of the compliance review done.",
        },
        {
          speaker: 'seller',
          text: "Bridge letter is signed; I'll send it after this call.",
        },
        {
          speaker: 'buyer',
          text: "Then we move to the compliance officer's review next week, then procurement.",
        },
      ]),
      summary:
        "SOC2 Type 2 report walkthrough. All four auditor exceptions are remediated; bridge letter to be sent same day. SOC2 portion of the compliance review effectively closed; next stop is the compliance officer review followed by procurement involvement.",
      enhancedNotes:
        'Send signed bridge letter today. SOC2 portion of compliance review closed pending letter delivery.',
      externalId: 'gong-call-50042',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-04-09T14:00:00Z'),
      title: 'Massive Dynamic — Compliance review (CISO + Compliance officer)',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'compliance-officer@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I'm joining as the compliance officer. Nina has signed off on the SOC2 side; my job is to cover the regulatory pieces — GDPR, data residency, and breach-notification timelines.",
        },
        {
          speaker: 'seller',
          text: "Understood. I have our DPA template open and the data residency architecture diagram if we need to pull it up.",
        },
        {
          speaker: 'buyer',
          text: "Start with data residency. Our EU operating entity contracts require that EU personal data does not leave the EEA, including for support access. How do you handle support?",
        },
        {
          speaker: 'seller',
          text: "Support is staffed by an EU team for EU tenants; access tickets enforce the same regional pinning as the data plane. A US support engineer cannot open a session into an EU tenant — the IAM policy denies it.",
        },
        {
          speaker: 'buyer',
          text: "Good. What about your sub-processors — do any of them process EU data outside the EEA?",
        },
        {
          speaker: 'seller',
          text: "No. Our sub-processor list segregates by region; the EU sub-processors are all EEA-based and listed in the DPA exhibit.",
        },
        {
          speaker: 'buyer',
          text: "Breach notification?",
        },
        {
          speaker: 'seller',
          text: "Contractual 48 hours from confirmed incident, with a preliminary notice within 24 hours of detection. Both are in the DPA.",
        },
        {
          speaker: 'buyer',
          text: "That works. From the compliance side I'm a yes pending DPA redlines, which procurement will own.",
        },
      ]),
      summary:
        "Compliance review with CISO and Compliance Officer covering GDPR, EU data residency including support access, sub-processor regional segregation, and breach notification timelines. Compliance officer is a yes pending DPA redlines through procurement.",
      enhancedNotes:
        'Compliance review effectively complete. Hand off to procurement for DPA redlines.',
      externalId: 'gong-call-50050',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-04-16T15:00:00Z'),
      title: 'Massive Dynamic — Data residency deep-dive (EU/US separation)',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'brandon.fayette@massivedynamic.example',
        'eu-platform-lead@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I run the EU platform team at Massive Dynamic. I want to verify the data residency story end to end before we move any EU tenants onto your platform.",
        },
        {
          speaker: 'seller',
          text: "Of course. The short version: two fully independent regional deployments, Frankfurt and us-east, with zero data plane crossover.",
        },
        {
          speaker: 'buyer',
          text: "Walk me through every place where data could theoretically cross. Backups, logs, metrics, support, billing, anything.",
        },
        {
          speaker: 'seller',
          text: "Backups: stay in-region, encrypted with regional KMS. Logs: shipped to a regional logging cluster, 30-day retention, never replicated. Product metrics: anonymized counters only, and disable-able per tenant. Support: regional staffing as discussed. Billing: tenant metadata only, no customer payload, lives in US but contains no personal data.",
        },
        {
          speaker: 'buyer',
          text: "The billing piece — tenant metadata includes what exactly? Workspace names? Those can themselves be sensitive.",
        },
        {
          speaker: 'seller',
          text: "Fair point. Workspace name, owner email, plan tier, usage counters. For EU tenants we hash the workspace name and owner email before they leave region; the US billing system only sees the hash.",
        },
        {
          speaker: 'buyer',
          text: "Good. That's the level of detail I needed. From the EU platform side, the data residency story checks out.",
        },
        {
          speaker: 'seller',
          text: "I'll write up this walkthrough as an addendum to the architecture doc so you have it for your records.",
        },
      ]),
      summary:
        "Data residency deep-dive with the EU platform lead. Verified every data plane and ancillary path (backups, logs, metrics, support, billing) for EU/US separation. EU platform lead signed off on the data residency story; seller to send a written addendum.",
      enhancedNotes:
        'Send written data residency addendum within 48 hours. EU platform team signed off.',
      externalId: 'gong-call-50058',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-04-22T16:00:00Z'),
      title: 'Massive Dynamic — Director of Engineering technical review (API + auth)',
      source: 'google_meet',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'brandon.fayette@massivedynamic.example',
        'platform-eng@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I want to use this session for the API and auth review. The isolation piece is settled — this is more about how my platform team will integrate.",
        },
        {
          speaker: 'seller',
          text: "Great. We support OIDC for SSO, SCIM for provisioning, and our API uses OAuth 2.0 with short-lived access tokens and rotating refresh tokens.",
        },
        {
          speaker: 'buyer',
          text: "Do you support a customer-managed signing key for service-to-service auth? We don't want to be exposed if your signing key were compromised.",
        },
        {
          speaker: 'seller',
          text: "Yes — bring-your-own signing key via JWKS endpoint you host. We rotate on your schedule.",
        },
        {
          speaker: 'buyer',
          text: "Rate limits? My team is going to want to know whether one of our workspaces can DoS another by hammering the API.",
        },
        {
          speaker: 'seller',
          text: "Per-tenant rate limits enforced at the edge, defaults are configurable per plan, and there's a fair-use circuit breaker that isolates a noisy tenant within seconds. Again — multi-tenant isolation extends to API quota.",
        },
        {
          speaker: 'buyer',
          text: "Webhooks — signed payloads?",
        },
        {
          speaker: 'seller',
          text: "HMAC-SHA256 with a per-tenant secret you rotate via the API, plus an optional mTLS mode if you want certificate-pinned delivery.",
        },
        {
          speaker: 'buyer',
          text: "Good. I'll greenlight engineering's portion of the review. Procurement is the remaining gate.",
        },
      ]),
      summary:
        "Technical review with Director of Engineering on API and auth: OIDC SSO, SCIM, OAuth 2.0, bring-your-own signing key, per-tenant API rate limits with isolation enforcement, and signed webhooks with optional mTLS. Engineering portion of the review greenlit; procurement remains the open gate.",
      enhancedNotes:
        'Engineering signed off. Drive procurement intake to start same week.',
      externalId: 'gong-call-50064',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-05-06T14:30:00Z'),
      title: 'Massive Dynamic — Procurement intake call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'janet.tubbs@massivedynamic.example',
        'legal@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "I'm Janet from procurement, here with our deal counsel. Procurement involvement at this dollar size means we go through a standard intake — DPA, MSA, SLA, sub-processor change notice, and an information security exhibit.",
        },
        {
          speaker: 'seller',
          text: "Understood. I sent the templates last week — did you have a chance to start redlines?",
        },
        {
          speaker: 'buyer',
          text: "We did. Two big ones: your DPA language on data residency is too soft for our EU operating entity, and your sub-processor change notice period is 30 days where we require 60.",
        },
        {
          speaker: 'seller',
          text: "On data residency I can give you stronger language — 'EU customer data shall not be processed outside the EEA except where strictly necessary for the provision of the service and with prior written consent' — does that get us there?",
        },
        {
          speaker: 'buyer',
          text: "Closer. Strip the 'strictly necessary' carve-out and we have a deal on that clause.",
        },
        {
          speaker: 'seller',
          text: "I'll take that back to legal. On the 60-day sub-processor change notice — we can do 45 standard and 60 for sub-processors that process EU personal data.",
        },
        {
          speaker: 'buyer',
          text: "Workable. Get me the next redline turn this week and I think we can close in three more turns. Procurement involvement on our side averages 3 weeks once redlines start.",
        },
      ]),
      summary:
        'Procurement intake with Janet (procurement) and deal counsel. Two open redlines: tightening data residency DPA language for EU operating entity, and extending sub-processor change notice to 60 days for EU sub-processors. Procurement involvement timeline estimated at three more redline turns over roughly three weeks.',
      enhancedNotes:
        'Turn redlines this week. Track 3 redline turns to close — target end of May.',
      externalId: 'gong-call-50080',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-05-12T15:00:00Z'),
      title: 'Massive Dynamic — Pen-test report review (red-team findings)',
      source: 'gong',
      duration: 75 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'red-team@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "We pulled in our internal red team to read your most recent third-party pen-test report. They have questions on three findings.",
        },
        {
          speaker: 'seller',
          text: "Go for it.",
        },
        {
          speaker: 'buyer',
          text: "Finding 3 — medium-severity IDOR on the admin API. Marked as remediated. What was the root cause and what was the fix?",
        },
        {
          speaker: 'seller',
          text: "An admin endpoint took a tenant_id as a query parameter and didn't cross-check it against the caller's JWT tenant claim. Fix was to remove the parameter entirely — tenant_id is now derived solely from the token. Regression test added.",
        },
        {
          speaker: 'buyer',
          text: "Did you audit all other endpoints for the same pattern?",
        },
        {
          speaker: 'seller',
          text: "Yes. We ran a codemod that flagged every endpoint accepting a tenant_id parameter — found two more, both fixed in the same release.",
        },
        {
          speaker: 'buyer',
          text: "Finding 5 — outdated dependency with a known CVE. Status?",
        },
        {
          speaker: 'seller',
          text: "Patched within 6 days of the report. We now have a 7-day SLA on critical CVEs enforced by a CI gate.",
        },
        {
          speaker: 'buyer',
          text: "Finding 7 — multi-tenant isolation test. The pen-tester wrote that they could not break tenant isolation. Did they actually try, or did they skip it?",
        },
        {
          speaker: 'seller',
          text: "They tried — there's an appendix with the test methodology, including attempting to forge JWT tenant claims, pool exhaustion, and direct S3 prefix access. All failed. I'll send you the appendix.",
        },
        {
          speaker: 'buyer',
          text: "Send that and I'll close out the pen-test review.",
        },
      ]),
      summary:
        'Pen-test report review with CISO and internal red team. Walked through three findings (IDOR remediation with codemod sweep, CVE patching SLA, multi-tenant isolation testing methodology). All findings closed; pending appendix delivery on the isolation test methodology.',
      enhancedNotes:
        'Send pen-test appendix on isolation test methodology. Pen-test review closing.',
      externalId: 'gong-call-50088',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-05-18T16:00:00Z'),
      title: 'Massive Dynamic — Sub-processor list review',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'compliance-officer@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: "Short one — just want to walk the sub-processor list line by line and confirm regional segregation for each.",
        },
        {
          speaker: 'seller',
          text: "Sounds good. The list is split into US sub-processors, EU sub-processors, and global infrastructure.",
        },
        {
          speaker: 'buyer',
          text: "Start with EU. I want to see each one's role and confirm they're EEA-based.",
        },
        {
          speaker: 'seller',
          text: "Frankfurt-hosted Postgres, Frankfurt-hosted object storage, Ireland-based email transactional provider, and a German support-tooling vendor. All four have EEA-based processing and signed DPAs.",
        },
        {
          speaker: 'buyer',
          text: "Global infrastructure — that's where I want to push. CDN and DDoS protection are usually global. Are EU customers' edge traffic terminated in-region?",
        },
        {
          speaker: 'seller',
          text: "Yes. CDN config pins EU tenant traffic to EU PoPs; TLS termination happens in-region; the origin is always the in-region cluster. No US PoP ever sees decrypted EU traffic.",
        },
        {
          speaker: 'buyer',
          text: "Good. List is acceptable. Add the 60-day notice clause and we're done here.",
        },
      ]),
      summary:
        'Sub-processor list line-by-line review. Confirmed EEA-based processing for all EU sub-processors and in-region edge termination for global CDN/DDoS. List acceptable pending the 60-day sub-processor change notice clause from the procurement redlines.',
      enhancedNotes:
        'Sub-processor list approved pending procurement clause. Wire to MSA exhibit.',
      externalId: 'gong-call-50094',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000013',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-05-25T17:00:00Z'),
      title: 'Massive Dynamic — Champion 1:1 with CISO',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'nina.sharp@massivedynamic.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Wanted to grab 30 minutes with you 1:1 to make sure we're aligned heading into the final stretch. Where do you see this from your seat?",
        },
        {
          speaker: 'buyer',
          text: "Honestly? Cleanest enterprise security review I've run this year. SOC2 is done, isolation is done, data residency is done, pen-test is done. The only thing in front of us is procurement involvement on the last DPA turn.",
        },
        {
          speaker: 'seller',
          text: "Anything you're worried about on the procurement side?",
        },
        {
          speaker: 'buyer',
          text: "Janet is fair but slow. If your counsel can turn the next redline in two business days instead of five, we close on time. If it slips, we push to mid-June.",
        },
        {
          speaker: 'seller',
          text: "I'll personally chase counsel on the 48-hour turn. What about internal stakeholders — anyone I should be re-engaging?",
        },
        {
          speaker: 'buyer',
          text: "Brandon is happy. The compliance officer is happy. The EU platform team is happy. You don't need to re-engage anyone — just close procurement.",
        },
        {
          speaker: 'seller',
          text: "Got it. Thanks Nina — this has been one of the smoother enterprise reviews on my side too.",
        },
      ]),
      summary:
        "Champion 1:1 with CISO Nina Sharp. Confirmed SOC2, isolation, data residency, and pen-test reviews are all closed on her side. Sole remaining gate is procurement involvement on the final DPA redline turn; CISO will champion internally if seller's counsel can turn redlines in 48 hours.",
      enhancedNotes:
        'Push counsel to 48-hour redline turn. CISO is fully aligned and championing internally.',
      externalId: 'gong-call-50101',
    },
    {
      id: '00000000-0000-0000-0000-eeee05000014',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000005',
      occurredAt: new Date('2026-05-28T20:00:00Z'),
      title: 'Internal — Massive Dynamic deal review prep',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
        'legal@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Quick internal sync on Massive Dynamic before next week's forecast call. Where I have it: all security workstreams closed, procurement is the only open item, CISO is championing internally.",
        },
        {
          speaker: 'seller',
          text: "Manager — do we have the bandwidth to push counsel to a 48-hour redline turn? Nina was explicit that if we slip past that we lose May and push to mid-June.",
        },
        {
          speaker: 'seller',
          text: "Legal — on the data residency clause, I committed to strip the 'strictly necessary' carve-out. Are we okay with that operationally?",
        },
        {
          speaker: 'seller',
          text: "I also want to flag: this deal has been the cleanest enterprise compliance review we've done. We should write up the multi-tenant isolation playbook and the SOC2 walkthrough format — both landed extremely well.",
        },
        {
          speaker: 'seller',
          text: "Risk-wise: low. Forecasting commit for May, with mid-June as the slip scenario if procurement involvement drags. No technical risk remaining.",
        },
      ]),
      summary:
        "Internal prep call for Massive Dynamic. All security workstreams closed; procurement is the only open item. Seller requests counsel 48-hour SLA on next redline turn and operational sign-off on data residency clause changes. Forecasted commit for May, slip scenario to mid-June if procurement drags. Recommends productizing the multi-tenant isolation playbook and SOC2 walkthrough format.",
      enhancedNotes:
        'Confirm counsel 48-hr SLA. Confirm legal sign-off on data residency clause. Forecast: commit May, slip mid-June.',
      externalId: 'gong-call-50105',
    },
  ],
};
