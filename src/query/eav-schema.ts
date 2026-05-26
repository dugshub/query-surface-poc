// EAV substrate — Shape A (dealbrain typed-column `field_values`).
//
// Mirrors dealbrain proper's `field_definitions` + `field_values` (the layout
// the live CRM runs; packages/db/src/server/schema.ts). These are NOT domain
// query entities — they are not in `EntityName`, not searchable, not exposed
// by /search. They are the backing tables the FilterCompiler JOINs to when it
// resolves an EAV field path (e.g. `opportunity.StageName`).
//
// `field_definitions` is per-user (unique on user_id + entity_type + key), so
// the resolver's field map is actor-scoped — see build-registry / loadFieldMap.
//
// Registered for drizzle-kit via src/schema.ts (NOT the generated barrel).

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

// One row per (user, entity_type, key): the schema record describing a custom
// or sync-discovered field. Lean subset of dealbrain's 30-column table — only
// the columns the resolver, query_describe, and the seed need.
export const fieldDefinitions = pgTable(
  'field_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    key: varchar('key', { length: 255 }).notNull(),
    // See valueColumnForDataType() for the data_type → value column mapping.
    dataType: varchar('data_type', { length: 20 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).default('opportunity').notNull(),
    selectOptions: jsonb('select_options').$type<string[]>(),
    isKeyField: boolean('is_key_field').default(false).notNull(),
    keyFieldOrder: integer('key_field_order'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userEntityKeyUnique: unique('field_definitions_user_entity_type_key_unique').on(
      t.userId,
      t.entityType,
      t.key,
    ),
    userEntityIdx: index('field_definitions_user_id_entity_type_idx').on(t.userId, t.entityType),
  }),
);

// One row per (entity_id, entity_type, field_definition_id): the value of a
// dynamic field for a specific entity row. Sparse typed columns — exactly one
// of value_* is populated, selected by the definition's data_type.
export const fieldValues = pgTable(
  'field_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityId: uuid('entity_id').notNull(),
    entityType: varchar('entity_type', { length: 50 }).default('opportunity').notNull(),
    fieldDefinitionId: uuid('field_definition_id')
      .notNull()
      .references(() => fieldDefinitions.id, { onDelete: 'cascade' }),
    // Sparse columns for different data types (see valueColumnForDataType).
    valueText: text('value_text'),
    valueNumber: numeric('value_number'),
    valueDate: timestamp('value_date'),
    valueBoolean: boolean('value_boolean'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    // The uniqueness the resolver relies on: at most one value row per field,
    // so a LEFT JOIN can never multiply parent rows (the "virtual column" trick).
    valueUnique: unique('field_values_unique').on(t.entityId, t.entityType, t.fieldDefinitionId),
    entityIdx: index('field_values_entity_type_entity_id_idx').on(t.entityType, t.entityId),
    defIdx: index('field_values_field_definition_id_idx').on(t.fieldDefinitionId),
    // Read-side filter accelerators — typed columns index cleanly (Shape A's
    // advantage over jsonb). Cover the two hottest value columns.
    defTextIdx: index('field_values_def_text_idx').on(t.fieldDefinitionId, t.valueText),
    defNumberIdx: index('field_values_def_number_idx').on(t.fieldDefinitionId, t.valueNumber),
  }),
);

export type FieldDefinition = InferSelectModel<typeof fieldDefinitions>;
export type FieldValue = InferSelectModel<typeof fieldValues>;
