// POST /search — find things, return IDs (and optional preview).
//
// Two body shapes accepted:
//   1) Single entity inline:  { entity, filter, sort, page, preview?, include_sql? }
//   2) Multi-entity array:    { queries: SingleSearchQuery[], preview?, include_sql? }
//
// Response shape mirrors the input — single returns the entity's result envelope
// directly, multi returns `{ results: { [entity]: result } }`.

import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';

import { DRIZZLE } from '../shared/constants/tokens';
import { runSearch, runSearchMulti } from './service';
import type { SearchRequest, SearchResponse, SingleSearchQuery } from './types';
import {
  EntityNameSchema,
  FilterExpressionSchema,
  SortSchema,
} from './zod-schemas';

const SingleSearchQuerySchema = z.object({
  entity: EntityNameSchema,
  filter: FilterExpressionSchema.optional(),
  sort: z.array(SortSchema).optional(),
  page: z
    .object({
      limit: z.number().int().min(1).max(1000).optional(),
      offset: z.number().int().min(0).optional(),
    })
    .optional(),
});

const SearchRequestSchema = z.union([
  // Single-entity inline
  SingleSearchQuerySchema.extend({
    preview: z.boolean().optional(),
    include_sql: z.boolean().optional(),
  }),
  // Multi-entity array
  z.object({
    queries: z.array(SingleSearchQuerySchema).min(1),
    preview: z.boolean().optional(),
    include_sql: z.boolean().optional(),
  }),
]);

function isMulti(req: SearchRequest): req is { queries: SingleSearchQuery[]; preview?: boolean; include_sql?: boolean } {
  return 'queries' in req;
}

@Controller('search')
export class SearchController {
  constructor(
    @Inject(DRIZZLE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
  ) {}

  @Post()
  async search(@Body() body: unknown): Promise<SearchResponse> {
    const parsed = SearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'invalid_request',
        issues: parsed.error.flatten(),
      });
    }
    const req = parsed.data as SearchRequest;
    const opts = { preview: req.preview, include_sql: req.include_sql };

    try {
      if (isMulti(req)) {
        const results = await runSearchMulti(this.db, req.queries, opts);
        return { results };
      }
      const result = await runSearch(this.db, req, opts);
      return { entity: req.entity, ...result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('Field path') ||
        message.includes('belongs_to resolution failed') ||
        message.includes('has_many') ||
        message.includes('Unknown entity') ||
        message.includes('Unknown op')
      ) {
        throw new BadRequestException({ error: 'compile_error', message });
      }
      throw err;
    }
  }
}
