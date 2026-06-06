// PredicateCompiler — resolved Predicate → Drizzle SQL.
//
// The PUBLIC filter language is the resolved Predicate subset (predicate.ts);
// this compiler walks that tree DIRECTLY — there is no intermediate
// FilterExpression IR and no translation adapter (RFC-0002 §4: convergence by
// native alignment, never by translation). The valuable internals — dotted-path
// resolution into JOIN chains (belongs_to) or EXISTS subqueries (has_many), and
// shape-aware EAV value resolution (typed-columns + jsonb-value) — are retained
// verbatim; only the language they walk changed.
//
// ─── Operator mapping (Predicate spelling → SQL impl) ────────────────────────
//
//   Comparison  eq neq gt gte lt lte in nin between  → the matching Drizzle op
//   String      contains startsWith endsWith         → ILIKE %x% / x% / %x
//               matches                              → REJECTED (typed error) —
//                 the locked `matches` is a JS RegExp; Postgres `~` is POSIX ERE.
//                 They are different languages (anchoring, classes, backrefs,
//                 Unicode), so silently compiling `matches` to `~` would change
//                 semantics. We reject loudly rather than mislead. A caller that
//                 wants substring/prefix/suffix matching uses contains/startsWith
//                 /endsWith; true regex filtering belongs in the JS eval target.
//   Unary       exists / isNotNull → IS NOT NULL    missing / isNull → IS NULL
//                 For a plain nullable column, row presence == column non-null,
//                 so exists≈isNotNull and missing≈isNull. For an EAV field the
//                 LEFT JOIN reads an absent value as NULL, so the same identity
//                 holds and IS NULL / IS NOT NULL is the honest, cheap SQL
//                 interpretation of presence. (The locked surface distinguishes
//                 presence from null-ness; in a flat row model they coincide.)
//   Boolean     and / or / not                       → AND / OR / NOT
//
// ─── NULL semantics ──────────────────────────────────────────────────────────
//
// We keep native SQL behaviour. Postgres uses three-valued logic: a `nin`
// (NOT IN) whose list contains NULL yields UNKNOWN (→ the row is excluded), and
// a comparison against NULL is UNKNOWN. This MATCHES the predicate package's own
// `evalPredicate`, which uses SQL-style 3VL internally and projects `unknown` to
// `false` at the top — so the SQL compile target and the JS eval target agree on
// NULL handling. (See predicate.ts and the locked eval.ts.)

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
import { alias, type PgColumn, type PgTable } from 'drizzle-orm/pg-core';

import { registry } from '../registry';
import { coercionCategory, valueColumnForDataType } from '../eav/mapping';
import type { EavContext, FieldMap } from '../eav/field-map';
import type { Binding, Predicate } from '../predicate';
import type {
  DomainQueryRequest,
  EntityName,
  Sort,
  TextMatchDescriptor,
} from '../types';

/**
 * Thrown when the SQL compile path is asked to compile a Predicate operator it
 * cannot honestly express — currently only `matches` (JS RegExp ≠ Postgres POSIX
 * ERE; see the header). Typed + descriptive so callers can catch it distinctly
 * and route regex filtering to the JS eval target instead of the SQL compiler.
 */
export class UnsupportedPredicateOpError extends Error {
  readonly op: string;
  constructor(op: string, detail: string) {
    super(`Predicate op '${op}' is not supported by the SQL compiler: ${detail}`);
    this.name = 'UnsupportedPredicateOpError';
    this.op = op;
  }
}

// The compiler's PRIVATE SQL-op vocabulary. NOT a public type — it is the set of
// shapes compileLeafOp / compileLeafOpExpr know how to emit. Predicate operators
// lower onto these at the leaf (predToSqlLeaf). `is_null` / `is_not_null` are the
// SQL spellings the unary Predicate ops map to.
type SqlOp =
  | 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'contains' | 'startswith' | 'endswith'
  | 'is_null' | 'is_not_null';

