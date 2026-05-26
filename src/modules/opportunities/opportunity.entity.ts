import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { accounts } from '../accounts/account.entity';

// EAV FLIP: the business fields (StageName, Amount, CloseDate, NextStep,
// Probability, IsClosed, IsWon, Description) no longer live as columns here —
// they're EAV-backed in field_values, keyed by per-user field_definitions, and
// resolved by the FilterCompiler. This table keeps only system / display
// columns. The agent still queries the business fields as { on: 'StageName',
// ... } — the seam is invisible. See src/query/eav-schema.ts + docs.
export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id'),
    externalId: text('external_id'),
    name: text('name').notNull(),
    // POC-specific narrative columns — not part of dealbrain's SF field
    // catalog, so they stay as real columns rather than moving to EAV.
    stateOfDeal: text('state_of_deal'),
    stateOfDealStatus: text('state_of_deal_status'),
    isVisible: boolean('is_visible'),
    emailDomains: jsonb('email_domains'),
    providerMetadata: jsonb('provider_metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

// Forward imports for has_many — see comment in account.entity.ts.
// Both directions of the graph are declared at the entity layer so
// buildRegistry() can introspect everything without a separate spec file.
import { emails } from '../emails/email.entity';
import { transcripts } from '../transcripts/transcript.entity';

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
  emails: many(emails),
  transcripts: many(transcripts),
}));

export type Opportunity = InferSelectModel<typeof opportunities>;
export type OpportunityInsert = typeof opportunities.$inferInsert;
