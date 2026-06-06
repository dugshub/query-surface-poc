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

// ── the editor's op vocabulary ──────────────────────────────────────────────
// Internal to the filter BUILDER (ConditionEditor / FilterBuilder / OPS_BY_TYPE).
// These are the UI spellings the user picks from; they are mapped to the wire
// Predicate spelling at serialization time (filter.ts `leafToExpr`). They are NOT
// the wire format.
export type Op =
  | 'eq' | 'neq' | 'in' | 'nin'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'contains' | 'startswith' | 'endswith'
  | 'is_null' | 'is_not_null';

// ── the wire filter language: a resolved Predicate ──────────────────────────
// Mirror of the package's src/query/predicate.ts — the resolved subset of the
// locked Predicate language (RFC-0002 §4: Predicate is the only expression
// language; the frontend filter editor "serializes to the Predicate type").
// Operands are restricted to entity-path and literal bindings.
export type Binding =
  | { from: 'entity'; path: string }
  | { from: 'literal'; value: unknown };

export type CmpOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'between';
export type StrOp = 'matches' | 'contains' | 'startsWith' | 'endsWith';
export type UnaryOp = 'exists' | 'missing' | 'isNull' | 'isNotNull';

export type Predicate =
  | { op: CmpOp; left: Binding; right: Binding }
  | { op: StrOp; left: Binding; pattern: string }
  | { op: UnaryOp; left: Binding }
  | { op: 'and' | 'or'; clauses: Predicate[] }
  | { op: 'not'; clause: Predicate };

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
  filter?: Predicate;
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
