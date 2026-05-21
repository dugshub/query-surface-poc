// EntityRegistry — the hand-authored map from logical entity names to the
// Drizzle tables, columns, and relationships the compiler needs to resolve
// dotted FieldPaths into JOIN chains.
//
// In production this would be code-generated from the entity YAML manifests.
// For the POC, hand-authoring matches the 5-entity scope exactly and keeps
// the demo readable end-to-end.

import { accounts } from '../modules/accounts/account.entity';
import { opportunities } from '../modules/opportunities/opportunity.entity';
import { emails } from '../modules/emails/email.entity';
import { transcripts } from '../modules/transcripts/transcript.entity';
import { transcript_chunks } from '../modules/transcript_chunks/transcript_chunk.entity';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { EntityName } from './types';

export type RelDescriptor =
  | { kind: 'belongs_to'; target: EntityName; fk: string }
  | { kind: 'has_many'; target: EntityName; fk: string };

export interface EntityDescriptor {
  name: EntityName;
  table: PgTable;
  primaryKey: string;
  // tslint:disable-next-line: no-any — columns vary per entity, registry is
  // intentionally loose; type-safety comes from the YAML manifests upstream.
  columns: Record<string, PgColumn>;
  relationships: Record<string, RelDescriptor>;

  // Columns participating in the `on: 'text'` magic fan-out. May include dotted
  // paths through has_many relationships (e.g. transcript declares 'chunks.body').
  // A filter `{on: 'text', op: 'contains', value: X}` expands to:
  //   OR(<col_1> ILIKE %X%, <col_2> ILIKE %X%, ...)
  searchableColumns: string[];
}

export const registry: Record<EntityName, EntityDescriptor> = {
  account: {
    name: 'account',
    table: accounts,
    primaryKey: 'id',
    columns: accounts as unknown as Record<string, PgColumn>,
    relationships: {
      // accounts referenced by opportunities — the reverse direction
      opportunities: { kind: 'has_many', target: 'opportunity', fk: 'account_id' },
    },
    searchableColumns: ['name', 'domain'],
  },
  opportunity: {
    name: 'opportunity',
    table: opportunities,
    primaryKey: 'id',
    columns: opportunities as unknown as Record<string, PgColumn>,
    relationships: {
      account: { kind: 'belongs_to', target: 'account', fk: 'account_id' },
      emails: { kind: 'has_many', target: 'email', fk: 'opportunity_id' },
      transcripts: { kind: 'has_many', target: 'transcript', fk: 'opportunity_id' },
    },
    searchableColumns: ['name'],
  },
  email: {
    name: 'email',
    table: emails,
    primaryKey: 'id',
    columns: emails as unknown as Record<string, PgColumn>,
    relationships: {
      opportunity: { kind: 'belongs_to', target: 'opportunity', fk: 'opportunity_id' },
    },
    searchableColumns: ['subject', 'body'],
  },
  transcript: {
    name: 'transcript',
    table: transcripts,
    primaryKey: 'id',
    columns: transcripts as unknown as Record<string, PgColumn>,
    relationships: {
      opportunity: { kind: 'belongs_to', target: 'opportunity', fk: 'opportunity_id' },
      chunks: { kind: 'has_many', target: 'transcript_chunk', fk: 'transcript_id' },
    },
    // Transcripts themselves have no body column — text matches happen via
    // has_many fan-out into chunks. The compiler resolves 'chunks.body' as a
    // has_many EXISTS subquery, exactly like a hand-written cross-entity filter.
    searchableColumns: ['title', 'participants', 'chunks.body'],
  },
  transcript_chunk: {
    name: 'transcript_chunk',
    table: transcript_chunks,
    primaryKey: 'id',
    columns: transcript_chunks as unknown as Record<string, PgColumn>,
    relationships: {
      transcript: { kind: 'belongs_to', target: 'transcript', fk: 'transcript_id' },
    },
    searchableColumns: ['body'],
  },
};
