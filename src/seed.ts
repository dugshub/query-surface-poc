// Demo seed: 3 accounts × ~3 opportunities each × emails + transcripts × chunks.
// Deterministic IDs so demo.ts can reference specific rows without re-querying.

import { db, closeDb } from './db';
import { accounts } from './modules/accounts/account.entity';
import { opportunities } from './modules/opportunities/opportunity.entity';
import { emails } from './modules/emails/email.entity';
import { transcripts } from './modules/transcripts/transcript.entity';
import { transcript_chunks } from './modules/transcript_chunks/transcript_chunk.entity';
import { sql } from 'drizzle-orm';

const USER_ID = '11111111-1111-1111-1111-111111111111';

// Stable IDs
const ACCT = {
  acme: '00000000-0000-0000-0000-0000000000a1',
  globex: '00000000-0000-0000-0000-0000000000a2',
  initech: '00000000-0000-0000-0000-0000000000a3',
};

const OPP = {
  acme_new:    '00000000-0000-0000-0000-0000000000b1',
  acme_renew:  '00000000-0000-0000-0000-0000000000b2',
  globex_pilot:'00000000-0000-0000-0000-0000000000b3',
  globex_exp:  '00000000-0000-0000-0000-0000000000b4',
  initech_main:'00000000-0000-0000-0000-0000000000b5',
  initech_addon:'00000000-0000-0000-0000-0000000000b6',
};

const TS = {
  acme_disco:    '00000000-0000-0000-0000-0000000000c1',
  acme_pricing:  '00000000-0000-0000-0000-0000000000c2',
  globex_pilot:  '00000000-0000-0000-0000-0000000000c3',
  initech_legal: '00000000-0000-0000-0000-0000000000c4',
};

