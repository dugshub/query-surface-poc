// Communication — the base/parent of every communication artifact (class-table
// inheritance). Holds what ALL comms share: which deal they belong to (the
// context edge), when they happened, tenancy. The type-specific payload lives
// in a child table keyed by communication_id:
//
//   communications ──one──> emails     (type = 'email')
//   communications ──one──> meetings   (type = 'meeting')  ──one──> transcripts
//
// Participants (who was on it, and in what role) hang off the base via
// communication_participants, so the same MtM serves emails and meetings alike.

import {
  pgEnum,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { qEntity, qField } from '../../query/define-entity';
import { text } from 'drizzle-orm/pg-core';
import { opportunities } from '../opportunities/opportunity.entity';

export const communicationTypeEnum = pgEnum('communication_type', ['email', 'meeting']);

const communicationEntity = qEntity(
  'communications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    opportunityId: qField(uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }), { label: 'Opportunity', description: 'The deal this communication is about (context edge).', isKeyField: true, keyFieldOrder: 2 }),
    type: qField(communicationTypeEnum('type').notNull(), { label: 'Type', description: "Which child table carries the payload: 'email' or 'meeting'.", isKeyField: true, keyFieldOrder: 0 }),
    occurredAt: qField(timestamp('occurred_at').notNull(), { label: 'Occurred at', isKeyField: true, keyFieldOrder: 1 }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A communication tied to a deal — the base record shared by emails and meetings. Carries the opportunity context, timing, and (via participants) the people involved; the type-specific body lives in the matching child table.' },
);

export const communications = communicationEntity.table;

// Forward imports for has_many — children + participants. Modeled as has_many
// (the registry has no has_one); each child link is effectively 1:1.
import { emails } from '../emails/email.entity';
import { meetings } from '../meetings/meeting.entity';
import { communicationParticipants } from './communication-participant.entity';

export const communicationsRelations = relations(communications, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [communications.opportunityId],
    references: [opportunities.id],
  }),
  emails: many(emails),
  meetings: many(meetings),
  participants: many(communicationParticipants),
}));

export type Communication = InferSelectModel<typeof communications>;
export type CommunicationInsert = typeof communications.$inferInsert;
