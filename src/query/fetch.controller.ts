// POST /fetch — hydrate a list of IDs into full rows.
//
// Body: { entity, ids: [uuid…], filter?: refinement, expand?: [], include_sql? }
//
// Dispatches per entity-name to the right service. Per ADR-002 services are
// the public DI surface; repos stay private to their module.

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

import type { EntityName, FetchResponse } from './types';
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
    private readonly accountService: AccountService,
    private readonly opportunityService: OpportunityService,
    private readonly emailService: EmailService,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serviceFor(entity: EntityName): { fetch: any } {
    switch (entity) {
      case 'account':          return this.accountService as unknown as { fetch: any };
      case 'opportunity':      return this.opportunityService as unknown as { fetch: any };
      case 'email':            return this.emailService as unknown as { fetch: any };
      case 'transcript':       return this.transcriptService as unknown as { fetch: any };
      case 'transcript_chunk': return this.transcriptChunkService as unknown as { fetch: any };
    }
  }

  @Post()
  async fetch(@Body() body: unknown): Promise<FetchResponse> {
    const parsed = FetchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'invalid_request',
        issues: parsed.error.flatten(),
      });
    }
    const req = parsed.data;

    try {
      const result = await this.serviceFor(req.entity).fetch(req.ids, {
        filter: req.filter,
        include_sql: req.include_sql,
      });
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
