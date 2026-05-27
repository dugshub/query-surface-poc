// buildRegistry() — derives the query registry at boot by introspecting
// Drizzle's relations() declarations + column metadata. Replaces the
// hand-authored src/generated/query-registry.ts (v1 codegen approach).
//
// Why runtime introspection instead of codegen:
//   - Single source of truth: the relational graph lives in `<entity>Relations`,
//     declared next to the Drizzle table. Engineers maintain one file per entity
//     instead of `entity.yaml + entity.ts + the generated registry`.
//   - No YAMLs to throw away. No codegen step to run before drizzle-kit push.
//   - Types and enum values come from Drizzle's column introspection — they
//     can't drift from the schema.
//
// What we still need humans to declare (per-entity, in the .entity.ts file):
//   - relations(table, ({ one, many }) => ({...}))  ← idiomatic Drizzle
//
// What we DERIVE from Drizzle metadata:
//   - belongs_to: target table from one()'s referencedTable; fk from config.fields[0]
//   - has_many: target table from many()'s referencedTable; fk found by inverse one() lookup
//   - searchableColumns: every text column that isn't an ID/UUID/enum
//   - column types + enum values: directly from PgColumn introspection

import { createMany, createOne, type Relations } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { accounts, accountsRelations, accountsFieldMeta, accountsMeta } from '../modules/accounts/account.entity';
import type { FieldMetaMap, EntityMeta } from '../shared/orm/define-entity';
import { contacts, contactsRelations } from '../modules/contacts/contact.entity';
import { emails, emailsRelations } from '../modules/emails/email.entity';
import { opportunities, opportunitiesRelations } from '../modules/opportunities/opportunity.entity';
import { transcripts, transcriptsRelations } from '../modules/transcripts/transcript.entity';
import { transcriptObservations, transcriptObservationsRelations } from '../modules/transcript-observations/transcript-observation.entity';
import { fieldValues, fieldValuesJsonb } from './eav/schema';
import type { EntityName } from './types';

// ---------------------------------------------------------------------------
// Output shape — matches what compiler.ts / expand.ts / preview.ts read today
// from src/generated/query-registry.ts. Unchanged interface, new derivation.
// ---------------------------------------------------------------------------

export type RelDescriptor =
  | { kind: 'belongs_to'; target: EntityName; fk: string }
  | { kind: 'has_many'; target: EntityName; fk: string };

/**
 * Static EAV strategy for an entity whose fields live in a value table.
 * Discriminated by storage shape — the compiler picks the resolution path off
 * `kind`. Only the static, schema-derived part lives here; the per-actor field
 * map (key → field_definition_id + data_type) is loaded at runtime (field-map.ts).
 * Together they make the EAV seam invisible to the agent regardless of shape.
 *
 *  - 'typed-columns' (Shape A, dealbrain): value lives in one of four typed
 *    columns picked by valueColumnForDataType(); resolution returns a real
 *    PgColumn (rides the kind:'column' path).
 *  - 'jsonb-value' (Shape B, codegen-patterns): value lives in a single jsonb
 *    column with inline temporal validity; resolution returns an SQL cast
 *    expression (the eav_expr path). `currentOnly` adds `valid_to IS NULL` to
 *    the join so only the current value is matched (one row per field).
 */
export type EavStrategy =
  | {
      kind: 'typed-columns';
      valueTable: PgTable;
      entityTypeValue: string;
    }
  | {
      kind: 'jsonb-value';
      valueTable: PgTable;
      entityTypeValue: string;
      valueColumn: string;     // property key of the jsonb column (e.g. 'value')
      currentOnly: boolean;    // true → join predicate adds `valid_to IS NULL`
      validToColumn: string;   // property key of the valid_to column (e.g. 'validTo')
    };

export interface EntityDescriptor {
  name: EntityName;
  table: PgTable;
  primaryKey: string;
  columns: Record<string, PgColumn>;
  relationships: Record<string, RelDescriptor>;
  searchableColumns: string[];
  /** Present when this entity's fields are EAV-backed (e.g. opportunity). */
  eav?: EavStrategy;
  /** Attribute-level native-column semantics (qField), keyed by column property. */
  fieldMeta?: FieldMetaMap;
  /** Entity-level semantics (summary, …). */
  meta?: EntityMeta;
}

// ---------------------------------------------------------------------------
// Registration — the ONE place that maps entity names (singular, our domain
// convention) to their Drizzle tables + relations objects. Drizzle uses table
// names (plural) internally; this list bridges the two.
// ---------------------------------------------------------------------------

interface EntityRegistration {
  name: EntityName;
  table: PgTable;
  relations: Relations;
  /** EAV strategy when the entity's fields are value-table-backed. */
  eav?: EavStrategy;
  fieldMeta?: FieldMetaMap;
  meta?: EntityMeta;
}

const ENTITIES: readonly EntityRegistration[] = [
  // account fields are EAV-backed by Shape B (jsonb single value) — the
  // codegen-patterns layout. opportunity uses Shape A (typed columns).
  {
    name: 'account',
    table: accounts,
    relations: accountsRelations,
    fieldMeta: accountsFieldMeta,
    meta: accountsMeta,
    eav: {
      kind: 'jsonb-value',
      valueTable: fieldValuesJsonb,
      entityTypeValue: 'account',
      valueColumn: 'value',
      currentOnly: true,
      validToColumn: 'validTo',
    },
  },
  {
    name: 'opportunity',
    table: opportunities,
    relations: opportunitiesRelations,
    eav: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'opportunity' },
  },
  { name: 'contact',    table: contacts,    relations: contactsRelations },
  { name: 'email',      table: emails,      relations: emailsRelations },
  { name: 'transcript', table: transcripts, relations: transcriptsRelations },
  // Observation variant — typed packets about a transcript. Shape A EAV, scoped
  // to its own field_definitions(entity_type='transcript_observation').
  {
    name: 'transcriptObservation',
    table: transcriptObservations,
    relations: transcriptObservationsRelations,
    eav: { kind: 'typed-columns', valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  },
];

