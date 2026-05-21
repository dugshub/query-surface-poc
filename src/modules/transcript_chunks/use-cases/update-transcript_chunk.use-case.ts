import { Injectable } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';
import type { UpdateTranscriptChunkDto } from '../dto/update-transcript_chunk.dto';
import type { TranscriptChunk } from '../transcript_chunk.entity';

@Injectable()
export class UpdateTranscriptChunkUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(
    id: string,
    dto: UpdateTranscriptChunkDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<TranscriptChunk | null> {
    return this.service.update(id, dto);
  }
}
