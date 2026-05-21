import { Injectable } from '@nestjs/common';
import { TranscriptChunkService } from '../transcript_chunk.service';

@Injectable()
export class DeleteTranscriptChunkUseCase {
  constructor(private readonly service: TranscriptChunkService) {}

  async execute(
    id: string,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<void> {
    return this.service.delete(id);
  }
}
