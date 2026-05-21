import { Injectable, NotFoundException } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';
import type { Transcript } from '../transcript.entity';

@Injectable()
export class FindTranscriptByIdUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(id: string): Promise<Transcript> {
    const entity = await this.service.findById(id);
    if (entity === null || entity === undefined) {
      throw new NotFoundException(`Transcript not found: ${id}`);
    }
    return entity;
  }
}
