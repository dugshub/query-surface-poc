import { Injectable } from '@nestjs/common';
import type {
  FetchOptions,
  QueryOptions,
} from '../query/query.application-service';
import { translateEngineErrors, UnknownEntityError } from './errors';
import {
  type PublicEntityCatalog,
  projectCatalog,
  projectRow,
  publicKeySet,
} from './projection';
import { QuerySurfaceService } from './query-surface.service';

/**
 * INTERNAL external-call-path use-cases — deliberately NOT exported from the
 * package barrel. Every protocol presentation the package ships (REST router
 * today, MCP projection later) goes through these, so call-path policy lives
 * exactly once: typed-error translation, and the CONSUMER PROJECTION (lean
 * field shape + native-column allowlist) so the contract never leaks the
 * engine's introspection internals or un-curated columns.
 *
 * Hosts integrating querying into their OWN use-cases inject
 * `QuerySurfaceService` instead — that returns the RAW shape (full columns,
 * all facets); the public projection is external-call-path policy only.
 *
 * Identity is protocol-ignorant by construction: these take ONLY the request
 * payload (entity, filter, ids). The service resolves the host-injected
 * `getRequester()` per call; the boundary is the only place that enters a
 * context.
 */

@Injectable()
export class DescribeUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  all(): Promise<PublicEntityCatalog[]> {
    return translateEngineErrors(async () => {
      const catalogs = await this.querySurface.describe();
      return catalogs.map((c) =>
        projectCatalog(c, this.querySurface.exposeColumns),
      );
    });
  }

  async one(entity: string): Promise<PublicEntityCatalog> {
    const catalog = await translateEngineErrors(() =>
      this.querySurface.describe(entity),
    );
    if (!catalog) throw new UnknownEntityError(entity);
    return projectCatalog(catalog, this.querySurface.exposeColumns);
  }
}

@Injectable()
export class SearchUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  execute(entity: string, opts: QueryOptions = {}) {
    return translateEngineErrors(async () => {
      const result = await this.querySurface.query(entity, opts);
      if (!result.preview || result.preview.length === 0) return result;
      const catalog = await this.querySurface.describe(entity);
      const keys = publicKeySet(catalog, this.querySurface.exposeColumns);
      return { ...result, preview: result.preview.map((r) => projectRow(r, keys)) };
    });
  }
}

@Injectable()
export class FetchUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  execute(entity: string, ids: string[], opts: FetchOptions = {}) {
    return translateEngineErrors(async () => {
      const result = await this.querySurface.fetch(entity, ids, opts);
      const catalog = await this.querySurface.describe(entity);
      const keys = publicKeySet(catalog, this.querySurface.exposeColumns);
      return { ...result, rows: result.rows.map((r) => projectRow(r, keys)) };
    });
  }
}
