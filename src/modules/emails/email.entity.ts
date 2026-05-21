import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { opportunities } from '../opportunities/opportunity.entity';

export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);

export const emails = pgTable(
  'emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // WARNING: on_delete: 'cascade' is a no-op when this entity uses soft_delete.
    // BaseService.delete() issues UPDATE … SET deleted_at = now(), not DELETE, so Postgres
    // cascade rules never fire for a soft-deleted parent. This FK constraint only applies on
    // hard-delete (e.g. admin purge). See ADR-021: docs/adrs/ADR-021-on-delete-semantics.md
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    occurredAt: timestamp('occurred_at').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    fromEmail: text('from_email').notNull(),
    toEmail: text('to_email').notNull(),
    direction: directionEnum('direction').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
);

export const emailsRelations = relations(emails, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [emails.opportunityId],
    references: [opportunities.id],
  }),
}));

export type Email = InferSelectModel<typeof emails>;
export type EmailInsert = typeof emails.$inferInsert;
