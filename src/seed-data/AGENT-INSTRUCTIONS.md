# Deal-authoring agent instructions

You are writing seed data for **one deal** in a CRM proof-of-concept. Nine
sibling agents are authoring the other nine deals in parallel. All 10 files
get loaded by `src/seed.ts` to populate the database.

This brief is shared across all 10 agents. Your per-deal prompt names your
persona, deal number, and themes — that's the only thing that varies.

## What you write

A single TypeScript file at:

```
/Users/dug/Projects/dealbrain-integrations/query-surface-poc/src/seed-data/deal-NN-<slug>.ts
```

`NN` = your two-digit deal number (e.g. `01`, `02`, …, `10`).
`<slug>` = kebab-case of the account name (e.g. `acme`, `pied-piper`).

The file's ONLY job is to export a `DealSeed` object. No logic, no imports
other than from `./deal-types`.

## File skeleton

```ts
import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal NN — <Account name> — <one-line headline>
//
// Themes: <list themes from your persona>
// Stage: <stage>  |  Amount: $<X>  |  Status: <status>

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa000000NN',
    userId: USER_ID,
    name: '...',
    website: '...',
    externalId: 'sf-acct-NNN',
    providerMetadata: { industry: '...', employee_count: N },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb000000NN',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa000000NN', // same as above
    name: '<Account> — <opportunity short name>',
    description: '...',
    stage: '<one of: prospect | qualifying | presenting | negotiation | closing | won | lost>',
    amount: 25000000,           // integer cents — $250K = 25_000_000
    closeDate: new Date('2026-MM-DDT00:00:00Z'),
    nextStep: '...',
    probability: 75,            // 0–100
    isClosed: false,            // true only if stage in [won, lost]
    isWon: false,               // true ONLY if stage = won
    stateOfDealStatus: 'healthy', // 'healthy' | 'at_risk' | 'closing' | 'lost' (string varchar — pick one)
    stateOfDeal: '...',         // 1–3 sentence narrative summary, LLM-style
    isVisible: true,
    emailDomains: ['<the account domain>'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-ccccNN000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa000000NN',
      firstName: '...',
      lastName: '...',
      email: '...',
    },
    // 1 to 3 contacts total per deal
  ],

  emails: [
    {
      // omit `id` — Drizzle uses defaultRandom()
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb000000NN',
      accountId: '00000000-0000-0000-0000-aaaa000000NN',
      contactId: '00000000-0000-0000-0000-ccccNN000001',   // optional but seed when applicable
      occurredAt: new Date('2026-04-15T14:00:00Z'),
      subject: '...',
      bodyText: '...',                                      // 2–5 realistic sentences
      fromAddress: 'contact@example.com',                   // contact's email when inbound; rep@findtempo.co when outbound
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',                                 // 'inbound' | 'outbound'
      threadId: 'thread-<deal-slug>-NNN',
      hasAttachments: false,
    },
    // see persona for email count (2–4 per deal)
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeeeNN000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb000000NN',
      occurredAt: new Date('2026-04-01T15:00:00Z'),
      title: '<Account> — <call type>',                     // e.g. "Acme — Discovery call"
      source: 'zoom',                                       // 'zoom'|'google_meet'|'gong'|'granola'|'fathom'|'manual'
      duration: 45 * 60,                                    // seconds
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['cfo@example.com', 'rep@findtempo.co'],
      scope: 'external',                                    // 'external' | 'internal' | 'unknown'
      language: 'eng',
      transcript: transcriptBody([
        { speaker: 'seller', text: '...' },
        { speaker: 'buyer',  text: '...' },
        // 5–8 speaker turns per transcript
      ]),
      summary: '...',                                        // 1–3 sentences, LLM-style call summary
      enhancedNotes: '...',                                  // optional one-liner
      externalId: 'gong-call-NNNNN',
    },
    // see persona for transcript count (1–3 per deal)
  ],
};
```

## ID scheme — use EXACTLY

| Row type     | UUID pattern                                         | Notes |
|--------------|------------------------------------------------------|-------|
| Account      | `00000000-0000-0000-0000-aaaa000000NN`               | NN = your deal number, zero-padded |
| Opportunity  | `00000000-0000-0000-0000-bbbb000000NN`               | NN = your deal number |
| Contact #K   | `00000000-0000-0000-0000-ccccNN00000K`               | NN = deal, K = 1/2/3 |
| Transcript K | `00000000-0000-0000-0000-eeeeNN00000K`               | NN = deal, K = 1/2/3 |
| Email        | omit `id` field — Drizzle defaults to random UUIDs   | |

This guarantees no ID collisions across the 10 files.

## Realism guidance

- **Email bodies**: 2–5 sentences each. Conversational, not stilted. Mix inbound + outbound. Reference real things in the deal (seat count, pricing tier, dates).
- **Transcript bodies**: 5–8 speaker turns, alternating mostly seller/buyer. Each turn 1–3 sentences. People interrupt themselves, mention numbers, refer to internal stakeholders by role. Avoid corporate-cliché phrasing.
- **Names**: pick believable first/last names for contacts. Match them to the country/industry feel of the account.
- **Dates**: occurredAt in March–May 2026 for both emails and transcripts. Spread them out (transcripts often precede emails by days/weeks).
- **Domain**: the account website becomes the email domain. e.g. `acme.example` → emails from `cfo@acme.example`.
- **Stage ↔ closeDate**: prospect deals close late (Q4 2026); closing/negotiation deals close in Jun–Aug 2026; won deals close in May 2026.
- **probability**: matches stage (`prospect`=10–20, `qualifying`=25–35, `presenting`=40–50, `negotiation`=55–70, `closing`=75–90, `won`=100, `lost`=0).
- **isClosed/isWon**: see field comments in the skeleton.

## Theme overlap is the WHOLE POINT

Your per-deal prompt lists 3–4 themes to weave in. Those themes are
**deliberately shared with other deals** so cross-deal text searches return
multiple hits. Sample shared vocabulary:

- "pricing pushback" / "pricing tier" / "volume discount"
- "renewal lock" / "multi-year commit"
- "data residency" / "compliance"
- "SOC2" / "HIPAA" / "compliance review"
- "procurement involvement"
- "legal redlines" / "SOW" / "MSA"
- "pilot results" / "pilot extension"
- "competitor" (mention by name when your persona says to)
- "implementation timeline"
- "stakeholder mapping" / "champion"
- "integration concerns" (Salesforce, HubSpot, etc.)
- "ROI case"

**Drop these phrases literally into transcript bodies and email subjects/bodies.**
Don't paraphrase them away — searchers will look for these exact words.

## What NOT to do

- Don't import from anywhere except `./deal-types`
- Don't add try/catch, validation, or any logic
- Don't make up fields not in the skeleton
- Don't use placeholder text like "TODO" or "Lorem ipsum"
- Don't reuse names/emails across deals (each contact should be unique to their deal)

## When done

Reply with one short sentence:
> Wrote `deal-NN-<slug>.ts` (`M` contacts, `M` emails, `M` transcripts).
