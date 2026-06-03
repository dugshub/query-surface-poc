// Mirror of the query-surface contract (src/query/types.ts + catalog.ts), kept
// as a hand-maintained copy so the Explore app stays a pure HTTP client with no
// import into the package. If the surface contract changes, update this file.

export type ColumnType =
  | 'uuid' | 'string' | 'integer' | 'number'
  | 'datetime' | 'date' | 'boolean' | 'json' | 'enum';

export type FacetSource = 'drizzle' | 'field_definition' | 'field_meta' | 'derived';

export interface CatalogField {
  /** What you put in `on:` / `columns:` — snake_case for native cols, field key for EAV. */
  key: string;
  /** Backing camelCase real column; absent for EAV-only fields. */
  column?: string;
  eav: boolean;
  type: ColumnType;
  nullable: boolean;
  enumValues?: string[];
  label?: string;
  note?: string;
  searchable: boolean;
  preview: boolean;
  previewOrder?: number;
  /** Provenance per facet — where each piece of metadata came from. */
  sources: Partial<Record<string, FacetSource>>;
}

export interface RelationshipInfo {
  name: string;
  kind: 'belongs_to' | 'has_many';
  target: string;
  fk: string;
}

/** Structural role. Absent ⇒ 'entity'. 'junction' = link/edge table: traversable
 *  but not a first-class query root, so the entity picker hides it. */
export type EntityKind = 'entity' | 'junction';

export interface EntityCatalog {
  entity: string;
  summary?: string;
  kind?: EntityKind;
  fields: CatalogField[];
  relationships: RelationshipInfo[];
  searchableColumns: string[];
}

export type Op =
  | 'eq' | 'neq' | 'in' | 'nin'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'contains' | 'startswith' | 'endswith'
  | 'is_null' | 'is_not_null';

export interface LeafFilter {
  on: string;
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

/** Preview rows are open records (they may carry an additive `_snippets` array). */
export type PreviewRow = Record<string, unknown> & { _snippets?: SnippetEntry[] };

export interface SnippetEntry {
  column: string;
  snippet: string;
  match: { start: number; end: number };
  full_length: number;
}

export interface SearchResult {
  entity?: string;
  ids: string[];
  total: number;
  has_more: boolean;
  preview?: PreviewRow[];
  sql?: string;
  params?: unknown[];
  error?: string;
  message?: string;
}

/** Hydrated rows from /api/fetch — full columns + EAV merged + expanded relations. */
export interface FetchResult {
  entity: string;
  rows: Array<Record<string, unknown>>;
  count: number;
  sql?: string;
  params?: unknown[];
  error?: string;
  message?: string;
}

// ── the single source of truth the whole UI is a projection of ──────────────
// Every surface (filter builder, results table, SQL panel, tool-call panel, the
// URL hash) reads from and writes to this one object. See memory: explore-ui-build.
export interface QueryState {
  entity: string | null;
  filter?: FilterExpression;
  sort: Sort[];
  /** Projection — fields to show as result columns. Empty → the curated preview set. */
  columns: string[];
  /** Relations to hydrate on drill-down (used in M3). */
  expand: string[];
  page: { limit: number; offset: number };
}

export const emptyQueryState = (entity: string | null): QueryState => ({
  entity,
  filter: undefined,
  sort: [],
  columns: [],
  expand: [],
  page: { limit: 25, offset: 0 },
});
