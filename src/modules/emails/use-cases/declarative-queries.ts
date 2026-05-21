/**
 * Declarative Query Use Cases for Email
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { Email } from '../email.entity';

@Injectable()
export class FindEmailByOpportunityIdUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(opportunityId: string): Promise<Email[]> {
    return this.service.findByOpportunityId(opportunityId);
  }
}

@Injectable()
export class FindEmailByUserIdUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(userId: string): Promise<Email[]> {
    return this.service.findByUserId(userId);
  }
}

@Injectable()
export class FindEmailByDirectionAndOpportunityIdUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(direction: 'inbound' | 'outbound', opportunityId: string): Promise<Email[]> {
    return this.service.findByDirectionAndOpportunityId(direction, opportunityId);
  }
}

export const declarativeQueryClasses = [
  FindEmailByOpportunityIdUseCase,
  FindEmailByUserIdUseCase,
  FindEmailByDirectionAndOpportunityIdUseCase,
];
