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

  /** Full-row query (legacy / debug). Returns hydrated rows in one call. */
  async run(req: DomainQueryRequest): Promise<DomainQueryResult> {
    return runQuery(this.db, req);
  }

  /** IDs-first search. Returns IDs + total + optional preview. Cheap. */
  async search(
    query: SingleSearchQuery,
    opts: { preview?: boolean; include_sql?: boolean } = {},
  ): Promise<SearchEntityResult> {
    return runSearch(this.db, query, opts);
  }

  /** Multi-entity parallel search — each entity gets its own filter expression. */
  async searchMulti(
    queries: SingleSearchQuery[],
    opts: { preview?: boolean; include_sql?: boolean } = {},
  ) {
    return runSearchMulti(this.db, queries, opts);
  }

  /** Hydrate a set of IDs into full rows, with optional refinement filter. */
  async fetch(req: FetchRequest): Promise<FetchResponse> {
    return runFetch(this.db, req);
  }
}
