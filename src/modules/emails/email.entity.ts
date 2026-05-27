import {
  boolean,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '@shared/orm/define-entity';
import { opportunities } from '../opportunities/opportunity.entity';

export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);

const emailEntity = defineEntity(
  'emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: qField(uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }), { label: 'Opportunity', isKeyField: true, keyFieldOrder: 4 }),
    userId: qField(uuid('user_id'), { isVisible: false }),
    tenantId: qField(uuid('tenant_id'), { isVisible: false }),
    accountId: qField(uuid('account_id'), { label: 'Account (loose ref)' }),
    contactId: qField(uuid('contact_id'), { label: 'Contact (loose ref)' }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    source: qField(text('source'), { label: 'Source', searchable: false }),
    occurredAt: qField(timestamp('occurred_at').notNull(), { label: 'Occurred at', isKeyField: true, keyFieldOrder: 3 }),
    subject: qField(text('subject'), { label: 'Subject', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    bodyText: qField(text('body_text'), { label: 'Body', description: 'Plain-text body. Searchable.', searchable: true }),
    fromAddress: qField(text('from_address').notNull(), { label: 'From', searchable: false, isKeyField: true, keyFieldOrder: 1 }),
    toAddresses: qField(jsonb('to_addresses'), { label: 'To' }),
    ccAddresses: jsonb('cc_addresses'),
    direction: qField(directionEnum('direction').notNull(), { label: 'Direction', description: 'inbound = customer → us; outbound = us → customer.', isKeyField: true, keyFieldOrder: 2 }),
    threadId: qField(text('thread_id'), { label: 'Thread' }),
    messageId: text('message_id'),
    inReplyTo: qField(text('in_reply_to'), { searchable: false }),
    hasAttachments: boolean('has_attachments'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A single email message tied to an opportunity. Inbound/outbound communication — subject, body, addresses, thread.' },
);

export const emails = emailEntity.table;
export const emailsFieldMeta = emailEntity.fieldMeta;
export const emailsMeta = emailEntity.meta;

export const emailsRelations = relations(emails, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [emails.opportunityId],
    references: [opportunities.id],
  }),
}));

export type Email = InferSelectModel<typeof emails>;
export type EmailInsert = typeof emails.$inferInsert;
