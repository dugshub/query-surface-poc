import { Injectable } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';
import type { CreateTranscriptChunkDto } from '../dto/create-transcript_chunk.dto';
import type { TranscriptChunk } from '../transcript_chunk.entity';

@Injectable()
export class CreateTranscriptChunkUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(
    dto: CreateTranscriptChunkDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<TranscriptChunk> {
    return this.service.create(dto);
  }
}
