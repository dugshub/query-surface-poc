// Uniform domain query primitive — the language the agent speaks.
//
// One JSON shape works across every entity. Cross-entity reachability via
// dotted field paths. Boolean composition. Text search is just an op, not a
// special tool.

export type EntityName =
  | 'account'
  | 'opportunity'
  | 'contact'
  | 'email'
  | 'transcript';

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
  on: string;        // field key or dotted path: 'StageName' | 'account.name' | 'opportunity.StageName' | 'text' (magic)
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

/**
 * Snippet entry returned in preview rows when a text op (contains/startswith/
 * endswith) fired in the filter. ADDITIVE — does not replace the column value.
 * One entry per matched column per row; rows with no text match get no _snippets.
 *
 *   - `column`        : camelCase column name where the match was found
 *   - `snippet`       : windowed text around the match (±60 chars by default).
 *                       Leading/trailing `…` indicate truncation from full value.
 *   - `match.start`   : zero-based index OF THE MATCH within `snippet`
 *                       (NOT the full column value). Accounts for the leading `…`.
 *   - `match.end`     : exclusive end of the match within `snippet`.
 *   - `full_length`   : length of the original column value (so caller knows
 *                       there's more to fetch beyond the window).
 */
export interface SnippetEntry {
  column: string;
  snippet: string;
  match: { start: number; end: number };
  full_length: number;
}

/**
 * Descriptor of a text-op leaf in the compiled filter. Collected during compile;
 * consumed at runtime to extract snippets from preview rows.
 *
 * Only direct columns are tracked — has_many text matches (e.g. transcript
 * matching via `chunks.body`) live on a child row not present in the parent
 * preview, so v1 skips them.
 */
export interface TextMatchDescriptor {
  column: string;                                  // camelCase column on the root entity
  pattern: string;                                 // original search string
  op: 'contains' | 'startswith' | 'endswith';
}

// One entity's search result.
// Preview rows are `Record<string, unknown>` to allow the additive `_snippets`
// array — present when a text op fired AND a column matched in this row.
export interface SearchEntityResult {
  ids: string[];
  total: number;          // total matching across all pages
  has_more: boolean;
  preview?: Array<Record<string, unknown>>;   // each row may carry a `_snippets: SnippetEntry[]` field
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
