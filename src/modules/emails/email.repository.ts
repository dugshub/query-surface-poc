import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { ActivityEntityRepository } from '@shared/base-classes/activity-entity-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { emails, type Email } from './email.entity';

@Injectable()
export class EmailRepository extends ActivityEntityRepository<Email> {
  readonly table = emails;
  // POC ADDITION: codegen would emit this from entity.name in production.
  protected readonly entityName = 'email' as const;

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

  async findByUserId(userId: string): Promise<Email[]> {
    const rows = await this.baseQuery()
      .where(eq(this.table['userId'], userId)).orderBy(desc(this.table['occurredAt']));
    return rows as Email[];
  }

  async findByDirectionAndOpportunityId(direction: 'inbound' | 'outbound', opportunityId: string): Promise<Email[]> {
    const rows = await this.baseQuery()
      .where(and(eq(this.table['direction'], direction), eq(this.table['opportunityId'], opportunityId))).orderBy(desc(this.table['occurredAt']));
    return rows as Email[];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FK traversal methods (from belongs_to relationships — CGP-358b)
  // Called by service-layer composition methods on the inverse (has_many) side.
  // ═══════════════════════════════════════════════════════════════════════

  async findByOpportunityId(id: string, opts?: { cursor?: string; limit?: number }): Promise<Email[]> {
    let q = this.baseQuery().where(eq(this.table['opportunityId'], id));
    if (opts?.limit) q = (q as any).limit(opts.limit);
    return (await q) as Email[];
  }

  // Inherited from ActivityEntityRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
  //   findByDateRange, findByUserId, findByOpportunityId, findRecentByOpportunityId
}
