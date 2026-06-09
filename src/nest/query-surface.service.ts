import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { EntityCatalog } from '../query/catalog';
import {
  type FetchOptions,
  QueryApplicationService,
  type QueryOptions,
} from '../query/query.application-service';
import { registerSchema } from '../query/schema-registry';
import type {
  QuerySurfaceModuleOptions,
  QuerySurfaceRequester,
} from './options';
import { QUERY_SURFACE_DRIZZLE, QUERY_SURFACE_OPTIONS } from './tokens';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = NodePgDatabase<any>;

/**
 * Generic read capability over the host's curated entity set: one
 * describe/query/fetch surface for REST, MCP tools, tRPC, or agent runtimes
 * to project.
 *
 * Scoping is AMBIENT: every method obtains the requester via the
 * host-injected `getRequester` (typically the host's ALS reader) and
 * force-injects that requester's tenancy scope + EAV field-map. Callers never
 * pass identity; a missing boundary throws loudly instead of leaking
 * unscoped data. The engine itself stays scope-agnostic (explicit
 * `QueryServiceOptions`) — this service is the ambient adapter in front
 * of it.
 */
@Injectable()
export class QuerySurfaceService implements OnModuleInit {
  // One engine per requester identity: the engine caches the requester's EAV
  // field-map promise, so reuse avoids re-loading field_definitions per call.
  // Bounded by active users × orgs in practice.
  private readonly engines = new Map<string, QueryApplicationService>();

  constructor(
    @Inject(QUERY_SURFACE_DRIZZLE) private readonly db: AnyDb,
    @Inject(QUERY_SURFACE_OPTIONS)
    private readonly options: QuerySurfaceModuleOptions,
  ) {}

  /** Host's native-column allowlist; consumed by the public use-cases' projection. */
  get exposeColumns(): QuerySurfaceModuleOptions['exposeColumns'] {
    return this.options.exposeColumns;
  }

  onModuleInit(): void {
    // Register the host's curated tables + relations + EAV overlay into the
    // surface once at startup (introspection-derived).
    registerSchema(this.options.schema as never, {
      ...(this.options.eav ? { eav: this.options.eav } : {}),
    });
  }

  private engine(): QueryApplicationService {
    const requester = this.options.getRequester();
    const key = this.engineKey(requester);
    const cached = this.engines.get(key);
    if (cached) return cached;

    const engine = new QueryApplicationService(this.db, {
      actorUserId: requester.userId,
      ...(requester.organizationId
        ? { actorOrganizationId: requester.organizationId }
        : {}),
      scope: this.options.scopeFor(requester),
    });
    this.engines.set(key, engine);
    return engine;
  }

  private engineKey(requester: QuerySurfaceRequester): string {
    return `${requester.userId}|${requester.organizationId ?? ''}`;
  }

  /** Typed field catalog (incl. the requester's EAV virtual columns). */
  describe(): Promise<EntityCatalog[]>;
  describe(entity: string): Promise<EntityCatalog>;
  describe(entity?: string): Promise<EntityCatalog[] | EntityCatalog> {
    const q = this.engine();
    return entity ? q.describe(entity as never) : q.describe();
  }

  /** Find IDs (+ preview rows) matching a filter. Scope is AND-injected. */
  query(entity: string, opts: QueryOptions = {}) {
    return this.engine().query(entity as never, opts);
  }

  /** Hydrate IDs into full rows, with optional relational expand. Scope-checked. */
  fetch(entity: string, ids: string[], opts: FetchOptions = {}) {
    return this.engine().fetch(entity as never, ids, opts);
  }
}
