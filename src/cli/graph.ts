// Entity-relationship graph — renders the data model as a tree in the terminal.
//
// Roots are entities with no belongs_to edge; we descend has_many edges to form
// the hierarchy (account → opportunity → email). Each edge is labelled with its
// FK column; nodes with >1 belongs_to are "join" nodes (◆) and note their
// parents. Borrows dugshub/stack's connector aesthetic (├─ └─ │) and glyphs.
//
// Entities never reached via has_many (a belongs_to whose inverse many() is
// missing — what `doctor` flags as MISSING_INVERSE) are listed separately, so
// the graph doubles as a relationship-completeness check.

import type { EntityCatalog } from '../query/catalog';
import { glyph, theme } from './ui';

interface Edge {
  target: string;
  fk: string;
}
interface Node {
  cat: EntityCatalog;
  hasMany: Edge[];
  belongsTo: string[]; // target entity names
}

function index(catalogs: EntityCatalog[]): Map<string, Node> {
  const map = new Map<string, Node>();
  for (const cat of catalogs) {
    map.set(String(cat.entity), {
      cat,
      hasMany: cat.relationships
        .filter((r) => r.kind === 'has_many')
        .map((r) => ({ target: String(r.target), fk: r.fk })),
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
    isJoin: n.belongsTo.length > 1,
  }));
}

function nodeLabel(n: Node): string {
  const fields = `${n.cat.fields.length} ${n.cat.fields.length === 1 ? 'field' : 'fields'}`;
  const eav = n.cat.fields.filter((f) => f.eav).length;
  const eavTag = eav > 0 ? theme.muted(`, ${eav} eav`) : '';
  const join =
    n.belongsTo.length > 1 ? '  ' + theme.muted(`(joins ${n.belongsTo.join(' + ')})`) : '';
  return `${theme.entity(String(n.cat.entity))}  ${theme.muted(fields)}${eavTag}${join}`;
}

function nodeGlyph(n: Node): string {
  return n.belongsTo.length > 1 ? theme.rel(glyph.join) : theme.entity(glyph.node);
}

/** Render the data model as a tree. */
export function renderEntityGraph(catalogs: EntityCatalog[]): void {
  const nodes = index(catalogs);
  const rendered = new Set<string>();

  console.log(
    '  ' +
      theme.muted(
        `${theme.entity(glyph.node)} entity   ${theme.rel(glyph.join)} join   ${glyph.tee} has_many   ${glyph.returns} cycle`,
      ),
  );
  console.log('');

  let roots = [...nodes.values()].filter((n) => n.belongsTo.length === 0);
  if (roots.length === 0) roots = [...nodes.values()];

  const renderChildren = (edges: Edge[], prefix: string, path: Set<string>): void => {
    const present = edges.filter((e) => nodes.has(e.target));
    present.forEach((edge, i) => {
      const node = nodes.get(edge.target)!;
      const isLast = i === present.length - 1;
      const connector = isLast ? glyph.elbow : glyph.tee;
      const cycle = path.has(edge.target);
      const via = edge.fk ? theme.muted(`  ${glyph.arrowL} ${edge.fk}`) : '';
      const note = cycle ? '  ' + theme.muted(`${glyph.returns} cycle`) : '';
      console.log(`${prefix}${theme.muted(connector)}${nodeGlyph(node)} ${nodeLabel(node)}${via}${note}`);
      rendered.add(edge.target);
      if (!cycle && node.hasMany.length) {
        const childPrefix = prefix + (isLast ? glyph.gap : theme.muted(glyph.pipe));
        renderChildren(node.hasMany, childPrefix, new Set([...path, edge.target]));
      }
    });
  };

  roots.forEach((root, i) => {
    if (i > 0) console.log('');
    console.log(`${nodeGlyph(root)} ${nodeLabel(root)}`);
    rendered.add(String(root.cat.entity));
    renderChildren(root.hasMany, '', new Set([String(root.cat.entity)]));
  });

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
