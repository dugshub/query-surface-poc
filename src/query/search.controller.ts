// POST /search — find things, return IDs (and optional preview).
//
// Two body shapes accepted:
//   1) Single entity inline:  { entity, filter, sort, page, preview?, include_sql? }
//   2) Multi-entity array:    { queries: SingleSearchQuery[], preview?, include_sql? }
//
// The controller dispatches per-entity to the right SERVICE (each generated
// service inherits search()/fetch()/query() from BaseService — they pass
// through to the repository's same-named methods, which delegate to
// FilterCompilerService). Repos are NOT injected here per ADR-002.

import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { z } from 'zod';

import { AccountService } from '../modules/accounts/account.service';
import { EmailService } from '../modules/emails/email.service';
import { OpportunityService } from '../modules/opportunities/opportunity.service';
import { TranscriptChunkService } from '../modules/transcript_chunks/transcript_chunk.service';
import { TranscriptService } from '../modules/transcripts/transcript.service';

import type { IBaseRepository } from '../shared/base-classes/base-service';
import type { EntityName, SearchResponse, SingleSearchQuery } from './types';
import { EntityNameSchema, FilterExpressionSchema, SortSchema } from './zod-schemas';

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
  SingleSearchQuerySchema.extend({
    preview: z.boolean().optional(),
    include_sql: z.boolean().optional(),
  }),
  z.object({
    queries: z.array(SingleSearchQuerySchema).min(1),
    preview: z.boolean().optional(),
    include_sql: z.boolean().optional(),
  }),
]);

@Controller('search')
export class SearchController {
  constructor(
    private readonly accountService: AccountService,
    private readonly opportunityService: OpportunityService,
    private readonly emailService: EmailService,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
  ) {}

  /** Dispatch by entity name to the right service. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serviceFor(entity: EntityName): { search: any } {
    switch (entity) {
      case 'account':          return this.accountService as unknown as { search: any };
      case 'opportunity':      return this.opportunityService as unknown as { search: any };
      case 'email':            return this.emailService as unknown as { search: any };
      case 'transcript':       return this.transcriptService as unknown as { search: any };
      case 'transcript_chunk': return this.transcriptChunkService as unknown as { search: any };
    }
  }

  @Post()
  async search(@Body() body: unknown): Promise<SearchResponse> {
    const parsed = SearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'invalid_request',
        issues: parsed.error.flatten(),
      });
    }
    const req = parsed.data;
    const opts = { preview: req.preview, include_sql: req.include_sql };

    try {
      if ('queries' in req) {
        // Multi-entity: dispatch in parallel.
        const settled = await Promise.all(
          req.queries.map(async q => ({
            entity: q.entity,
            result: await this.serviceFor(q.entity).search(
              { filter: q.filter, sort: q.sort, page: q.page },
              opts,
            ),
          })),
        );
        const results: Partial<Record<EntityName, unknown>> = {};
        for (const { entity, result } of settled) results[entity] = result;
        return { results } as SearchResponse;
      }

      // Single-entity
      const single = req as SingleSearchQuery & { preview?: boolean; include_sql?: boolean };
      const result = await this.serviceFor(single.entity).search(
        { filter: single.filter, sort: single.sort, page: single.page },
        opts,
      );
      return { entity: single.entity, ...result } as SearchResponse;
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
