import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';
import { OpportunityRepository } from '../opportunities/opportunity.repository';

import { EmailRepository } from './email.repository';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateEmailSchema } from './dto/create-email.dto';
import { UpdateEmailSchema } from './dto/update-email.dto';
import { EmailOutputSchema } from './dto/email-output.dto';
import { FindEmailByIdUseCase } from './use-cases/find-email-by-id.use-case';
import { ListEmailsUseCase } from './use-cases/list-emails.use-case';
import { CreateEmailUseCase } from './use-cases/create-email.use-case';
import { UpdateEmailUseCase } from './use-cases/update-email.use-case';
import { DeleteEmailUseCase } from './use-cases/delete-email.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';
import { SearchEmailsUseCase } from './use-cases/search-emails.use-case';
import { EmailSearchController } from './email-search.controller';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
    // OpportunitysModule,
  ],
  controllers: [EmailController, EmailSearchController],
  providers: [
    EmailRepository,
    EmailService,
    OpportunityRepository,
    FindEmailByIdUseCase,
    ListEmailsUseCase,
    CreateEmailUseCase,
    UpdateEmailUseCase,
    DeleteEmailUseCase,
    ...declarativeQueryClasses,
    SearchEmailsUseCase,
  ],
  exports: [EmailService],  // Only service is exported (ADR-002)
})
export class EmailsModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateEmailDto', CreateEmailSchema);
    this.openApi.registerSchema('UpdateEmailDto', UpdateEmailSchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('EmailOutputDto', EmailOutputSchema);
  }
}
