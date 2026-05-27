import {
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '../../query/define-entity';
import { accounts } from '../accounts/account.entity';

const contactEntity = defineEntity(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: qField(uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }), { label: 'Account', isKeyField: true, keyFieldOrder: 3 }),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    organizationId: qField(uuid('organization_id'), { isVisible: false }),
    externalId: qField(text('external_id'), { label: 'External ID' }),
    firstName: qField(text('first_name'), { label: 'First name', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    lastName: qField(text('last_name'), { label: 'Last name', searchable: true, isKeyField: true, keyFieldOrder: 1 }),
    email: qField(text('email'), { label: 'Email', searchable: true, isKeyField: true, keyFieldOrder: 2 }),
    providerMetadata: qField(jsonb('provider_metadata'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A person attached to an account — the human stakeholders on a deal. Buyers, champions, decision-makers.' },
);

export const contacts = contactEntity.table;
export const contactsFieldMeta = contactEntity.fieldMeta;
export const contactsMeta = contactEntity.meta;

export const contactsRelations = relations(contacts, ({ one }) => ({
  account: one(accounts, {
    fields: [contacts.accountId],
    references: [accounts.id],
  }),
}));

export type Contact = InferSelectModel<typeof contacts>;
export type ContactInsert = typeof contacts.$inferInsert;
