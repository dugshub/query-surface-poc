// DomainQueryService — runs CompiledQuery against Drizzle.
//
// Three flows:
//   runQuery  — legacy, full-row return for the CLI demo (kept for compat)
//   runSearch — narrow + return IDs (+ optional preview rows)
//   runFetch  — hydrate IDs into full rows (+ optional refinement filter)

import { count, getTableName, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn } from 'drizzle-orm/pg-core';

import { compile } from './compiler';
import { registry } from '../generated/query-registry';
import { previewColumns, previewEavFields } from './preview';
import { buildSnippets } from './snippets';
import { expandRows, parseExpandPaths } from './expand';
import { hydrateEavRows } from './eav-read';
import type { EavContext } from './field-map';
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
  eav?: EavContext,
): Promise<DomainQueryResult> {
  const compiled = compile(req, eav);

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
  }) as Array<Record<string, unknown>>;

  await hydrateEavRows(db, req.entity, rootRows, eav?.fieldMaps[req.entity]);

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
  eav?: EavContext,
): Promise<SearchEntityResult> {
  // Curated EAV preview fields (e.g. opportunity's StageName / Amount) — the
  // compiler projects them via field_values joins so preview rows look flat.
  const eavPreviewFields = opts.preview
    ? previewEavFields(query.entity, eav?.fieldMaps[query.entity])
    : [];

  // Compile once — same JOIN chain serves the COUNT and the SELECT-ID queries.
  const compiled = compile({
    entity: query.entity,
    filter: query.filter,
    sort: query.sort,
    page: query.page,
  }, eav, eavPreviewFields);

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
  // PgColumn for real/Shape-A columns; SQL.Aliased for Shape-B jsonb cast exprs.
  const selectShape: Record<string, PgColumn | SQL.Aliased> = { id: idCol };
  // Track which columns were auto-extended (added solely so the snippet
  // builder can read them) vs. curated PREVIEW_FIELDS. Auto-extended
  // columns get stripped from the response row after snippets are built —
  // the snippet itself carries the match window, so returning the full
  // column body would double-pay for the same information.
  const autoExtended: string[] = [];
  if (previewCols) {
    for (const [alias, col] of Object.entries(previewCols)) {
      selectShape[alias] = col;
    }
    // Auto-extend the preview shape so any column referenced by a text-match
    // descriptor is pulled (in-SQL) even if it wasn't in the entity's default
    // preview field list. e.g. text-magic on transcript fans out across
    // [title, transcript, summary, user_notes, enhanced_notes]; only `title`
    // and `summary` are curated, so `transcript / user_notes / enhanced_notes`
    // get added here so snippets can extract from them. They're stripped from
    // the response row below.
    const entityCols = registry[query.entity].columns as Record<string, PgColumn>;
    for (const m of compiled.textMatches) {
      if (!(m.column in selectShape) && entityCols[m.column]) {
        selectShape[m.column] = entityCols[m.column];
        autoExtended.push(m.column);
      }
    }
  }

  // EAV preview fields (StageName, Amount, …) — value columns keyed by field
  // key, projected through the previewJoins below. Empty unless preview + EAV.
  for (const [alias, col] of Object.entries(compiled.eavPreview)) {
    selectShape[alias] = col;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pq: any = db.select(selectShape).from(compiled.rootTable);
  for (const j of compiled.joins) pq = pq.leftJoin(j.table, j.on);
  for (const j of compiled.previewJoins) pq = pq.leftJoin(j.table, j.on);
  if (compiled.where) pq = pq.where(compiled.where);
  if (compiled.orderBy.length) pq = pq.orderBy(...compiled.orderBy);
  pq = pq.limit(compiled.limit).offset(compiled.offset);

  const debug = (pq as { toSQL: () => { sql: string; params: unknown[] } }).toSQL();
  const rows: Array<Record<string, unknown>> = await pq;

  const ids = rows.map(r => String(r.id));

  // Attach `_snippets` to preview rows that have a text-op match in this row,
  // THEN strip the auto-extended columns. Snippets carry the match window +
  // offsets + full_length, so the full column body is redundant on the wire.
  // Curated columns (PREVIEW_FIELDS) stay intact — those are what the agent
  // uses for at-a-glance row identity.
  //
  // Agents that need the full body should `query_fetch` the row IDs — the
  // two-stage "search to decide, fetch to read" pattern.
  if (opts.preview && compiled.textMatches.length > 0) {
    for (const row of rows) {
      const snippets = buildSnippets(row, compiled.textMatches);
      if (snippets.length > 0) {
        row._snippets = snippets;
      }
      for (const col of autoExtended) {
        delete row[col];
      }
    }
  }

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
  eav?: EavContext,
): Promise<Partial<Record<EntityName, SearchEntityResult>>> {
  // Parallel — each entity hits its own table; no shared dependency.
  const settled = await Promise.all(
    queries.map(async q => ({ entity: q.entity, result: await runSearch(db, q, opts, eav) })),
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
  eav?: EavContext,
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
  }, eav);

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
  }) as Array<Record<string, unknown>>;

  // Merge EAV fields inline so fetched rows carry StageName/Amount/etc. — the
  // agent sees one flat row, never the field_values seam.
  await hydrateEavRows(db, req.entity, rows, eav?.fieldMaps[req.entity]);

  // Expand relationships inline. Each expand path is parsed into a tree, then
  // we walk it depth-first with batched IN queries per segment. Mutates rows
  // in place; original columns stay untouched.
  if (req.expand && req.expand.length > 0) {
    const tree = parseExpandPaths(req.expand);
    await expandRows(db, req.entity, rows, tree, eav);
  }

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
