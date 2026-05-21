import { Injectable, Inject, Optional } from '@nestjs/common';
import { WithAnalytics } from '@shared/base-classes/with-analytics';
import { EVENT_BUS } from '@shared/constants/tokens';
import { ActivityEntityService } from '@shared/base-classes/activity-entity-service';
import { EmailRepository } from './email.repository';
import type { Email } from './email.entity';
import { OpportunityRepository } from '../opportunities/opportunity.repository';
import type { Opportunity } from '../opportunities/opportunity.entity';

@Injectable()
export class EmailService extends WithAnalytics(
  ActivityEntityService<EmailRepository, Email>,
) {
  protected override readonly entityName = 'email';

  /** Injected by NestJS when EventsModule is registered. */
  @Optional() @Inject(EVENT_BUS)
  protected override eventBus: any = undefined;

  constructor(
    protected override readonly repository: EmailRepository,
    private readonly opportunityRepo: OpportunityRepository,
  ) {
    super(repository);
  }

  // Lifecycle events (created/updated/deleted + per-field changes) are emitted
  // automatically by BaseService when the events subsystem is installed.
  //
  // Inherited from ActivityEntityService:
  //   findById, findByIds, list, count, exists, create, update, delete
  //   findByDateRange, findByUserId, findByOpportunityId, findRecentByOpportunityId

  // ═══════════════════════════════════════════════════════════════════════
  // Declarative queries (from queries: block in entity YAML)
  // Pass-through to repository — keeps use-cases on the service layer so
  // cross-cutting concerns (analytics, events) stay uniform.
  // ═══════════════════════════════════════════════════════════════════════

  async findByOpportunityId(opportunityId: string): Promise<Email[]> {
    return this.repository.findByOpportunityId(opportunityId);
  }

  async findByUserId(userId: string): Promise<Email[]> {
    return this.repository.findByUserId(userId);
  }

  async findByDirectionAndOpportunityId(direction: 'inbound' | 'outbound', opportunityId: string): Promise<Email[]> {
    return this.repository.findByDirectionAndOpportunityId(direction, opportunityId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Relationship composition methods (CGP-358b / CGP-62)
  // Two queries, no SQL JOIN. Core-contract path; relations() const stays
  // as opt-in extension for hand-written Drizzle queries.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch the Opportunity parent for this Email.
   * Two repo calls: find self by id → find target by FK.
   */
  async opportunity(emailId: string): Promise<Opportunity | null> {
    const entity = await this.repository.findById(emailId);
    if (!entity) return null;
    return entity.opportunityId ? this.opportunityRepo.findById(entity.opportunityId) : null;
  }


}
