// Predicate → SQL compile tests.
//
// These run with NO database: `compile()` builds the registry from the Drizzle
// schema barrel (schema-only, no connection), and we render the resulting
// `where` SQL fragment to a parameterised string + params via drizzle's
// PgDialect. So every assertion is a deterministic compiled-SQL snapshot — the
// honest unit of "did the operator map to the right SQL", runnable in CI without
// Postgres. (Live-result tests would need a seeded DB; see the report.)
//
// Coverage: one case per operator, plus the `entity`-path routing modes
// (native column / belongs_to JOIN / has_many EXISTS / EAV Shape A typed-column
// / EAV Shape B jsonb), text-magic fan-out, and the two documented rejections
// (`matches`, column-to-column).

import { describe, expect, test, beforeAll } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';

import { registerSchema } from '../schema-registry';
import { compile, UnsupportedPredicateOpError } from './compiler';
import { cmp, str, unary, and, or, notP, field, lit, type Predicate } from '../predicate';
import type { EavContext, FieldMap, FieldDef } from '../eav/field-map';
import * as schema from '../../schema';
import { fieldValues, fieldValuesJsonb } from '../eav/schema';

const dialect = new PgDialect();

// Same overlay as main.ts / server.ts / mcp.ts.
const EAV_OVERLAY = {
  opportunities:           { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'opportunity' },
  transcript_observations: { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  accounts:                { kind: 'jsonb-value' as const, valueTable: fieldValuesJsonb, entityTypeValue: 'account', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' },
};

beforeAll(() => {
  registerSchema(schema as unknown as Record<string, unknown>, { eav: EAV_OVERLAY });
});

// Render a Predicate's compiled WHERE to { sql, params } — no DB needed.
function where(entity: string, filter: Predicate, eav?: EavContext): { sql: string; params: unknown[] } {
  const compiled = compile({ entity, filter }, eav);
  if (!compiled.where) return { sql: '', params: [] };
  return dialect.sqlToQuery(compiled.where);
}

// Hand-built EAV field maps (offline substitute for loadFieldMaps' DB read).
function fieldDef(id: string, dataType: string): FieldDef {
  return { fieldDefinitionId: id, dataType, selectOptions: null, label: id, description: null, isKeyField: false, keyFieldOrder: null };
}
// opportunity → Shape A (typed-columns): StageName is text, Amount is money(number).
const oppFieldMap: FieldMap = new Map<string, FieldDef>([
  ['StageName', fieldDef('fd-stage', 'select')],
  ['Amount', fieldDef('fd-amount', 'money')],
]);
// account → Shape B (jsonb-value): Tier is text, Score is number.
const acctFieldMap: FieldMap = new Map<string, FieldDef>([
  ['Tier', fieldDef('fd-tier', 'text')],
  ['Score', fieldDef('fd-score', 'number')],
]);
const eavCtx: EavContext = { fieldMaps: { opportunities: oppFieldMap, accounts: acctFieldMap } };

// ─── Comparison operators (Predicate spelling → SQL) ─────────────────────────

describe('comparison operators', () => {
  test('eq → =', () => {
    const r = where('accounts', cmp('name', 'eq', 'Acme Corp'));
    expect(r.sql).toBe('"accounts"."name" = $1');
    expect(r.params).toEqual(['Acme Corp']);
  });

  test('neq → <>', () => {
    expect(where('accounts', cmp('name', 'neq', 'Acme')).sql).toBe('"accounts"."name" <> $1');
  });

  test('gt / gte / lt / lte → > >= < <=', () => {
    expect(where('opportunities', cmp('name', 'gt', 'A')).sql).toBe('"opportunities"."name" > $1');
    expect(where('opportunities', cmp('name', 'gte', 'A')).sql).toBe('"opportunities"."name" >= $1');
    expect(where('opportunities', cmp('name', 'lt', 'Z')).sql).toBe('"opportunities"."name" < $1');
    expect(where('opportunities', cmp('name', 'lte', 'Z')).sql).toBe('"opportunities"."name" <= $1');
  });

  test('in → IN (...)', () => {
    const r = where('accounts', cmp('name', 'in', ['A', 'B']));
    expect(r.sql).toBe('"accounts"."name" in ($1, $2)');
    expect(r.params).toEqual(['A', 'B']);
  });

  test('nin → NOT IN (...)  [3VL note: a NULL in the list makes NOT IN unknown → row excluded, matching evalPredicate]', () => {
    const r = where('accounts', cmp('name', 'nin', ['A', 'B']));
    expect(r.sql).toBe('"accounts"."name" not in ($1, $2)');
    expect(r.params).toEqual(['A', 'B']);
  });

  test('between → (>= AND <=)', () => {
    const r = where('opportunities', cmp('name', 'between', ['A', 'M']));
    expect(r.sql).toBe('("opportunities"."name" >= $1 and "opportunities"."name" <= $2)');
    expect(r.params).toEqual(['A', 'M']);
  });
});

// ─── String operators (camelCase Predicate spelling → ILIKE) ─────────────────

describe('string operators → ILIKE', () => {
  test('contains → ilike %x%', () => {
    const r = where('accounts', str('name', 'contains', 'Acme'));
    expect(r.sql).toBe('"accounts"."name" ilike $1');
    expect(r.params).toEqual(['%Acme%']);
  });

  test('startsWith → ilike x%', () => {
    expect(where('accounts', str('name', 'startsWith', 'Ac')).params).toEqual(['Ac%']);
  });

  test('endsWith → ilike %x', () => {
    expect(where('accounts', str('name', 'endsWith', 'Corp')).params).toEqual(['%Corp']);
  });

  test('matches → REJECTED with a typed, descriptive error (JS RegExp ≠ POSIX)', () => {
    let err: unknown;
    try {
      where('accounts', str('name', 'matches', '^Ac.*Corp$'));
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnsupportedPredicateOpError);
    expect((err as UnsupportedPredicateOpError).op).toBe('matches');
    expect((err as Error).message).toContain('POSIX');
  });
});

// ─── Unary operators (presence / null discrimination → SQL NULL tests) ───────

describe('unary operators', () => {
  test('exists → IS NOT NULL', () => {
    expect(where('accounts', unary('website', 'exists')).sql).toBe('"accounts"."website" is not null');
  });
  test('isNotNull → IS NOT NULL', () => {
    expect(where('accounts', unary('website', 'isNotNull')).sql).toBe('"accounts"."website" is not null');
  });
  test('missing → IS NULL', () => {
    expect(where('accounts', unary('website', 'missing')).sql).toBe('"accounts"."website" is null');
  });
  test('isNull → IS NULL', () => {
    expect(where('accounts', unary('website', 'isNull')).sql).toBe('"accounts"."website" is null');
  });
});

// ─── Boolean composition ─────────────────────────────────────────────────────

describe('boolean composition', () => {
  test('and → AND', () => {
    const r = where('accounts', and(cmp('name', 'eq', 'X'), str('website', 'contains', 'io')));
    expect(r.sql).toBe('("accounts"."name" = $1 and "accounts"."website" ilike $2)');
    expect(r.params).toEqual(['X', '%io%']);
  });
  test('or → OR', () => {
    const r = where('accounts', or(cmp('name', 'eq', 'X'), cmp('name', 'eq', 'Y')));
    expect(r.sql).toBe('("accounts"."name" = $1 or "accounts"."name" = $2)');
  });
  test('not → NOT', () => {
    const r = where('accounts', notP(cmp('name', 'eq', 'X')));
    expect(r.sql).toBe('not "accounts"."name" = $1');
  });
  test('nested and/or/not', () => {
    const r = where('accounts', and(cmp('name', 'eq', 'X'), notP(or(str('name', 'contains', 'a'), str('website', 'endsWith', '.io')))));
    expect(r.sql).toBe('("accounts"."name" = $1 and not ("accounts"."name" ilike $2 or "accounts"."website" ilike $3))');
  });
});

// ─── `entity` binding routing — exactly as `on:` did ─────────────────────────

describe('entity-path routing', () => {
  test('native column — no joins', () => {
    const compiled = compile({ entity: 'accounts', filter: cmp('name', 'eq', 'Acme') });
    expect(compiled.joins.length).toBe(0);
    expect(dialect.sqlToQuery(compiled.where!).sql).toBe('"accounts"."name" = $1');
  });

  test('belongs_to dotted path → LEFT JOIN on the target', () => {
    // opportunities → account (belongs_to); filter on account.name.
    const compiled = compile({ entity: 'opportunities', filter: cmp('account.name', 'eq', 'Acme') });
    expect(compiled.joins.length).toBe(1);
    const r = dialect.sqlToQuery(compiled.where!);
    expect(r.sql).toBe('"accounts"."name" = $1');
    expect(r.params).toEqual(['Acme']);
  });

  test('has_many dotted path → correlated EXISTS subquery', () => {
    // accounts → opportunities (has_many); filter on opportunities.name.
    const r = where('accounts', cmp('opportunities.name', 'eq', 'Big Deal'));
    expect(r.sql).toContain('exists (select 1 from "opportunities"');
    expect(r.sql).toContain('where "opportunities"."account_id" = "accounts"."id"');
    expect(r.sql).toContain('"opportunities"."name" = $1');
    expect(r.params).toEqual(['Big Deal']);
  });

  test('has_many → belongs_to chain inside the EXISTS', () => {
    // transcripts → observations (has_many) → opportunity (belongs_to) → name.
    const r = where('transcripts', cmp('observations.opportunity.name', 'eq', 'Deal'));
    expect(r.sql).toContain('exists (select 1 from "transcript_observations"');
    expect(r.sql).toContain('inner join "opportunities"');
    expect(r.params).toEqual(['Deal']);
  });
});

// ─── EAV shape-aware value resolution (typed-columns + jsonb) ────────────────

describe('EAV field resolution', () => {
  test('Shape A (typed-columns): text field → value_text column behind a LEFT JOIN', () => {
    const compiled = compile({ entity: 'opportunities', filter: cmp('StageName', 'eq', 'Negotiation/Review') }, eavCtx);
    expect(compiled.joins.length).toBe(1); // field_values join
    const r = dialect.sqlToQuery(compiled.where!);
    expect(r.sql).toContain('value_text');
    expect(r.params).toEqual(['Negotiation/Review']);
  });

  test('Shape A (typed-columns): money field → value_number column, value coerced to number', () => {
    const r = where('opportunities', cmp('Amount', 'gt', '100000'), eavCtx);
    expect(r.sql).toContain('value_number');
    expect(r.params).toEqual([100000]); // coerced from the string by the field data_type
  });

  test('Shape B (jsonb-value): text field → jsonb #>> cast expression', () => {
    const r = where('accounts', cmp('Tier', 'eq', 'enterprise'), eavCtx);
    expect(r.sql).toContain("#>> '{}'");
    expect(r.params).toEqual(['enterprise']);
  });

  test('Shape B (jsonb-value): number field → ::numeric cast, value coerced', () => {
    const r = where('accounts', cmp('Score', 'gte', '50'), eavCtx);
    expect(r.sql).toContain('::numeric');
    expect(r.params).toEqual([50]);
  });
});

// ─── text-magic fan-out ──────────────────────────────────────────────────────

describe('text-magic (entity path "text")', () => {
  test('fans out across searchable columns as an OR', () => {
    // accounts searchable = [name, website].
    const r = where('accounts', str('text', 'contains', 'pricing'));
    expect(r.sql).toBe('("accounts"."name" ilike $1 or "accounts"."website" ilike $2)');
    expect(r.params).toEqual(['%pricing%', '%pricing%']);
  });
});

// ─── rejections ──────────────────────────────────────────────────────────────

describe('rejections', () => {
  test('column-to-column comparison (right is an entity binding) → typed error', () => {
    const colToCol: Predicate = { op: 'eq', left: field('name'), right: field('website') };
    expect(() => where('accounts', colToCol)).toThrow(UnsupportedPredicateOpError);
  });

  test('literal-left leaf → typed error (no column to compare)', () => {
    const litLeft: Predicate = { op: 'eq', left: lit('x'), right: lit('y') };
    expect(() => where('accounts', litLeft)).toThrow(UnsupportedPredicateOpError);
  });
});