// ---------------------------------------------------------------------------
// Drizzle introspection helpers
// ---------------------------------------------------------------------------

const TABLE_NAME = Symbol.for('drizzle:Name');
const TABLE_COLUMNS = Symbol.for('drizzle:Columns');

function tableName(t: PgTable): string {
  return (t as unknown as Record<symbol, string>)[TABLE_NAME];
}

function tableColumns(t: PgTable): Record<string, PgColumn> {
  return (t as unknown as Record<symbol, Record<string, PgColumn>>)[TABLE_COLUMNS];
}

// Drizzle 0.30.x stores relations() callbacks unevaluated on the Relations
// object. We pass it Drizzle's own one()/many() builders to walk the config.
type RelationsConfig = Record<string, { constructor: { name: string }; referencedTable: PgTable; config?: { fields: PgColumn[] } }>;

function evaluateRelations(rels: Relations, table: PgTable): RelationsConfig {
  const helpers = { one: createOne(table), many: createMany(table) };
  return (rels as unknown as { config: (h: unknown) => RelationsConfig }).config(helpers);
}

// ---------------------------------------------------------------------------
// Searchable columns — type-driven default.
//
// Include every string-typed column EXCEPT structural identifiers (IDs, FKs,
// external_id) and enum-typed columns (those use `eq`/`in` ops, not text
// matching). Result is broader than a curated list — `creator_email`,
// `language`, etc. become searchable on transcripts — but no per-entity
// metadata is needed.
//
// Override path (when we add it): a `.$type<NotSearchable>()` brand on a
// column would let entity authors opt specific columns out. Not in v2; add
// when the noise becomes a real problem.
// ---------------------------------------------------------------------------

function deriveSearchableColumns(table: PgTable): string[] {
  const out: string[] = [];
  for (const col of Object.values(tableColumns(table))) {
    if (col.dataType !== 'string') continue;
    const cName = (col as unknown as { columnType: string }).columnType;
    if (cName === 'PgUUID') continue;
    if (cName === 'PgEnumColumn') continue;
    const dbName = col.name;
    if (dbName === 'id') continue;
    if (dbName === 'external_id') continue;
    if (dbName.endsWith('_id')) continue;
    out.push(dbName);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

function buildRegistry(): Record<EntityName, EntityDescriptor> {
  // Lookup: Drizzle's table name (plural) → our entity name (singular).
  const tableToEntity: Record<string, EntityName> = {};
  for (const e of ENTITIES) tableToEntity[tableName(e.table)] = e.name;

  // Pass 1: build descriptors with belongs_to filled in. has_many FKs left
  // as placeholders to resolve in pass 2 (Drizzle's many() doesn't carry
  // the FK — it lives on the inverse one() declaration).
  const out = {} as Record<EntityName, EntityDescriptor>;

  for (const spec of ENTITIES) {
    const cfg = evaluateRelations(spec.relations, spec.table);
    const relationships: Record<string, RelDescriptor> = {};

    for (const [relName, rel] of Object.entries(cfg)) {
      const target = tableToEntity[tableName(rel.referencedTable)];
      if (!target) continue;

      if (rel.constructor.name === 'One') {
        const fkName = rel.config!.fields[0].name;
        relationships[relName] = { kind: 'belongs_to', target, fk: fkName };
      } else if (rel.constructor.name === 'Many') {
        // FK resolved in pass 2 — leave a marker.
        relationships[relName] = { kind: 'has_many', target, fk: '' };
      }
    }

    out[spec.name] = {
      name: spec.name,
      table: spec.table,
      primaryKey: 'id',
      columns: spec.table as unknown as Record<string, PgColumn>,
      relationships,
      searchableColumns: deriveSearchableColumns(spec.table),
      eav: spec.eav,
      fieldMeta: spec.fieldMeta,
      meta: spec.meta,
    };
  }

  // Pass 2: for each has_many, find the inverse belongs_to on the target
  // entity and copy its FK column name.
  for (const desc of Object.values(out)) {
    for (const rel of Object.values(desc.relationships)) {
      if (rel.kind !== 'has_many' || rel.fk !== '') continue;
      const targetDesc = out[rel.target];
      const inverse = Object.values(targetDesc.relationships).find(
        r => r.kind === 'belongs_to' && r.target === desc.name,
      );
      if (inverse) {
        rel.fk = inverse.fk;
      } else {
        // Shouldn't happen if relations() is symmetric. Throw a clear error.
        throw new Error(
          `buildRegistry: has_many '${desc.name}' → '${rel.target}' has no inverse belongs_to. ` +
          `Add a 'one(${desc.name})' declaration to ${rel.target}Relations.`,
        );
      }
    }
  }

  return out;
}

// Built once at module load — same lifetime as the static registry it replaces.
export const registry: Record<EntityName, EntityDescriptor> = buildRegistry();
