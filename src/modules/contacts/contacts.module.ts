import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { OPENAPI_REGISTRY, type OpenApiRegistry } from '@shared/openapi';
import { DatabaseModule } from '@shared/database/database.module';
import { AccountRepository } from '../accounts/account.repository';

import { ContactRepository } from './contact.repository';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
// OPENAPI-2: Zod schemas registered with OpenApiRegistry at module init.
import { CreateContactSchema } from './dto/create-contact.dto';
import { UpdateContactSchema } from './dto/update-contact.dto';
import { ContactOutputSchema } from './dto/contact-output.dto';
import { FindContactByIdUseCase } from './use-cases/find-contact-by-id.use-case';
import { ListContactsUseCase } from './use-cases/list-contacts.use-case';
import { CreateContactUseCase } from './use-cases/create-contact.use-case';
import { UpdateContactUseCase } from './use-cases/update-contact.use-case';
import { DeleteContactUseCase } from './use-cases/delete-contact.use-case';
import { declarativeQueryClasses } from './use-cases/declarative-queries';

@Module({
  imports: [
    DatabaseModule,
    // TODO: Add subsystem modules as needed (EventsSubsystemModule, IntegrationsSubsystemModule, etc.)
    // Cross-domain modules from relationships:
    // AccountsModule,
  ],
  controllers: [ContactController],
  providers: [
    ContactRepository,
    ContactService,
    AccountRepository,
    FindContactByIdUseCase,
    ListContactsUseCase,
    CreateContactUseCase,
    UpdateContactUseCase,
    DeleteContactUseCase,
    ...declarativeQueryClasses,
  ],
  exports: [ContactService],  // Only service is exported (ADR-002)
})
export class ContactsModule implements OnModuleInit {
  // OPENAPI-2: register this entity's Zod schemas with the shared
  // OpenApiRegistry at module init. OPENAPI-4 awaits `build()` at boot
  // to emit the full /docs-json document.
  constructor(
    @Inject(OPENAPI_REGISTRY) private readonly openApi: OpenApiRegistry,
  ) {}

  onModuleInit(): void {
    this.openApi.registerSchema('CreateContactDto', CreateContactSchema);
    this.openApi.registerSchema('UpdateContactDto', UpdateContactSchema);
    // CLP pipeline names the response schema <Entity>OutputDto (matches
    // classNames.outputDto); the OPENAPI-2 spec sketch uses "ResponseDto"
    // but existing CLP code already publishes OutputDto everywhere, so we
    // keep consistency. OPENAPI-3 decorators reference the same name.
    this.openApi.registerSchema('ContactOutputDto', ContactOutputSchema);
  }
}
