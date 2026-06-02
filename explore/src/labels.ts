// Human-readable display labels. The surface speaks in keys (snake_case native
// columns, camelCase backing columns, dotted related paths); the UI should speak
// in labels. Prefer an entity's explicit `label` (from qField / field_definitions);
// fall back to a humanized key so nothing ever renders raw.

import { camelize } from './filter';
import type { PathInfo } from './graph';
import type { CatalogField, EntityCatalog } from './types';

// Tokens that read better fully uppercased than Title-cased.
const ACRONYMS = new Set(['id', 'url', 'uri', 'rls', 'api', 'uuid', 'crm', 'ip', 'sql', 'ai', 'rsvp']);

/** snake_case / camelCase key → "Title Case", used only when no explicit label exists. */
export function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split camelCase boundaries
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** A field's display label: explicit label wins, else humanized key. */
export const fieldLabel = (f: CatalogField): string => f.label ?? humanize(f.key);

/** An entity's display label. Entities carry no label in the catalog, so humanize. */
export const entityLabel = (entity: string): string => humanize(entity);

/** Match a result-row column key back to a catalog field (by key, backing column, or camel form). */
const findField = (cat: EntityCatalog, col: string): CatalogField | undefined => {
  const cc = camelize(col);
  return cat.fields.find((f) => f.key === col || f.column === col || camelize(f.key) === cc || (f.column && camelize(f.column) === cc));
};

/**
 * Resolve any projected column key (native, EAV, or dotted related path) to its
 * display label. Related columns are prefixed with the related entity, e.g.
 * "Account · Name", so they stay distinguishable in a flat results header.
 */
export function columnLabel(
  col: string,
  root: EntityCatalog,
  catalogs: Map<string, EntityCatalog>,
  paths: Map<string, PathInfo>,
): string {
  if (col.includes('.')) {
    const segs = col.split('.');
    const field = segs[segs.length - 1];
    const prefix = segs.slice(0, -1).join('.');
    for (const p of paths.values()) {
      if (p.prefix.join('.') !== prefix) continue;
      const cat = catalogs.get(p.entity);
      const f = cat && findField(cat, field);
      const base = f ? fieldLabel(f) : humanize(field);
      return `${entityLabel(p.entity)} · ${base}`;
    }
    return humanize(field);
  }
  const f = findField(root, col);
  return f ? fieldLabel(f) : humanize(col);
}
