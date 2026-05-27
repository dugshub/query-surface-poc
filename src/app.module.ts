import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { QueryModule } from './query/query.module';

/**
 * AppModule — minimal composition for the query surface.
 *
 * DatabaseModule provides the DRIZZLE client; QueryModule (@Global) provides
 * QueryApplicationService (describe / query / fetch). No HTTP, CRUD, or OpenAPI —
 * this is the library surface plus its example wiring.
 */
@Module({
  imports: [DatabaseModule, QueryModule],
})
export class AppModule {}
