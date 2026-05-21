import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';
import { OpportunityRepository } from '../opportunities/opportunity.repository';

import { TranscriptRepository } from './transcript.repository';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateTranscriptSchema } from './dto/create-transcript.dto';
import { UpdateTranscriptSchema } from './dto/update-transcript.dto';
import { TranscriptOutputSchema } from './dto/transcript-output.dto';
import { FindTranscriptByIdUseCase } from './use-cases/find-transcript-by-id.use-case';
import { ListTranscriptsUseCase } from './use-cases/list-transcripts.use-case';
import { CreateTranscriptUseCase } from './use-cases/create-transcript.use-case';
import { UpdateTranscriptUseCase } from './use-cases/update-transcript.use-case';
import { DeleteTranscriptUseCase } from './use-cases/delete-transcript.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';
import { SearchTranscriptsUseCase } from './use-cases/search-transcripts.use-case';
import { TranscriptSearchController } from './transcript-search.controller';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
    // OpportunitysModule,
  ],
  controllers: [TranscriptController, TranscriptSearchController],
  providers: [
    TranscriptRepository,
    TranscriptService,
    OpportunityRepository,
    FindTranscriptByIdUseCase,
    ListTranscriptsUseCase,
    CreateTranscriptUseCase,
    UpdateTranscriptUseCase,
    DeleteTranscriptUseCase,
    ...declarativeQueryClasses,
    SearchTranscriptsUseCase,
  ],
  exports: [TranscriptService],  // Only service is exported (ADR-002)
})
export class TranscriptsModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateTranscriptDto', CreateTranscriptSchema);
    this.openApi.registerSchema('UpdateTranscriptDto', UpdateTranscriptSchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('TranscriptOutputDto', TranscriptOutputSchema);
  }
}
