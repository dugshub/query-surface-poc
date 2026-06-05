import { Module } from '@nestjs/common';
import { QuerySurfaceModule } from '../query-surface.module';
import {
  DescribeUseCase,
  FetchUseCase,
  GetByIdUseCase,
  ListUseCase,
  SearchUseCase,
} from '../use-cases';
import { EntityConvenienceController } from './entity-convenience.controller';
import { QueryController } from './query.controller';
import { QuerySurfaceAuthGuard } from './query-surface-auth.guard';

/**
 * Package-owned REST presentation. A host mounts it by importing this module
 * wherever its public API lives, with three bindings visible to the injector
 * (typically via a @Global host module):
 *
 *   - QUERY_SURFACE_DRIZZLE / QUERY_SURFACE_OPTIONS (the core seams)
 *   - QUERY_SURFACE_AUTH_GUARD → the host's real guard (e.g. an API-key guard)
 *
 * Plus host-side document assembly: register QUERY_SURFACE_OPENAPI_SCHEMAS
 * into the host's OpenAPI registry and include this module in its Swagger
 * document scan.
 *
 * The use-cases providers here are package-INTERNAL (not exported from the
 * barrel) — external call-path policy stays in one place, shared with the
 * future MCP projection.
 */
@Module({
  imports: [QuerySurfaceModule],
  // Order matters: QueryController's static 'query/...' routes must register
  // before EntityConvenienceController's ':entity/:id' pattern, which would
  // otherwise capture 'query/describe'.
  controllers: [QueryController, EntityConvenienceController],
  providers: [
    QuerySurfaceAuthGuard,
    DescribeUseCase,
    SearchUseCase,
    FetchUseCase,
    ListUseCase,
    GetByIdUseCase,
  ],
})
export class QuerySurfaceRestModule {}
