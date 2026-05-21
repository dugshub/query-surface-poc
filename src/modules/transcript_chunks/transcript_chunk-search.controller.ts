import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { PaginationSchema } from '@shared/http/pagination';
import { SearchTranscriptChunksUseCase } from './use-cases/search-transcript_chunks.use-case';

const TranscriptChunkFiltersSchema = z.object({
  transcriptId: z.string().uuid().optional(),
  speaker: z.enum(['seller', 'buyer', 'unknown']).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}

/**
 * Filtered search controller (task #16) — generated from queries:
 * block in transcript_chunk.yaml.
 */
@Controller('transcript_chunks')
export class TranscriptChunkSearchController {
  constructor(private readonly searchUseCase: SearchTranscriptChunksUseCase) {}

  @Get('search')
  async search(@Query() query: Record<string, unknown>) {
    return this.searchUseCase.execute(parseOrThrow(TranscriptChunkFiltersSchema, query));
  }
}
