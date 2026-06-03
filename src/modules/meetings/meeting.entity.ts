// Meeting — a congregation of people discussing. The child of `communications`
// for type='meeting', and the parent of `transcripts` (a transcript is always
// the recorded artifact of a meeting).
//
// A meeting is NOT a calendar event — a calendar event is just a meeting that
// happened to be *scheduled* (`is_scheduled = true`). A recording with no
// calendar invite still gets a meeting (synthesized, `is_scheduled = false`),
// so "transcript → meeting" holds universally. Calendar-ness is a facet here,
// not a separate table.
//
// Who was there lives on the base via communication_participants (host /
// invitee / attendee), so this table holds only the meeting's own attributes.

import {
  integer,
  pgEnum,
  text,
  timestamp,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { qEntity, qField } from '../../query/define-entity';
import { communications } from '../communications/communication.entity';

export const meetingSourceEnum = pgEnum('meeting_source', ['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']);
export const meetingScopeEnum = pgEnum('meeting_scope', ['external', 'internal', 'unknown']);

const meetingEntity = qEntity(
  'meetings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 1:1 link to the base (unique). Children keep their own id PK (the engine
    // joins on `id`) and carry communication_id as a unique FK.
    communicationId: qField(uuid('communication_id').notNull().unique().references(() => communications.id, { onDelete: 'cascade' }), { label: 'Communication' }),
    title: qField(text('title').notNull(), { label: 'Title', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    source: qField(meetingSourceEnum('source'), { label: 'Source', description: 'Where it happened / was recorded.', isKeyField: true, keyFieldOrder: 1 }),
    scope: qField(meetingScopeEnum('scope'), { label: 'Scope', description: 'external = mixed parties; internal = all internal.', isKeyField: true, keyFieldOrder: 2 }),
    isScheduled: qField(boolean('is_scheduled').notNull().default(false), { label: 'Scheduled', description: 'true = originated from a calendar invite; false = ad-hoc / recording-only.' }),
    location: qField(text('location'), { label: 'Location', description: 'Physical room or meeting link.', searchable: false }),
    durationSeconds: qField(integer('duration_seconds'), { label: 'Duration (s)' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A meeting — a congregation of people discussing, recorded or not. The child of a communication (type=meeting) and the parent of its transcript. A calendar event is a meeting with is_scheduled=true; participants (host/invitee/attendee) hang off the base communication.' },
);

export const meetings = meetingEntity.table;

// Forward import for has_many — a meeting can have transcript(s).
import { transcripts } from '../transcripts/transcript.entity';

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  communication: one(communications, {
    fields: [meetings.communicationId],
    references: [communications.id],
  }),
  transcripts: many(transcripts),
}));

export type Meeting = InferSelectModel<typeof meetings>;
export type MeetingInsert = typeof meetings.$inferInsert;
