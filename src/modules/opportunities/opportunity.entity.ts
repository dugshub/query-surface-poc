import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { accounts } from '../accounts/account.entity';

export const stageEnum = pgEnum('stage', ['prospect', 'qualifying', 'presenting', 'negotiation', 'closing', 'won', 'lost']);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id'),
    externalId: text('external_id'),
    name: text('name').notNull(),
    description: text('description'),
    stage: stageEnum('stage'),
    amount: integer('amount'),
    closeDate: timestamp('close_date'),
    nextStep: text('next_step'),
    probability: integer('probability'),
    isClosed: boolean('is_closed'),
    isWon: boolean('is_won'),
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
