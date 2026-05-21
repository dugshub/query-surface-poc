import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';
import { TranscriptRepository } from '../transcripts/transcript.repository';

import { TranscriptChunkRepository } from './transcript_chunk.repository';
import { TranscriptChunkService } from './transcript_chunk.service';
import { TranscriptChunkController } from './transcript_chunk.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateTranscriptChunkSchema } from './dto/create-transcript_chunk.dto';
import { UpdateTranscriptChunkSchema } from './dto/update-transcript_chunk.dto';
import { TranscriptChunkOutputSchema } from './dto/transcript_chunk-output.dto';
import { FindTranscriptChunkByIdUseCase } from './use-cases/find-transcript_chunk-by-id.use-case';
import { ListTranscriptChunksUseCase } from './use-cases/list-transcript_chunks.use-case';
import { CreateTranscriptChunkUseCase } from './use-cases/create-transcript_chunk.use-case';
import { UpdateTranscriptChunkUseCase } from './use-cases/update-transcript_chunk.use-case';
import { DeleteTranscriptChunkUseCase } from './use-cases/delete-transcript_chunk.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';
import { SearchTranscriptChunksUseCase } from './use-cases/search-transcript_chunks.use-case';
import { TranscriptChunkSearchController } from './transcript_chunk-search.controller';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
    // TranscriptsModule,
  ],
  controllers: [TranscriptChunkController, TranscriptChunkSearchController],
  providers: [
    TranscriptChunkRepository,
    TranscriptChunkService,
    TranscriptRepository,
    FindTranscriptChunkByIdUseCase,
    ListTranscriptChunksUseCase,
    CreateTranscriptChunkUseCase,
    UpdateTranscriptChunkUseCase,
    DeleteTranscriptChunkUseCase,
    ...declarativeQueryClasses,
    SearchTranscriptChunksUseCase,
  ],
  exports: [TranscriptChunkService],  // Only service is exported (ADR-002)
})
export class TranscriptChunksModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateTranscriptChunkDto', CreateTranscriptChunkSchema);
    this.openApi.registerSchema('UpdateTranscriptChunkDto', UpdateTranscriptChunkSchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('TranscriptChunkOutputDto', TranscriptChunkOutputSchema);
  }
}
