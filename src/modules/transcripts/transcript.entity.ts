import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { opportunities } from '../opportunities/opportunity.entity';

export const sourceEnum = pgEnum('source', ['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']);
export const scopeEnum = pgEnum('scope', ['external', 'internal', 'unknown']);

export const transcripts = pgTable(
  'transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    externalId: text('external_id'),
    source: sourceEnum('source').notNull(),
    title: text('title').notNull(),
    creatorName: text('creator_name'),
    creatorEmail: text('creator_email'),
    attendeeEmails: jsonb('attendee_emails'),
    userNotes: text('user_notes'),
    enhancedNotes: text('enhanced_notes'),
    transcript: text('transcript'),
    summary: text('summary'),
    occurredAt: timestamp('occurred_at').notNull(),
    externalLink: text('external_link'),
    scope: scopeEnum('scope'),
    language: text('language'),
    duration: integer('duration'),
    rawData: jsonb('raw_data'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [transcripts.opportunityId],
    references: [opportunities.id],
  }),
}));

export type Transcript = InferSelectModel<typeof transcripts>;
export type TranscriptInsert = typeof transcripts.$inferInsert;
