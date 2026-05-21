import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';

import { AccountRepository } from './account.repository';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateAccountSchema } from './dto/create-account.dto';
import { UpdateAccountSchema } from './dto/update-account.dto';
import { AccountOutputSchema } from './dto/account-output.dto';
import { FindAccountByIdUseCase } from './use-cases/find-account-by-id.use-case';
import { ListAccountsUseCase } from './use-cases/list-accounts.use-case';
import { CreateAccountUseCase } from './use-cases/create-account.use-case';
import { UpdateAccountUseCase } from './use-cases/update-account.use-case';
import { DeleteAccountUseCase } from './use-cases/delete-account.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
  ],
  controllers: [AccountController],
  providers: [
    AccountRepository,
    AccountService,
    FindAccountByIdUseCase,
    ListAccountsUseCase,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    ...declarativeQueryClasses,
  ],
  exports: [AccountService],  // Only service is exported (ADR-002)
})
export class AccountsModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateAccountDto', CreateAccountSchema);
    this.openApi.registerSchema('UpdateAccountDto', UpdateAccountSchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('AccountOutputDto', AccountOutputSchema);
  }
}
