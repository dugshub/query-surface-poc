import { useMemo, useState } from 'react';
import { fanQuery } from '../api';
import {
  applyEdit, newGroup, newLeaf, rootGroup, specializeForEntity, toExpression,
  type Edit, type FGroup, type FLeaf,
} from '../filter';
import { composeOn, pathsFrom } from '../graph';
import { Highlight } from './GlobalSearch';
import { ConditionEditor, describeCondition } from './ConditionEditor';
import { EntityIcon } from './EntityIcon';
import { entityLabel } from '../labels';
import type { EntityCatalog, PreviewRow, SearchResult, SnippetEntry } from '../types';

interface Props {
  catalogs: EntityCatalog[];
  onPick: (entity: string, id: string) => void;
}

// Leaf `on` encoding for this page: 'text' (search the comm's own text columns)
// or an ABSOLUTE `${entity}::${fieldKey}` reference, re-rooted per comm entity at
// run time. '::' can't appear in a dotted relationship path, so it's unambiguous.
const COMM_BASE = 'communications';
const parseAbs = (on: string): { entity: string; field: string } | null => {
  const i = on.indexOf('::');
  return i < 0 ? null : { entity: on.slice(0, i), field: on.slice(i + 2) };
};

/**
 * Cross-entity comm search. Output is the communication text family (emails ·
 * meetings · transcripts — anything with searchable text that climbs to the
 * `communications` base). You filter on ANY field reachable from those entities
 * (their own columns, plus the belongs_to climb to communication → opportunity →
 * account). At run time the one filter tree is re-rooted onto each comm entity as
 * dotted paths and fanned; leaves a given entity can't reach prune out. Lets an
 * agent comb every email/meeting/transcript tied to opportunities matching some
 * profile (value band, industry, stage…) in one shot.
 */
