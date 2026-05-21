import { Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, type SQL } from 'drizzle-orm';
import type { Page } from '@shared/http/pagination';
import { TranscriptService } from '../transcript.service';
import { transcripts, type Transcript } from '../transcript.entity';

export interface SearchTranscriptsInput {
  opportunityId?: string;
  source?: 'zoom' | 'google_meet' | 'manual' | 'gong' | 'granola' | 'fathom';
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Filtered search use case (task #16).
 *
 * Composes the entity service's `list` + `count` with filter-AND and
 * an optional ilike search on `transcript`.
 * Pagination is enforced at the Zod layer in the controller.
 */
@Injectable()
export class SearchTranscriptsUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(input: SearchTranscriptsInput): Promise<Page<Transcript>> {
    const conditions: SQL[] = [];
    if (input.opportunityId) conditions.push(eq(transcripts.opportunityId, input.opportunityId));
    if (input.source) conditions.push(eq(transcripts.source, input.source));
    if (input.search) conditions.push(ilike(transcripts.transcript, `%${input.search}%`));

    const where =
      conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      and(...conditions);

    const [items, total] = await Promise.all([
      this.service.list({ where, limit: input.limit, offset: input.offset, orderBy: asc(transcripts.createdAt) }),
      this.service.count(where),
    ]);

    return { items, total, limit: input.limit, offset: input.offset };
  }
}
