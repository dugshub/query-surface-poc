import { Injectable } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';
import type { UpdateTranscriptDto } from '../dto/update-transcript.dto';
import type { Transcript } from '../transcript.entity';

@Injectable()
export class UpdateTranscriptUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(
    id: string,
    dto: UpdateTranscriptDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Transcript | null> {
    return this.service.update(id, dto);
  }
}
