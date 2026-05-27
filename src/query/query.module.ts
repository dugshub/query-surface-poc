// QueryModule — provides QueryApplicationService globally.
//
// @Global() so any use-case / service / adapter can inject the query surface
// without importing this module explicitly. The service only needs the DRIZZLE
// client (from DatabaseModule); it is entity-agnostic and discovers models via
// the introspected registry.

import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../shared/database/database.module';
import { QueryApplicationService } from './query.application-service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [QueryApplicationService],
  exports: [QueryApplicationService],
})
export class QueryModule {}
