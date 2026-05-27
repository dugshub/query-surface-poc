// TranscriptObservation — a typed metadata packet an Agent "observed" about a
// transcript (a communication), in relation to the deal lifecycle it belongs to.
//
//   - Observations are 1:1 with a COMMUNICATION TYPE (this is the transcript
//     variant; EmailObservation etc. are siblings). Refs an opportunity now; the
//     transcript link becomes implicit later via a shared CommunicationEntity base.
//   - Typed payload is EAV-backed (Shape A) — field_definitions(entity_type=
//     'transcript_observation') resolve through field_values.
//
// NOTE: data/seed + the polymorphic observation *family* layer are deferred
// (to be rebased on the upstream design). The entity is registered + describable.

import {
  jsonb,
  numeric,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';
import { opportunities } from '../opportunities/opportunity.entity';
import { transcripts } from '../transcripts/transcript.entity';

const transcriptObservationEntity = defineEntity(
  'transcript_observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    organizationId: qField(uuid('organization_id'), { isVisible: false }),
    opportunityId: qField(uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }), { label: 'Opportunity', isKeyField: true, keyFieldOrder: 4 }),
    transcriptId: qField(uuid('transcript_id').references(() => transcripts.id, { onDelete: 'cascade' }), { label: 'Transcript' }),
    observationType: qField(text('observation_type').notNull(), { label: 'Observation type', description: 'The typed kind, e.g. risk_signal | next_step | sentiment.', searchable: false, isKeyField: true, keyFieldOrder: 0 }),
    observedAt: qField(timestamp('observed_at').notNull(), { label: 'Observed at', isKeyField: true, keyFieldOrder: 1 }),
    producedBy: qField(text('produced_by'), { label: 'Produced by (agent)', searchable: false }),
    agentRunId: qField(uuid('agent_run_id'), { label: 'Agent run' }),
    confidence: qField(numeric('confidence'), { label: 'Confidence', description: '0..1', isKeyField: true, keyFieldOrder: 3 }),
    summary: qField(text('summary'), { label: 'Summary', searchable: true, isKeyField: true, keyFieldOrder: 2 }),
    rawData: qField(jsonb('raw_data'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A typed metadata packet an Agent observed about a transcript, anchored to a deal. EAV-typed per observationType.' },
);

export const transcriptObservations = transcriptObservationEntity.table;
export const transcriptObservationsFieldMeta = transcriptObservationEntity.fieldMeta;
export const transcriptObservationsMeta = transcriptObservationEntity.meta;

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
