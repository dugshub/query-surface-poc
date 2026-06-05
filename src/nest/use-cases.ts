import { Injectable } from '@nestjs/common';
import type { EntityCatalog } from '../query/catalog';
import type {
  FetchOptions,
  QueryOptions,
} from '../query/query.application-service';
import { translateEngineErrors, UnknownEntityError } from './errors';
import { QuerySurfaceService } from './query-surface.service';

/**
 * INTERNAL external-call-path use-cases — deliberately NOT exported from the
 * package barrel. Every protocol presentation the package ships (REST router
 * today, MCP projection later) goes through these, so call-path policy lives
 * exactly once: typed-error translation now; request-level validation and the
 * Phase-1 attribution envelope (source refs on every result) attach here.
 *
 * Hosts integrating querying into their OWN use-cases inject
 * `QuerySurfaceService` instead — that is the supported composition point.
 *
 * Identity is protocol-ignorant by construction: these take ONLY the request
 * payload (entity, filter, ids). No requester parameter exists to pass — the
 * service resolves the host-injected `getRequester()` per call, and the
 * boundary (REST interceptor / MCP handler / worker) is the only place that
 * enters a context. A presentation literally cannot smuggle identity through.
 */

@Injectable()
export class DescribeUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  all(): Promise<EntityCatalog[]> {
    return translateEngineErrors(() => this.querySurface.describe());
  }

  async one(entity: string): Promise<EntityCatalog> {
    const catalog = await translateEngineErrors(() =>
      this.querySurface.describe(entity),
    );
    if (!catalog) throw new UnknownEntityError(entity);
    return catalog;
  }
}

@Injectable()
export class SearchUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  execute(entity: string, opts: QueryOptions = {}) {
    // Phase 1: the attribution envelope (source refs per result row) wraps
    // the engine result here — once, for every protocol.
    return translateEngineErrors(() => this.querySurface.query(entity, opts));
  }
}

@Injectable()
export class FetchUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  execute(entity: string, ids: string[], opts: FetchOptions = {}) {
    return translateEngineErrors(() =>
      this.querySurface.fetch(entity, ids, opts),
    );
  }
}
