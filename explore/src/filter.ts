// Filter model for the builder. A tree of leaves and groups that compiles to the
// surface's FilterExpression. The builder edits this tree; toExpression() turns
// it into what /api/query receives. Type-aware: opsForField narrows operators by
// the field's ColumnType, and fieldOptions walks relationships into dotted paths.
import type { CatalogField, ColumnType, FilterExpression, LeafFilter, Op } from './types';

export interface FLeaf {
  kind: 'leaf';
  id: string;
  on: string;            // field key, dotted path, or 'text'
  op: Op;
  value: unknown;        // string | number | boolean | string[] | [unknown, unknown]
}

export interface FGroup {
  kind: 'group';
  id: string;
  conj: 'and' | 'or';
  negate: boolean;
  children: FNode[];
}

export type FNode = FLeaf | FGroup;

const uid = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const newLeaf = (on = 'text', op: Op = 'contains'): FLeaf => ({ kind: 'leaf', id: uid(), on, op, value: '' });
export const newGroup = (conj: 'and' | 'or' = 'and'): FGroup => ({ kind: 'group', id: uid(), conj, negate: false, children: [newLeaf()] });
export const rootGroup = (): FGroup => newGroup('and');

// ── operators per type ──────────────────────────────────────────────────────
const OPS_BY_TYPE: Record<ColumnType, Op[]> = {
  string:   ['contains', 'startswith', 'endswith', 'eq', 'neq', 'in', 'nin', 'is_null', 'is_not_null'],
  uuid:     ['eq', 'neq', 'in', 'nin', 'is_null', 'is_not_null'],
  integer:  ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'nin', 'is_null', 'is_not_null'],
  number:   ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'nin', 'is_null', 'is_not_null'],
  datetime: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'is_null', 'is_not_null'],
  date:     ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'is_null', 'is_not_null'],
  boolean:  ['eq', 'neq', 'is_null', 'is_not_null'],
  enum:     ['eq', 'neq', 'in', 'nin', 'is_null', 'is_not_null'],
  json:     ['eq', 'neq', 'is_null', 'is_not_null'],
};
const TEXT_OPS: Op[] = ['contains', 'startswith', 'endswith'];

export const NO_VALUE_OPS = new Set<Op>(['is_null', 'is_not_null']);
export const MULTI_OPS = new Set<Op>(['in', 'nin']);
export const RANGE_OPS = new Set<Op>(['between']);

/** Operators valid for a field (the 'text' pseudo-field, field=undefined, gets text ops). */
export function opsForField(field?: CatalogField): Op[] {
  if (!field) return TEXT_OPS;
  return OPS_BY_TYPE[field.type] ?? ['eq', 'neq', 'is_null', 'is_not_null'];
}

/** A sensible default value when the op changes, so the widget has the right shape. */
export function defaultValueForOp(op: Op): unknown {
  if (NO_VALUE_OPS.has(op)) return undefined;
  if (RANGE_OPS.has(op)) return ['', ''];
  if (MULTI_OPS.has(op)) return [];
  return '';
}

/** snake_case → camelCase; idempotent on camelCase. Mirrors the surface's resolvePath. */
export const camelize = (s: string): string => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// ── compile tree → FilterExpression ─────────────────────────────────────────
function leafToExpr(l: FLeaf): LeafFilter | undefined {
  if (NO_VALUE_OPS.has(l.op)) return { on: l.on, op: l.op };
  if (RANGE_OPS.has(l.op)) {
    const [a, b] = Array.isArray(l.value) ? (l.value as unknown[]) : [];
    if (a === '' || a == null || b === '' || b == null) return undefined;
    return { on: l.on, op: l.op, value: [a, b] };
  }
  if (MULTI_OPS.has(l.op)) {
    const arr = Array.isArray(l.value)
      ? (l.value as unknown[])
      : String(l.value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!arr.length) return undefined;
    return { on: l.on, op: l.op, value: arr };
  }
  if (l.value === '' || l.value == null) return undefined;
  return { on: l.on, op: l.op, value: l.value };
}

