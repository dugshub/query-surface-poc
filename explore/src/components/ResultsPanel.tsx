import { useState } from 'react';
import type { PreviewRow, SearchResult, SnippetEntry, Sort } from '../types';

interface Props {
  result: SearchResult | null;
  running: boolean;
  request: unknown;          // the /api/query body == the "tool call" an agent emits
  limit: number;
  offset: number;
  sort: Sort[];
  onLimitChange: (n: number) => void;
  onOffsetChange: (n: number) => void;
  onToggleSort: (field: string) => void;
  onRun: () => void;
  onRowClick: (id: string) => void;
}

type Tab = 'results' | 'sql' | 'tool';

const fmt = (v: unknown): string =>
  v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);

/** Right pane — run controls + the result, as rows / compiled SQL / tool call. */
export function ResultsPanel(p: Props) {
  const { result, running, request, limit, offset, sort, onLimitChange, onOffsetChange, onToggleSort, onRun, onRowClick } = p;
  const [tab, setTab] = useState<Tab>('results');

  const rows: PreviewRow[] = result?.preview ?? [];
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => k !== '_snippets')))];
  const sortField = sort[0]?.field;
  const sortDir = sort[0]?.dir;
  const total = result && !result.error ? result.total : 0;
  const showingFrom = rows.length ? offset + 1 : 0;
  const showingTo = offset + rows.length;

  return (
    <div className="results">
      <div className="toolbar">
        <button onClick={onRun} disabled={running}>{running ? 'Running…' : 'Run query'}</button>
        <label className="meta">
          limit{' '}
          <input
            type="number" min={1} max={1000} value={limit} style={{ width: 64 }}
            onChange={(e) => onLimitChange(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        {result && !result.error && (
          <span className="meta">
            {total} match{total === 1 ? '' : 'es'}
            {rows.length ? ` · showing ${showingFrom}–${showingTo}` : ''}
          </span>
        )}
        <span className="spacer" />
        <button className="ghost" disabled={offset === 0 || running} onClick={() => onOffsetChange(Math.max(0, offset - limit))}>‹ prev</button>
        <button className="ghost" disabled={!result?.has_more || running} onClick={() => onOffsetChange(offset + limit)}>next ›</button>
      </div>

      {result?.error && <p className="err">{result.error}: {result.message}</p>}

      <div className="tabs">
        {(['results', 'sql', 'tool'] as Tab[]).map((t) => (
          <div key={t} className={'tab' + (t === tab ? ' active' : '')} onClick={() => setTab(t)}>
            {t === 'results' ? 'Results' : t === 'sql' ? 'SQL' : 'Tool call'}
          </div>
        ))}
      </div>

      {tab === 'results' && (
        rows.length === 0
          ? <p className="empty">{result ? 'No rows.' : 'Run a query to see rows.'}</p>
          : (
            <table>
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c} className="sortable" title="click to sort" onClick={() => onToggleSort(c)}>
                      {c}{sortField === c ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <Row key={(r.id as string) ?? i} row={r} cols={cols} onClick={onRowClick} />
                ))}
              </tbody>
            </table>
          )
      )}

      {tab === 'sql' && (
        <CodeBlock text={result?.sql
          ? `${result.sql}\n\n-- params: ${JSON.stringify(result.params ?? [])}`
          : '(no filter — full scan, or no query run yet)'} canCopy={!!result?.sql} />
      )}

      {tab === 'tool' && (
        <CodeBlock text={`POST /api/query\n${JSON.stringify(request ?? {}, null, 2)}`} canCopy={!!request} copyText={JSON.stringify(request ?? {}, null, 2)} />
      )}
    </div>
  );
}

function CodeBlock({ text, canCopy, copyText }: { text: string; canCopy: boolean; copyText?: string }) {
  const [done, setDone] = useState(false);
  const onCopy = () => {
    void navigator.clipboard?.writeText(copyText ?? text);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  };
  return (
    <div className="code-wrap">
      {canCopy && <button className="ghost copy" onClick={onCopy}>{done ? '✓ copied' : 'copy'}</button>}
      <pre className="code">{text}</pre>
    </div>
  );
}

function Row({ row, cols, onClick }: { row: PreviewRow; cols: string[]; onClick: (id: string) => void }) {
  const snippets = row._snippets as SnippetEntry[] | undefined;
  const id = row.id != null ? String(row.id) : null;
  return (
    <>
      <tr className={id ? 'rowclick' : ''} onClick={() => id && onClick(id)} title={id ? 'open full row →' : undefined}>
        {cols.map((c) => <td key={c}><code>{fmt(row[c])}</code></td>)}
      </tr>
      {snippets?.length ? (
        <tr>
          <td colSpan={cols.length} className="snip">
            {snippets.map((s, i) => (
              <span key={i}>
                {i > 0 && '  ·  '}
                <b>{s.column}:</b> …<Highlight snippet={s.snippet} match={s.match} />…
              </span>
            ))}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Highlight({ snippet, match }: { snippet: string; match: { start: number; end: number } }) {
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
