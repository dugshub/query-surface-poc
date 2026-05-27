// TranscriptObservation — a typed metadata packet an Agent "observed" about a
// transcript (a communication), in relation to the deal lifecycle it belongs to.
//
// Domain shape (see docs/field-catalog-design.md + memory observation-domain-model):
//   - Observations are 1:1 with a COMMUNICATION TYPE. This is the transcript
//     variant; an EmailObservation (etc.) will be its sibling.
//   - It refs an opportunity id NOW (the world-lifecycle anchor). The link to the
//     transcript is explicit here, but is intended to become IMPLICIT later via a
//     shared CommunicationEntity base class that email + transcript adopt.
//   - Its typed payload is EAV-backed (Shape A — typed columns, like opportunity):
//     the variant's fields live in field_definitions(entity_type='transcript_observation')
//     and resolve through field_values. So each observation kind carries its own
//     typed, queryable fields via the same uniform catalog.

import {
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { opportunities } from '../opportunities/opportunity.entity';
import { transcripts } from '../transcripts/transcript.entity';

export const transcriptObservations = pgTable('transcript_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id'),

  // World-lifecycle anchor — the deal this observation is about.
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
  // The communication it observed. Explicit FK now; becomes implicit via the
  // future CommunicationEntity base (the 1:1 comm-type link).
  transcriptId: uuid('transcript_id').references(() => transcripts.id, { onDelete: 'cascade' }),

  // The packet itself.
  observationType: text('observation_type').notNull(), // typed kind (e.g. 'risk_signal', 'next_step', 'sentiment')
  observedAt: timestamp('observed_at').notNull(),       // "stamped"
  producedBy: text('produced_by'),                      // which Agent observed it
  agentRunId: uuid('agent_run_id'),                     // provenance — the run that produced it
  confidence: numeric('confidence'),                    // 0..1
  summary: text('summary'),                             // narrative payload (searchable)
  rawData: jsonb('raw_data'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transcriptObservationsRelations = relations(transcriptObservations, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [transcriptObservations.opportunityId],
    references: [opportunities.id],
  }),
  transcript: one(transcripts, {
    fields: [transcriptObservations.transcriptId],
    references: [transcripts.id],
  }),
}));

export type TranscriptObservation = InferSelectModel<typeof transcriptObservations>;
export type TranscriptObservationInsert = typeof transcriptObservations.$inferInsert;
