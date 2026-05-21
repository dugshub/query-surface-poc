import {
  boolean,
  jsonb,
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
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    tenantId: uuid('tenant_id'),
    accountId: uuid('account_id'),
    contactId: uuid('contact_id'),
    externalId: text('external_id'),
    source: text('source'),
    occurredAt: timestamp('occurred_at').notNull(),
    subject: text('subject'),
    bodyText: text('body_text'),
    fromAddress: text('from_address').notNull(),
    toAddresses: jsonb('to_addresses'),
    ccAddresses: jsonb('cc_addresses'),
    direction: directionEnum('direction').notNull(),
    threadId: text('thread_id'),
    messageId: text('message_id'),
    inReplyTo: text('in_reply_to'),
    hasAttachments: boolean('has_attachments'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
