// Per-entity preview column selection.
//
// When /search is called with `preview: true`, we return a curated slice of
// columns alongside each ID so the agent can browse without a second roundtrip.
// In production codegen would emit this from the entity manifest; for the POC
// it's hand-defined to match what a seller would actually want to see at a glance.
//
// Curated fields can be a mix of real columns and EAV field keys (e.g.
// opportunity's StageName / Amount live in field_values). `previewColumns`
// resolves the real ones; `previewEavFields` returns the EAV ones, which the
// compiler projects through field_values joins. The agent sees one flat row.

import type { PgColumn } from 'drizzle-orm/pg-core';
import { registry } from '../generated/query-registry';
import type { FieldMap } from './field-map';
import type { EntityName } from './types';

const PREVIEW_FIELDS: Record<EntityName, string[]> = {
  // name + website are real columns; Industry / Tier / EmployeeCount are
  // Shape-B (jsonb) EAV fields surfaced via field_values_jsonb.
  account:     ['name', 'website', 'Industry', 'Tier', 'EmployeeCount'],
  // name + account_id are real columns; StageName / Amount / CloseDate are
  // EAV fields (real SF keys), surfaced via field_values joins.
  opportunity: ['name', 'StageName', 'Amount', 'CloseDate', 'account_id'],
  contact:     ['first_name', 'last_name', 'email', 'account_id'],
  email:       ['subject', 'from_address', 'direction', 'occurred_at', 'opportunity_id'],
  transcript:  ['title', 'source', 'occurred_at', 'opportunity_id', 'summary'],
};

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Real (non-EAV) preview columns resolvable directly off the entity's table. */
export function previewColumns(entity: EntityName): Record<string, PgColumn> {
  const fields = PREVIEW_FIELDS[entity];
  const desc = registry[entity];
  const cols = desc.columns as Record<string, PgColumn>;
  const out: Record<string, PgColumn> = {};
  for (const f of fields) {
    const col = cols[camel(f)];
    if (col) out[camel(f)] = col;
  }
  return out;
}

/**
 * Curated preview fields that are EAV-backed (present in the actor's field
 * map). Returned as field keys for the compiler to project via field_values
 * joins. Empty unless the entity is EAV-enabled and a field map is supplied.
 */
export function previewEavFields(entity: EntityName, fieldMap?: FieldMap): string[] {
  if (!fieldMap || !registry[entity].eav) return [];
  return PREVIEW_FIELDS[entity].filter((f) => fieldMap.has(f));
}
