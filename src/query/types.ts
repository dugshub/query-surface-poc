// Uniform domain query primitive — the language the agent speaks.
//
// One JSON shape works across every entity. Cross-entity reachability via
// dotted field paths. Boolean composition. Text search is just an op, not a
// special tool.

export type EntityName =
  | 'account'
  | 'opportunity'
  | 'email'
  | 'transcript'
  | 'transcript_chunk';

export type Op =
  | 'eq'
  | 'neq'
  | 'in'
  | 'nin'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'contains'      // ILIKE %X%
  | 'startswith'    // ILIKE X%
  | 'endswith'      // ILIKE %X
  | 'is_null'
  | 'is_not_null';

export interface LeafFilter {
  on: string;        // dotted path: 'stage' | 'account.industry' | 'chunks.body' | 'text' (magic — Round 2)
  op: Op;
  value?: unknown;
}

export type FilterExpression =
  | LeafFilter
  | { and: FilterExpression[] }
  | { or: FilterExpression[] }
  | { not: FilterExpression };

export interface Sort {
  field: string;
  dir: 'asc' | 'desc';
}

// ============================================================================
// Internal (kept for compatibility with the demo CLI which imports it)
// ============================================================================

export interface DomainQueryRequest {
  entity: EntityName;
  filter?: FilterExpression;
  sort?: Sort[];
  page?: { limit?: number; offset?: number };
  expand?: string[];
  include_sql?: boolean;
}

export interface DomainQueryResult<T = Record<string, unknown>> {
  rows: T[];
  count: number;
  sql?: string;
  params?: unknown[];
}

// ============================================================================
// /search — find things, return IDs (and optional preview rows)
// ============================================================================

// Per-entity query inside a multi-entity search.
export interface SingleSearchQuery {
  entity: EntityName;
  filter?: FilterExpression;
  sort?: Sort[];
  page?: { limit?: number; offset?: number };
}

// Request shape: ONE of these forms.
//   Shape 1: single entity inline — { entity, filter, sort, page, preview?, include_sql? }
//   Shape 2: multi-entity         — { queries: SingleSearchQuery[], preview?, include_sql? }
export type SearchRequest =
  | (SingleSearchQuery & { preview?: boolean; include_sql?: boolean })
  | { queries: SingleSearchQuery[]; preview?: boolean; include_sql?: boolean };

// One entity's search result.
export interface SearchEntityResult {
  ids: string[];
  total: number;          // total matching across all pages
  has_more: boolean;
  preview?: Array<Record<string, unknown>>;   // populated when preview: true; shape = curated columns per entity
  sql?: string;           // debug
  params?: unknown[];
}

// Response shape mirrors the request:
//   Single-entity request →  { entity, ids, total, has_more, preview?, sql? }
//   Multi-entity request →   { results: { [entity]: SearchEntityResult } }
export type SearchResponse =
  | ({ entity: EntityName } & SearchEntityResult)
  | { results: Partial<Record<EntityName, SearchEntityResult>> };

// ============================================================================
// /fetch — hydrate IDs into full rows, with optional refinement filter
// ============================================================================

export interface FetchRequest {
  entity: EntityName;
  ids: string[];
  filter?: FilterExpression;      // optional refinement — narrow within these IDs
  expand?: string[];              // (not yet implemented; v2)
  include_sql?: boolean;
}

export interface FetchResponse {
  entity: EntityName;
  rows: Array<Record<string, unknown>>;
  count: number;
  sql?: string;
  params?: unknown[];
}
