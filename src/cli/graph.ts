// Entity-relationship graph — renders the data model as a tree in the terminal.
//
// Roots are entities with no belongs_to edge; we descend has_many edges to form
// the hierarchy (the natural containment shape: account → opportunity → email).
// Borrows dugshub/stack's connector aesthetic (├─ └─ │) and node glyphs.
//
// Entities never reached via has_many (e.g. a belongs_to whose inverse many()
// is missing — exactly what `doctor` flags as MISSING_INVERSE) are listed
// separately, so the graph doubles as a relationship-completeness check.

import type { EntityCatalog } from '../query/catalog';
import { glyph, theme } from './ui';

interface Node {
  cat: EntityCatalog;
  hasMany: string[]; // target entity names
  belongsTo: string[];
}

function index(catalogs: EntityCatalog[]): Map<string, Node> {
  const map = new Map<string, Node>();
  for (const cat of catalogs) {
    map.set(String(cat.entity), {
      cat,
      hasMany: cat.relationships.filter((r) => r.kind === 'has_many').map((r) => String(r.target)),
      belongsTo: cat.relationships.filter((r) => r.kind === 'belongs_to').map((r) => String(r.target)),
    });
  }
  return map;
}

/** JSON shape: adjacency per entity. */
export function graphAdjacency(catalogs: EntityCatalog[]): unknown {
  const nodes = index(catalogs);
  return [...nodes.values()].map((n) => ({
    entity: String(n.cat.entity),
    fields: n.cat.fields.length,
    belongs_to: n.belongsTo,
    has_many: n.hasMany,
  }));
}

function nodeLabel(n: Node): string {
  const fields = `${n.cat.fields.length} ${n.cat.fields.length === 1 ? 'field' : 'fields'}`;
  const eav = n.cat.fields.filter((f) => f.eav).length;
  const eavTag = eav > 0 ? theme.muted(`, ${eav} eav`) : '';
  return `${theme.entity(String(n.cat.entity))}  ${theme.muted(fields)}${eavTag}`;
}

/** Render the data model as a tree. Returns the rendered (or null in no-data). */
export function renderEntityGraph(catalogs: EntityCatalog[]): void {
  const nodes = index(catalogs);
  const rendered = new Set<string>();

  // Legend.
  console.log(
    '  ' +
      theme.muted(
        `${theme.entity(glyph.node)} entity   ${glyph.tee} has_many   ${glyph.returns} cycle`,
      ),
  );
  console.log('');

  // Roots: no belongs_to. Fall back to all entities if every node has one (cycle).
  let roots = [...nodes.values()].filter((n) => n.belongsTo.length === 0);
  if (roots.length === 0) roots = [...nodes.values()];

  const renderChildren = (parents: string[], prefix: string, path: Set<string>): void => {
    const children = parents.filter((c) => nodes.has(c));
    children.forEach((name, i) => {
      const node = nodes.get(name)!;
      const isLast = i === children.length - 1;
      const connector = isLast ? glyph.elbow : glyph.tee;
      const cycle = path.has(name);
      const note = cycle ? '  ' + theme.muted(`${glyph.returns} cycle`) : '';
      console.log(`${prefix}${theme.muted(connector)}${theme.entity(glyph.node)} ${nodeLabel(node)}${note}`);
      rendered.add(name);
      if (!cycle && node.hasMany.length) {
        const childPrefix = prefix + (isLast ? glyph.gap : theme.muted(glyph.pipe));
        renderChildren(node.hasMany, childPrefix, new Set([...path, name]));
      }
    });
  };

  roots.forEach((root, i) => {
    if (i > 0) console.log('');
    console.log(`${theme.entity(glyph.root)} ${nodeLabel(root)}`);
    rendered.add(String(root.cat.entity));
    renderChildren(root.hasMany, '', new Set([String(root.cat.entity)]));
  });

  // Entities not reachable via has_many — likely a missing inverse many().
  const orphans = [...nodes.keys()].filter((n) => !rendered.has(n));
  if (orphans.length) {
    console.log('');
    console.log(theme.warning(`${glyph.warn} not reachable via has_many (missing inverse?):`));
    for (const o of orphans) {
      const n = nodes.get(o)!;
      const to = n.belongsTo.length ? theme.muted(` ${glyph.arrowR} ${n.belongsTo.join(', ')}`) : '';
      console.log(`  ${theme.entity(glyph.node)} ${theme.entity(o)}${to}`);
    }
  }
}