// camelCase helper — Drizzle column refs are camelCase; YAML/JSON uses snake_case.
function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Resolve a dotted path against a starting entity. Returns either a direct
// column reference (with any JOIN clauses needed) or a has_many subquery
// descriptor.
type Join = { table: PgTable; on: SQL };

type ColumnResolution = {
  kind: 'column';
  column: PgColumn;
  joins: Join[];
  // For EAV value columns: the field-definition data_type, so the leaf value is
  // coerced by the field's logical type rather than the storage column's
  // (numeric stores as a JS string, so the column can't tell us).
  coerceAs?: string;
};

type EavExprResolution = {
  // EAV Shape B (jsonb): the value is a cast SQL expression, not a column.
  // Ops compile against the expression via compileLeafOpExpr.
  kind: 'eav_expr';
  expr: SQL;
  joins: Join[];
  coerceAs: string;
};

type PathResolution =
  | ColumnResolution
  | EavExprResolution
  | {
      kind: 'has_many';
      target: PgTable;          // the child/junction table — FROM of the EXISTS
      fkColumn: PgColumn;       // child.fk back to parent
      parentPkColumn: PgColumn; // parent.pk
      // The op target INSIDE the EXISTS, plus any belongs_to joins from the child
      // onward (e.g. opportunity_contacts → contacts → contacts.email). Lets a
      // has_many be followed by a belongs_to chain, not just a single child column.
      inner: ColumnResolution | EavExprResolution;
    };

// jsonb value → typed SQL expression for Shape B. `value` stores the scalar as
// jsonb; `#>> '{}'` extracts it as text, then we cast per the field's data_type.
function jsonbValueExpr(valueCol: PgColumn, dataType: string): SQL {
  switch (coercionCategory(dataType)) {
    case 'number':
      return sql`(${valueCol} #>> '{}')::numeric`;
    case 'boolean':
      return sql`(${valueCol} #>> '{}')::boolean`;
    case 'date':
      return sql`(${valueCol} #>> '{}')::timestamptz`;
    default: // string / text / picklist / reference / …
      return sql`${valueCol} #>> '{}'`;
  }
}

function resolvePath(ctx: CompileContext, dotted: string): PathResolution {
  return resolveFrom(ctx, ctx.rootEntity, dotted.split('.'));
}

