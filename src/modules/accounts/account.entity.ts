import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id'),
    externalId: text('external_id'),
    name: text('name').notNull(),
    website: text('website'),
    providerMetadata: jsonb('provider_metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

// Forward declarations — buildRegistry() introspects these to learn the
// relational graph. Both directions are declared so cross-entity reach
// (e.g. `account.contacts.email contains '@'`) works without a separate
// metadata file.
//
// belongs_to lives on the entity holding the FK; has_many lives on the
// "parent" side. Targets are typed as `any` to break the import cycle
// between sibling entity modules.
import { opportunities } from '../opportunities/opportunity.entity';
import { contacts } from '../contacts/contact.entity';

export const accountsRelations = relations(accounts, ({ many }) => ({
  opportunities: many(opportunities),
  contacts: many(contacts),
}));

export type Account = InferSelectModel<typeof accounts>;
export type AccountInsert = typeof accounts.$inferInsert;
