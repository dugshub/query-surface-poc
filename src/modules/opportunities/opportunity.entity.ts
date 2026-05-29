import {
  boolean,
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';
import { accounts } from '../accounts/account.entity';

// EAV FLIP: the business fields (StageName, Amount, CloseDate, NextStep,
// Probability, IsClosed, IsWon, Description) are EAV-backed in field_values,
// keyed by per-user field_definitions, and resolved by the compiler. This table
// keeps only system / display columns. The agent still queries the business
// fields as { on: 'StageName', ... } — the seam is invisible.
const opportunityEntity = defineEntity(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: qField(uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }), { label: 'Account', isKeyField: true, keyFieldOrder: 1 }),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    organizationId: qField(uuid('organization_id'), { isVisible: false }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    name: qField(text('name').notNull(), { label: 'Deal name', description: 'e.g. "Acme — Q3 New Logo". Amount is in DOLLARS.', isKeyField: true, keyFieldOrder: 0 }),
    // POC-specific narrative columns — not part of the SF field catalog.
    stateOfDeal: qField(text('state_of_deal'), { label: 'Deal state (narrative)', description: 'LLM-generated summary of where the deal stands.' }),
    stateOfDealStatus: qField(text('state_of_deal_status'), { label: 'Deal status', description: 'Short label: healthy | at_risk | closing | lost.', searchable: false }),
    isVisible: qField(boolean('is_visible'), { label: 'Visible' }),
    emailDomains: qField(jsonb('email_domains'), { isVisible: false }),
    providerMetadata: qField(jsonb('provider_metadata'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A sales deal/opportunity attached to an account. The central pipeline record. Its business fields (StageName, Amount, CloseDate, …) are EAV-backed and queried like ordinary columns.' },
);

export const opportunities = opportunityEntity.table;

// Forward imports for has_many — both directions declared so registry.ts can
// introspect the full graph without a separate metadata file. Emails and
// transcripts no longer hang off the opportunity directly — they reach it
// through the communications base (opportunity → communications → email/meeting).
import { communications } from '../communications/communication.entity';
import { transcriptObservations } from '../transcript-observations/transcript-observation.entity';

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
  communications: many(communications),
  transcriptObservations: many(transcriptObservations),
}));

export type Opportunity = InferSelectModel<typeof opportunities>;
export type OpportunityInsert = typeof opportunities.$inferInsert;