// Resolve a dotted path from an arbitrary entity. Recurses through a has_many:
// the has_many becomes a correlated EXISTS, and the REMAINDER of the path is
// resolved rooted at the child (belongs_to chain) and emitted as joins inside
// that EXISTS — so `opp.opportunity_contacts.contact.email` compiles, not just
// `opp.opportunity_contacts.role`. A has_many must still be the first collection
// hop (belongs_to → has_many is not correlatable here); no has_many → has_many.
function resolveFrom(ctx: CompileContext, startEntity: EntityName, segments: string[]): PathResolution {
  let currentEntity = startEntity;
  const joins: Join[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const desc = registry[currentEntity];
    const rel = desc.relationships[seg];
    if (!rel) {
      throw new Error(`Field path '${segments.join('.')}' invalid at segment '${seg}' on entity '${currentEntity}'`);
    }
    if (rel.kind === 'has_many') {
      if (joins.length > 0) {
        // belongs_to hops preceded this has_many — the EXISTS can't correlate to
        // an intermediate joined table. (Root the query on the child instead.)
        throw new Error(`belongs_to → has_many is not supported in path '${segments.join('.')}'`);
      }
      const childDesc = registry[rel.target];
      const fkCol = (childDesc.columns as Record<string, PgColumn>)[camel(rel.fk)];
      const parentPkCol = (desc.columns as Record<string, PgColumn>)[desc.primaryKey];
      if (!fkCol || !parentPkCol) {
        throw new Error(`has_many subquery resolution failed for '${segments.join('.')}'`);
      }
      // Resolve the tail (a belongs_to chain) rooted at the child; its joins ride
      // inside the EXISTS. `select 1 from child <joins> where child.fk = parent.pk and <op>`.
      const inner = resolveFrom(ctx, rel.target, segments.slice(i + 1));
      if (inner.kind === 'has_many') {
        throw new Error(`has_many → has_many is not supported in path '${segments.join('.')}'`);
      }
      return { kind: 'has_many', target: childDesc.table, fkColumn: fkCol, parentPkColumn: parentPkCol, inner };
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

  // Final segment. On an EAV-enabled entity, EAV wins: a declared field (by
  // exact key, e.g. 'StageName') resolves to a value column behind a LEFT JOIN
  // to field_values. The unique (entity_id, entity_type, field_definition_id)
  // constraint means the join can't multiply parent rows, so the value column
  // behaves exactly like a real nullable column for every downstream op — the
  // seam is invisible. Anything not in the field map falls back to a real
  // column (system/display columns: id, accountId, name, timestamps).
  const finalSeg = segments[segments.length - 1];
  const finalDesc = registry[currentEntity];

  if (finalDesc.eav) {
    const field = ctx.fieldMaps[currentEntity]?.get(finalSeg);
    if (field) {
      const strat = finalDesc.eav;
      const aliasName = `fv_${currentEntity}_${finalSeg}`.replace(/[^a-zA-Z0-9_]/g, '_');
      let aliased = ctx.eavAliases.get(aliasName);
      if (!aliased) {
        aliased = alias(strat.valueTable, aliasName);
        ctx.eavAliases.set(aliasName, aliased);
      }
      const a = aliased as unknown as Record<string, PgColumn>;
      const parentPk = (finalDesc.columns as Record<string, PgColumn>)[finalDesc.primaryKey];

      // Join predicate: parent ↔ value row for THIS field. For Shape B with
      // inline temporal, restrict to the current value (valid_to IS NULL) so
      // the join stays single-row (the virtual-column invariant).
      const predicates: SQL[] = [
        eq(a.entityId, parentPk),
        eq(a.entityType, strat.entityTypeValue),
        eq(a.fieldDefinitionId, field.fieldDefinitionId),
      ];
      if (strat.kind === 'jsonb-value' && strat.currentOnly) {
        predicates.push(isNull(a[strat.validToColumn]));
      }
      joins.push({ table: aliased, on: and(...predicates)! });

      if (strat.kind === 'typed-columns') {
        // Shape A — value lives in a typed column; rides the column op path.
        return { kind: 'column', column: a[valueColumnForDataType(field.dataType)], joins, coerceAs: field.dataType };
      }
      // Shape B — value is a jsonb cast expression; rides the eav_expr path.
      return { kind: 'eav_expr', expr: jsonbValueExpr(a[strat.valueColumn], field.dataType), joins, coerceAs: field.dataType };
    }
  }

  const col = (finalDesc.columns as Record<string, PgColumn>)[camel(finalSeg)];
  if (!col) {
    throw new Error(`Field path '${segments.join('.')}' invalid at final column '${finalSeg}' on entity '${currentEntity}'`);
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
function coerceForColumn(col: PgColumn, value: unknown, coerceAs?: string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(v => coerceForColumn(col, v, coerceAs));

  // Drizzle exposes the TS-level type via .dataType. For PgTimestamp /
  // PgTimestampWithTimezone this is 'date'; PgInteger is 'number'; PgBoolean
  // is 'boolean'; PgText / PgVarchar / pgEnum are 'string'; etc.
  //
  // For EAV value columns the storage column lies (numeric → 'string'), so the
  // field-definition data_type is the authority — coerceAs carries it.
  const dt = coerceAs ? coercionCategory(coerceAs) : (col as unknown as { dataType?: string }).dataType;

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

function compileLeafOp(col: PgColumn, op: SqlOp, rawValue: unknown, coerceAs?: string): SQL {
  // Coerce once at the boundary. All subsequent op handlers see the right type.
  const value = coerceForColumn(col, rawValue, coerceAs);
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

// Coerce a JSON leaf value by the field's data_type, for the expression path
// (no column to introspect). Mirror of coerceForColumn's per-category logic.
function coerceForExpr(value: unknown, coerceAs: string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(v => coerceForExpr(v, coerceAs));
  const cat = coercionCategory(coerceAs);
  if (cat === 'date') {
    if (value instanceof Date) return value;
    const d = new Date(value as string | number);
    return Number.isNaN(d.getTime()) ? value : d;
  }
  if (cat === 'number') {
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  if (cat === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
  }
  return value;
}

// Compile a leaf op against an arbitrary SQL value EXPRESSION (EAV Shape B —
// jsonb cast). Parallel to compileLeafOp, which targets a PgColumn. The LEFT
// JOIN means an absent current value reads as NULL, so semantics match a
// nullable column.
function compileLeafOpExpr(expr: SQL, op: SqlOp, rawValue: unknown, coerceAs: string): SQL {
  const v = coerceForExpr(rawValue, coerceAs);
  switch (op) {
    case 'eq': return sql`${expr} = ${v}`;
    case 'neq': return sql`${expr} <> ${v}`;
    case 'gt': return sql`${expr} > ${v}`;
    case 'gte': return sql`${expr} >= ${v}`;
    case 'lt': return sql`${expr} < ${v}`;
    case 'lte': return sql`${expr} <= ${v}`;
    case 'between': {
      const [lo, hi] = v as [unknown, unknown];
      return sql`${expr} between ${lo} and ${hi}`;
    }
    case 'in':
    case 'nin': {
      const arr = (v as unknown[]) ?? [];
      if (arr.length === 0) return op === 'in' ? sql`false` : sql`true`;
      const list = sql.join(arr.map(x => sql`${x}`), sql`, `);
      return op === 'in' ? sql`${expr} in (${list})` : sql`${expr} not in (${list})`;
    }
    // Text ops never coerce — ILIKE wants the raw string pattern.
    case 'contains': return sql`${expr} ilike ${`%${rawValue}%`}`;
    case 'startswith': return sql`${expr} ilike ${`${rawValue}%`}`;
    case 'endswith': return sql`${expr} ilike ${`%${rawValue}`}`;
    case 'is_null': return sql`${expr} is null`;
    case 'is_not_null': return sql`${expr} is not null`;
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
  fieldMaps: Partial<Record<EntityName, FieldMap>>;  // actor-scoped EAV field maps
  eavAliases: Map<string, PgTable>;       // aliasName → aliased field_values, deduped per field
}

function pushJoin(ctx: CompileContext, j: { table: PgTable; on: SQL }): void {
  const key = getTableName(j.table);
  if (ctx.joinKeys.has(key)) return;
  ctx.joinKeys.add(key);
  ctx.joins.push(j);
}

// Text ops whose matches we can snippet at runtime. has_many subqueries are
// excluded — those matches live on a child row not present in the parent preview.
const TEXT_OPS = new Set<SqlOp>(['contains', 'startswith', 'endswith']);

function pushTextMatch(
  ctx: CompileContext,
  column: string,
  op: SqlOp,
  pattern: unknown,
): void {
  if (!TEXT_OPS.has(op)) return;
  if (typeof pattern !== 'string' || pattern.length === 0) return;
  const key = `${column}|${op}|${pattern}`;
  if (ctx.textMatchKeys.has(key)) return;
  ctx.textMatchKeys.add(key);
  ctx.textMatches.push({ column, op: op as TextMatchDescriptor['op'], pattern });
}

// ─── Predicate leaf lowering ──────────────────────────────────────────────────
//
// A Predicate LEAF (cmp / str / unary) carries an entity-path `left`, a private
// SQL op, and a value. We DON'T translate the whole tree into an IR — we lower
// just the leaf to the `(path, SqlOp, value)` triple the resolution machinery
// already understands, then feed it into resolvePath + compileLeafOp(Expr). The
// boolean structure (and/or/not) is walked directly by compileExpression.

/** The entity path a leaf's `left` binding points at. Only `entity` bindings can
 *  be a query-surface comparison target; a bare `literal` left makes no sense in
 *  a row filter (there is no column to compare), so we reject it. */
function leftPath(left: Binding, op: string): string {
  if (left.from === 'entity') return left.path;
  throw new UnsupportedPredicateOpError(
    op,
    `left operand must be an entity binding ({ from: 'entity', path }); got '${left.from}'`,
  );
}

/** A lowered leaf: the path to resolve, the SQL op to emit, and the raw value. */
interface LoweredLeaf {
  path: string;
  op: SqlOp;
  value: unknown;
}

// The non-boolean Predicate variants — every Predicate that is a LEAF (a comparison,
// string, or unary node). A concrete union (not Exclude<>) because `BoolOp` and
// `UnaryOp` are type aliases and TS's control-flow analysis won't narrow a
// discriminant typed by an alias (the same limitation the locked eval.ts notes).
type LeafPredicate =
  | { op: CmpOpName; left: Binding; right: Binding }
  | { op: StrOpName; left: Binding; pattern: string }
  | { op: UnaryOpName; left: Binding };
type CmpOpName = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'between';
type StrOpName = 'matches' | 'contains' | 'startsWith' | 'endsWith';
type UnaryOpName = 'exists' | 'missing' | 'isNull' | 'isNotNull';

/**
 * Lower a Predicate leaf node to (path, SqlOp, value). Owns the operator mapping
 * and the documented divergences:
 *   • comparison + boolean ops carry through 1:1 (eq…between).
 *   • string ops: contains/startsWith/endsWith → contains/startswith/endswith,
 *     value = the literal `pattern`. `matches` is REJECTED here (see header).
 *   • unary ops: exists/isNotNull → is_not_null; missing/isNull → is_null,
 *     value is unused.
 */
function lowerLeaf(p: LeafPredicate): LoweredLeaf {
  switch (p.op) {
    // Comparison — right operand is the value (a literal, post-resolution).
    case 'eq': case 'neq': case 'gt': case 'gte':
    case 'lt': case 'lte': case 'in': case 'nin': case 'between': {
      // A right-hand entity binding (column = column) isn't expressible through
      // compileLeafOp's parameterised value path; reject rather than mis-bind.
      if (p.right.from !== 'literal') {
        throw new UnsupportedPredicateOpError(
          p.op,
          `right operand must be a literal binding ({ from: 'literal', value }); column-to-column comparison is not supported`,
        );
      }
      return { path: leftPath(p.left, p.op), op: p.op, value: p.right.value };
    }
    // String — pattern is a literal string (NOT a binding).
    case 'contains':
      return { path: leftPath(p.left, p.op), op: 'contains', value: p.pattern };
    case 'startsWith':
      return { path: leftPath(p.left, p.op), op: 'startswith', value: p.pattern };
    case 'endsWith':
      return { path: leftPath(p.left, p.op), op: 'endswith', value: p.pattern };
    case 'matches':
      // The one operator we refuse to compile — JS RegExp ≠ Postgres POSIX ERE.
      throw new UnsupportedPredicateOpError(
        'matches',
        "the predicate `matches` is a JavaScript RegExp, which is NOT equivalent to Postgres' POSIX `~` operator (different anchoring, character classes, backreferences, and Unicode semantics). Compiling it to `~` would silently change semantics. Use `contains`/`startsWith`/`endsWith` for substring matching, or evaluate `matches` against the JS eval target (evalPredicate) instead of the SQL compiler.",
      );
    // Unary presence/null discriminators → SQL NULL tests. In a flat row model
    // presence and non-null coincide (see header), so:
    case 'exists': case 'isNotNull':
      return { path: leftPath(p.left, p.op), op: 'is_not_null', value: undefined };
    case 'missing': case 'isNull':
      return { path: leftPath(p.left, p.op), op: 'is_null', value: undefined };
  }
}

function compileLeaf(ctx: CompileContext, leaf: LoweredLeaf): SQL {
  const resolved = resolvePath(ctx, leaf.path);
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
    return compileLeafOp(resolved.column, leaf.op, leaf.value, resolved.coerceAs);
  }
  if (resolved.kind === 'eav_expr') {
    // EAV Shape B (jsonb) — value is a cast expression behind a LEFT JOIN.
    for (const j of resolved.joins) pushJoin(ctx, j);
    return compileLeafOpExpr(resolved.expr, leaf.op, leaf.value, resolved.coerceAs);
  }
  // has_many → EXISTS (SELECT 1 FROM child <inner belongs_to joins> WHERE
  // child.fk = parent.pk AND <op on the inner target>). Drizzle's exists() helper
  // doesn't paren raw sql templates, so emit the whole EXISTS clause directly.
  const inner = resolved.inner;
  const innerCondition = inner.kind === 'column'
    ? compileLeafOp(inner.column, leaf.op, leaf.value, inner.coerceAs)
    : compileLeafOpExpr(inner.expr, leaf.op, leaf.value, inner.coerceAs);
  const innerJoins = inner.joins.length
    ? sql.join(inner.joins.map((j) => sql` inner join ${j.table} on ${j.on}`), sql``)
    : sql``;
  return sql`exists (select 1 from ${resolved.target}${innerJoins} where ${eq(resolved.fkColumn, resolved.parentPkColumn)} and ${innerCondition})`;
}

// Walk the Predicate tree directly. Boolean nodes recurse; every other node is a
// leaf, lowered then compiled. No intermediate FilterExpression — the public
// language IS what the compiler walks (RFC-0002 §4 native alignment).
function compileExpression(ctx: CompileContext, p: Predicate): SQL {
  if (p.op === 'and') {
    return and(...p.clauses.map((c) => compileExpression(ctx, c))) as SQL;
  }
  if (p.op === 'or') {
    return or(...p.clauses.map((c) => compileExpression(ctx, c))) as SQL;
  }
  if (p.op === 'not') {
    return not(compileExpression(ctx, p.clause));
  }
  // Every remaining variant is a leaf. CFA won't narrow `p` away from the
  // alias-typed boolean variants here (see LeafPredicate), so assert it.
  return compileLeaf(ctx, lowerLeaf(p as LeafPredicate));
}

function compileSort(ctx: CompileContext, sort: Sort): SQLWrapper {
  const resolved = resolvePath(ctx, sort.field);
  if (resolved.kind === 'has_many') {
    throw new Error(`Cannot sort by has_many path: ${sort.field}`);
  }
  for (const j of resolved.joins) pushJoin(ctx, j);
  if (resolved.kind === 'eav_expr') {
    return sort.dir === 'desc' ? sql`${resolved.expr} desc` : sql`${resolved.expr} asc`;
  }
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
  // LEFT JOINs needed ONLY to surface the projected fields (not the filter) —
  // the belongs_to hop for a dotted column, or the field_values join for an EAV
  // field. Kept separate from `joins` so the COUNT query stays minimal — these
  // apply to the projecting SELECT only. Deduped against filter joins.
  previewJoins: { table: PgTable; on: SQL }[];
  // Compiler-resolved SELECT columns for the projected fields, keyed by the
  // requested field key. Carries native columns (PgColumn), EAV Shape A value
  // columns (PgColumn), and EAV Shape B jsonb casts (aliased SQL) alike — NOT
  // just EAV. In default preview this holds only the curated EAV preview fields
  // (native preview columns come from catalogPreview); when the caller projects
  // explicit `columns` it holds every requested field. has_many is excluded.
  projection: Record<string, PgColumn | SQL.Aliased>;
}

// Rewrite any leaf whose entity path is the magic `'text'` into an OR across the
// root entity's declared searchableColumns. Each searchable column becomes a
// sibling leaf with the same op + value/pattern, then the engine compiles them
// normally (including has_many fan-out for dotted paths like 'chunks.body').
//
// Operates on Predicate directly: the magic target is `{ from: 'entity', path:
// 'text' }`. Only leaves with an entity `left` are candidates; string/comparison
// ops are rewritten by swapping the entity path. (text-magic is only meaningful
// for the contains/startsWith/endsWith/eq family; an `exists`/`matches` on 'text'
// would be unusual but is rewritten uniformly — the leaf compiler handles it.)
//
// If an entity declares zero searchable columns and a filter targets 'text',
// we throw — the caller asked for something the entity doesn't support.
function expandTextMagic(rootEntity: EntityName, p: Predicate): Predicate {
  if (p.op === 'and') {
    return { op: 'and', clauses: p.clauses.map((c) => expandTextMagic(rootEntity, c)) };
  }
  if (p.op === 'or') {
    return { op: 'or', clauses: p.clauses.map((c) => expandTextMagic(rootEntity, c)) };
  }
  if (p.op === 'not') {
    return { op: 'not', clause: expandTextMagic(rootEntity, p.clause) };
  }
  // Leaf — does its `left` target the magic 'text' path? (CFA won't narrow `p`
  // away from the alias-typed boolean variants here; assert it's a leaf.)
  const leaf = p as LeafPredicate;
  if (leaf.left.from !== 'entity' || leaf.left.path !== 'text') return p;
  const cols = registry[rootEntity].searchableColumns;
  if (!cols || cols.length === 0) {
    throw new Error(`Entity '${rootEntity}' has no searchable columns; cannot resolve 'text' filter`);
  }
  // Re-point this leaf's entity path at one searchable column, preserving the
  // op + the rest of the leaf shape (right / pattern). Spreading keeps the
  // discriminated-union variant intact.
  const repoint = (col: string): Predicate => ({ ...leaf, left: { from: 'entity', path: col } });
  if (cols.length === 1) return repoint(cols[0]);
  return { op: 'or', clauses: cols.map(repoint) };
}

export function compile(
  req: DomainQueryRequest,
  eav?: EavContext,
  // Fields to project into the SELECT beyond the primary key, each resolved like
  // a filter `on:` (native / EAV / belongs_to dotted; has_many is skipped).
  // Default preview passes the curated EAV preview keys; explicit projection
  // passes the caller's `columns`. See CompiledQuery.projection.
  projectFields?: string[],
): CompiledQuery {
  const desc = registry[req.entity];
  if (!desc) throw new Error(`Unknown entity: ${req.entity}`);

  const ctx: CompileContext = {
    rootEntity: req.entity,
    joins: [],
    joinKeys: new Set(),
    textMatches: [],
    textMatchKeys: new Set(),
    fieldMaps: eav?.fieldMaps ?? {},
    eavAliases: new Map(),
  };

  const expanded = req.filter ? expandTextMagic(req.entity, req.filter) : undefined;
  const where = expanded ? compileExpression(ctx, expanded) : undefined;
  const orderBy = (req.sort ?? []).map(s => compileSort(ctx, s));

  // Resolve each projected field through the SAME machinery as filters (so a
  // join is deduped if the field is also filtered). Their joins go into
  // previewJoins (SELECT-only); their resolved columns into `projection`, keyed
  // by the requested field key. has_many can't be a scalar column → skipped.
  const previewJoins: { table: PgTable; on: SQL }[] = [];
  const projection: Record<string, PgColumn | SQL.Aliased> = {};
  for (const f of projectFields ?? []) {
    const resolved = resolvePath(ctx, f);
    if (resolved.kind === 'has_many') continue;
    for (const j of resolved.joins) {
      const key = getTableName(j.table);
      if (ctx.joinKeys.has(key)) continue; // already joined for the filter/sort
      ctx.joinKeys.add(key);
      previewJoins.push(j);
    }
    // Native / Shape A → column; Shape B → aliased cast expression. Row key = f.
    projection[f] = resolved.kind === 'eav_expr' ? resolved.expr.as(f) : resolved.column;
  }

  return {
    rootTable: desc.table,
    joins: ctx.joins,
    where,
    orderBy,
    limit: req.page?.limit ?? 25,
    offset: req.page?.offset ?? 0,
    textMatches: ctx.textMatches,
    previewJoins,
    projection,
  };
}
