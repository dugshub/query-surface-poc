// Typed client for the query surface. Talks to the framework-free Bun adapter
// (src/server.ts) via the Vite dev proxy on /api. Three primitives:
//   GET  /api/describe            → EntityCatalog[]
//   POST /api/query               → SearchResult
//   POST /api/fetch               → { entity, rows, count, sql?, params? }   (M3)
import type { EntityCatalog, FetchResult, Predicate, QueryState, SearchResult } from './types';

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${path}`);
  return r.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${path}`);
  return r.json() as Promise<T>;
}

export const describe = (): Promise<EntityCatalog[]> => getJson('/api/describe');

/**
 * Serialize the query-state into the /api/query request body. This is also the
 * "tool call" an agent would emit — surfaced verbatim in the UI.
 * Projection contract: send `columns` only when the user picked some; omitting
 * it asks the surface for its curated preview set.
 */
export function queryRequest(qs: QueryState): Record<string, unknown> {
  if (!qs.entity) throw new Error('queryRequest: no entity selected');
  const body: Record<string, unknown> = { entity: qs.entity, preview: true };
  if (qs.filter) body.filter = qs.filter;
  if (qs.sort.length) body.sort = qs.sort;
  if (qs.columns.length) body.columns = qs.columns;
  body.page = qs.page;
  return body;
}

export const runQuery = (qs: QueryState): Promise<SearchResult> =>
  postJson('/api/query', queryRequest(qs));

/** Hydrate one or more IDs into full rows, optionally expanding related entities. */
export const runFetch = (entity: string, ids: string[], expand: string[]): Promise<FetchResult> =>
  postJson('/api/fetch', { entity, ids, expand: expand.length ? expand : undefined });

/**
 * Cross-entity global search — the surface is entity-rooted, so this fans the
 * same `text contains` filter across each entity in parallel and tags every
 * result with its source entity. Pass entities that actually have searchable
 * columns (catalogs with `searchableColumns.length > 0`); the rest match nothing.
 * One failing entity can't sink the batch — its slot resolves to an empty error
 * result. Equivalent to one multi-entity call, which the single-entity API lacks.
 */
export async function searchAll(value: string, entities: string[]): Promise<SearchResult[]> {
  // Magic-`text` fan-out as a resolved Predicate string leaf (pattern is literal).
  const filter: Predicate = { op: 'contains', left: { from: 'entity', path: 'text' }, pattern: value };
  return fanQuery(entities.map((entity) => ({ entity, filter })), 10);
}

/**
 * Run a (possibly per-entity-different) query across many entities in parallel,
 * tagging each result with its entity. The cross-entity Search page specializes
 * one filter tree per entity (pruning leaves on fields that entity lacks) and
 * passes the survivors here. A `filter` of undefined means "no predicate" (all
 * rows). One failing entity resolves to an empty error slot, never sinking the
 * batch.
 */
export async function fanQuery(
  reqs: Array<{ entity: string; filter?: Predicate }>,
  limit = 25,
): Promise<SearchResult[]> {
  return Promise.all(reqs.map(({ entity, filter }) =>
    postJson<SearchResult>('/api/query', {
      entity, preview: true, ...(filter ? { filter } : {}), page: { limit, offset: 0 },
    })
      .then((r) => ({ ...r, entity }))
      .catch((e) => ({ entity, ids: [], total: 0, has_more: false, preview: [], error: String(e) })),
  ));
}
