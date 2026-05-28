import { useState } from 'react';
import type { PreviewRow, SearchResult, SnippetEntry } from '../types';

interface Props {
  result: SearchResult | null;
  running: boolean;
  request: unknown;          // the /api/query body == the "tool call" an agent emits
  limit: number;
  onLimitChange: (n: number) => void;
  onRun: () => void;
}

type Tab = 'results' | 'sql' | 'tool';

const fmt = (v: unknown): string =>
  v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);

/** Right pane — run controls + the result, viewable as rows / compiled SQL / tool call. */
export function ResultsPanel({ result, running, request, limit, onLimitChange, onRun }: Props) {
  const [tab, setTab] = useState<Tab>('results');

  const rows: PreviewRow[] = result?.preview ?? [];
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => k !== '_snippets')))];

  return (
    <div className="results">
      <div className="toolbar">
        <button onClick={onRun} disabled={running}>{running ? 'Running…' : 'Run query'}</button>
        <label className="meta">
          limit{' '}
          <input
            type="number"
            min={1}
            max={1000}
            value={limit}
            style={{ width: 64 }}
            onChange={(e) => onLimitChange(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        {result && !result.error && (
          <span className="meta">
            {result.total} match{result.total === 1 ? '' : 'es'}
            {result.has_more ? ` (showing ${rows.length})` : ''}
          </span>
        )}
      </div>

      {result?.error && (
        <p className="err">{result.error}: {result.message}</p>
      )}

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
                <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <Row key={(r.id as string) ?? i} row={r} cols={cols} />
                ))}
              </tbody>
            </table>
          )
      )}

      {tab === 'sql' && (
        <pre className="code">{result?.sql
          ? `${result.sql}\n\n-- params: ${JSON.stringify(result.params ?? [])}`
          : '(no filter — full scan, or no query run yet)'}</pre>
      )}

      {tab === 'tool' && (
        <pre className="code">{`POST /api/query\n${JSON.stringify(request ?? {}, null, 2)}`}</pre>
      )}
    </div>
  );
}

function Row({ row, cols }: { row: PreviewRow; cols: string[] }) {
  const snippets = row._snippets as SnippetEntry[] | undefined;
  return (
    <>
      <tr>{cols.map((c) => <td key={c}><code>{fmt(row[c])}</code></td>)}</tr>
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
