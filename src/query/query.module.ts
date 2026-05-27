// QueryModule — registers the consumer's entities and provides the query surface.
//
// The package ships no entities; the consumer supplies them at bootstrap:
//   imports: [DatabaseModule, QueryModule.forRoot(myEntities)]
// DatabaseModule (consumer-provided, @Global) supplies the DRIZZLE token that
// QueryApplicationService injects.

import { Module, type DynamicModule } from '@nestjs/common';

import { QueryApplicationService } from './query.application-service';
import { configureQueryRegistry, type EntityRegistration } from './registry';

@Module({})
export class QueryModule {
  /** Register entities + provide QueryApplicationService globally. Call once in the root module. */
  static forRoot(entities: readonly EntityRegistration[]): DynamicModule {
    configureQueryRegistry(entities);
    return {
      module: QueryModule,
      global: true,
      providers: [QueryApplicationService],
      exports: [QueryApplicationService],
    };
  }
}
