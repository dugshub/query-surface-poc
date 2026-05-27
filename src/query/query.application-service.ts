// QueryApplicationService — the single composition point for the semantic query
// surface. Consumer-agnostic: an LLM tool, a REST controller, a frontend
// filter-builder, or a use-case all inject this one service and call the same
// three primitives. No transport, no per-entity indirection.
//
//   describe(entity?) → the typed field catalog (queryable fields per model,
//                       assembled from EAV ⊕ Drizzle introspection)
//   query(entity,…)   → find IDs (+ optional preview) matching a FilterExpression
//   fetch(entity,…)   → hydrate IDs into full rows (+ refinement filter / expand)
//
// The pure logic lives underneath (catalog.ts, compiler.ts, service.ts runners);
// this class composes it and owns the actor-scoped EAV context (loaded once,
// cached). See docs/field-catalog-design.md.

import { Inject, Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from '../shared/constants/tokens';
import { registry } from '../generated/query-registry';
import { buildEntityCatalog, type EntityCatalog } from './catalog';
import { loadFieldMaps, POC_ACTOR_USER_ID, type EavContext } from './eav/field-map';
import { runFetch, runSearch } from './engine/runners';
import type {
  EntityName,
  FetchResponse,
  FilterExpression,
  SearchEntityResult,
  Sort,
} from './types';

export interface QueryOptions {
  filter?: FilterExpression;
  sort?: Sort[];
  page?: { limit?: number; offset?: number };
  preview?: boolean;
  include_sql?: boolean;
}

export interface FetchOptions {
  filter?: FilterExpression;
  expand?: string[];
  include_sql?: boolean;
}

@Injectable()
export class QueryApplicationService {
  constructor(
    @Inject(DRIZZLE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
  ) {}

  // Actor-scoped EAV field maps — loaded once, cached for process lifetime.
  // POC: a single tenant (POC_ACTOR_USER_ID). A real consumer resolves the
  // actor per request and keys the cache accordingly — see field-map.ts.
  private eavPromise?: Promise<EavContext>;
  private eav(): Promise<EavContext> {
    if (!this.eavPromise) this.eavPromise = loadFieldMaps(this.db, POC_ACTOR_USER_ID);
    return this.eavPromise;
  }

  /** Drop the cached actor EAV context. Call after reconfiguring the registry at runtime. */
  resetCache(): void {
    this.eavPromise = undefined;
  }

  /** Typed field catalog for one entity, or all registered entities. */
  async describe(entity: EntityName): Promise<EntityCatalog>;
  async describe(): Promise<EntityCatalog[]>;
  async describe(entity?: EntityName): Promise<EntityCatalog | EntityCatalog[]> {
    const eav = await this.eav();
    if (entity) return buildEntityCatalog(entity, eav.fieldMaps[entity]);
    return (Object.keys(registry) as EntityName[]).map((e) =>
      buildEntityCatalog(e, eav.fieldMaps[e]),
    );
  }

  /** Find IDs (+ optional preview rows) matching a filter. */
  async query(entity: EntityName, opts: QueryOptions = {}): Promise<SearchEntityResult> {
    const eav = await this.eav();
    return runSearch(
      this.db,
      { entity, filter: opts.filter, sort: opts.sort, page: opts.page },
      { preview: opts.preview, include_sql: opts.include_sql },
      eav,
    );
  }

  /** Hydrate IDs into full rows, with optional refinement filter + relational expand. */
  async fetch(entity: EntityName, ids: string[], opts: FetchOptions = {}): Promise<FetchResponse> {
    const eav = await this.eav();
    return runFetch(
      this.db,
      { entity, ids, filter: opts.filter, expand: opts.expand, include_sql: opts.include_sql },
      eav,
    );
  }
}
