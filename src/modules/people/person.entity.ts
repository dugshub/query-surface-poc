// Person — the canonical identity pillar. EVERYONE who shows up in a
// communication is a person: external buyers, the internal rep, a random cc on
// a thread. A `contact` is a person *promoted* to a CRM stakeholder on an
// account (contact.person_id → people); the rep is a person with no contact.
//
// communication_participants map to people (not contacts) so any participant —
// CRM-known or not — has something to point at. person → contact → account is
// the bridge back into the CRM graph.

import {
  pgEnum,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';

export const personKindEnum = pgEnum('person_kind', ['internal', 'external', 'unknown']);

const personEntity = defineEntity(
  'people',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    displayName: qField(text('display_name').notNull(), { label: 'Name', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    email: qField(text('email'), { label: 'Email', searchable: true, isKeyField: true, keyFieldOrder: 1 }),
    kind: qField(personKindEnum('kind').notNull(), { label: 'Kind', description: 'internal = our side (the rep/org); external = the customer side; unknown = unresolved.', isKeyField: true, keyFieldOrder: 2 }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A person — the canonical identity that communication participants map to. Everyone on an email or in a meeting is a person; a contact is a person promoted to a CRM stakeholder on an account.' },
);

export const people = personEntity.table;

// Forward imports for has_many — both directions declared so registry.ts can
// introspect the full graph.
import { contacts } from '../contacts/contact.entity';
import { communicationParticipants } from '../communications/communication-participant.entity';

export const peopleRelations = relations(people, ({ many }) => ({
  contacts: many(contacts),
  participations: many(communicationParticipants),
}));

export type Person = InferSelectModel<typeof people>;
export type PersonInsert = typeof people.$inferInsert;
