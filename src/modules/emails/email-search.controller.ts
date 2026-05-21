import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { PaginationSchema } from '@shared/http/pagination';
import { SearchEmailsUseCase } from './use-cases/search-emails.use-case';

const EmailFiltersSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}

/**
 * Filtered search controller (task #16) — generated from queries:
 * block in email.yaml.
 */
@Controller('emails')
export class EmailSearchController {
  constructor(private readonly searchUseCase: SearchEmailsUseCase) {}

  @Get('search')
  async search(@Query() query: Record<string, unknown>) {
    return this.searchUseCase.execute(parseOrThrow(EmailFiltersSchema, query));
  }
}
