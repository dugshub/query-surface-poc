import {
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '@shared/orm/define-entity';
import { opportunities } from '../opportunities/opportunity.entity';
import { transcriptObservations } from '../transcript-observations/transcript-observation.entity';

export const sourceEnum = pgEnum('source', ['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']);
export const scopeEnum = pgEnum('scope', ['external', 'internal', 'unknown']);

const transcriptEntity = defineEntity(
  'transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: qField(uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }), { label: 'Opportunity', isKeyField: true, keyFieldOrder: 3 }),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    source: qField(sourceEnum('source').notNull(), { label: 'Source', description: 'Recording provider.', isKeyField: true, keyFieldOrder: 1 }),
    title: qField(text('title').notNull(), { label: 'Title', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    creatorName: qField(text('creator_name'), { label: 'Creator', searchable: false }),
    creatorEmail: qField(text('creator_email'), { searchable: false }),
    attendeeEmails: qField(jsonb('attendee_emails'), { label: 'Attendees' }),
    userNotes: qField(text('user_notes'), { label: 'Rep notes', searchable: true }),
    enhancedNotes: qField(text('enhanced_notes'), { label: 'Enhanced notes', searchable: true }),
    transcript: qField(text('transcript'), { label: 'Transcript body', description: 'Concatenated speaker turns. Primary text-search target for "what was said on calls".', searchable: true }),
    summary: qField(text('summary'), { label: 'Summary', searchable: true, isKeyField: true, keyFieldOrder: 4 }),
    occurredAt: qField(timestamp('occurred_at').notNull(), { label: 'Occurred at', isKeyField: true, keyFieldOrder: 2 }),
    externalLink: qField(text('external_link'), { searchable: false }),
    scope: qField(scopeEnum('scope'), { label: 'Scope', description: 'external = mixed parties; internal = all internal.' }),
    language: qField(text('language'), { searchable: false }),
    duration: qField(integer('duration'), { label: 'Duration (s)' }),
    rawData: qField(jsonb('raw_data'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A call/meeting transcript tied to an opportunity. Full body text inline, plus LLM summary and rep notes.' },
);

export const transcripts = transcriptEntity.table;
export const transcriptsFieldMeta = transcriptEntity.fieldMeta;
export const transcriptsMeta = transcriptEntity.meta;

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [transcripts.opportunityId],
    references: [opportunities.id],
  }),
  observations: many(transcriptObservations),
}));

export type Transcript = InferSelectModel<typeof transcripts>;
export type TranscriptInsert = typeof transcripts.$inferInsert;
