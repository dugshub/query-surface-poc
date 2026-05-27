// FilterCompilerService — NestJS-injectable facade over the pure compiler.
//
// This is the @Injectable surface that BaseRepository injects (via property
// injection on the FILTER_COMPILER token). Every generated repository's
// query()/search()/fetch() methods delegate here.
//
// The service is intentionally thin: it holds the Drizzle client and routes
// to the runQuery/runSearch/runFetch functions in service.ts. The compiler
// itself (compiler.ts) remains a pure function — the service is just the DI
// integration point.

import { Inject, Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from '../shared/constants/tokens';
import { loadFieldMaps, POC_ACTOR_USER_ID, type EavContext } from './field-map';
import { runFetch, runQuery, runSearch, runSearchMulti } from './service';
import type {
  DomainQueryRequest,
  DomainQueryResult,
  FetchRequest,
  FetchResponse,
  SearchEntityResult,
  SingleSearchQuery,
} from './types';

@Injectable()
export class FilterCompilerService {
  constructor(
    @Inject(DRIZZLE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
  ) {}

  // Actor-scoped EAV field maps, loaded once (cached) and shared by every call.
  // POC: a single tenant (POC_ACTOR_USER_ID). A real consumer would resolve the
  // actor per request and key the cache accordingly — see field-map.ts.
  private eavPromise?: Promise<EavContext>;

  private eav(): Promise<EavContext> {
    if (!this.eavPromise) {
      this.eavPromise = loadFieldMaps(this.db, POC_ACTOR_USER_ID);
    }
    return this.eavPromise;
  }

  /**
   * Actor-scoped EAV field maps — exposed so query_describe can fold EAV fields
   * into the entity schemas (the agent discovers StageName/Amount/etc. as
   * ordinary fields). Same cached load as the search/fetch path.
   */
  fieldMaps(): Promise<EavContext> {
    return this.eav();
  }

  /** Full-row query (legacy / debug). Returns hydrated rows in one call. */
  async run(req: DomainQueryRequest): Promise<DomainQueryResult> {
    return runQuery(this.db, req, await this.eav());
  }

  /** IDs-first search. Returns IDs + total + optional preview. Cheap. */
  async search(
    query: SingleSearchQuery,
    opts: { preview?: boolean; include_sql?: boolean } = {},
  ): Promise<SearchEntityResult> {
    return runSearch(this.db, query, opts, await this.eav());
  }

  /** Multi-entity parallel search — each entity gets its own filter expression. */
  async searchMulti(
    queries: SingleSearchQuery[],
    opts: { preview?: boolean; include_sql?: boolean } = {},
  ) {
    return runSearchMulti(this.db, queries, opts, await this.eav());
  }

  /** Hydrate a set of IDs into full rows, with optional refinement filter. */
  async fetch(req: FetchRequest): Promise<FetchResponse> {
    return runFetch(this.db, req, await this.eav());
  }
}
