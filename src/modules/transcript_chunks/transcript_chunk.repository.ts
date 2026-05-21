import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@shared/constants/tokens';
import type { DrizzleClient } from '@shared/types/drizzle';
import { BaseRepository } from '@shared/base-classes/base-repository';
import type { BehaviorConfig } from '@shared/base-classes/base-repository';
import { transcript_chunks, type TranscriptChunk } from './transcript_chunk.entity';

@Injectable()
export class TranscriptChunkRepository extends BaseRepository<TranscriptChunk> {
  readonly table = transcript_chunks;
  protected readonly entityName = 'transcript_chunk' as const;   // POC: would be codegen-emitted

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

  // ═══════════════════════════════════════════════════════════════════════
  // FK traversal methods (from belongs_to relationships — CGP-358b)
  // Called by service-layer composition methods on the inverse (has_many) side.
  // ═══════════════════════════════════════════════════════════════════════

  async findByTranscriptId(id: string, opts?: { cursor?: string; limit?: number }): Promise<TranscriptChunk[]> {
    let q = this.baseQuery().where(eq(this.table['transcriptId'], id));
    if (opts?.limit) q = (q as any).limit(opts.limit);
    return (await q) as TranscriptChunk[];
  }

  // Inherited from BaseRepository:
  //   findById, findByIds, list, count, exists, create, update, delete, upsertMany
}
