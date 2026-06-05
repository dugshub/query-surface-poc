/**
 * NestJS presentation seam for the query-surface engine — import as
 * `@repo/query-surface/nest`. Kept out of the package root export so the
 * engine core stays consumable without @nestjs/common installed.
 *
 * Deliberately NOT exported: the internal use-cases (`use-cases.ts`). External
 * callers integrate via a package presentation (REST module here, MCP
 * projection later), which routes through them; hosts composing querying into
 * their own use-cases inject `QuerySurfaceService`.
 */
export { InvalidQueryError, UnknownEntityError } from './errors';
export type {
  QuerySurfaceModuleOptions,
  QuerySurfaceRequester,
} from './options';
export { QuerySurfaceModule } from './query-surface.module';
export { QuerySurfaceService } from './query-surface.service';
export {
  QUERY_SURFACE_OPENAPI_SCHEMAS,
  type QueryFetchRequestDto,
  type QuerySearchRequestDto,
} from './rest/query.dto';
export { QuerySurfaceRestModule } from './rest/query-surface-rest.module';
export {
  QUERY_SURFACE_AUTH_GUARD,
  QUERY_SURFACE_DRIZZLE,
  QUERY_SURFACE_OPTIONS,
} from './tokens';
