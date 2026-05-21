/**
 * Declarative Query Use Cases for TranscriptChunk
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';
import type { TranscriptChunk } from '../transcript_chunk.entity';

@Injectable()
export class FindTranscriptChunkByTranscriptIdUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(transcriptId: string): Promise<TranscriptChunk[]> {
    return this.service.findByTranscriptId(transcriptId);
  }
}

export const declarativeQueryClasses = [
  FindTranscriptChunkByTranscriptIdUseCase,
];
