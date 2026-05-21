import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { opportunities } from '../opportunities/opportunity.entity';

export const sourceEnum = pgEnum('source', ['zoom', 'google_meet', 'manual', 'gong', 'granola']);

export const transcripts = pgTable(
  'transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // WARNING: on_delete: 'cascade' is a no-op when this entity uses soft_delete.
    // BaseService.delete() issues UPDATE … SET deleted_at = now(), not DELETE, so Postgres
    // cascade rules never fire for a soft-deleted parent. This FK constraint only applies on
    // hard-delete (e.g. admin purge). See ADR-021: docs/adrs/ADR-021-on-delete-semantics.md
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    occurredAt: timestamp('occurred_at').notNull(),
    title: text('title').notNull(),
    source: sourceEnum('source').notNull(),
    durationMinutes: integer('duration_minutes'),
    participants: text('participants'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
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
