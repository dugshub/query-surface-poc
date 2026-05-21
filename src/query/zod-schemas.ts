// Shared Zod schemas used across search + fetch controllers. Keeping these
// centralized so the validation surface stays consistent and we don't drift
// between endpoints.

import { z } from 'zod';

export const EntityNameSchema = z.enum([
  'account',
  'opportunity',
  'contact',
  'email',
  'transcript',
]);

export const OpSchema = z.enum([
  'eq',
  'neq',
  'in',
  'nin',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'contains',
  'startswith',
  'endswith',
  'is_null',
  'is_not_null',
]);

const LeafFilterSchema = z.object({
  on: z.string().min(1),
  op: OpSchema,
  value: z.unknown().optional(),
});

type FilterExpressionShape =
  | z.infer<typeof LeafFilterSchema>
  | { and: FilterExpressionShape[] }
  | { or: FilterExpressionShape[] }
  | { not: FilterExpressionShape };

export const FilterExpressionSchema: z.ZodType<FilterExpressionShape> = z.lazy(() =>
  z.union([
    LeafFilterSchema,
    z.object({ and: z.array(FilterExpressionSchema).min(1) }),
    z.object({ or: z.array(FilterExpressionSchema).min(1) }),
    z.object({ not: FilterExpressionSchema }),
  ]),
);

export const SortSchema = z.object({
  field: z.string().min(1),
  dir: z.enum(['asc', 'desc']),
});
