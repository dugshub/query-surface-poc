// FilterCompiler — JSON FilterExpression → Drizzle SQL.
//
// Resolves dotted field paths into JOIN chains (for belongs_to) or EXISTS
// subqueries (for has_many). Compiles each leaf op to a Drizzle SQL fragment.
// Handles boolean composition. Returns a runnable query the service layer
// dispatches.

import {
  and,
  asc,
  desc,
  eq,
  getTableName,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { registry } from '../generated/query-registry';
import type {
  DomainQueryRequest,
  EntityName,
  FilterExpression,
  LeafFilter,
  Op,
  Sort,
  TextMatchDescriptor,
} from './types';

// camelCase helper — Drizzle column refs are camelCase; YAML/JSON uses snake_case.
function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Resolve a dotted path against a starting entity. Returns either a direct
// column reference (with any JOIN clauses needed) or a has_many subquery
// descriptor.
type PathResolution =
  | {
      kind: 'column';
      column: PgColumn;
      joins: { table: PgTable; on: SQL }[];
    }
  | {
      kind: 'has_many';
      target: PgTable;
      fkColumn: PgColumn;          // child.fk
      parentPkColumn: PgColumn;    // parent.id
      innerColumn: PgColumn;       // child column the inner filter targets
    };

function resolvePath(rootEntity: EntityName, dotted: string): PathResolution {
  const segments = dotted.split('.');
  let currentEntity = rootEntity;
  const joins: { table: PgTable; on: SQL }[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const desc = registry[currentEntity];
    const rel = desc.relationships[seg];
    if (!rel) {
      throw new Error(`Field path '${dotted}' invalid at segment '${seg}' on entity '${currentEntity}'`);
    }
    if (rel.kind === 'has_many') {
      // Terminal has_many — wrap the rest as an inner filter target.
      if (i !== segments.length - 2) {
        throw new Error(`has_many traversal '${seg}' must be followed by a single child column, got '${segments.slice(i + 1).join('.')}'`);
      }
      const childDesc = registry[rel.target];
      const innerCol = (childDesc.columns as Record<string, PgColumn>)[camel(segments[i + 1])];
      const fkCol = (childDesc.columns as Record<string, PgColumn>)[camel(rel.fk)];
      const parentDesc = registry[currentEntity];
      const parentPkCol = (parentDesc.columns as Record<string, PgColumn>)[parentDesc.primaryKey];
      if (!innerCol || !fkCol || !parentPkCol) {
        throw new Error(`has_many subquery resolution failed for '${dotted}'`);
      }
      return {
        kind: 'has_many',
        target: childDesc.table,
        fkColumn: fkCol,
        parentPkColumn: parentPkCol,
        innerColumn: innerCol,
      };
    }
    // belongs_to — add LEFT JOIN and advance.
    const targetDesc = registry[rel.target];
    const parentFkCol = (desc.columns as Record<string, PgColumn>)[camel(rel.fk)];
    const targetPkCol = (targetDesc.columns as Record<string, PgColumn>)[targetDesc.primaryKey];
    if (!parentFkCol || !targetPkCol) {
      throw new Error(`belongs_to resolution failed for '${seg}' on '${currentEntity}'`);
    }
    joins.push({
      table: targetDesc.table,
      on: eq(parentFkCol, targetPkCol),
    });
    currentEntity = rel.target;
  }

  // Final segment is a column on currentEntity.
  const finalSeg = segments[segments.length - 1];
  const finalDesc = registry[currentEntity];
  const col = (finalDesc.columns as Record<string, PgColumn>)[camel(finalSeg)];
  if (!col) {
    throw new Error(`Field path '${dotted}' invalid at final column '${finalSeg}' on entity '${currentEntity}'`);
  }
  return { kind: 'column', column: col, joins };
}

// Coerce a JSON value into the runtime type Drizzle expects for `col`.
//
// JSON has no native Date/bigint shape, so callers send dates as ISO strings,
// integers as integers, etc. The registry knows what each column's TypeScript
// type should be (via Drizzle's `.dataType` introspection): if we don't coerce,
// pg sends the raw string parameter and Postgres throws on type-mismatched
// comparisons (e.g. `timestamp > text`).
//
// Coercion is per-element so `in`/`nin`/`between` work transparently — pass
// an array/tuple and we coerce each entry against the same column.
//
// Already-coerced values (Date object, number, boolean) flow through unchanged.
function coerceForColumn(col: PgColumn, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(v => coerceForColumn(col, v));

  // Drizzle exposes the TS-level type via .dataType. For PgTimestamp /
  // PgTimestampWithTimezone this is 'date'; PgInteger is 'number'; PgBoolean
  // is 'boolean'; PgText / PgVarchar / pgEnum are 'string'; etc.
  const dt = (col as unknown as { dataType?: string }).dataType;

  if (dt === 'date') {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error(`Invalid date value for column '${(col as unknown as { name?: string }).name}': ${JSON.stringify(value)}`);
      }
      return d;
    }
    return value;
  }
  if (dt === 'number') {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return value;
  }
  if (dt === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    if (typeof value === 'number') return value !== 0;
    return value;
  }
  // string / json / array / unknown — pass through. Postgres will coerce or
  // throw with a meaningful message; we don't second-guess.
  return value;
}

