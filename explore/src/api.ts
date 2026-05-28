// Typed client for the query surface. Talks to the framework-free Bun adapter
// (src/server.ts) via the Vite dev proxy on /api. Three primitives:
//   GET  /api/describe            → EntityCatalog[]
//   POST /api/query               → SearchResult
//   POST /api/fetch               → { entity, rows, count, sql?, params? }   (M3)
import type { EntityCatalog, FetchResult, QueryState, SearchResult } from './types';

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
