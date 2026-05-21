import { Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, type SQL } from 'drizzle-orm';
import type { Page } from '@shared/http/pagination';
import { EmailService } from '../email.service';
import { emails, type Email } from '../email.entity';

export interface SearchEmailsInput {
  opportunityId?: string;
  direction?: 'inbound' | 'outbound';
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Filtered search use case (task #16).
 *
 * Composes the entity service's `list` + `count` with filter-AND and
 * an optional ilike search on `body_text`.
 * Pagination is enforced at the Zod layer in the controller.
 */
@Injectable()
export class SearchEmailsUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(input: SearchEmailsInput): Promise<Page<Email>> {
    const conditions: SQL[] = [];
    if (input.opportunityId) conditions.push(eq(emails.opportunityId, input.opportunityId));
    if (input.direction) conditions.push(eq(emails.direction, input.direction));
    if (input.search) conditions.push(ilike(emails.bodyText, `%${input.search}%`));

    const where =
      conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      and(...conditions);

    const [items, total] = await Promise.all([
      this.service.list({ where, limit: input.limit, offset: input.offset, orderBy: asc(emails.createdAt) }),
      this.service.count(where),
    ]);

    return { items, total, limit: input.limit, offset: input.offset };
  }
}
