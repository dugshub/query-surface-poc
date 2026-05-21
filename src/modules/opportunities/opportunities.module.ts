import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';
import { AccountRepository } from '../accounts/account.repository';

import { OpportunityRepository } from './opportunity.repository';
import { OpportunityService } from './opportunity.service';
import { OpportunityController } from './opportunity.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateOpportunitySchema } from './dto/create-opportunity.dto';
import { UpdateOpportunitySchema } from './dto/update-opportunity.dto';
import { OpportunityOutputSchema } from './dto/opportunity-output.dto';
import { FindOpportunityByIdUseCase } from './use-cases/find-opportunity-by-id.use-case';
import { ListOpportunitiesUseCase } from './use-cases/list-opportunities.use-case';
import { CreateOpportunityUseCase } from './use-cases/create-opportunity.use-case';
import { UpdateOpportunityUseCase } from './use-cases/update-opportunity.use-case';
import { DeleteOpportunityUseCase } from './use-cases/delete-opportunity.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
    // AccountsModule,
  ],
  controllers: [OpportunityController],
  providers: [
    OpportunityRepository,
    OpportunityService,
    AccountRepository,
    FindOpportunityByIdUseCase,
    ListOpportunitiesUseCase,
    CreateOpportunityUseCase,
    UpdateOpportunityUseCase,
    DeleteOpportunityUseCase,
    ...declarativeQueryClasses,
  ],
  exports: [OpportunityService],  // Only service is exported (ADR-002)
})
export class OpportunitiesModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateOpportunityDto', CreateOpportunitySchema);
    this.openApi.registerSchema('UpdateOpportunityDto', UpdateOpportunitySchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('OpportunityOutputDto', OpportunityOutputSchema);
  }
}
