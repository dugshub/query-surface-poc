// EAV read-merge — fold EAV cells back into hydrated rows so an EAV entity's
// rows carry their fields (StageName, Amount, …) inline, indistinguishable from
// real columns. The read counterpart to the compiler's resolveEav.
//
// Shared by runFetch/runQuery (root rows) and expand.ts (materialized related
// rows) so EVERY surface that returns a row hydrates its EAV fields. Lives in
// its own module to avoid a service ↔ expand import cycle. Batched: one query
// over field_values for all row ids.

import { and, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { registry } from '../generated/query-registry';
import { extractTypedValue } from './eav-mapping';
import { fieldValues } from './eav-schema';
import type { FieldMap } from './field-map';
import type { EntityName } from './types';

export async function hydrateEavRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>,
  entity: EntityName,
  rows: Array<Record<string, unknown>>,
  fieldMap?: FieldMap,
): Promise<void> {
  const desc = registry[entity];
  if (!desc.eav || !fieldMap || fieldMap.size === 0 || rows.length === 0) return;

  const ids = rows.map((r) => String(r.id)).filter(Boolean);
  if (ids.length === 0) return;

  // field_definition_id → { key, dataType } for decoding each cell.
  const byDefId = new Map<string, { key: string; dataType: string }>();
  for (const [key, def] of fieldMap) {
    byDefId.set(def.fieldDefinitionId, { key, dataType: def.dataType });
  }

  const fvRows = await db
    .select({
      entityId: fieldValues.entityId,
      fieldDefinitionId: fieldValues.fieldDefinitionId,
      valueText: fieldValues.valueText,
      valueNumber: fieldValues.valueNumber,
      valueDate: fieldValues.valueDate,
      valueBoolean: fieldValues.valueBoolean,
    })
    .from(fieldValues)
    .where(
      and(
        eq(fieldValues.entityType, desc.eav.entityTypeValue),
        inArray(fieldValues.entityId, ids),
      ),
    );

  const byEntity = new Map<string, Record<string, unknown>>();
  for (const fv of fvRows) {
    const meta = byDefId.get(fv.fieldDefinitionId);
    if (!meta) continue;
    let bag = byEntity.get(fv.entityId);
    if (!bag) {
      bag = {};
      byEntity.set(fv.entityId, bag);
    }
    bag[meta.key] = extractTypedValue(fv, meta.dataType);
  }

  for (const r of rows) {
    const bag = byEntity.get(String(r.id));
    if (bag) Object.assign(r, bag);
  }
}
