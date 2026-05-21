// QueryModule — wires the FilterCompilerService globally + the two controllers.
//
// @Global() so BaseRepository can resolve FILTER_COMPILER from any module's
// DI scope without each module importing QueryModule explicitly. The
// controllers inject the 5 generated entity services and dispatch per
// entity-name in multi-entity requests.

import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../shared/database/database.module';
import { FILTER_COMPILER } from '../shared/constants/tokens';
import { AccountsModule } from '../modules/accounts/accounts.module';
import { ContactsModule } from '../modules/contacts/contacts.module';
import { EmailsModule } from '../modules/emails/emails.module';
import { OpportunitiesModule } from '../modules/opportunities/opportunities.module';
import { TranscriptsModule } from '../modules/transcripts/transcripts.module';

import { FilterCompilerService } from './filter-compiler.service';
import { FetchController } from './fetch.controller';
import { SearchController } from './search.controller';

@Global()
@Module({
  imports: [
    DatabaseModule,
    // Pull in entity modules so their services are visible to our controllers.
    // (Each module exports its service per ADR-002; the repos are infrastructure
    // detail and stay private to the module.)
    AccountsModule,
    ContactsModule,
    EmailsModule,
    OpportunitiesModule,
    TranscriptsModule,
  ],
  controllers: [SearchController, FetchController],
  providers: [
    FilterCompilerService,
    // Bind the FILTER_COMPILER token to the concrete service so BaseRepository's
    // property injection (@Inject(FILTER_COMPILER)) resolves.
    { provide: FILTER_COMPILER, useExisting: FilterCompilerService },
  ],
  exports: [FILTER_COMPILER, FilterCompilerService],
})
export class QueryModule {}
