// Query runners — compile a request and run it against Drizzle.
//
// Two flows:
//   runSearch — narrow + return IDs (+ optional preview rows)
//   runFetch  — hydrate IDs into full rows (+ optional refinement filter)

import { count, getTableName, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn } from 'drizzle-orm/pg-core';

import { compile } from './compiler';
import { registry } from '../registry';
import { catalogPreview } from './preview';
import { buildSnippets } from './snippets';
import { expandRows, parseExpandPaths } from './expand';
import { hydrateEavRows } from '../eav/read';
import type { EavContext } from '../eav/field-map';
import type {
  EntityName,
  FetchRequest,
  FetchResponse,
  FilterExpression,
  SearchEntityResult,
  SingleSearchQuery,
  Sort,
} from '../types';

// ============================================================================
// /search — narrow + return IDs (+ optional preview)
// ============================================================================

export async function runSearch(
  db: NodePgDatabase<Record<string, unknown>>,
  query: SingleSearchQuery,
  opts: { preview?: boolean; include_sql?: boolean },
  eav?: EavContext,
): Promise<SearchEntityResult> {
  // What columns do preview rows carry? Two routes, both resolved through the
  // SAME compiler machinery (compile()'s 3rd arg), so native columns, EAV
  // Shape A/B, and belongs_to dotted paths all project uniformly:
  //   • projection — an explicit `columns` list from the caller (overrides the
  //     curated set; lets a UI choose exactly which fields appear as columns).
  //   • default    — the catalog's curated preview fields (qField isKeyField /
  //     field_definitions.isKeyField), split into native columns + EAV keys.
  // Either route is moot without preview rows, so both collapse to "ids only".
  const projecting = !!opts.preview && Array.isArray(query.columns);
  const pv = opts.preview && !projecting
    ? catalogPreview(query.entity, eav?.fieldMaps[query.entity])
    : null;

  // Fields handed to the compiler to resolve into SELECT expressions:
  //   projecting      → the caller's columns (native + EAV + belongs_to)
  //   default preview → just the EAV preview keys (native ones come from `pv`)
  const projectFields = projecting ? query.columns! : (pv?.eavKeys ?? []);

  // Compile once — same JOIN chain serves the COUNT and the SELECT-ID queries.
  const compiled = compile({
    entity: query.entity,
    filter: query.filter,
    sort: query.sort,
    page: query.page,
  }, eav, projectFields);

  const desc = registry[query.entity];
  const idCol = (desc.columns as Record<string, PgColumn>)[desc.primaryKey];

  // 1) Total count — same WHERE + JOINs, no ORDER BY / LIMIT.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cq: any = db.select({ total: count() }).from(compiled.rootTable);
  for (const j of compiled.joins) cq = cq.leftJoin(j.table, j.on);
  if (compiled.where) cq = cq.where(compiled.where);
  const totalRows = await cq;
  const total = Number(totalRows[0]?.total ?? 0);

  // 2) Paginated SELECT — ids (+ projected/preview columns if requested).
  // PgColumn for real/Shape-A columns; SQL.Aliased for Shape-B jsonb cast exprs.
  const selectShape: Record<string, PgColumn | SQL.Aliased> = { id: idCol };

  // Default-preview native columns (keyed by camelCase column). Null when
  // projecting — projected native columns arrive via compiled.eavPreview below.
  const previewCols = pv?.nativeColumns ?? null;
  if (previewCols) {
    for (const [alias, col] of Object.entries(previewCols)) {
      selectShape[alias] = col;
    }
  }

  // Compiler-resolved projection columns, keyed by the requested field key. In
  // default mode this carries only the curated EAV preview fields (StageName,
  // Amount, …); in projection mode it carries EVERY requested column — native,
  // EAV, and belongs_to dotted paths alike — since compile() resolves any field
  // path the same way. has_many paths were dropped during compile.
  for (const [alias, col] of Object.entries(compiled.projection)) {
    selectShape[alias] = col;
  }

  // Auto-extend the SELECT so any column a text-match descriptor points at is
  // pulled (in-SQL) for snippet extraction even when it isn't in the
  // projected/preview set — e.g. text-magic on a transcript fans out across
  // [title, transcript, summary, …] but only some are curated/projected. These
  // columns are stripped from the response row once snippets are built: the
  // snippet already carries the match window, so the full body is redundant.
  const autoExtended: string[] = [];
  if (opts.preview) {
    const entityCols = registry[query.entity].columns as Record<string, PgColumn>;
    for (const m of compiled.textMatches) {
      if (!(m.column in selectShape) && entityCols[m.column]) {
        selectShape[m.column] = entityCols[m.column];
        autoExtended.push(m.column);
      }
    }
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
  // Curated preview columns stay intact — those are what the consumer
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
  EntityName,
  FetchRequest,
  FetchResponse,
  SearchEntityResult,
};
