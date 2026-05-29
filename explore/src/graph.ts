// Relationship graph + pathfinder — the backbone of first-class traversal.
//
// From a root entity, find a valid dotted-path PREFIX to every reachable entity,
// so the UI can offer "pick any entity, then a field on it" and resolve the join
// automatically. Respects the surface's resolvePath rule: belongs_to hops chain
// freely, but a has_many can only be the FINAL relationship hop (it compiles to a
// terminal EXISTS sub-query and can't be traversed past). So a path is
//   [belongs_to]* [has_many]?  →  field
// A has_many anywhere on the path means the leaf compiles to EXISTS ("any …") and
// the path's attributes can be FILTERED but not projected as a scalar column.
import type { EntityCatalog } from './types';

export interface PathInfo {
  entity: string;       // target entity
  prefix: string[];     // relationship names root→entity ([] for the root itself)
  hasMany: boolean;     // path crosses a has_many → EXISTS; not column-projectable
}

/** BFS shortest valid path from `root` to every reachable entity. */
export function pathsFrom(root: string, catalogs: Map<string, EntityCatalog>): Map<string, PathInfo> {
  const out = new Map<string, PathInfo>();
  out.set(root, { entity: root, prefix: [], hasMany: false });
  const queue: PathInfo[] = [out.get(root)!];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.hasMany) continue; // can't extend past a has_many (must be terminal)
    const cat = catalogs.get(cur.entity);
    if (!cat) continue;
    for (const rel of cat.relationships) {
      if (out.has(rel.target)) continue; // BFS → first time is the shortest path
      const info: PathInfo = {
        entity: rel.target,
        prefix: [...cur.prefix, rel.name],
        hasMany: rel.kind === 'has_many', // cur.hasMany is false here (guarded above)
      };
      out.set(rel.target, info);
      queue.push(info); // has_many targets get enqueued but the guard stops extension
    }
  }
  return out;
}

/** prefix + field → the dotted `on:` path. */
export const composeOn = (prefix: string[], field: string): string =>
  prefix.length ? [...prefix, field].join('.') : field;

/** Reverse: split an `on:` path into its scope entity + terminal field, via the path table. */
export function parseOn(on: string, paths: Map<string, PathInfo>): { entity: string; field: string } | null {
  const segs = on.split('.');
  const field = segs[segs.length - 1];
  const prefixStr = segs.slice(0, -1).join('.');
  for (const p of paths.values()) {
    if (p.prefix.join('.') === prefixStr) return { entity: p.entity, field };
  }
  return null;
}
