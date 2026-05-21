/**
 * Declarative Query Use Cases for Account
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { AccountService } from '../account.service';
import type { Account } from '../account.entity';

@Injectable()
export class FindAccountByUserIdUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(userId: string): Promise<Account[]> {
    return this.service.findByUserId(userId);
  }
}

@Injectable()
export class FindAccountByExternalIdUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(externalId: string): Promise<Account | null> {
    return this.service.findByExternalId(externalId);
  }
}

@Injectable()
export class FindAccountByIndustryUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(industry: 'fintech' | 'saas' | 'retail' | 'health' | 'manufacturing' | 'other'): Promise<Account[]> {
    return this.service.findByIndustry(industry);
  }
}

export const declarativeQueryClasses = [
  FindAccountByUserIdUseCase,
  FindAccountByExternalIdUseCase,
  FindAccountByIndustryUseCase,
];
