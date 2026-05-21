import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';

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

export type Account = InferSelectModel<typeof accounts>;
export type AccountInsert = typeof accounts.$inferInsert;
