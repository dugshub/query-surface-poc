import { Injectable, Inject, Optional } from '@nestjs/common';
import { WithAnalytics } from '@shared/base-classes/with-analytics';
import { EVENT_BUS } from '@shared/constants/tokens';
import { BaseService } from '@shared/base-classes/base-service';
import { TranscriptChunkRepository } from './transcript_chunk.repository';
import type { TranscriptChunk } from './transcript_chunk.entity';
import { TranscriptRepository } from '../transcripts/transcript.repository';
import type { Transcript } from '../transcripts/transcript.entity';

@Injectable()
export class TranscriptChunkService extends WithAnalytics(
  BaseService<TranscriptChunkRepository, TranscriptChunk>,
) {
  protected override readonly entityName = 'transcript_chunk';

  /** Injected by NestJS when EventsModule is registered. */
  @Optional() @Inject(EVENT_BUS)
  protected override eventBus: any = undefined;

  constructor(
    protected override readonly repository: TranscriptChunkRepository,
    private readonly transcriptRepo: TranscriptRepository,
  ) {
    super(repository);
  }

  // Lifecycle events (created/updated/deleted + per-field changes) are emitted
  // automatically by BaseService when the events subsystem is installed.
  //
  // Inherited from BaseService:
  //   findById, findByIds, list, count, exists, create, update, delete

  // ═══════════════════════════════════════════════════════════════════════
  // Declarative queries (from queries: block in entity YAML)
  // Pass-through to repository — keeps use-cases on the service layer so
  // cross-cutting concerns (analytics, events) stay uniform.
  // ═══════════════════════════════════════════════════════════════════════

  async findByTranscriptId(transcriptId: string): Promise<TranscriptChunk[]> {
    return this.repository.findByTranscriptId(transcriptId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Relationship composition methods (CGP-358b / CGP-62)
  // Two queries, no SQL JOIN. Core-contract path; relations() const stays
  // as opt-in extension for hand-written Drizzle queries.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch the Transcript parent for this TranscriptChunk.
   * Two repo calls: find self by id → find target by FK.
   */
  async transcript(transcriptChunkId: string): Promise<Transcript | null> {
    const entity = await this.repository.findById(transcriptChunkId);
    if (!entity) return null;
    return entity.transcriptId ? this.transcriptRepo.findById(entity.transcriptId) : null;
  }


}
