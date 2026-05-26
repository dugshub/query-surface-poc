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
import { fieldDefinitions, fieldValues } from './query/eav-schema';
import { sql } from 'drizzle-orm';
import { ALL_DEALS } from './seed-data';
import { USER_ID, OPPORTUNITY_EAV_SEED_KEYS } from './seed-data/deal-types';
import { buildEavSeed } from './seed-data/build-eav';

// Strip the inline EAV field values (stage/amount/…) so only real opportunity
// columns are inserted; their values are seeded into field_values by buildEavSeed.
function toOpportunityRow(o: object): Record<string, unknown> {
  const row = { ...o } as Record<string, unknown>;
  for (const k of OPPORTUNITY_EAV_SEED_KEYS) delete row[k];
  return row;
}

async function main(): Promise<void> {
  console.log(`Loading ${ALL_DEALS.length} deals from src/seed-data/…`);

  // Flatten each entity's rows across all deals before inserting. Order matters
  // because of FK chains: accounts first, then opportunities, then everything
  // that references opportunities.
  const allAccounts      = ALL_DEALS.map(d => d.account);
  const allOpportunities = ALL_DEALS.map(d => toOpportunityRow(d.opportunity));
  const allContacts      = ALL_DEALS.flatMap(d => d.contacts);
  const allEmails        = ALL_DEALS.flatMap(d => d.emails);
  const allTranscripts   = ALL_DEALS.flatMap(d => d.transcripts);

  const { fieldDefinitions: defRows, fieldValues: valueRows } = buildEavSeed(ALL_DEALS, USER_ID);

  console.log('Truncating tables…');
  await db.execute(sql`TRUNCATE TABLE field_values, field_definitions, transcripts, emails, contacts, opportunities, accounts RESTART IDENTITY CASCADE`);

  console.log(`Seeding ${allAccounts.length} accounts…`);
  await db.insert(accounts).values(allAccounts);

  console.log(`Seeding ${allOpportunities.length} opportunities…`);
  await db.insert(opportunities).values(allOpportunities as (typeof opportunities.$inferInsert)[]);

  console.log(`Seeding ${allContacts.length} contacts…`);
  await db.insert(contacts).values(allContacts);

  console.log(`Seeding ${allEmails.length} emails…`);
  await db.insert(emails).values(allEmails);

  console.log(`Seeding ${allTranscripts.length} transcripts…`);
  await db.insert(transcripts).values(allTranscripts);

  // EAV: field_definitions (the opportunity field catalog, real SF keys) then
  // field_values (typed cells projected from each opportunity's columns).
  console.log(`Seeding ${defRows.length} field_definitions…`);
  await db.insert(fieldDefinitions).values(defRows);
  console.log(`Seeding ${valueRows.length} field_values…`);
  await db.insert(fieldValues).values(valueRows);

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
