import {
  integer,
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
    // WARNING: on_delete: 'cascade' is a no-op when this entity uses soft_delete.
    // BaseService.delete() issues UPDATE … SET deleted_at = now(), not DELETE, so Postgres
    // cascade rules never fire for a soft-deleted parent. This FK constraint only applies on
    // hard-delete (e.g. admin purge). See ADR-021: docs/adrs/ADR-021-on-delete-semantics.md
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    stage: stageEnum('stage').notNull(),
    amount: integer('amount'),
    closeDate: timestamp('close_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
);

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
}));

export type Opportunity = InferSelectModel<typeof opportunities>;
export type OpportunityInsert = typeof opportunities.$inferInsert;
