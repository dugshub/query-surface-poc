/**
 * Declarative Query Use Cases for Transcript
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { TranscriptService } from '../transcript.service';
import type { Transcript } from '../transcript.entity';

@Injectable()
export class FindTranscriptByOpportunityIdUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(opportunityId: string): Promise<Transcript[]> {
    return this.service.findByOpportunityId(opportunityId);
  }
}

@Injectable()
export class FindTranscriptByUserIdUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(userId: string): Promise<Transcript[]> {
    return this.service.findByUserId(userId);
  }
}

@Injectable()
export class FindTranscriptBySourceAndOpportunityIdUseCase {
  constructor(private readonly service: TranscriptService) {}

  async execute(source: 'zoom' | 'google_meet' | 'manual' | 'gong' | 'granola' | 'fathom', opportunityId: string): Promise<Transcript[]> {
    return this.service.findBySourceAndOpportunityId(source, opportunityId);
  }
}

export const declarativeQueryClasses = [
  FindTranscriptByOpportunityIdUseCase,
  FindTranscriptByUserIdUseCase,
  FindTranscriptBySourceAndOpportunityIdUseCase,
];
