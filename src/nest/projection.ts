import type { CatalogField, EntityCatalog } from '../catalog';
import type { ExposeColumns } from './options';

/**
 * Consumer-facing projection of the engine's internal catalog + rows.
 *
 * Two jobs, applied once at the public call-path (the use-cases), never in the
 * service (host code composing on the service wants the raw shape):
 *  1. Strip implementation facets — `column`, `eav`, `preview`, `sources`,
 *     relationship `fk`, entity `searchableColumns` — that leak introspection
 *     internals into the contract.
 *  2. Curate the field set — a native column reaches the consumer only if it is
 *     allow-listed in `exposeColumns[entity]`; EAV fields are already
 *     is_visible-curated by the engine, so they pass through. `id` always
 *     passes (the row handle). With no allowlist configured, native columns
 *     pass through unchanged (facet-trim only) — the host opts in by providing
 *     the map.
 */

export interface PublicCatalogField {
  key: string;
  label?: string;
  type: string;
  nullable: boolean;
  searchable: boolean;
  note?: string;
  enumValues?: readonly string[];
}

export interface PublicRelationship {
  name: string;
  kind: string;
  target: string;
}

export interface PublicEntityCatalog {
  entity: string;
  fields: PublicCatalogField[];
  relationships: PublicRelationship[];
}

function isPublicField(
  field: CatalogField,
  entity: string,
  expose?: ExposeColumns,
): boolean {
  if (field.eav) return true;
  if (field.key === 'id') return true;
  if (!expose) return true;
  return (expose[entity] ?? []).includes(field.key);
}

function toPublicField(f: CatalogField): PublicCatalogField {
  return {
    key: f.key,
    ...(f.label ? { label: f.label } : {}),
    type: f.type,
    nullable: f.nullable,
    searchable: f.searchable,
    ...(f.note ? { note: f.note } : {}),
    ...(f.enumValues && f.enumValues.length > 0
      ? { enumValues: f.enumValues }
      : {}),
  };
}

/** Lean describe shape: facets stripped, native columns filtered to the allowlist. */
export function projectCatalog(
  catalog: EntityCatalog,
  expose?: ExposeColumns,
): PublicEntityCatalog {
  const entity = catalog.entity as string;
  return {
    entity,
    fields: catalog.fields
      .filter((f) => isPublicField(f, entity, expose))
      .map(toPublicField),
    relationships: catalog.relationships.map((r) => ({
      name: r.name,
      kind: r.kind,
      target: r.target as string,
    })),
  };
}

/**
 * Row keys a consumer may see for an entity: the public field set plus
 * relationship names, so `expand`ed relations survive projection.
 */
export function publicKeySet(
  catalog: EntityCatalog,
  expose?: ExposeColumns,
): Set<string> {
  const entity = catalog.entity as string;
  const keys = new Set<string>();
  for (const f of catalog.fields) {
    if (isPublicField(f, entity, expose)) keys.add(f.key);
  }
  for (const r of catalog.relationships) keys.add(r.name);
  return keys;
}

/** Pick only the allowed keys from a raw row. */
export function projectRow(
  row: Record<string, unknown>,
  keys: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row)) {
    if (keys.has(k)) out[k] = row[k];
  }
  return out;
}