function compileLeafOp(col: PgColumn, op: Op, rawValue: unknown): SQL {
  // Coerce once at the boundary. All subsequent op handlers see the right type.
  const value = coerceForColumn(col, rawValue);
  switch (op) {
    case 'eq': return eq(col, value as never);
    case 'neq': return ne(col, value as never);
    case 'in': return inArray(col, value as never[]);
    case 'nin': return notInArray(col, value as never[]);
    case 'gt': return gt(col, value as never);
    case 'gte': return gte(col, value as never);
    case 'lt': return lt(col, value as never);
    case 'lte': return lte(col, value as never);
    case 'between': {
      const [lo, hi] = value as [unknown, unknown];
      return and(gte(col, lo as never), lte(col, hi as never)) as SQL;
    }
    // String-typed ops — never coerce, ILIKE always wants a string pattern.
    case 'contains': return ilike(col, `%${rawValue}%`);
    case 'startswith': return ilike(col, `${rawValue}%`);
    case 'endswith': return ilike(col, `%${rawValue}`);
    case 'is_null': return isNull(col);
    case 'is_not_null': return isNotNull(col);
    default:
      throw new Error(`Unknown op: ${op}`);
  }
}

interface CompileContext {
  rootEntity: EntityName;
  joins: { table: PgTable; on: SQL }[];   // accumulated as the tree is walked
  joinKeys: Set<string>;                  // dedupe by table name
  textMatches: TextMatchDescriptor[];     // direct-column text-op hits (for snippet extraction)
  textMatchKeys: Set<string>;             // dedupe by column|op|pattern
}

function pushJoin(ctx: CompileContext, j: { table: PgTable; on: SQL }): void {
  const key = getTableName(j.table);
  if (ctx.joinKeys.has(key)) return;
  ctx.joinKeys.add(key);
  ctx.joins.push(j);
}

// Text ops whose matches we can snippet at runtime. has_many subqueries are
// excluded — those matches live on a child row not present in the parent preview.
const TEXT_OPS = new Set<Op>(['contains', 'startswith', 'endswith']);

function pushTextMatch(
  ctx: CompileContext,
  column: string,
  op: Op,
  pattern: unknown,
): void {
  if (!TEXT_OPS.has(op)) return;
  if (typeof pattern !== 'string' || pattern.length === 0) return;
  const key = `${column}|${op}|${pattern}`;
  if (ctx.textMatchKeys.has(key)) return;
  ctx.textMatchKeys.add(key);
  ctx.textMatches.push({ column, op: op as TextMatchDescriptor['op'], pattern });
}

function compileLeaf(ctx: CompileContext, leaf: LeafFilter): SQL {
  const resolved = resolvePath(ctx.rootEntity, leaf.on);
  if (resolved.kind === 'column') {
    for (const j of resolved.joins) pushJoin(ctx, j);
    // Only track text matches that land on a column of the ROOT entity (no joins).
    // Joined-column text matches (e.g. opportunity.account.name on a transcript root)
    // could be snippeted from the join output, but for v1 we keep it simple and
    // restrict snippets to the root entity's own columns.
    if (resolved.joins.length === 0 && TEXT_OPS.has(leaf.op)) {
      // Extract camelCase column name from the Drizzle column ref.
      // Drizzle exposes the column's name via the `.name` property.
      const colName = (resolved.column as unknown as { name?: string }).name;
      if (colName) {
        // colName is snake_case from the DB; convert to camelCase for the row key.
        const camelName = colName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
        pushTextMatch(ctx, camelName, leaf.op, leaf.value);
      }
    }
    return compileLeafOp(resolved.column, leaf.op, leaf.value);
  }
  // has_many → EXISTS (SELECT 1 FROM child WHERE child.fk = parent.pk AND <inner>)
  // Drizzle's exists() helper doesn't paren raw sql templates, so emit the
  // whole EXISTS clause directly as a sql tag.
  const innerCondition = compileLeafOp(resolved.innerColumn, leaf.op, leaf.value);
  return sql`exists (select 1 from ${resolved.target} where ${eq(resolved.fkColumn, resolved.parentPkColumn)} and ${innerCondition})`;
}

