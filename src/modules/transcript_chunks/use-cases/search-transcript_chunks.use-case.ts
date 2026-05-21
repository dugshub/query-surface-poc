import { Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, type SQL } from 'drizzle-orm';
import type { Page } from '@shared/http/pagination';
import { TranscriptChunkService } from '../transcript_chunk.service';
import { transcript_chunks, type TranscriptChunk } from '../transcript_chunk.entity';

export interface SearchTranscriptChunksInput {
  transcriptId?: string;
  speaker?: 'seller' | 'buyer' | 'unknown';
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Filtered search use case (task #16).
 *
 * Composes the entity service's `list` + `count` with filter-AND and
 * an optional ilike search on `body`.
 * Pagination is enforced at the Zod layer in the controller.
 */
@Injectable()
export class SearchTranscriptChunksUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(input: SearchTranscriptChunksInput): Promise<Page<TranscriptChunk>> {
    const conditions: SQL[] = [];
    if (input.transcriptId) conditions.push(eq(transcript_chunks.transcriptId, input.transcriptId));
    if (input.speaker) conditions.push(eq(transcript_chunks.speaker, input.speaker));
    if (input.search) conditions.push(ilike(transcript_chunks.body, `%${input.search}%`));

    const where =
      conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      and(...conditions);

    const [items, total] = await Promise.all([
      this.service.list({ where, limit: input.limit, offset: input.offset, orderBy: asc(transcript_chunks.createdAt) }),
      this.service.count(where),
    ]);

    return { items, total, limit: input.limit, offset: input.offset };
  }
}
