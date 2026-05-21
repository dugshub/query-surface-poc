import { Injectable, NotFoundException } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';
import type { TranscriptChunk } from '../transcript_chunk.entity';

@Injectable()
export class FindTranscriptChunkByIdUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(id: string): Promise<TranscriptChunk> {
    const entity = await this.service.findById(id);
    if (entity === null || entity === undefined) {
      throw new NotFoundException(`TranscriptChunk not found: ${id}`);
    }
    return entity;
  }
}
