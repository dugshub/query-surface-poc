import type { ScopeResolver } from '../query/query.application-service';
import type { RegisterSchemaOptions } from '../query/schema-registry';

/**
 * The identity a query runs as. Shape-compatible with the host's ambient
 * requester context (e.g. `@repo/shared/requester-context`'s
 * `RequesterContext`) without depending on it — the package stays portable;
 * the host injects how to obtain one via `getRequester`.
 */
export interface QuerySurfaceRequester {
  userId: string;
  /** Org-owned EAV field definitions resolve by this when present. */
  organizationId?: string | null;
}

/**
 * Host-supplied policy for the mounted query surface.
 *
 * Everything here is the host's domain knowledge: the curated entity set and
 * its relations, the EAV overlay, the tenancy predicate per entity, and the
 * source of the ambient requester. The package contributes the mechanics
 * (engine, per-requester caching, describe/query/fetch surface).
 */
export interface QuerySurfaceModuleOptions {
  /** Tables + drizzle Relations objects, passed to `registerSchema` once at
   *  module init. */
  schema: Record<string, unknown>;
  /** EAV overlay per entity (see `RegisterSchemaOptions['eav']`). */
  eav?: RegisterSchemaOptions['eav'];
  /** Non-bypassable per-entity tenancy scope for a requester — AND-ed into
   *  every query/fetch. */
  scopeFor: (requester: QuerySurfaceRequester) => ScopeResolver;
  /**
   * Ambient requester source, called per operation. Hosts typically pass
   * their ALS reader (e.g. `requireRequester`); it should THROW when no
   * context is active — fail-loud beats unscoped reads.
   */
  getRequester: () => QuerySurfaceRequester;
}
