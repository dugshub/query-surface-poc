import { Injectable, Inject, Optional } from '@nestjs/common';
import { WithAnalytics } from '@shared/base-classes/with-analytics';
import { EVENT_BUS } from '@shared/constants/tokens';
import { SyncedEntityService } from '@shared/base-classes/synced-entity-service';
import { AccountRepository } from './account.repository';
import type { Account } from './account.entity';

@Injectable()
export class AccountService extends WithAnalytics(
  SyncedEntityService<AccountRepository, Account>,
) {
  protected override readonly entityName = 'account';

  /** Injected by NestJS when EventsModule is registered. */
  @Optional() @Inject(EVENT_BUS)
  protected override eventBus: any = undefined;

  constructor(
    protected override readonly repository: AccountRepository,
  ) {
    super(repository);
  }

  // Lifecycle events (created/updated/deleted + per-field changes) are emitted
  // automatically by BaseService when the events subsystem is installed.
  //
  // Inherited from SyncedEntityService:
  //   findById, findByIds, list, count, exists, create, update, delete
  //   findByExternalId, findAllByUserId, findVisibleByUserId

  // ═══════════════════════════════════════════════════════════════════════
  // Declarative queries (from queries: block in entity YAML)
  // Pass-through to repository — keeps use-cases on the service layer so
  // cross-cutting concerns (analytics, events) stay uniform.
  // ═══════════════════════════════════════════════════════════════════════

  async findByUserId(userId: string): Promise<Account[]> {
    return this.repository.findByUserId(userId);
  }

  async findByExternalId(externalId: string): Promise<Account | null> {
    return this.repository.findByExternalId(externalId);
  }

  async findByIndustry(industry: 'fintech' | 'saas' | 'retail' | 'health' | 'manufacturing' | 'other'): Promise<Account[]> {
    return this.repository.findByIndustry(industry);
  }



}
