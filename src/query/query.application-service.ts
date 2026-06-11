// QueryApplicationService — the single composition point for the semantic query
// surface. Consumer-agnostic: an MCP tool, a web UI, the CLI, or a frontend
// filter-builder all construct this one class (`new QueryApplicationService(db)`)
// and call the same three primitives. No framework, no transport, no per-entity
// indirection.
//
//   describe(entity?) → the typed field catalog (queryable fields per model,
//                       assembled from EAV ⊕ Drizzle introspection)
//   query(entity,…)   → find IDs (+ optional preview) matching a FilterExpression
//   fetch(entity,…)   → hydrate IDs into full rows (+ refinement filter / expand)
//
// The pure logic lives underneath (catalog.ts, compiler.ts, service.ts runners);
// this class composes it and owns the actor-scoped EAV context (loaded once,
// cached). See docs/field-catalog-design.md.

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { buildEntityCatalog, type EntityCatalog } from './catalog';
import { type EavContext, loadFieldMaps } from './eav/field-map';
import { ENGINE_ERROR } from './engine/error-messages';
import { normalizeRankBy } from './engine/rank-normalize';
import { runFetch, runSearch } from './engine/runners';
import { registry } from './registry';
import type {
  EntityName,
  FetchResponse,
  FilterExpression,
  RankBy,
  SearchEntityResult,
  Sort,
} from './types';

/**
 * Per-entity scope predicate — a mandatory, caller-derived filter AND-ed into
 * every query/fetch for that entity (tenancy: user/org). Return undefined to
 * leave an entity unscoped. The package stays domain-agnostic: the consumer
 * supplies this (mirroring their access contract, e.g. an Electric shape-defs
 * table). Scope is non-bypassable — the agent's own filter can only narrow it.
 */
export type ScopeResolver = (
  entity: EntityName,
) => FilterExpression | undefined;

export interface QueryServiceOptions {
  /** EAV field-map actor — whose `field_definitions` define the virtual columns.
   *  REQUIRED at query time: a missing actor throws rather than silently
   *  resolving another identity's fields. Standalone demos pass an explicit
   *  constant. */
  actorUserId?: string;
  /** When set, field definitions load by org ownership (org-owned defs carry
   *  user_id NULL) instead of per-user ownership. */
  actorOrganizationId?: string;
  /** Per-entity tenancy scope, AND-ed into every query/fetch. */
  scope?: ScopeResolver;
  /** Embed a query string for `rank_by { method: 'semantic' }` (same model that
   *  produced the stored vectors). Omit → semantic ranking is unsupported. */
  embed?: (text: string) => Promise<number[]>;
  /** `(entity → text column) → embedding column` map; gates which columns
   *  support semantic ranking. */
  semanticColumns?: Record<string, Record<string, string>>;
}

export interface QueryOptions {
  filter?: FilterExpression;
  sort?: Sort[];
  page?: { limit?: number; offset?: number };
  // Explicit projection for preview rows — see SingleSearchQuery.columns.
  // Omit → the entity's curated preview fields.
  columns?: string[];
  // Rank + top-K by a search method; owns ordering + limit when present.
  // Wire-shaped (snake) to flow through the use-case spread; mapped to the engine's `rankBy`
  // in `query()`. `method` is the RAW wire value (any string) — normalizeRankBy + the service
  // conform/default it to the canonical 'semantic'|'lexical' before compile.
  rank_by?: Omit<RankBy, 'method'> & { method?: string };
  preview?: boolean;
  include_sql?: boolean;
}

export interface FetchOptions {
  filter?: FilterExpression;
  expand?: string[];
  include_sql?: boolean;
}

