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

export interface ListPage {
  limit?: number;
  offset?: number;
}

export interface ListSort {
  field: string;
  dir: 'asc' | 'desc';
}

/**
 * Convenience list: search (scoped ids + total) composed with fetch (full
 * rows) — partner-DX surface over the same two primitives, so scope and EAV
 * behavior are identical to the generic path by construction.
 */
@Injectable()
export class ListUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  async execute(entity: string, page: ListPage = {}, sort?: ListSort) {
    const found = await translateEngineErrors(() =>
      this.querySurface.query(entity, {
        page,
        ...(sort ? { sort: [sort] } : {}),
      }),
    );
    if (found.ids.length === 0) {
      return { entity, rows: [], count: 0, total: found.total, has_more: found.has_more };
    }
    const fetched = await translateEngineErrors(() =>
      this.querySurface.fetch(entity, found.ids),
    );
    return {
      entity,
      rows: fetched.rows,
      count: fetched.count,
      total: found.total,
      has_more: found.has_more,
    };
  }
}

/**
 * Convenience by-id. Returns null for both "doesn't exist" and "exists but
 * out of scope" — no existence oracle; the presentation maps null to 404.
 */
@Injectable()
export class GetByIdUseCase {
  constructor(private readonly querySurface: QuerySurfaceService) {}

  async execute(entity: string, id: string) {
    const fetched = await translateEngineErrors(() =>
      this.querySurface.fetch(entity, [id]),
    );
    return fetched.rows[0] ?? null;
  }
}