/** Tree → FilterExpression (or undefined if it carries no usable predicate). */
export function toExpression(node: FNode): FilterExpression | undefined {
  if (node.kind === 'leaf') return leafToExpr(node);
  const parts = node.children.map(toExpression).filter(Boolean) as FilterExpression[];
  if (parts.length === 0) return undefined;
  let expr: FilterExpression = parts.length === 1 ? parts[0] : node.conj === 'or' ? { or: parts } : { and: parts };
  if (node.negate) expr = { not: expr };
  return expr;
}

// ── immutable tree edits (by node id) ────────────────────────────────────────
export type Edit =
  | { op: 'patchLeaf'; id: string; patch: Partial<Omit<FLeaf, 'kind' | 'id'>> }
  | { op: 'patchGroup'; id: string; patch: Partial<Pick<FGroup, 'conj' | 'negate'>> }
  | { op: 'add'; groupId: string; node: FNode }
  | { op: 'remove'; id: string };

export function applyEdit(node: FGroup, e: Edit): FGroup {
  let children = e.op === 'remove' ? node.children.filter((c) => c.id !== e.id) : node.children;
  children = children.map((c) =>
    c.kind === 'group'
      ? applyEdit(c, e)
      : e.op === 'patchLeaf' && c.id === e.id
        ? { ...c, ...e.patch }
        : c,
  );
  let self: FGroup = { ...node, children };
  if (e.op === 'patchGroup' && node.id === e.id) self = { ...self, ...e.patch };
  if (e.op === 'add' && node.id === e.groupId) self = { ...self, children: [...self.children, e.node] };
  return self;
}

// Relationship traversal (entity-first paths + dotted-path resolution) lives in graph.ts.

// ── per-root specialization (rewrite leaf paths, prune the unreachable) ───────
// The Search page builds ONE filter tree of ABSOLUTE leaves (each names a target
// entity + field, or `text`) and fans it across several comm roots. For a given
// root we rewrite each leaf's `on` into the dotted relationship path from that
// root (mapOn) — `text` stays `text`. A leaf whose target the root can't reach
// (mapOn → null) is unsatisfiable: boolean algebra collapses it (a FALSE conjunct
// kills the root → it's skipped; a FALSE disjunct just drops that branch). This
// is what keeps every fanned query a path the surface can actually compile.

type Spec = { t: 'expr'; expr: FilterExpression } | { t: 'true' } | { t: 'false' };

function specNode(expr: FilterExpression, mapOn: (on: string) => string | null): Spec {
  if ('and' in expr) {
    const parts: FilterExpression[] = [];
    for (const c of expr.and) {
      const s = specNode(c, mapOn);
      if (s.t === 'false') return { t: 'false' };   // one unsatisfiable conjunct kills the AND
      if (s.t === 'expr') parts.push(s.expr);
    }
    return parts.length ? { t: 'expr', expr: parts.length === 1 ? parts[0] : { and: parts } } : { t: 'true' };
  }
  if ('or' in expr) {
    const parts: FilterExpression[] = [];
    let sawTrue = false;
    for (const c of expr.or) {
      const s = specNode(c, mapOn);
      if (s.t === 'true') sawTrue = true;
      else if (s.t === 'expr') parts.push(s.expr);
    }
    if (sawTrue) return { t: 'true' };
    return parts.length ? { t: 'expr', expr: parts.length === 1 ? parts[0] : { or: parts } } : { t: 'false' };
  }
  if ('not' in expr) {
    const s = specNode(expr.not, mapOn);
    if (s.t === 'true') return { t: 'false' };
    if (s.t === 'false') return { t: 'true' };
    return { t: 'expr', expr: { not: s.expr } };
  }
  const leaf = expr as LeafFilter;
  const on = mapOn(leaf.on);
  return on == null ? { t: 'false' } : { t: 'expr', expr: { ...leaf, on } };
}

/**
 * Specialize a filter tree for one root entity. `mapOn` rewrites a leaf's
 * absolute `on` into the dotted path from this root (or returns null when the
 * root can't reach it). Returns `{ skip: true }` when nothing can match (drop the
 * root), else `{ filter }` — possibly undefined, meaning "no surviving predicate".
 */
export function specializeForEntity(
  expr: FilterExpression,
  mapOn: (on: string) => string | null,
): { skip: boolean; filter?: FilterExpression } {
  const s = specNode(expr, mapOn);
  if (s.t === 'false') return { skip: true };
  if (s.t === 'true') return { skip: false, filter: undefined };
  return { skip: false, filter: s.expr };
}
