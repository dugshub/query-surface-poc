// Actor-scoped EAV field map — the DYNAMIC half of the registry.
//
// `field_definitions` are per-user, so "which fields does `opportunity` have,
// and what are their ids/types" can't be a module-load singleton like the
// static registry (tables, columns, relationships). This loads that map for a
// given (userId, entityType) and caches it in-process. The compiler reads it
// (via the EavContext threaded into compile()) to resolve an EAV field path
// like `opportunity.StageName` to a field_definition_id + value column.
//
// POC scope: cached at first use for process lifetime; query_describe and the
// search/fetch path share the cache. A real consumer would key the cache by
// the authenticated actor and invalidate it on field-definition writes.

import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { registry } from '../generated/query-registry';
import { fieldDefinitions } from './eav-schema';
import type { EntityName } from './types';

export interface FieldDef {
  fieldDefinitionId: string;
  dataType: string;
  /** select / multipicklist option list, when the field is an enumerated type. */
  selectOptions: string[] | null;
  label: string;
}

/** key (e.g. 'StageName') → its definition for this actor. */
export type FieldMap = ReadonlyMap<string, FieldDef>;

/** EAV resolution context threaded into compile(): the actor's field maps per entity. */
export interface EavContext {
  fieldMaps: Partial<Record<EntityName, FieldMap>>;
}

// POC single-tenant actor — equals the seed USER_ID (src/seed-data/deal-types.ts).
// A real consumer injects the authenticated actor instead of this constant.
export const POC_ACTOR_USER_ID = '11111111-1111-1111-1111-111111111111';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = NodePgDatabase<any>;

const cache = new Map<string, FieldMap>();

/** Load (and cache) the field map for one actor + entity_type. */
export async function loadFieldMap(
  db: AnyDb,
  userId: string,
  entityType: string,
): Promise<FieldMap> {
  const cacheKey = `${userId}|${entityType}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const rows = await db
    .select({
      id: fieldDefinitions.id,
      key: fieldDefinitions.key,
      dataType: fieldDefinitions.dataType,
      selectOptions: fieldDefinitions.selectOptions,
      label: fieldDefinitions.label,
    })
    .from(fieldDefinitions)
    .where(and(eq(fieldDefinitions.userId, userId), eq(fieldDefinitions.entityType, entityType)));

  const map = new Map<string, FieldDef>();
  for (const r of rows) {
    map.set(r.key, {
      fieldDefinitionId: r.id,
      dataType: r.dataType,
      selectOptions: (r.selectOptions as string[] | null) ?? null,
      label: r.label,
    });
  }
  cache.set(cacheKey, map);
  return map;
}

/** Load field maps for every EAV-enabled entity in the registry, for one actor. */
export async function loadFieldMaps(db: AnyDb, userId: string): Promise<EavContext> {
  const fieldMaps: Partial<Record<EntityName, FieldMap>> = {};
  for (const desc of Object.values(registry)) {
    if (desc.eav) {
      fieldMaps[desc.name] = await loadFieldMap(db, userId, desc.eav.entityTypeValue);
    }
  }
  return { fieldMaps };
}

/** Test/seed hook — drop the cache (e.g. after reseeding field_definitions). */
export function clearFieldMapCache(): void {
  cache.clear();
}