export function SearchPage({ catalogs, onPick }: Props) {
  const [tree, setTree] = useState<FGroup>(rootGroup);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<{ queried: number; skipped: number } | null>(null);

  const catalogMap = useMemo(() => new Map(catalogs.map((c) => [c.entity, c])), [catalogs]);

  // Output entities: text-bearing members of the communication family — they have
  // searchable columns AND reach the communications base via belongs_to.
  const commOutputs = useMemo(() => catalogs.filter((c) => {
    if (c.kind === 'junction' || c.searchableColumns.length === 0) return false;
    if (c.entity === COMM_BASE) return false; // the base itself carries no text
    const p = pathsFrom(c.entity, catalogMap).get(COMM_BASE);
    return !!p && !p.hasMany; // belongs_to climb only
  }), [catalogs, catalogMap]);

  // Filterable field universe: every entity reachable from any comm output, with
  // its fields. Grouped by entity for the picker.
  const fieldGroups = useMemo(() => {
    const reachable = new Set<string>();
    for (const c of commOutputs) for (const t of pathsFrom(c.entity, catalogMap).keys()) reachable.add(t);
    return [...reachable]
      .map((e) => catalogMap.get(e))
      .filter((c): c is EntityCatalog => !!c && c.kind !== 'junction' && c.fields.length > 0)
      .sort((a, b) => a.entity.localeCompare(b.entity));
  }, [commOutputs, catalogMap]);

  const edit = (e: Edit) => setTree((t) => applyEdit(t, e));

  const run = async () => {
    const expr = toExpression(tree);
    if (!expr || commOutputs.length === 0) { setResults(null); setStats(null); return; }
    setRunning(true);
    try {
      const reqs: Array<{ entity: string; filter?: ReturnType<typeof toExpression> }> = [];
      for (const c of commOutputs) {
        const paths = pathsFrom(c.entity, catalogMap);
        const mapOn = (on: string): string | null => {
          if (on === 'text') return 'text';
          const abs = parseAbs(on);
          if (!abs) return null;
          const p = paths.get(abs.entity);
          return p ? composeOn(p.prefix, abs.field) : null;
        };
        const { skip, filter } = specializeForEntity(expr, mapOn);
        if (!skip) reqs.push({ entity: c.entity, filter });
      }
      const rs = await fanQuery(reqs.map((r) => ({ entity: r.entity, filter: r.filter })));
      setResults(rs);
      setStats({ queried: reqs.length, skipped: commOutputs.length - reqs.length });
    } finally {
      setRunning(false);
    }
  };

  const expr = toExpression(tree);
  const hits = (results ?? []).filter((r) => (r.preview?.length ?? 0) > 0);
  const totalHits = (results ?? []).reduce((n, r) => n + (r.total ?? 0), 0);

  if (commOutputs.length === 0) {
    return <div className="searchpage"><p className="empty">No communication text entities found (need searchable text reaching “{COMM_BASE}”).</p></div>;
  }

  return (
    <div className="searchpage">
      <p className="searchpage-intro">
        Comb the communication text across <b>{commOutputs.map((c) => entityLabel(c.entity)).join(' · ')}</b> —
        filtered by any attribute of the related opportunity / account (value, industry, stage…). Build the filter,
        add a <code>text</code> condition for what to find, and it fans across each comm type and merges the hits.
      </p>

      <div className="filter">
        <CrossGroup node={tree} isRoot groups={fieldGroups} catalogMap={catalogMap} edit={edit} />
      </div>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button onClick={() => void run()} disabled={running || !expr}>
          {running ? 'Searching…' : 'Search comms'}
        </button>
        {!expr && <span className="meta">add a condition to search</span>}
        {stats && !running && (
          <span className="meta">
            {totalHits} match{totalHits === 1 ? '' : 'es'} · {stats.queried} comm type{stats.queried === 1 ? '' : 's'} queried
            {stats.skipped ? ` · ${stats.skipped} skipped (filter unreachable)` : ''}
          </span>
        )}
      </div>

      {results && (
        <div className="searchpage-results">
          {hits.length === 0
            ? <p className="empty">{running ? 'Searching…' : 'No matches.'}</p>
            : hits.map((r) => (
              <div key={r.entity} className="gsearch-group">
                <div className="gsearch-group-head">
                  <span className="entity-tab-ico"><EntityIcon name={r.entity!} /></span>
                  <span className="n">{entityLabel(r.entity!)}</span>
                  <span className="c">{r.total} match{r.total === 1 ? '' : 'es'}</span>
                </div>
                {(r.preview ?? []).map((row, i) => (
                  <ResultRow key={(row.id as string) ?? i} entity={r.entity!} row={row} onPick={onPick} />
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── builder (absolute-leaf flavour: pick any reachable entity.field, or text) ──

interface BuildProps {
  groups: EntityCatalog[];                  // entities (with fields) offered in the picker
  catalogMap: Map<string, EntityCatalog>;
  edit: (e: Edit) => void;
}

function CrossGroup({ node, isRoot, ...p }: { node: FGroup; isRoot?: boolean } & BuildProps) {
  const [creating, setCreating] = useState(false);
  return (
    <div className={'fgroup' + (node.negate ? ' negated' : '')}>
      <div className="fgroup-head">
        <button className="conj" title="Toggle AND / OR"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { conj: node.conj === 'and' ? 'or' : 'and' } })}>
          {node.conj.toUpperCase()}
        </button>
        <button className={'ghost neg' + (node.negate ? ' on' : '')} title="Negate this group (NOT)"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { negate: !node.negate } })}>
          NOT
        </button>
        <span className="spacer" />
        <button className="ghost" onClick={() => setCreating(true)}>+ condition</button>
        <button className="ghost" onClick={() => p.edit({ op: 'add', groupId: node.id, node: newGroup(node.conj === 'and' ? 'or' : 'and') })}>+ group</button>
        {!isRoot && <span className="x" title="remove group" onClick={() => p.edit({ op: 'remove', id: node.id })}>✕</span>}
      </div>
      <div className="fgroup-body">
        {node.children.length === 0 && <div className="muted" style={{ fontSize: 12 }}>no conditions yet</div>}
        {node.children.map((c) =>
          c.kind === 'group'
            ? <CrossGroup key={c.id} node={c} {...p} />
            : <CrossLeaf key={c.id} leaf={c} {...p} />,
        )}
      </div>
      {creating && (
        <ConditionEditor
          groups={p.groups}
          catalogMap={p.catalogMap}
          onApply={(patch) => p.edit({ op: 'add', groupId: node.id, node: { ...newLeaf(), ...patch } })}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function CrossLeaf({ leaf, groups, catalogMap, edit }: { leaf: FLeaf } & BuildProps) {
  const [editing, setEditing] = useState(false);
  const isText = leaf.on === 'text';
  const abs = isText ? null : parseAbs(leaf.on);
  const text = describeCondition({ on: leaf.on, op: leaf.op, value: leaf.value }, catalogMap);
  return (
    <div className="cond">
      <span className="cond-ico">{isText ? <SearchGlyph /> : abs ? <EntityIcon name={abs.entity} /> : null}</span>
      <span className="cond-text">{text || 'incomplete condition'}</span>
      <button type="button" className="cond-edit" title="edit condition" onClick={() => setEditing(true)}><ChevronGlyph /></button>
      <span className="x" title="remove condition" onClick={() => edit({ op: 'remove', id: leaf.id })}>✕</span>
      {editing && (
        <ConditionEditor
          leaf={{ on: leaf.on, op: leaf.op, value: leaf.value }}
          groups={groups}
          catalogMap={catalogMap}
          onApply={(patch) => edit({ op: 'patchLeaf', id: leaf.id, patch })}
          onRemove={() => edit({ op: 'remove', id: leaf.id })}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ── results ───────────────────────────────────────────────────────────────────

const fmt = (v: unknown): string =>
  v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

function ResultRow({ entity, row, onPick }: { entity: string; row: PreviewRow; onPick: (entity: string, id: string) => void }) {
  const snippets = row._snippets as SnippetEntry[] | undefined;
  const id = row.id != null ? String(row.id) : null;
  const summary = Object.entries(row)
    .filter(([k]) => k !== '_snippets' && k !== 'id')
    .slice(0, 3)
    .map(([, v]) => fmt(v))
    .filter(Boolean)
    .join(' · ');
  return (
    <button type="button" className="gsearch-hit" disabled={!id} onClick={() => id && onPick(entity, id)} title={id ? 'open full row →' : undefined}>
      {summary && <span className="gsearch-hit-summary">{summary}</span>}
      {snippets?.length ? (
        <span className="snip">
          {snippets.map((s, i) => (
            <span key={i}>{i > 0 && '  ·  '}<b>{s.column}:</b> …<Highlight snippet={s.snippet} match={s.match} />…</span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
