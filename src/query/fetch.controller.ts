// POST /fetch — hydrate a list of IDs into full rows.
//
// Body: { entity, ids: [uuid…], filter?: refinement, expand?: [], include_sql? }
//
// The optional `filter` is a refinement filter applied to the ID set — lets the
// agent say "of these 200 IDs, give me only the ones in stage=closing" without
// running a fresh /search. Composes with the existing FilterExpression algebra
// (it's AND'd to `id IN ids`).

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
import { runFetch } from './service';
import type { FetchRequest, FetchResponse } from './types';
import { EntityNameSchema, FilterExpressionSchema } from './zod-schemas';

const FetchRequestSchema = z.object({
  entity: EntityNameSchema,
  ids: z.array(z.string().uuid()).min(1).max(500),
  filter: FilterExpressionSchema.optional(),
  expand: z.array(z.string()).optional(),
  include_sql: z.boolean().optional(),
});

@Controller('fetch')
export class FetchController {
  constructor(
    @Inject(DRIZZLE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
  ) {}

  @Post()
  async fetch(@Body() body: unknown): Promise<FetchResponse> {
    const parsed = FetchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'invalid_request',
        issues: parsed.error.flatten(),
      });
    }

    try {
      return await runFetch(this.db, parsed.data as FetchRequest);
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
