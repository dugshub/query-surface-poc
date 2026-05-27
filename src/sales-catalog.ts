// Sales-coach example — the CONSUMER's code-side table catalog.
//
// The inventory of what CAN be exposed: live Drizzle tables + relations (+ the
// code defaults for field metadata). The runtime `entity_registrations` rows
// select from this by `tableKey` and layer on name / enabled / eav. Pairs with
// loadRegistrations(db, salesTableCatalog, salesValueTables).

import type { TableCatalog, ValueTableCatalog } from './query/runtime-registry';
import { fieldValues, fieldValuesJsonb } from './query/eav/schema';
import { accounts, accountsRelations, accountsFieldMeta, accountsMeta } from './modules/accounts/account.entity';
import { contacts, contactsRelations, contactsFieldMeta, contactsMeta } from './modules/contacts/contact.entity';
import { emails, emailsRelations, emailsFieldMeta, emailsMeta } from './modules/emails/email.entity';
import { opportunities, opportunitiesRelations, opportunitiesFieldMeta, opportunitiesMeta } from './modules/opportunities/opportunity.entity';
import { transcripts, transcriptsRelations, transcriptsFieldMeta, transcriptsMeta } from './modules/transcripts/transcript.entity';
import { transcriptObservations, transcriptObservationsRelations, transcriptObservationsFieldMeta, transcriptObservationsMeta } from './modules/transcript-observations/transcript-observation.entity';

/** tableKey → live Drizzle table + relations + code-default metadata. */
export const salesTableCatalog: TableCatalog = {
  accounts:               { table: accounts,             relations: accountsRelations,             fieldMeta: accountsFieldMeta,             meta: accountsMeta },
  opportunities:          { table: opportunities,        relations: opportunitiesRelations,        fieldMeta: opportunitiesFieldMeta,        meta: opportunitiesMeta },
  contacts:               { table: contacts,             relations: contactsRelations,             fieldMeta: contactsFieldMeta,             meta: contactsMeta },
  emails:                 { table: emails,               relations: emailsRelations,               fieldMeta: emailsFieldMeta,               meta: emailsMeta },
  transcripts:            { table: transcripts,          relations: transcriptsRelations,          fieldMeta: transcriptsFieldMeta,          meta: transcriptsMeta },
  transcript_observations:{ table: transcriptObservations, relations: transcriptObservationsRelations, fieldMeta: transcriptObservationsFieldMeta, meta: transcriptObservationsMeta },
};

/** EAV value-table key → live Drizzle table (for resolving eav.valueTableKey). */
export const salesValueTables: ValueTableCatalog = {
  field_values: fieldValues,
  field_values_jsonb: fieldValuesJsonb,
};
