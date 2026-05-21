import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';

export const industryEnum = pgEnum('industry', ['fintech', 'saas', 'retail', 'health', 'manufacturing', 'other']);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    externalId: text('external_id'),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    industry: industryEnum('industry'),
    domain: text('domain'),
    employeeCount: integer('employee_count'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
);

export type Account = InferSelectModel<typeof accounts>;
export type AccountInsert = typeof accounts.$inferInsert;
