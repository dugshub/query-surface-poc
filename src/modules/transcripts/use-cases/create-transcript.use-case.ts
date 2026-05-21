import { Injectable } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';
import type { CreateTranscriptDto } from '../dto/create-transcript.dto';
import type { Transcript } from '../transcript.entity';

@Injectable()
export class CreateTranscriptUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(
    dto: CreateTranscriptDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Transcript> {
    return this.service.create(dto);
  }
}
