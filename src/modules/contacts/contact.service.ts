import { Injectable, Inject, Optional } from '@nestjs/common';
import { WithAnalytics } from '@shared/base-classes/with-analytics';
import { EVENT_BUS } from '@shared/constants/tokens';
import { SyncedEntityService } from '@shared/base-classes/synced-entity-service';
import { ContactRepository } from './contact.repository';
import type { Contact } from './contact.entity';
import { AccountRepository } from '../accounts/account.repository';
import type { Account } from '../accounts/account.entity';

@Injectable()
export class ContactService extends WithAnalytics(
  SyncedEntityService<ContactRepository, Contact>,
) {
  protected override readonly entityName = 'contact';

  /** Injected by NestJS when EventsModule is registered. */
  @Optional() @Inject(EVENT_BUS)
  protected override eventBus: any = undefined;

  constructor(
    protected override readonly repository: ContactRepository,
    private readonly accountRepo: AccountRepository,
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

  async findByUserId(userId: string): Promise<Contact[]> {
    return this.repository.findByUserId(userId);
  }

  async findByAccountId(accountId: string): Promise<Contact[]> {
    return this.repository.findByAccountId(accountId);
  }

  async findByExternalId(externalId: string): Promise<Contact | null> {
    return this.repository.findByExternalId(externalId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Relationship composition methods (CGP-358b / CGP-62)
  // Two queries, no SQL JOIN. Core-contract path; relations() const stays
  // as opt-in extension for hand-written Drizzle queries.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch the Account parent for this Contact.
   * Two repo calls: find self by id → find target by FK.
   */
  async account(contactId: string): Promise<Account | null> {
    const entity = await this.repository.findById(contactId);
    if (!entity) return null;
    return entity.accountId ? this.accountRepo.findById(entity.accountId) : null;
  }


}
