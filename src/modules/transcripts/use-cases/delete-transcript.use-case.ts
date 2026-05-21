import { Injectable } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';

@Injectable()
export class DeleteTranscriptUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(
    id: string,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<void> {
    return this.service.delete(id);
  }
}