async function main(): Promise<void> {
  console.log('Truncating tables…');
  await db.execute(sql`TRUNCATE TABLE transcript_chunks, transcripts, emails, opportunities, accounts RESTART IDENTITY CASCADE`);

  console.log('Seeding accounts…');
  await db.insert(accounts).values([
    { id: ACCT.acme,    userId: USER_ID, name: 'Acme Corp',    industry: 'fintech', domain: 'acme.example',    employeeCount: 250 },
    { id: ACCT.globex,  userId: USER_ID, name: 'Globex',       industry: 'saas',    domain: 'globex.example',  employeeCount: 80 },
    { id: ACCT.initech, userId: USER_ID, name: 'Initech',      industry: 'retail',  domain: 'initech.example', employeeCount: 1200 },
  ]);

  console.log('Seeding opportunities…');
  await db.insert(opportunities).values([
    { id: OPP.acme_new,     userId: USER_ID, accountId: ACCT.acme,    name: 'Acme — Q3 New Logo',        stage: 'closing',    amount: 12000000 },
    { id: OPP.acme_renew,   userId: USER_ID, accountId: ACCT.acme,    name: 'Acme — Year 2 Renewal',     stage: 'qualifying', amount:  9500000 },
    { id: OPP.globex_pilot, userId: USER_ID, accountId: ACCT.globex,  name: 'Globex — Pilot Conversion', stage: 'closing',    amount:  4500000 },
    { id: OPP.globex_exp,   userId: USER_ID, accountId: ACCT.globex,  name: 'Globex — Seat Expansion',   stage: 'presenting', amount:  2200000 },
    { id: OPP.initech_main, userId: USER_ID, accountId: ACCT.initech, name: 'Initech — Initial Buy',     stage: 'negotiation',amount: 18000000 },
    { id: OPP.initech_addon,userId: USER_ID, accountId: ACCT.initech, name: 'Initech — Add-on Module',   stage: 'prospect',   amount:  3200000 },
  ]);

  console.log('Seeding emails…');
  await db.insert(emails).values([
    // Acme — closing deal: pricing pushback
    { userId: USER_ID, opportunityId: OPP.acme_new, occurredAt: new Date('2026-04-15T14:00:00Z'),
      subject: 'Re: Pricing for Q3 deal', body: 'Thanks for the breakdown. The pricing tier feels high — can we discuss volume discounts for our 250 seats?',
      fromEmail: 'cfo@acme.example', toEmail: 'rep@findtempo.co', direction: 'inbound' },
    { userId: USER_ID, opportunityId: OPP.acme_new, occurredAt: new Date('2026-04-15T16:30:00Z'),
      subject: 'Re: Pricing for Q3 deal', body: 'Happy to walk through pricing. Our enterprise tier includes everything you saw. I can put together a volume-discount proposal.',
      fromEmail: 'rep@findtempo.co', toEmail: 'cfo@acme.example', direction: 'outbound' },
    { userId: USER_ID, opportunityId: OPP.acme_new, occurredAt: new Date('2026-04-22T09:00:00Z'),
      subject: 'Contract redlines', body: 'Legal has flagged a few clauses around data residency. Will send the marked-up SOW today.',
      fromEmail: 'legal@acme.example', toEmail: 'rep@findtempo.co', direction: 'inbound' },
    // Globex — pilot deal: renewal mention
    { userId: USER_ID, opportunityId: OPP.globex_pilot, occurredAt: new Date('2026-04-08T11:00:00Z'),
      subject: 'Pilot results + renewal conversation', body: 'Team is excited — pilot exceeded our usage targets. Ready to talk renewal terms and seat counts.',
      fromEmail: 'cto@globex.example', toEmail: 'rep@findtempo.co', direction: 'inbound' },
    // Initech — negotiation: pricing + legal
    { userId: USER_ID, opportunityId: OPP.initech_main, occurredAt: new Date('2026-05-01T10:00:00Z'),
      subject: 'Pricing alignment', body: 'We need to align on pricing before legal review. The proposed rate per location is above our budget benchmark.',
      fromEmail: 'procurement@initech.example', toEmail: 'rep@findtempo.co', direction: 'inbound' },
  ]);

  console.log('Seeding transcripts + chunks…');
  await db.insert(transcripts).values([
    { id: TS.acme_disco,    userId: USER_ID, opportunityId: OPP.acme_new,     occurredAt: new Date('2026-04-01T15:00:00Z'),
      title: 'Acme — Discovery call',     source: 'zoom',        durationMinutes: 45, participants: 'cfo@acme.example, rep@findtempo.co' },
    { id: TS.acme_pricing,  userId: USER_ID, opportunityId: OPP.acme_new,     occurredAt: new Date('2026-04-18T15:00:00Z'),
      title: 'Acme — Pricing review',     source: 'google_meet', durationMinutes: 30, participants: 'cfo@acme.example, cto@acme.example, rep@findtempo.co' },
    { id: TS.globex_pilot,  userId: USER_ID, opportunityId: OPP.globex_pilot, occurredAt: new Date('2026-04-12T10:00:00Z'),
      title: 'Globex — Pilot debrief',    source: 'gong',        durationMinutes: 55, participants: 'cto@globex.example, vpeng@globex.example, rep@findtempo.co' },
    { id: TS.initech_legal, userId: USER_ID, opportunityId: OPP.initech_main, occurredAt: new Date('2026-05-05T14:00:00Z'),
      title: 'Initech — Legal alignment', source: 'zoom',        durationMinutes: 60, participants: 'procurement@initech.example, legal@initech.example, rep@findtempo.co' },
  ]);

  // Chunks: positional, with realistic-ish speaker turns mentioning various topics.
  // The body texts intentionally include "pricing" and "renewal" hits to make the
  // demo queries find real rows.
  const chunks: typeof transcript_chunks.$inferInsert[] = [];
  let pos = 0;

  const add = (transcriptId: string, speaker: 'seller' | 'buyer' | 'unknown', body: string) => {
    chunks.push({
      transcriptId, position: pos++, speaker, body,
      startsAtSec: pos * 30, endsAtSec: (pos + 1) * 30,
    });
  };

  pos = 0;
  add(TS.acme_disco, 'seller', 'Thanks for taking the time today. Can you tell me about the team and current workflow?');
  add(TS.acme_disco, 'buyer',  "We're around 250 people, finance team is heavy users of spreadsheets right now. Real pain point is reconciliation.");
  add(TS.acme_disco, 'seller', 'Got it. What does success look like in 6 months?');
  add(TS.acme_disco, 'buyer',  'Honestly, cutting our month-end close from 12 days to 5. That would be transformative for us.');
  add(TS.acme_disco, 'seller', "Makes sense. We've seen similar fintech teams hit 4-day closes. Should we talk pricing once we've scoped the rollout?");
  add(TS.acme_disco, 'buyer',  'Yes, send pricing options once you understand the seat count better.');

  pos = 0;
  add(TS.acme_pricing, 'seller', 'I want to walk you through the proposed pricing structure for 250 seats.');
  add(TS.acme_pricing, 'buyer',  "The base pricing tier is higher than we budgeted. Can we discuss volume discount thresholds?");
  add(TS.acme_pricing, 'seller', 'Absolutely. At 250 seats you qualify for our enterprise discount which brings the per-seat price down 22%.');
  add(TS.acme_pricing, 'buyer',  'Pricing makes more sense at that tier. What about a multi-year commitment — does that unlock additional discount?');
  add(TS.acme_pricing, 'seller', 'Yes — 3 year unlocks another 8% on pricing, plus a renewal lock at year-1 rates.');
  add(TS.acme_pricing, 'buyer',  'Good. I want our procurement team in the next pricing conversation.');

  pos = 0;
  add(TS.globex_pilot, 'seller', 'Excited to hear how the pilot went. What did the team think?');
  add(TS.globex_pilot, 'buyer',  'Pilot blew our expectations — usage was 3x our forecast. We need to talk renewal and committed seats now.');
  add(TS.globex_pilot, 'seller', 'Glad to hear it. For renewal, you have three options on commit duration.');
  add(TS.globex_pilot, 'buyer',  'Walk me through renewal pricing on each — 1 year vs 2 year vs 3 year.');
  add(TS.globex_pilot, 'seller', "1 year is list. 2 year unlocks 12% off. 3 year locks rates and gives 20% off plus a renewal-at-same-rate guarantee.");
  add(TS.globex_pilot, 'buyer',  "We will likely go 3 year for the rate lock. Send the proposal this week.");

  pos = 0;
  add(TS.initech_legal, 'seller', "Wanted to use this call to align on the legal redlines we received.");
  add(TS.initech_legal, 'buyer',  "We have concerns about the liability cap and the data residency clause. Pricing is also still under review by finance.");
  add(TS.initech_legal, 'seller', 'On liability — we can match your cap with mutual indemnification language.');
  add(TS.initech_legal, 'buyer',  "Acceptable. On pricing, procurement says the per-location rate needs to come down 15% for us to sign this quarter.");
  add(TS.initech_legal, 'seller', "I'll go back internally on the pricing ask. What's the latest you can wait before we lose the quarter?");
  add(TS.initech_legal, 'buyer',  'End of next week. After that pricing reopens with the new fiscal year discount sheet.');

  await db.insert(transcript_chunks).values(chunks);

  console.log(`Done. Seeded:`);
  console.log(`  ${Object.keys(ACCT).length} accounts`);
  console.log(`  ${Object.keys(OPP).length} opportunities`);
  console.log(`  5 emails`);
  console.log(`  ${Object.keys(TS).length} transcripts`);
  console.log(`  ${chunks.length} transcript chunks`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => closeDb());
