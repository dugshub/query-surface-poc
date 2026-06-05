/**
 * Request/response schemas for the generic query REST endpoints
 * (`/v1/query/...`). Package-owned: these are the wire contract of the
 * capability, identical for every host.
 *
 * Two flavors per recursive shape:
 *  - runtime schemas (`filterExpressionSchema`) — true recursive validation
 *    used by `ZodValidationPipe` at the controller boundary;
 *  - doc schemas (`*DocSchema`) — depth-limited variants for OpenAPI
 *    registries, because `@anatine/zod-openapi` collapses `z.lazy` to an
 *    empty schema. Swagger shows two nesting levels plus a description; the
 *    runtime accepts arbitrary depth.
 */
import { z } from 'zod';
import type { FilterExpression } from '../../query/types';

export const FILTER_OPS = [
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
] as const;

const leafFilterSchema = z.object({
  on: z
    .string()
    .min(1)
    .describe(
      'Column key or dotted relation path (e.g. "stage", "account.name", "opportunityContacts.contact.last_name"). EAV fields resolve as columns.',
    ),
  op: z.enum(FILTER_OPS),
  value: z.unknown().optional(),
});

export const filterExpressionSchema: z.ZodType<FilterExpression> = z.lazy(() =>
  z.union([
    leafFilterSchema,
    z.object({ and: z.array(filterExpressionSchema) }),
    z.object({ or: z.array(filterExpressionSchema) }),
    z.object({ not: filterExpressionSchema }),
  ]),
);

const sortSchema = z.object({
  field: z.string().min(1),
  dir: z.enum(['asc', 'desc']),
});

const pageSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});

export const querySearchRequestSchema = z.object({
  filter: filterExpressionSchema.optional(),
  sort: z.array(sortSchema).optional(),
  page: pageSchema.optional(),
  columns: z.array(z.string()).optional(),
  preview: z.boolean().optional(),
  include_sql: z.boolean().optional(),
});
export type QuerySearchRequestDto = z.infer<typeof querySearchRequestSchema>;

export const queryFetchRequestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  expand: z.array(z.string()).optional(),
  include_sql: z.boolean().optional(),
});
export type QueryFetchRequestDto = z.infer<typeof queryFetchRequestSchema>;

// ── Doc schemas (for the host's OpenAPI registry) ────────────────────────────

const filterGroupDocLevel = z.union([
  leafFilterSchema,
  z.object({ and: z.array(leafFilterSchema) }),
  z.object({ or: z.array(leafFilterSchema) }),
  z.object({ not: leafFilterSchema }),
]);

export const filterExpressionDocSchema = z
  .union([
    leafFilterSchema,
    z.object({ and: z.array(filterGroupDocLevel) }),
    z.object({ or: z.array(filterGroupDocLevel) }),
    z.object({ not: filterGroupDocLevel }),
  ])
  .describe(
    'Recursive filter expression: a leaf {on, op, value} or an and/or/not combinator of nested filter expressions. Nesting depth is unlimited at runtime; this doc schema shows two levels.',
  );

export const querySearchRequestDocSchema = querySearchRequestSchema.extend({
  filter: filterExpressionDocSchema.optional(),
});

export const querySearchResultDocSchema = z.object({
  ids: z.array(z.string().uuid()),
  total: z.number().int(),
  has_more: z.boolean(),
  preview: z
    .array(z.record(z.unknown()))
    .optional()
    .describe(
      'Preview rows (when preview=true). Text-op matches add a _snippets entry per matched column.',
    ),
  sql: z.string().optional(),
  params: z.array(z.unknown()).optional(),
});

export const queryFetchResponseDocSchema = z.object({
  entity: z.string(),
  rows: z.array(z.record(z.unknown())),
  count: z.number().int(),
  sql: z.string().optional(),
  params: z.array(z.unknown()).optional(),
});

export const queryEntityCatalogDocSchema = z.object({
  entity: z.string(),
  fields: z.array(
    z.object({
      key: z.string(),
      column: z.string(),
      eav: z
        .boolean()
        .describe(
          'True when the field is an EAV virtual column resolved for the calling principal.',
        ),
      type: z.string(),
      nullable: z.boolean(),
      searchable: z.boolean(),
      preview: z.boolean(),
    }),
  ),
});

/**
 * Name → Zod schema map the HOST registers into its OpenAPI registry so the
 * controller's `$ref`-based `@Api*` decorators resolve. The package stays
 * registry-agnostic; the host owns document assembly.
 */
export const QUERY_SURFACE_OPENAPI_SCHEMAS = {
  FilterExpression: filterExpressionDocSchema,
  QuerySearchRequestDto: querySearchRequestDocSchema,
  QueryFetchRequestDto: queryFetchRequestSchema,
  QuerySearchResultDto: querySearchResultDocSchema,
  QueryFetchResponseDto: queryFetchResponseDocSchema,
  QueryEntityCatalogDto: queryEntityCatalogDocSchema,
} as const;
