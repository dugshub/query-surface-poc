// Sales-coach example — the CONSUMER's entity registration.
//
// This is NOT part of the query package. It's what a consumer writes to expose
// their Drizzle models through the query surface: a list of EntityRegistration
// (table + relations + optional EAV strategy + field metadata), handed to
// QueryModule.forRoot(). The EAV value tables (field_values / field_values_jsonb)
// are the package-provided substrate the consumer points its EavStrategy at.
//
// (Will relocate under examples/sales-coach/ in a follow-up.)

import type { EntityRegistration } from './query/registry';
import { fieldValues, fieldValuesJsonb } from './query/eav/schema';
import { accounts, accountsRelations, accountsFieldMeta, accountsMeta } from './modules/accounts/account.entity';
import { contacts, contactsRelations, contactsFieldMeta, contactsMeta } from './modules/contacts/contact.entity';
import { emails, emailsRelations, emailsFieldMeta, emailsMeta } from './modules/emails/email.entity';
import { opportunities, opportunitiesRelations, opportunitiesFieldMeta, opportunitiesMeta } from './modules/opportunities/opportunity.entity';
import { transcripts, transcriptsRelations, transcriptsFieldMeta, transcriptsMeta } from './modules/transcripts/transcript.entity';
import { transcriptObservations, transcriptObservationsRelations, transcriptObservationsFieldMeta, transcriptObservationsMeta } from './modules/transcript-observations/transcript-observation.entity';

export const salesEntities: EntityRegistration[] = [
  // account fields are EAV-backed by Shape B (jsonb single value); opportunity Shape A.
  {
    name: 'account',
    table: accounts,
    relations: accountsRelations,
    fieldMeta: accountsFieldMeta,
    meta: accountsMeta,
    eav: { kind: 'jsonb-value', valueTable: fieldValuesJsonb, entityTypeValue: 'account', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' },
  },
  {
    name: 'opportunity',
    table: opportunities,
    relations: opportunitiesRelations,
    fieldMeta: opportunitiesFieldMeta,
    meta: opportunitiesMeta,
    eav: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'opportunity' },
  },
  { name: 'contact',    table: contacts,    relations: contactsRelations,    fieldMeta: contactsFieldMeta,    meta: contactsMeta },
  { name: 'email',      table: emails,      relations: emailsRelations,      fieldMeta: emailsFieldMeta,      meta: emailsMeta },
  { name: 'transcript', table: transcripts, relations: transcriptsRelations, fieldMeta: transcriptsFieldMeta, meta: transcriptsMeta },
  {
    name: 'transcriptObservation',
    table: transcriptObservations,
    relations: transcriptObservationsRelations,
    fieldMeta: transcriptObservationsFieldMeta,
    meta: transcriptObservationsMeta,
    eav: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  },
];
