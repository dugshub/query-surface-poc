import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { QueryModule } from './query/query.module';
import { salesEntities } from './sales-entities';

/**
 * AppModule — example wiring for the query surface.
 *
 * DatabaseModule (@Global) provides the DRIZZLE client; QueryModule.forRoot()
 * registers the consumer's entities and provides QueryApplicationService. The
 * sales-coach entity set is the example consumer registration.
 */
@Module({
  imports: [DatabaseModule, QueryModule.forRoot(salesEntities)],
})
export class AppModule {}
