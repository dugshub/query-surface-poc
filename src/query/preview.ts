// Per-entity preview column selection.
//
// When /search is called with `preview: true`, we return a curated slice of
// columns alongside each ID so the agent can browse without a second roundtrip.
// In production codegen would emit this from the entity manifest; for the POC
// it's hand-defined to match what a seller would actually want to see at a glance.

import type { PgColumn } from 'drizzle-orm/pg-core';
import { registry } from '../generated/query-registry';
import type { EntityName } from './types';

const PREVIEW_FIELDS: Record<EntityName, string[]> = {
  account:     ['name', 'website'],
  opportunity: ['name', 'stage', 'amount', 'state_of_deal_status', 'account_id', 'close_date'],
  contact:     ['first_name', 'last_name', 'email', 'account_id'],
  email:       ['subject', 'from_address', 'direction', 'occurred_at', 'opportunity_id'],
  transcript:  ['title', 'source', 'occurred_at', 'opportunity_id', 'summary'],
};

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

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