export class QueryApplicationService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: engine is schema-agnostic; Drizzle's DB type is generic over the host schema, unknown at the package level
    private readonly db: NodePgDatabase<any>,
    private readonly options: QueryServiceOptions = {},
  ) {}

  // Actor-scoped EAV field maps — resolved FRESH on every call, never memoized.
  // The actor (whose field_definitions define the EAV virtual columns) comes
  // from options.actorUserId. It is REQUIRED: a missing actor must fail loudly
  // rather than silently resolve another identity's fields. Callers without a
  // real actor (e.g. the standalone POC demo) pass an explicit constant.
  //
  // Not cached: `field_definitions.is_visible` is live seller curation, and a
  // per-instance memo (combined with this engine being reused per-requester for
  // the process lifetime) made curation edits invisible until a restart. The
  // underlying read is uncached too (see loadFieldMap); the cost is a handful of
  // indexed lookups per request, paid so describe/query always reflect current
  // curation.
  private eav(): Promise<EavContext> {
    const actorUserId = this.options.actorUserId;
    if (!actorUserId) {
      throw new Error(
        'QueryApplicationService: options.actorUserId is required — EAV field ' +
          'resolution has no actor to scope to.',
      );
    }
    return loadFieldMaps(this.db, {
      userId: actorUserId,
      ...(this.options.actorOrganizationId
        ? { organizationId: this.options.actorOrganizationId }
        : {}),
    });
  }

  // AND the entity's tenancy scope into the caller's filter. Scope is
  // non-bypassable: it always applies; the caller's filter can only narrow it.
  private scoped(
    entity: EntityName,
    filter?: FilterExpression,
  ): FilterExpression | undefined {
    const s = this.options.scope?.(entity);
    if (s && filter) return { and: [s, filter] };
    return s ?? filter;
  }

  /**
   * No-op, retained for API compatibility. The actor EAV context is no longer
   * memoized (it is resolved fresh per call), so there is nothing to reset.
   */
  resetCache(): void {}

  /** Typed field catalog for one entity, or all registered entities. */
  async describe(entity: EntityName): Promise<EntityCatalog>;
  async describe(): Promise<EntityCatalog[]>;
  async describe(
    entity?: EntityName,
  ): Promise<EntityCatalog | EntityCatalog[]> {
    const eav = await this.eav();
    if (entity) return buildEntityCatalog(entity, eav.fieldMaps[entity]);
    return (Object.keys(registry) as EntityName[]).map((e) =>
      buildEntityCatalog(e, eav.fieldMaps[e]),
    );
  }

  /** Find IDs (+ optional preview rows) matching a filter. */
  async query(
    entity: EntityName,
    opts: QueryOptions = {},
  ): Promise<SearchEntityResult> {
    const eav = await this.eav();
    // Normalize rank_by aliases (group_by/per → partition_by, top_k → limit, quoted keys),
    // then fill rank_by.on with the entity's default text column when the caller omits it —
    // the one field agents reliably forget, and almost always unambiguous.
    const rankBy = this.withDefaultMethod(
      entity,
      this.withDefaultRankOn(entity, normalizeRankBy(opts.rank_by)),
    );
    // Semantic rank: resolve the query vector + embedding column here (the
    // service owns the async embed() call; compile stays synchronous).
    const rankSemantic = await this.resolveSemanticRank(entity, rankBy);
    return runSearch(
      this.db,
      {
        entity,
        filter: this.scoped(entity, opts.filter),
        sort: opts.sort,
        page: opts.page,
        columns: opts.columns,
        rankBy,
        rankSemantic,
      },
      { preview: opts.preview, include_sql: opts.include_sql },
      eav,
    );
  }

  /** Default `rank_by.on` to the entity's sole registered semantic text column when the caller
   *  omits it (small models reliably forget it, and it's almost always unambiguous). With 0 or
   *  >1 candidates we can't safely choose — surface a clear 400 rather than guess. */
  private withDefaultRankOn(
    entity: EntityName,
    rankBy?: RankBy,
  ): RankBy | undefined {
    if (!rankBy || rankBy.on) return rankBy;
    const candidates = Object.keys(this.options.semanticColumns?.[entity] ?? {});
    if (candidates.length === 1) return { ...rankBy, on: candidates[0] };
    throw new Error(
      `${ENGINE_ERROR.RANK} rank_by.on is required for '${entity}' (no single default text column to rank on)`,
    );
  }

  /** Default `rank_by.method` when omitted (small models often skip it), and reject an
   *  unrecognized value (normalizeRankBy already aliased the common synonyms). Default =
   *  'semantic' when an embedding column exists for `on` (or any), else 'lexical'. */
  private withDefaultMethod(
    entity: EntityName,
    rankBy?: RankBy,
  ): RankBy | undefined {
    if (!rankBy) return rankBy;
    if (rankBy.method === 'semantic' || rankBy.method === 'lexical') return rankBy;
    if (rankBy.method == null) {
      const cols = this.options.semanticColumns?.[entity] ?? {};
      const hasSemantic = rankBy.on ? !!cols[rankBy.on] : Object.keys(cols).length > 0;
      return { ...rankBy, method: hasSemantic ? 'semantic' : 'lexical' };
    }
    throw new Error(
      `${ENGINE_ERROR.RANK} unknown method '${rankBy.method}' — use 'semantic' or 'lexical' (aliases: similarity/cosine/vector → semantic, keyword/fts/text → lexical)`,
    );
  }

  /** For a `method:'semantic'` rank, resolve `{ vector, embeddingColumn }` from
   *  the host-injected embed() port + semantic-column registry. Fails loud (→
   *  400) when the column isn't semantically searchable or no embed is bound. */
  private async resolveSemanticRank(
    entity: EntityName,
    rankBy?: RankBy,
  ): Promise<{ vector: number[]; embeddingColumn: string } | undefined> {
    if (rankBy?.method !== 'semantic') return undefined;
    const embeddingColumn = rankBy.on
      ? this.options.semanticColumns?.[entity]?.[rankBy.on]
      : undefined;
    if (!embeddingColumn) {
      throw new Error(
        `${ENGINE_ERROR.RANK} column '${rankBy.on}' does not support semantic ranking on '${entity}'`,
      );
    }
    if (!this.options.embed) {
      throw new Error(
        `${ENGINE_ERROR.RANK} semantic ranking is not configured (no embed port)`,
      );
    }
    const vector = await this.options.embed(rankBy.query);
    return { vector, embeddingColumn };
  }

  /** Hydrate IDs into full rows, with optional refinement filter + relational expand. */
  async fetch(
    entity: EntityName,
    ids: string[],
    opts: FetchOptions = {},
  ): Promise<FetchResponse> {
    const eav = await this.eav();
    return runFetch(
      this.db,
      {
        entity,
        ids,
        filter: this.scoped(entity, opts.filter),
        expand: opts.expand,
        include_sql: opts.include_sql,
      },
      eav,
    );
  }
}
