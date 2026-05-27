import {
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { defineEntity, qField } from '@shared/orm/define-entity';

const accountEntity = defineEntity(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: qField(uuid('user_id').notNull(), { isVisible: false }),
    organizationId: qField(uuid('organization_id'), { isVisible: false }),
    externalId: qField(text('external_id'), { label: 'External ID', description: 'Source CRM identifier (Salesforce/HubSpot).' }),
    name: qField(text('name').notNull(), { label: 'Account name', description: 'Company name, e.g. "Acme Corp".', searchable: true, isKeyField: true, keyFieldOrder: 0 }),
    website: qField(text('website'), { label: 'Website', searchable: true, isKeyField: true, keyFieldOrder: 1 }),
    providerMetadata: qField(jsonb('provider_metadata'), { isVisible: false }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  { summary: 'A company/organization the user sells to. Root of the CRM graph — opportunities and contacts hang off accounts.' },
);

export const accounts = accountEntity.table;
export const accountsFieldMeta = accountEntity.fieldMeta;
export const accountsMeta = accountEntity.meta;

// Forward declarations — registry.ts introspects these to learn the relational
// graph. Both directions are declared so cross-entity reach works without a
// separate metadata file.
import { opportunities } from '../opportunities/opportunity.entity';
import { contacts } from '../contacts/contact.entity';

export const accountsRelations = relations(accounts, ({ many }) => ({
  opportunities: many(opportunities),
  contacts: many(contacts),
}));

export type Account = InferSelectModel<typeof accounts>;
export type AccountInsert = typeof accounts.$inferInsert;
