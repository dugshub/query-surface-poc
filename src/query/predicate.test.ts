// Predicate construction-helper tests — lock the public leaf/operand shape so
// consumers (and the compiler) can rely on it. Pure, no DB.

import { describe, expect, test } from 'bun:test';
import { field, lit, cmp, str, unary, and, or, notP } from './predicate';

describe('operand helpers', () => {
  test('field → entity binding', () => {
    expect(field('StageName')).toEqual({ from: 'entity', path: 'StageName' });
  });
  test('lit → literal binding', () => {
    expect(lit(100000)).toEqual({ from: 'literal', value: 100000 });
    expect(lit(['A', 'B'])).toEqual({ from: 'literal', value: ['A', 'B'] });
    expect(lit(null)).toEqual({ from: 'literal', value: null });
  });
});

describe('leaf helpers', () => {
  test('cmp → comparison leaf with entity left + literal right', () => {
    expect(cmp('Amount', 'gt', 100000)).toEqual({
      op: 'gt',
      left: { from: 'entity', path: 'Amount' },
      right: { from: 'literal', value: 100000 },
    });
  });
  test('str → string leaf with literal pattern (not a binding)', () => {
    expect(str('title', 'contains', 'pricing')).toEqual({
      op: 'contains',
      left: { from: 'entity', path: 'title' },
      pattern: 'pricing',
    });
  });
  test('unary → unary leaf', () => {
    expect(unary('closedAt', 'isNotNull')).toEqual({
      op: 'isNotNull',
      left: { from: 'entity', path: 'closedAt' },
    });
  });
});

describe('boolean helpers', () => {
  test('and / or → clause arrays', () => {
    const a = cmp('x', 'eq', 1);
    const b = cmp('y', 'eq', 2);
    expect(and(a, b)).toEqual({ op: 'and', clauses: [a, b] });
    expect(or(a, b)).toEqual({ op: 'or', clauses: [a, b] });
  });
  test('notP → not clause', () => {
    const a = cmp('x', 'eq', 1);
    expect(notP(a)).toEqual({ op: 'not', clause: a });
  });
});
