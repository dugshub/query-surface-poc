/**
 * Declarative Query Use Cases for Opportunity
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';
import type { Opportunity } from '../opportunity.entity';

@Injectable()
export class FindOpportunityByUserIdUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(userId: string): Promise<Opportunity[]> {
    return this.service.findByUserId(userId);
  }
}

@Injectable()
export class FindOpportunityByAccountIdUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(accountId: string): Promise<Opportunity[]> {
    return this.service.findByAccountId(accountId);
  }
}

@Injectable()
export class FindOpportunityByStageUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(stage: 'prospect' | 'qualifying' | 'presenting' | 'negotiation' | 'closing' | 'won' | 'lost'): Promise<Opportunity[]> {
    return this.service.findByStage(stage);
  }
}

@Injectable()
export class FindOpportunityByExternalIdUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(externalId: string): Promise<Opportunity | null> {
    return this.service.findByExternalId(externalId);
  }
}

export const declarativeQueryClasses = [
  FindOpportunityByUserIdUseCase,
  FindOpportunityByAccountIdUseCase,
  FindOpportunityByStageUseCase,
  FindOpportunityByExternalIdUseCase,
];
