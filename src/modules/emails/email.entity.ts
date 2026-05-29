// Email — the child of `communications` for type='email'. Keyed by
// communication_id (CTI). The shared facets (which deal, when, external id,
// tenancy) live on the base; this table holds only email-specific payload.
//
// from / to / cc / bcc are NO LONGER address-string columns — they're
// communication_participants rows (role='from'|'to'|'cc'|'bcc') pointing at
// people. "emails from Priya" is now a real traversal, not a string match on a
// loose column.

import {
  boolean,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';
import { pgEnum } from 'drizzle-orm/pg-core';
import { communications } from '../communications/communication.entity';

export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);

const emailEntity = defineEntity(
  'emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 1:1 link to the base (unique). The engine joins on `id`, so children keep
    // their own id PK and carry communication_id as a unique FK rather than
    // using it as the PK directly.
    communicationId: qField(uuid('communication_id').notNull().unique().references(() => communications.id, { onDelete: 'cascade' }), { label: 'Communication' }),
    subject: qField(text('subject'), { label: 'Subject', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    bodyText: qField(text('body_text'), { label: 'Body', description: 'Plain-text body. Searchable.', searchable: true }),
    direction: qField(directionEnum('direction').notNull(), { label: 'Direction', description: 'inbound = customer → us; outbound = us → customer.', isKeyField: true, keyFieldOrder: 1 }),
    threadId: qField(text('thread_id'), { label: 'Thread', isKeyField: true, keyFieldOrder: 2 }),
    messageId: text('message_id'),
    inReplyTo: qField(text('in_reply_to'), { searchable: false }),
    hasAttachments: qField(boolean('has_attachments'), { label: 'Has attachments' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A single email message — the child of a communication (type=email). Subject, body, direction, thread. Sender/recipients are participants (from/to/cc/bcc → people), not columns.' },
);

export const emails = emailEntity.table;

export const emailsRelations = relations(emails, ({ one }) => ({
  communication: one(communications, {
    fields: [emails.communicationId],
    references: [communications.id],
  }),
}));

export type Email = InferSelectModel<typeof emails>;
export type EmailInsert = typeof emails.$inferInsert;
