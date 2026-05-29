// CommunicationParticipant — the people ⟷ communication edge. One row per
// (communication, person, role). Both sides are real FKs, so the query surface
// can traverse it in either direction: person → participations → communication,
// and communication → participants → person.
//
// `role` vocabulary differs by communication type:
//   email   : from | to | cc | bcc
//   meeting : host | invitee | attendee
//
// invited ≠ attended — they're orthogonal. A person can be invited and not show
// (response='declined', attended=false) or show without an invite (no 'invitee'
// row, attended=true). So invitation lives in `role`/`response` and presence in
// `attended`, rather than collapsing both into one field. For emails `response`
// and `attended` are null (not meaningful).

import {
  boolean,
  pgEnum,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';
import { communications } from './communication.entity';
import { people } from '../people/person.entity';

export const participantRoleEnum = pgEnum('participant_role', [
  'from', 'to', 'cc', 'bcc',       // email
  'host', 'invitee', 'attendee',   // meeting
]);

export const participantResponseEnum = pgEnum('participant_response', [
  'accepted', 'declined', 'tentative', 'no_response',
]);

const communicationParticipantEntity = defineEntity(
  'communication_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communicationId: qField(uuid('communication_id').references(() => communications.id, { onDelete: 'cascade' }), { label: 'Communication', isKeyField: true, keyFieldOrder: 3 }),
    personId: qField(uuid('person_id').references(() => people.id, { onDelete: 'cascade' }), { label: 'Person', isKeyField: true, keyFieldOrder: 1 }),
    role: qField(participantRoleEnum('role').notNull(), { label: 'Role', description: 'email: from/to/cc/bcc · meeting: host/invitee/attendee.', isKeyField: true, keyFieldOrder: 0 }),
    response: qField(participantResponseEnum('response'), { label: 'Invite response', description: 'Meeting RSVP. Null for emails. Orthogonal to attendance.', isKeyField: true, keyFieldOrder: 2 }),
    attended: qField(boolean('attended'), { label: 'Attended', description: 'Did they actually show? Null for emails. invited≠attended — set independently of role/response.' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A person’s involvement in a communication, with a typed role (email: from/to/cc/bcc · meeting: host/invitee/attendee). Carries meeting RSVP (response) and actual presence (attended) as orthogonal facets — invited is not the same as attended.' },
);

export const communicationParticipants = communicationParticipantEntity.table;

export const communicationParticipantsRelations = relations(communicationParticipants, ({ one }) => ({
  communication: one(communications, {
    fields: [communicationParticipants.communicationId],
    references: [communications.id],
  }),
  person: one(people, {
    fields: [communicationParticipants.personId],
    references: [people.id],
  }),
}));

export type CommunicationParticipant = InferSelectModel<typeof communicationParticipants>;
export type CommunicationParticipantInsert = typeof communicationParticipants.$inferInsert;
