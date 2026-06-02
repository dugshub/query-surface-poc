import { useEffect, useRef, useState } from 'react';
import { searchAll } from '../api';
import { EntityIcon } from './EntityIcon';
import { entityLabel } from '../labels';
import type { EntityCatalog, PreviewRow, SearchResult, SnippetEntry } from '../types';

interface Props {
  catalogs: EntityCatalog[];
  onPick: (entity: string, id: string) => void;
}

/**
 * Cross-entity text search. The surface is entity-rooted, so this fans one
 * `text contains` query across every entity that has searchable columns (via
 * api.searchAll) and shows the merged, entity-tagged hits in a drop-down. Picks
 * select that entity and open its drill drawer. Entities with no searchable
 * columns (e.g. communications, whose text lives in child tables) self-exclude.
 */
export function GlobalSearch({ catalogs, onPick }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);

  const searchable = catalogs.filter((c) => c.searchableColumns.length > 0);

  // Close the drop-down on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const run = async () => {
    const value = q.trim();
    if (!value) { setResults(null); return; }
    const seq = ++seqRef.current;
    setRunning(true);
    setOpen(true);
    try {
      const rs = await searchAll(value, searchable.map((c) => c.entity));
      if (seq === seqRef.current) setResults(rs);
    } finally {
      if (seq === seqRef.current) setRunning(false);
    }
  };

  const clear = () => { setQ(''); setResults(null); setOpen(false); };
  const pick = (entity: string, id: string) => { onPick(entity, id); setOpen(false); };

  const hits = (results ?? []).filter((r) => (r.preview?.length ?? 0) > 0);
  const totalHits = (results ?? []).reduce((n, r) => n + (r.total ?? 0), 0);

  return (
    <div className="gsearch" ref={boxRef}>
      <span className="gsearch-ico"><SearchGlyph /></span>
      <input
        type="search"
        value={q}
        placeholder={`Search across ${searchable.length} entities…`}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (results) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void run();
          else if (e.key === 'Escape') clear();
        }}
      />

      {open && (
        <div className="gsearch-panel">
          {running && <p className="gsearch-meta">Searching {searchable.length} entities…</p>}
          {!running && hits.length === 0 && (
            <p className="empty">No matches for “{q.trim()}”.</p>
          )}
          {!running && hits.length > 0 && (
            <>
              <p className="gsearch-meta">
                {totalHits} match{totalHits === 1 ? '' : 'es'} across {hits.length} entit{hits.length === 1 ? 'y' : 'ies'}
              </p>
              {hits.map((r) => (
                <div key={r.entity} className="gsearch-group">
                  <div className="gsearch-group-head">
                    <span className="entity-tab-ico"><EntityIcon name={r.entity!} /></span>
                    <span className="n">{entityLabel(r.entity!)}</span>
                    <span className="c">{r.total} match{r.total === 1 ? '' : 'es'}</span>
                  </div>
                  {(r.preview ?? []).map((row, i) => (
                    <Hit key={(row.id as string) ?? i} entity={r.entity!} row={row} onPick={pick} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const fmt = (v: unknown): string =>
  v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

/** One result row: a snippet if the match produced one, else a compact field summary. */
function Hit({ entity, row, onPick }: { entity: string; row: PreviewRow; onPick: (entity: string, id: string) => void }) {
  const snippets = row._snippets as SnippetEntry[] | undefined;
  const id = row.id != null ? String(row.id) : null;
  // Fall back to the first couple of non-id, non-snippet fields as a label.
  const summary = Object.entries(row)
    .filter(([k]) => k !== '_snippets' && k !== 'id')
    .slice(0, 2)
    .map(([, v]) => fmt(v))
    .filter(Boolean)
    .join(' · ');
  return (
    <button
      type="button"
      className="gsearch-hit"
      disabled={!id}
      onClick={() => id && onPick(entity, id)}
      title={id ? 'open full row →' : undefined}
    >
      {snippets?.length ? (
        <span className="snip">
          {snippets.map((s, i) => (
            <span key={i}>
              {i > 0 && '  ·  '}
              <b>{s.column}:</b> …<Highlight snippet={s.snippet} match={s.match} />…
            </span>
          ))}
        </span>
      ) : (
        <span className="gsearch-hit-summary">{summary || id}</span>
      )}
    </button>
  );
}

export function Highlight({ snippet, match }: { snippet: string; match: { start: number; end: number } }) {
  const { start, end } = match;
  if (start < 0 || end > snippet.length || start >= end) return <>{snippet}</>;
  return (
    <>
      {snippet.slice(0, start)}
      <mark>{snippet.slice(start, end)}</mark>
      {snippet.slice(end)}
    </>
  );
}

function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
