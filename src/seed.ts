// Demo seed — loads all per-deal files from src/seed-data/ and inserts in
// dependency order (accounts → opportunities → contacts → emails → transcripts).
//
// Each deal lives in its own file (src/seed-data/deal-NN-<slug>.ts) so deals
// can be tuned independently without touching this script. Add a new deal by
// dropping another deal-NN file and appending it to src/seed-data/index.ts.

import { db, closeDb } from './db';
import { accounts } from './modules/accounts/account.entity';
import { opportunities } from './modules/opportunities/opportunity.entity';
import { contacts } from './modules/contacts/contact.entity';
import { emails } from './modules/emails/email.entity';
import { transcripts } from './modules/transcripts/transcript.entity';
import { sql } from 'drizzle-orm';
import { ALL_DEALS } from './seed-data';

async function main(): Promise<void> {
  console.log(`Loading ${ALL_DEALS.length} deals from src/seed-data/…`);

  // Flatten each entity's rows across all deals before inserting. Order matters
  // because of FK chains: accounts first, then opportunities, then everything
  // that references opportunities.
  const allAccounts      = ALL_DEALS.map(d => d.account);
  const allOpportunities = ALL_DEALS.map(d => d.opportunity);
  const allContacts      = ALL_DEALS.flatMap(d => d.contacts);
  const allEmails        = ALL_DEALS.flatMap(d => d.emails);
  const allTranscripts   = ALL_DEALS.flatMap(d => d.transcripts);

  console.log('Truncating tables…');
  await db.execute(sql`TRUNCATE TABLE transcripts, emails, contacts, opportunities, accounts RESTART IDENTITY CASCADE`);

  console.log(`Seeding ${allAccounts.length} accounts…`);
  await db.insert(accounts).values(allAccounts);

  console.log(`Seeding ${allOpportunities.length} opportunities…`);
  await db.insert(opportunities).values(allOpportunities);

  console.log(`Seeding ${allContacts.length} contacts…`);
  await db.insert(contacts).values(allContacts);

  console.log(`Seeding ${allEmails.length} emails…`);
  await db.insert(emails).values(allEmails);

  console.log(`Seeding ${allTranscripts.length} transcripts…`);
  await db.insert(transcripts).values(allTranscripts);

  console.log('');
  console.log('Done. Per-deal breakdown:');
  for (const d of ALL_DEALS) {
    console.log(
      `  ${d.account.name.padEnd(28)}  ` +
      `${(d.opportunity.stage ?? '?').padEnd(12)}  ` +
      `$${((d.opportunity.amount ?? 0) / 100).toLocaleString().padStart(9)}  ` +
      `(${d.contacts.length} contacts, ${d.emails.length} emails, ${d.transcripts.length} transcripts)`,
    );
  }
  console.log('');
  console.log(`Totals: ${allAccounts.length} accounts / ${allOpportunities.length} opportunities / ${allContacts.length} contacts / ${allEmails.length} emails / ${allTranscripts.length} transcripts`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => closeDb());