function compileExpression(ctx: CompileContext, expr: FilterExpression): SQL {
  if ('and' in expr) {
    const parts = expr.and.map(e => compileExpression(ctx, e));
    return and(...parts) as SQL;
  }
  if ('or' in expr) {
    const parts = expr.or.map(e => compileExpression(ctx, e));
    return or(...parts) as SQL;
  }
  if ('not' in expr) {
    return not(compileExpression(ctx, expr.not));
  }
  return compileLeaf(ctx, expr as LeafFilter);
}

function compileSort(ctx: CompileContext, sort: Sort): SQLWrapper {
  const resolved = resolvePath(ctx.rootEntity, sort.field);
  if (resolved.kind !== 'column') {
    throw new Error(`Cannot sort by has_many path: ${sort.field}`);
  }
  for (const j of resolved.joins) pushJoin(ctx, j);
  return sort.dir === 'desc' ? desc(resolved.column) : asc(resolved.column);
}

export interface CompiledQuery {
  rootTable: PgTable;
  joins: { table: PgTable; on: SQL }[];
  where: SQL | undefined;
  orderBy: SQLWrapper[];
  limit: number;
  offset: number;
  // Direct-column text-op leaves collected during compile. The runtime uses
  // these to (a) ensure the matched column is in the preview SELECT and
  // (b) extract a snippet around each match per row.
  textMatches: TextMatchDescriptor[];
}

// Rewrite any `{on: 'text', op, value}` leaves in a filter tree into an OR
// across the root entity's declared searchableColumns. Each searchable column
// becomes a sibling leaf with the same op + value, then the engine compiles
// them normally (including has_many fan-out for dotted paths like 'chunks.body').
//
// If an entity declares zero searchable columns and the filter uses 'text',
// we throw — the caller asked for something the entity doesn't support.
function expandTextMagic(rootEntity: EntityName, expr: FilterExpression): FilterExpression {
  if ('and' in expr) {
    return { and: expr.and.map(e => expandTextMagic(rootEntity, e)) };
  }
  if ('or' in expr) {
    return { or: expr.or.map(e => expandTextMagic(rootEntity, e)) };
  }
  if ('not' in expr) {
    return { not: expandTextMagic(rootEntity, expr.not) };
  }
  // Leaf
  const leaf = expr as LeafFilter;
  if (leaf.on !== 'text') return leaf;
  const cols = registry[rootEntity].searchableColumns;
  if (!cols || cols.length === 0) {
    throw new Error(`Entity '${rootEntity}' has no searchable columns; cannot resolve 'text' filter`);
  }
  if (cols.length === 1) {
    return { on: cols[0], op: leaf.op, value: leaf.value };
  }
  return { or: cols.map(col => ({ on: col, op: leaf.op, value: leaf.value })) };
}

export function compile(req: DomainQueryRequest): CompiledQuery {
  const desc = registry[req.entity];
  if (!desc) throw new Error(`Unknown entity: ${req.entity}`);

  const ctx: CompileContext = {
    rootEntity: req.entity,
    joins: [],
    joinKeys: new Set(),
    textMatches: [],
    textMatchKeys: new Set(),
  };

  const expanded = req.filter ? expandTextMagic(req.entity, req.filter) : undefined;
  const where = expanded ? compileExpression(ctx, expanded) : undefined;
  const orderBy = (req.sort ?? []).map(s => compileSort(ctx, s));

  return {
    rootTable: desc.table,
    joins: ctx.joins,
    where,
    orderBy,
    limit: req.page?.limit ?? 25,
    offset: req.page?.offset ?? 0,
    textMatches: ctx.textMatches,
  };
}
