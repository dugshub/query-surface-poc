// DomainQueryService — runs CompiledQuery against Drizzle.
//
// Three flows:
//   runQuery  — legacy, full-row return for the CLI demo (kept for compat)
//   runSearch — narrow + return IDs (+ optional preview rows)
//   runFetch  — hydrate IDs into full rows (+ optional refinement filter)

import { count, getTableName, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { compile } from './compiler';
import { registry } from '../generated/query-registry';
import { previewColumns } from './preview';
import type {
  DomainQueryRequest,
  DomainQueryResult,
  EntityName,
  FetchRequest,
  FetchResponse,
  FilterExpression,
  SearchEntityResult,
  SingleSearchQuery,
  Sort,
} from './types';

// ============================================================================
// LEGACY — full-row return. Kept so demo.ts keeps working.
// ============================================================================
export async function runQuery(
  db: NodePgDatabase<Record<string, unknown>>,
  req: DomainQueryRequest,
): Promise<DomainQueryResult> {
  const compiled = compile(req);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db.select().from(compiled.rootTable);
  for (const j of compiled.joins) q = q.leftJoin(j.table, j.on);
  if (compiled.where) q = q.where(compiled.where);
  if (compiled.orderBy.length) q = q.orderBy(...compiled.orderBy);
  q = q.limit(compiled.limit).offset(compiled.offset);

  const debug = (q as { toSQL: () => { sql: string; params: unknown[] } }).toSQL();
  const rawRows = await q;

  const rootKey = getTableName(compiled.rootTable);
  const rootRows = rawRows.map((r: unknown) => {
    if (compiled.joins.length === 0) return r;
    return (r as Record<string, unknown>)[rootKey] ?? r;
  });

  return {
    rows: rootRows,
    count: rootRows.length,
    ...(req.include_sql ? { sql: debug.sql, params: debug.params } : {}),
  };
}

// ============================================================================
// /search — narrow + return IDs (+ optional preview)
// ============================================================================

export async function runSearch(
  db: NodePgDatabase<Record<string, unknown>>,
  query: SingleSearchQuery,
  opts: { preview?: boolean; include_sql?: boolean },
): Promise<SearchEntityResult> {
  // Compile once — same JOIN chain serves the COUNT and the SELECT-ID queries.
  const compiled = compile({
    entity: query.entity,
    filter: query.filter,
    sort: query.sort,
    page: query.page,
  });

  const desc = registry[query.entity];
  const idCol = (desc.columns as Record<string, PgColumn>)[desc.primaryKey];

  // 1) Total count — same WHERE + JOINs, no ORDER BY / LIMIT.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cq: any = db.select({ total: count() }).from(compiled.rootTable);
  for (const j of compiled.joins) cq = cq.leftJoin(j.table, j.on);
  if (compiled.where) cq = cq.where(compiled.where);
  const totalRows = await cq;
  const total = Number(totalRows[0]?.total ?? 0);

  // 2) Paginated SELECT — ids (+ preview columns if requested).
  const previewCols = opts.preview ? previewColumns(query.entity) : null;
  const selectShape: Record<string, PgColumn> = { id: idCol };
  if (previewCols) {
    for (const [alias, col] of Object.entries(previewCols)) {
      selectShape[alias] = col;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pq: any = db.select(selectShape).from(compiled.rootTable);
  for (const j of compiled.joins) pq = pq.leftJoin(j.table, j.on);
  if (compiled.where) pq = pq.where(compiled.where);
  if (compiled.orderBy.length) pq = pq.orderBy(...compiled.orderBy);
  pq = pq.limit(compiled.limit).offset(compiled.offset);

  const debug = (pq as { toSQL: () => { sql: string; params: unknown[] } }).toSQL();
  const rows: Array<Record<string, unknown>> = await pq;

  const ids = rows.map(r => String(r.id));

  const result: SearchEntityResult = {
    ids,
    total,
    has_more: compiled.offset + rows.length < total,
  };
  if (opts.preview) result.preview = rows;
  if (opts.include_sql) {
    result.sql = debug.sql;
    result.params = debug.params;
  }
  return result;
}

export async function runSearchMulti(
  db: NodePgDatabase<Record<string, unknown>>,
  queries: SingleSearchQuery[],
  opts: { preview?: boolean; include_sql?: boolean },
): Promise<Partial<Record<EntityName, SearchEntityResult>>> {
  // Parallel — each entity hits its own table; no shared dependency.
  const settled = await Promise.all(
    queries.map(async q => ({ entity: q.entity, result: await runSearch(db, q, opts) })),
  );
  const out: Partial<Record<EntityName, SearchEntityResult>> = {};
  for (const { entity, result } of settled) out[entity] = result;
  return out;
}

// ============================================================================
// /fetch — hydrate IDs into full rows
// ============================================================================

export async function runFetch(
  db: NodePgDatabase<Record<string, unknown>>,
  req: FetchRequest,
): Promise<FetchResponse> {
  const desc = registry[req.entity];
  if (!desc) throw new Error(`Unknown entity: ${req.entity}`);

  const idCol = (desc.columns as Record<string, PgColumn>)[desc.primaryKey];

  // Build the effective filter: AND(id IN ids, optional refinement)
  const idFilter: FilterExpression = { on: desc.primaryKey, op: 'in', value: req.ids };
  const effectiveFilter: FilterExpression = req.filter
    ? { and: [idFilter, req.filter] }
    : idFilter;

  const compiled = compile({
    entity: req.entity,
    filter: effectiveFilter,
    page: { limit: Math.max(req.ids.length, 1), offset: 0 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db.select().from(compiled.rootTable);
  for (const j of compiled.joins) q = q.leftJoin(j.table, j.on);
  if (compiled.where) q = q.where(compiled.where);
  q = q.limit(compiled.limit);

  const debug = (q as { toSQL: () => { sql: string; params: unknown[] } }).toSQL();
  const rawRows = await q;

  const rootKey = getTableName(compiled.rootTable);
  const rows = rawRows.map((r: unknown) => {
    if (compiled.joins.length === 0) return r;
    return (r as Record<string, unknown>)[rootKey] ?? r;
  });

  return {
    entity: req.entity,
    rows,
    count: rows.length,
    ...(req.include_sql ? { sql: debug.sql, params: debug.params } : {}),
  };
}

export type {
  DomainQueryRequest,
  DomainQueryResult,
  EntityName,
  FetchRequest,
  FetchResponse,
  SearchEntityResult,
};
