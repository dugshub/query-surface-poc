// Filter model for the builder. A tree of leaves and groups that compiles to the
// surface's FilterExpression. The builder edits this tree; toExpression() turns
// it into what /api/query receives. Type-aware: opsForField narrows operators by
// the field's ColumnType, and fieldOptions walks relationships into dotted paths.
import type {
  CatalogField, ColumnType, EntityCatalog, FilterExpression, LeafFilter, Op,
} from './types';

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

// ── relationship-aware field options for the leaf picker ─────────────────────
export interface FieldOption {
  value: string;          // the path for `on:`
  label: string;
  group: string;          // optgroup
  field?: CatalogField;   // resolved terminal field (drives ops + value widget); absent for 'text'
  hasMany?: boolean;      // path crosses a has_many → compiles to EXISTS ("any …")
}

/**
 * Build the leaf field dropdown for a root entity: the entity's own fields, then
 * one hop into each relationship (belongs_to also two hops), yielding dotted
 * paths. has_many paths only offer the child's native columns (the surface
 * resolves a has_many terminal to a real column, not EAV).
 */
export function fieldOptions(rootEntity: string, catalogs: Map<string, EntityCatalog>): FieldOption[] {
  const out: FieldOption[] = [{ value: 'text', label: 'text — search all', group: 'special' }];
  const root = catalogs.get(rootEntity);
  if (!root) return out;

  for (const f of root.fields) out.push({ value: f.key, label: f.key, group: 'this entity', field: f });

  for (const rel of root.relationships) {
    // Skip self-referential hops: the surface doesn't alias belongs_to joins, so
    // a self-join (e.g. accounts → parentAccount → accounts) can't resolve
    // unambiguously — offering it would return wrong rows.
    if (rel.target === rootEntity) continue;
    const tgt = catalogs.get(rel.target);
    if (!tgt) continue;
    const hm = rel.kind === 'has_many';
    const grp = `${rel.name} → ${rel.target}${hm ? ' (any)' : ''}`;
    for (const f of tgt.fields) {
      if (hm && f.eav) continue; // has_many terminal must be a native child column
      out.push({ value: `${rel.name}.${f.key}`, label: `${rel.name}.${f.key}`, group: grp, field: f, hasMany: hm });
    }
    if (rel.kind === 'belongs_to') {
      for (const rel2 of tgt.relationships) {
        if (rel2.kind !== 'belongs_to') continue;
        if (rel2.target === rootEntity || rel2.target === rel.target) continue; // would revisit → ambiguous self-join
        const tgt2 = catalogs.get(rel2.target);
        if (!tgt2) continue;
        const grp2 = `${rel.name}.${rel2.name} → ${rel2.target}`;
        for (const f of tgt2.fields) {
          out.push({ value: `${rel.name}.${rel2.name}.${f.key}`, label: `${rel.name}.${rel2.name}.${f.key}`, group: grp2, field: f });
        }
      }
    }
  }
  return out;
}
