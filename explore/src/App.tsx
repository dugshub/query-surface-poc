import { useCallback, useEffect, useReducer, useState } from 'react';
import { describe, queryRequest, runQuery } from './api';
import { queryReducer } from './state';
import { emptyQueryState, type EntityCatalog, type SearchResult } from './types';
import { Sidebar } from './components/Sidebar';
import { FieldPanel } from './components/FieldPanel';
import { ResultsPanel } from './components/ResultsPanel';

export function App() {
  const [catalogs, setCatalogs] = useState<EntityCatalog[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [qs, dispatch] = useReducer(queryReducer, emptyQueryState(null));
  const [result, setResult] = useState<SearchResult | null>(null);
  const [running, setRunning] = useState(false);
  const [request, setRequest] = useState<unknown>(null);

  // Load the schema once; select the first entity.
  useEffect(() => {
    describe()
      .then((cs) => {
        setCatalogs(cs);
        if (cs[0]) dispatch({ type: 'selectEntity', entity: cs[0].entity });
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const current = catalogs?.find((c) => c.entity === qs.entity) ?? null;

  const run = useCallback(async () => {
    if (!qs.entity) return;
    setRunning(true);
    setRequest(queryRequest(qs));
    try {
      setResult(await runQuery(qs));
    } catch (e) {
      setResult({ ids: [], total: 0, has_more: false, error: 'request_failed', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setRunning(false);
    }
  }, [qs]);

  // Auto-run when the entity changes (fresh root → show its curated preview).
  // Column toggles do NOT auto-run; the user curates columns then hits Run.
  useEffect(() => {
    if (qs.entity) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs.entity]);

  if (loadErr) return <div className="app"><p className="err" style={{ padding: 20 }}>Failed to load schema: {loadErr}<br /><span className="muted">Is the surface running? `bun src/server.ts`</span></p></div>;
  if (!catalogs) return <div className="app"><p className="muted" style={{ padding: 20 }}>Loading schema…</p></div>;

  return (
    <div className="app">
      <header className="bar">
        <h1>Query Surface — Explore</h1>
        <span className="sub">describe · query · fetch</span>
        <span className="spacer" />
        <span className="sub">
          {qs.columns.length
            ? `projecting ${qs.columns.length} column${qs.columns.length === 1 ? '' : 's'}`
            : 'curated preview'}
        </span>
      </header>

      <div className="layout">
        <Sidebar
          catalogs={catalogs}
          current={qs.entity}
          onSelect={(entity) => dispatch({ type: 'selectEntity', entity })}
        />
        {current
          ? <FieldPanel
              catalog={current}
              selected={qs.columns}
              onToggle={(key) => dispatch({ type: 'toggleColumn', key })}
            />
          : <div className="pane fields"><p className="muted">No entity.</p></div>}
        <ResultsPanel
          result={result}
          running={running}
          request={request}
          limit={qs.page.limit}
          onLimitChange={(limit) => dispatch({ type: 'setLimit', limit })}
          onRun={run}
        />
      </div>
    </div>
  );
}
