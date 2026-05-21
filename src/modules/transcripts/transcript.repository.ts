import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { ActivityEntityRepository } from '@shared/base-classes/activity-entity-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { transcripts, type Transcript } from './transcript.entity';

@Injectable()
export class TranscriptRepository extends ActivityEntityRepository<Transcript> {
  readonly table = transcripts;

  // Behaviors declared in YAML -> generated as config object
  protected override readonly behaviors: BehaviorConfig = {
    timestamps: true,
    softDelete: true,
    userTracking: false,
  };

  constructor(@Inject(DRIZZLE) db: DrizzleClient) {
    super(db);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Declarative queries (from queries: block in entity YAML)
  // ═══════════════════════════════════════════════════════════════════════

  async findByUserId(userId: string): Promise<Transcript[]> {
    const rows = await this.baseQuery()
      .where(eq(this.table['userId'], userId)).orderBy(desc(this.table['occurredAt']));
    return rows as Transcript[];
  }

  async findBySourceAndOpportunityId(source: 'zoom' | 'google_meet' | 'manual' | 'gong' | 'granola', opportunityId: string): Promise<Transcript[]> {
    const rows = await this.baseQuery()
      .where(and(eq(this.table['source'], source), eq(this.table['opportunityId'], opportunityId))).orderBy(desc(this.table['occurredAt']));
    return rows as Transcript[];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FK traversal methods (from belongs_to relationships — CGP-358b)
  // Called by service-layer composition methods on the inverse (has_many) side.
  // ═══════════════════════════════════════════════════════════════════════

  async findByOpportunityId(id: string, opts?: { cursor?: string; limit?: number }): Promise<Transcript[]> {
    let q = this.baseQuery().where(eq(this.table['opportunityId'], id));
    if (opts?.limit) q = (q as any).limit(opts.limit);
    return (await q) as Transcript[];
  }

  // Inherited from ActivityEntityRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
  //   findByDateRange, findByUserId, findByOpportunityId, findRecentByOpportunityId
}
