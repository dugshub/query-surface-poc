import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { SyncedEntityRepository } from '@shared/base-classes/synced-entity-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { contacts, type Contact } from './contact.entity';

@Injectable()
export class ContactRepository extends SyncedEntityRepository<Contact> {
  readonly table = contacts;
  // POC ADDITION: codegen would emit this from entity.name in production.
  protected readonly entityName = 'contact' as const;

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

  async findByUserId(userId: string): Promise<Contact[]> {
    const rows = await this.baseQuery()
      .where(eq(this.table['userId'], userId)).orderBy(asc(this.table['lastName']));
    return rows as Contact[];
  }

  async findByExternalId(externalId: string): Promise<Contact | null> {
    const rows = await this.baseQuery()
      .where(eq(this.table['externalId'], externalId))
      .limit(1);
    return (rows[0] as Contact) ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FK traversal methods (from belongs_to relationships — CGP-358b)
  // Called by service-layer composition methods on the inverse (has_many) side.
  // ═══════════════════════════════════════════════════════════════════════

  async findByAccountId(id: string, opts?: { cursor?: string; limit?: number }): Promise<Contact[]> {
    let q = this.baseQuery().where(eq(this.table['accountId'], id));
    if (opts?.limit) q = (q as any).limit(opts.limit);
    return (await q) as Contact[];
  }

  // Inherited from SyncedEntityRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
  //   findByExternalId, findAllByUserId, findVisibleByUserId, syncUpsert
}
