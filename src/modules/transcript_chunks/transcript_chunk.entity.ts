import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { transcripts } from '../transcripts/transcript.entity';

export const speakerEnum = pgEnum('speaker', ['seller', 'buyer', 'unknown']);

export const transcript_chunks = pgTable(
  'transcript_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transcriptId: uuid('transcript_id').references(() => transcripts.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    speaker: speakerEnum('speaker'),
    body: text('body').notNull(),
    startsAtSec: integer('starts_at_sec'),
    endsAtSec: integer('ends_at_sec'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const transcript_chunksRelations = relations(transcript_chunks, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [transcript_chunks.transcriptId],
    references: [transcripts.id],
  }),
}));

export type TranscriptChunk = InferSelectModel<typeof transcript_chunks>;
export type TranscriptChunkInsert = typeof transcript_chunks.$inferInsert;
