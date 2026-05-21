import { Injectable } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';
import type { TranscriptChunk } from '../transcript_chunk.entity';

@Injectable()
export class ListTranscriptChunksUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(): Promise<TranscriptChunk[]> {
    return this.service.list();
  }
}
