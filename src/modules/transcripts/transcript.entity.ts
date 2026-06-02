// Transcript — the recorded artifact of a meeting. ALWAYS a child of a meeting
// (transcript.meeting_id → meetings); a recording with no calendar invite still
// has a synthesized ad-hoc meeting. Keeps its own `id` PK because
// transcript_observations reference it directly.
//
// The meeting owns title / timing / scope / duration / participants; this table
// holds only the recorded content: the transcript body, summary, and rep notes.
// "Who was on the call" is transcript → meeting → participants → person.

import {
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { qEntity, qField } from '../../query/define-entity';
import { meetings } from '../meetings/meeting.entity';
import { transcriptObservations } from '../transcript-observations/transcript-observation.entity';

const transcriptEntity = qEntity(
  'transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetingId: qField(uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }), { label: 'Meeting', isKeyField: true, keyFieldOrder: 3 }),
    userNotes: qField(text('user_notes'), { label: 'Rep notes', searchable: true }),
    enhancedNotes: qField(text('enhanced_notes'), { label: 'Enhanced notes', searchable: true }),
    transcript: qField(text('transcript'), { label: 'Transcript body', description: 'Concatenated speaker turns. Primary text-search target for "what was said on calls".', searchable: true }),
    summary: qField(text('summary'), { label: 'Summary', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    language: qField(text('language'), { searchable: false }),
    externalLink: qField(text('external_link'), { searchable: false }),
    rawData: qField(jsonb('raw_data'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A call/meeting transcript — the recorded child of a meeting. Full body text inline, plus LLM summary and rep notes. Title, timing, and attendees live on the parent meeting.' },
);

export const transcripts = transcriptEntity.table;

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [transcripts.meetingId],
    references: [meetings.id],
  }),
  observations: many(transcriptObservations),
}));

export type Transcript = InferSelectModel<typeof transcripts>;
export type TranscriptInsert = typeof transcripts.$inferInsert;
