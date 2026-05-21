import { Injectable } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';
import type { Transcript } from '../transcript.entity';

@Injectable()
export class ListTranscriptsUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(): Promise<Transcript[]> {
    return this.service.list();
  }
}
