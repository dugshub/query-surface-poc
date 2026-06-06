// Predicate language — the query surface's PUBLIC filter language.
//
// This is a structural copy of the LOCKED Predicate surface
// (dealbrain-integrations RFC-0001 §1.2; shipped as dealbrain #174), RESTRICTED
// to the *resolved* binding subset. It is the only expression language this
// package speaks — there is no `FilterExpression` any more (RFC-0002 §4:
// "Predicate is the only expression language"; FilterExpression is
// deprecated-on-contact, converged by native alignment, never by translation).
//
// ─── Why a local, structural copy (no package dependency) ────────────────────
//
// We deliberately do NOT depend on `@swe-brain/*` or `@dealbrain/*`. Structural
// typing keeps the sibling repos decoupled: a Predicate tree authored in
// swe-brain (or dealbrain) flows in here directly because the SHAPES match, with
// no import edge and no version coupling. This is the cross-repo contract — the
// type, not the package.
//
// ─── Why the RESTRICTION to {entity} / {literal} is load-bearing ─────────────
//
// The locked Binding set has eight kinds (trigger / step / context / loop /
// literal / secret / computed, plus the `entity` kind added by RFC-0002 Delta 2).
// Seven of those reference values in a workflow EXECUTION scope — they are only
// resolvable against a live JobContext at run time. A SQL compiler has no such
// scope; it can only compile comparisons between an entity column/path and a
// constant.
//
// So this surface admits exactly two operand kinds:
//   • { from: 'entity', path }   — a column / dotted path on the Find target
//                                   entity (RFC-0002 Delta 2: the `entity`
//                                   binding, making the eval-side `entity` scope
//                                   symmetric with compile). This is what `on:`
//                                   used to be.
//   • { from: 'literal', value } — a constant.
//
// Restricting the TYPE to these two enforces — at the type level, at every public
// call site — that the caller has already resolved every dynamic binding
// (trigger / step / loop / context / secret / computed) against JobContext BEFORE
// the query ships. The Find executor does exactly this: it resolves dynamic
// bindings via `resolveBinding`, leaving query-surface only the "resolved
// residue" — entity-path-vs-literal comparisons under and/or/not — which is what
// the legacy FilterExpression already was (RFC-0002 §4).
//
// ─── Parity with the locked surface ──────────────────────────────────────────
//
// Operators, the StrOp `{op, left, pattern}` literal-string shape, the unary
// presence/null discriminators, and the SQL-style three-valued NULL semantics
// are all faithful to the locked surface and its evaluator (`evalPredicate`).
// See compiler.ts for the per-operator SQL mapping and the documented
// divergences (`matches` is rejected in the SQL path; `exists`/`missing` map to
// the honest SQL presence semantics).

/** A dotted-path string (e.g. "StageName", "account.name", "opportunity.StageName"). */
export type Path = string;

/** All scalar types that can appear as a literal value in the predicate tree. */
export type Literal = string | number | boolean | null | Date | Array<string | number>;

/**
 * A resolved reference to a value. The RESTRICTED binding set — only the two
 * kinds a SQL compiler can resolve. See the file header for why every other
 * locked binding kind (trigger/step/context/loop/secret/computed) is excluded:
 * those must be resolved against JobContext BEFORE the query ships.
 *
 *   { from: 'entity', path }    — a column/dotted path on the Find target entity
 *                                 (RFC-0002 Delta 2; the old `on:`).
 *   { from: 'literal', value }  — a constant (the old `value:`).
 */
export type Binding =
  | { from: 'entity'; path: Path }
  | { from: 'literal'; value: Literal };

/** Comparison operators — both operands are Bindings. Predicate spellings. */
export type CmpOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'between';

/**
 * String operators — `left` is a Binding, `pattern` is a literal string (NOT a
 * Binding), per the locked surface. `matches` (JS-RegExp) is part of the locked
 * surface but is REJECTED by the SQL compiler — see compiler.ts for the
 * JS-RegExp-vs-POSIX-regex divergence rationale.
 */
export type StrOp = 'matches' | 'contains' | 'startsWith' | 'endsWith';

/**
 * Unary presence / null-discrimination operators — two-valued opt-ins from the
 * three-valued logic, faithful to the locked surface:
 *
 *   exists / missing : pure presence/absence — do NOT test for null
 *                      (presence ≠ non-null).
 *   isNull / isNotNull : presence + null-ness.
 *
 * SQL mapping (compiler.ts): for a plain nullable column, presence is column
 * presence on a row, so exists≈isNotNull and missing≈isNull. For an EAV field
 * the LEFT JOIN reads an absent value as NULL, so the same identity holds and is
 * the honest interpretation. See compiler.ts for the documented aliasing.
 */
export type UnaryOp = 'exists' | 'missing' | 'isNull' | 'isNotNull';

/** Boolean composition operators. */
export type BoolOp = 'and' | 'or';

/**
 * A structured (non-string) predicate expression tree — the public filter
 * language of this package. Faithful in shape to the locked Predicate, with
 * operands restricted to the resolved Binding subset above.
 */
export type Predicate =
  | { op: CmpOp; left: Binding; right: Binding }
  | { op: StrOp; left: Binding; pattern: string }
  | { op: UnaryOp; left: Binding }
  | { op: BoolOp; clauses: Predicate[] }
  | { op: 'not'; clause: Predicate };

// ─── Construction helpers (ergonomic sugar — fully optional) ─────────────────
//
// Hand-authoring `{ from: 'entity', path }` / `{ from: 'literal', value }` at
// every leaf is verbose. These helpers make the resolved-residue shape that
// query-surface receives pleasant to write in demos, tests, and consumers,
// without hiding the underlying Predicate tree (they return plain Predicates).

/** An entity-path operand: `field('StageName')` → `{ from: 'entity', path: 'StageName' }`. */
export function field(path: Path): { from: 'entity'; path: Path } {
  return { from: 'entity', path };
}

/** A literal operand: `lit(100000)` → `{ from: 'literal', value: 100000 }`. */
export function lit(value: Literal): { from: 'literal'; value: Literal } {
  return { from: 'literal', value };
}

/**
 * Leaf comparison sugar: `cmp('StageName', 'eq', 'Negotiation/Review')`.
 * `path` is an entity path; `value` is wrapped as a literal. For `in`/`nin`
 * pass an array; for `between` pass `[lo, hi]`.
 */
export function cmp(path: Path, op: CmpOp, value: Literal): Predicate {
  return { op, left: field(path), right: lit(value) };
}

/** Leaf string-op sugar: `str('title', 'contains', 'pricing')`. */
export function str(path: Path, op: StrOp, pattern: string): Predicate {
  return { op, left: field(path), pattern };
}

/** Leaf unary sugar: `unary('closedAt', 'isNotNull')`. */
export function unary(path: Path, op: UnaryOp): Predicate {
  return { op, left: field(path) };
}

/** Boolean composition sugar. */
export function and(...clauses: Predicate[]): Predicate {
  return { op: 'and', clauses };
}
export function or(...clauses: Predicate[]): Predicate {
  return { op: 'or', clauses };
}
export function notP(clause: Predicate): Predicate {
  return { op: 'not', clause };
}
