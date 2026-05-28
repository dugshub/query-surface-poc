// Preview selection — derived from the field catalog (no hand-maintained list).
//
// When `query(preview: true)` is called, we return a curated slice of columns
// alongside each ID. The curated set is the catalog's preview fields
// (CatalogField.preview — from qField `isKeyField` on native columns, or
// field_definitions.isKeyField on EAV fields), ordered by previewOrder. Native
// preview fields project real columns; EAV preview fields project through
// field_values joins. The consumer sees one flat row.

import type { PgColumn } from 'drizzle-orm/pg-core';
import { registry } from '../registry';
import { buildEntityCatalog } from '../catalog';
import type { FieldMap } from '../eav/field-map';
import type { EntityName } from '../types';

export interface PreviewSelection {
  /** Real columns to SELECT, keyed by camelCase alias. */
  nativeColumns: Record<string, PgColumn>;
  /** EAV field keys to project via field_values joins. */
  eavKeys: string[];
}

/** Curated preview fields for an entity, split into native columns + EAV keys. */
export function catalogPreview(entity: EntityName, fieldMap?: FieldMap): PreviewSelection {
  const cat = buildEntityCatalog(entity, fieldMap);
  const cols = registry[entity].columns as Record<string, PgColumn>;
  const preview = cat.fields
    .filter((f) => f.preview)
    .sort((a, b) => (a.previewOrder ?? 999) - (b.previewOrder ?? 999));

  const nativeColumns: Record<string, PgColumn> = {};
  const eavKeys: string[] = [];
  for (const f of preview) {
    if (f.eav) eavKeys.push(f.key);
    else if (f.column && cols[f.column]) nativeColumns[f.column] = cols[f.column];
  }
  return { nativeColumns, eavKeys };
}
