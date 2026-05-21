import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { PaginationSchema } from '@shared/http/pagination';
import { SearchTranscriptsUseCase } from './use-cases/search-transcripts.use-case';

const TranscriptFiltersSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  source: z.enum(['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}

/**
 * Filtered search controller (task #16) — generated from queries:
 * block in transcript.yaml.
 */
@Controller('transcripts')
export class TranscriptSearchController {
  constructor(private readonly searchUseCase: SearchTranscriptsUseCase) {}

  @Get('search')
  async search(@Query() query: Record<string, unknown>) {
    return this.searchUseCase.execute(parseOrThrow(TranscriptFiltersSchema, query));
  }
}
