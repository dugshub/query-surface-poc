import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { accounts } from '../accounts/account.entity';

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id'),
    externalId: text('external_id'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email'),
    providerMetadata: jsonb('provider_metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const contactsRelations = relations(contacts, ({ one }) => ({
  account: one(accounts, {
    fields: [contacts.accountId],
    references: [accounts.id],
  }),
}));

export type Contact = InferSelectModel<typeof contacts>;
export type ContactInsert = typeof contacts.$inferInsert;
