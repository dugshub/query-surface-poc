import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { SyncedEntityRepository } from '@shared/base-classes/synced-entity-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { accounts, type Account } from './account.entity';

@Injectable()
export class AccountRepository extends SyncedEntityRepository<Account> {
  readonly table = accounts;
  // POC ADDITION: codegen would emit this from entity.name in production.
  protected readonly entityName = 'account' as const;

  // Behaviors declared in YAML -> generated as config object
  protected override readonly behaviors: BehaviorConfig = {
    timestamps: true,
    softDelete: false,
    userTracking: false,
  };

  constructor(@Inject(DRIZZLE) db: DrizzleClient) {
    super(db);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Declarative queries (from queries: block in entity YAML)
  // ═══════════════════════════════════════════════════════════════════════

  async findByUserId(userId: string): Promise<Account[]> {
    const rows = await this.baseQuery()
      .where(eq(this.table['userId'], userId)).orderBy(asc(this.table['name']));
    return rows as Account[];
  }

  async findByExternalId(externalId: string): Promise<Account | null> {
    const rows = await this.baseQuery()
      .where(eq(this.table['externalId'], externalId))
      .limit(1);
    return (rows[0] as Account) ?? null;
  }

  // Inherited from SyncedEntityRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
  //   findByExternalId, findAllByUserId, findVisibleByUserId, syncUpsert
}
