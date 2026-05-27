import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { SyncedEntityRepository } from '@shared/base-classes/synced-entity-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { opportunities, type Opportunity } from './opportunity.entity';

@Injectable()
export class OpportunityRepository extends SyncedEntityRepository<Opportunity> {
  readonly table = opportunities;
  // POC ADDITION: codegen would emit this from entity.name in production.
  protected readonly entityName = 'opportunity' as const;

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

  async findByUserId(userId: string): Promise<Opportunity[]> {
    const rows = await this.baseQuery()
      .where(eq(this.table['userId'], userId)).orderBy(desc(this.table['createdAt']));
    return rows as Opportunity[];
  }

  // findByStage REMOVED in the EAV flip — `stage`/`amount` are no longer
  // columns. "Find by stage" is now a query-surface concern:
  //   repo.search({ filter: { on: 'StageName', op: 'eq', value: 'Negotiation/Review' } })

  async findByExternalId(externalId: string): Promise<Opportunity | null> {
    const rows = await this.baseQuery()
      .where(eq(this.table['externalId'], externalId))
      .limit(1);
    return (rows[0] as Opportunity) ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FK traversal methods (from belongs_to relationships — CGP-358b)
  // Called by service-layer composition methods on the inverse (has_many) side.
  // ═══════════════════════════════════════════════════════════════════════

  async findByAccountId(id: string, opts?: { cursor?: string; limit?: number }): Promise<Opportunity[]> {
    let q = this.baseQuery().where(eq(this.table['accountId'], id));
    if (opts?.limit) q = (q as any).limit(opts.limit);
    return (await q) as Opportunity[];
  }

  // Inherited from SyncedEntityRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
  //   findByExternalId, findAllByUserId, findVisibleByUserId, syncUpsert
}
