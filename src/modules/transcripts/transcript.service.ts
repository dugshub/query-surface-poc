import { Injectable, Inject, Optional } from '@nestjs/common';
import { WithAnalytics } from '@shared/base-classes/with-analytics';
import { EVENT_BUS } from '@shared/constants/tokens';
import { ActivityEntityService } from '@shared/base-classes/activity-entity-service';
import { TranscriptRepository } from './transcript.repository';
import type { Transcript } from './transcript.entity';
import { OpportunityRepository } from '../opportunities/opportunity.repository';
import type { Opportunity } from '../opportunities/opportunity.entity';

@Injectable()
export class TranscriptService extends WithAnalytics(
  ActivityEntityService<TranscriptRepository, Transcript>,
) {
  protected override readonly entityName = 'transcript';

  /** Injected by NestJS when EventsModule is registered. */
  @Optional() @Inject(EVENT_BUS)
  protected override eventBus: any = undefined;

  constructor(
    protected override readonly repository: TranscriptRepository,
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

  async findByOpportunityId(opportunityId: string): Promise<Transcript[]> {
    return this.repository.findByOpportunityId(opportunityId);
  }

  async findByUserId(userId: string): Promise<Transcript[]> {
    return this.repository.findByUserId(userId);
  }

  async findBySourceAndOpportunityId(source: 'zoom' | 'google_meet' | 'manual' | 'gong' | 'granola' | 'fathom', opportunityId: string): Promise<Transcript[]> {
    return this.repository.findBySourceAndOpportunityId(source, opportunityId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Relationship composition methods (CGP-358b / CGP-62)
  // Two queries, no SQL JOIN. Core-contract path; relations() const stays
  // as opt-in extension for hand-written Drizzle queries.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch the Opportunity parent for this Transcript.
   * Two repo calls: find self by id → find target by FK.
   */
  async opportunity(transcriptId: string): Promise<Opportunity | null> {
    const entity = await this.repository.findById(transcriptId);
    if (!entity) return null;
    return entity.opportunityId ? this.opportunityRepo.findById(entity.opportunityId) : null;
  }


}
