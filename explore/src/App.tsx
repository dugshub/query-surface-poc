import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { describe, queryRequest, runQuery } from './api';
import { queryReducer } from './state';
import { camelize, rootGroup, toExpression, type FGroup } from './filter';
import { pathsFrom, type PathInfo } from './graph';
import { columnLabel } from './labels';
import type { Predicate } from './types';
import {
  clearHistory, loadHistory, pushHistory, readHash, summarize, writeHash,
  type HistEntry, type Snapshot,
} from './url';
import { emptyQueryState, type EntityCatalog, type SearchResult } from './types';
import { EntityTabs } from './components/EntityTabs';
import { FieldPanel } from './components/FieldPanel';
import { FilterBuilder } from './components/FilterBuilder';
import { ResultsPanel } from './components/ResultsPanel';
import { DrillDrawer } from './components/DrillDrawer';
import { QueryBar } from './components/QueryBar';
import { GlobalSearch } from './components/GlobalSearch';
import { SearchPage } from './components/SearchPage';
import { MetricsPanel } from './components/MetricsPanel';

export function App() {
  const [catalogs, setCatalogs] = useState<EntityCatalog[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [qs, dispatch] = useReducer(queryReducer, emptyQueryState(null));
  const [tree, setTree] = useState<FGroup>(rootGroup);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [running, setRunning] = useState(false);
  const [request, setRequest] = useState<unknown>(null);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistEntry[]>(loadHistory);
  const [runToken, setRunToken] = useState(0);
  const [mode, setMode] = useState<'explore' | 'search' | 'metrics'>(() => {
    const m = new URLSearchParams(location.search).get('mode');
    return m === 'metrics' || m === 'search' ? m : 'explore';
  });
  // Theme — initialized from the pre-paint attribute set in index.html.
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
  );
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Monotonic run id — guards against out-of-order responses clobbering newer ones.
  const seqRef = useRef(0);

  // Draggable field-sidebar width (persisted). The sidebar is the first grid
  // track starting at x=0, so the drag width is just the clamped clientX.
  const [fieldsW, setFieldsW] = useState<number>(() => {
    const v = Number(localStorage.getItem('fieldsW'));
    return v >= 200 && v <= 640 ? v : 300;
  });
  const draggingRef = useRef(false);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFieldsW(Math.min(640, Math.max(200, e.clientX)));
    };
    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);
  useEffect(() => { localStorage.setItem('fieldsW', String(fieldsW)); }, [fieldsW]);
  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, []);

  const requestRun = useCallback(() => setRunToken((t) => t + 1), []);

  const run = useCallback(async () => {
    if (!qs.entity) return;
    const seq = ++seqRef.current;
    setRunning(true);
    setRequest(queryRequest(qs));
    try {
      const r = await runQuery(qs);
      if (seq !== seqRef.current) return; // a newer run started — drop this stale result
      setResult(r);
      if (!r.error) {
        const snap: Snapshot = { entity: qs.entity, tree, columns: qs.columns, sort: qs.sort, limit: qs.page.limit, offset: qs.page.offset };
        setHistory((h) => pushHistory(h, { ts: Date.now(), label: summarize(snap), snap }));
      }
    } catch (e) {
      if (seq !== seqRef.current) return;
      setResult({ ids: [], total: 0, has_more: false, error: 'request_failed', message: e instanceof Error ? e.message : String(e) });
    } finally {
      if (seq === seqRef.current) setRunning(false);
    }
  }, [qs, tree]);

  // Global search pick — jump to the hit's entity and open its full row. Only
  // reset the query when actually switching entity, so picking a hit in the
  // current entity leaves the existing filter intact.
  const onGlobalPick = useCallback((entity: string, id: string) => {
    if (entity !== qs.entity) {
      dispatch({ type: 'selectEntity', entity });
      setTree(rootGroup());
      requestRun();
    }
    setDrillId(id);
  }, [requestRun, qs.entity]);

  // Switch root entity — explicit user action (resets the field-scoped state).
  // No-op on the active entity so an accidental re-click doesn't wipe the filter.
  const selectEntity = useCallback((entity: string) => {
    if (entity === qs.entity) return;
    dispatch({ type: 'selectEntity', entity });
    setTree(rootGroup());
    setDrillId(null);
    requestRun();
  }, [requestRun, qs.entity]);

  // Restore a saved/example Snapshot — set everything at once, then run. A
  // malformed tree (stale link / bad hand-edit) degrades to just the entity
  // rather than throwing into a fatal error.
  const load = useCallback((s: Snapshot) => {
    let filter: Predicate | undefined;
    try { filter = toExpression(s.tree); }
    catch { if (s.entity) { dispatch({ type: 'selectEntity', entity: s.entity }); setTree(rootGroup()); setDrillId(null); requestRun(); } return; }
    setTree(s.tree);
    setDrillId(null);
    dispatch({ type: 'hydrate', state: { entity: s.entity, filter, sort: s.sort, columns: s.columns, expand: [], page: { limit: s.limit, offset: s.offset } } });
    requestRun();
  }, [requestRun]);

  // Load the schema once; restore from the URL hash if present, else pick the
  // first entity. The ignore flag makes StrictMode's double-invoke a no-op.
  useEffect(() => {
    let ignore = false;
    describe()
      .then((cs) => {
        if (ignore) return;
        setCatalogs(cs);
        const snap = readHash();
        if (snap?.entity && cs.some((c) => c.entity === snap.entity)) load(snap);
        else if (cs[0]) selectEntity(cs[0].entity);
      })
      .catch((e) => { if (!ignore) setLoadErr(e instanceof Error ? e.message : String(e)); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run on explicit request (entity switch / sort / paging / load).
  useEffect(() => {
    if (runToken && qs.entity) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  const catalogMap = useMemo(() => new Map((catalogs ?? []).map((c) => [c.entity, c])), [catalogs]);
  const current = qs.entity ? catalogMap.get(qs.entity) ?? null : null;
  // Relationship paths from the current root → every reachable entity.
  const paths = useMemo<Map<string, PathInfo>>(
    () => (current ? pathsFrom(current.entity, catalogMap) : new Map()),
    [current, catalogMap],
  );

  const snapshot: Snapshot = { entity: qs.entity, tree, columns: qs.columns, sort: qs.sort, limit: qs.page.limit, offset: qs.page.offset };

  // Keep the URL hash mirroring the current query (so it's always shareable).
  useEffect(() => {
    if (qs.entity) writeHash(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, tree]);

  const onTreeChange = (t: FGroup) => {
    setTree(t);
    dispatch({ type: 'setFilter', filter: toExpression(t) });
  };

  const onToggleSort = (field: string) => {
    const cur = qs.sort[0];
    // Compare canonically so the same column tracks across curated camelCase
    // keys and projected snake_case keys (resolvePath camelizes either way).
    const same = cur && camelize(cur.field) === camelize(field);
    const next = !same
      ? [{ field, dir: 'asc' as const }]
      : cur.dir === 'asc' ? [{ field, dir: 'desc' as const }] : [];
    dispatch({ type: 'setSort', sort: next });
    requestRun();
  };

  const onOffsetChange = (offset: number) => {
    dispatch({ type: 'setOffset', offset });
    requestRun();
  };

  const onLimitChange = (limit: number) => {
    dispatch({ type: 'setLimit', limit });
    requestRun();
  };

  if (loadErr) return <div className="app"><p className="err" style={{ padding: 20 }}>Failed to load schema: {loadErr}<br /><span className="muted">Is the surface running? `bun src/server.ts`</span></p></div>;
  if (!catalogs) return <div className="app"><p className="muted" style={{ padding: 20 }}>Loading schema…</p></div>;

  return (
    <div className="app">
      <header className="bar">
        <h1>Query Surface</h1>
        <div className="mode-toggle">
          <button type="button" className={mode === 'explore' ? 'on' : ''} onClick={() => setMode('explore')}>Explore</button>
          <button type="button" className={mode === 'search' ? 'on' : ''} onClick={() => setMode('search')}>Search</button>
          <button type="button" className={mode === 'metrics' ? 'on' : ''} onClick={() => setMode('metrics')}>Metrics<span className="pv">preview</span></button>
        </div>
        {mode === 'explore' && (
          <QueryBar snapshot={snapshot} history={history} onLoad={load} onClearHistory={() => { clearHistory(); setHistory([]); }} />
        )}
        <span className="spacer" />
        {mode === 'explore' && <GlobalSearch catalogs={catalogs} onPick={onGlobalPick} />}
        <button
          type="button"
          className="ghost theme-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
        <span className="sub">
          {mode === 'metrics'
            ? 'semantic layer · not powered'
            : mode === 'search'
              ? 'one filter · every entity'
              : qs.columns.length ? `projecting ${qs.columns.length} column${qs.columns.length === 1 ? '' : 's'}` : 'curated preview'}
        </span>
      </header>

      {mode === 'search' ? (
        <div className="pane main searchpage-wrap">
          <SearchPage catalogs={catalogs} onPick={onGlobalPick} />
        </div>
      ) : (
      <div className="layout" style={{ gridTemplateColumns: `${fieldsW}px 6px 1fr` }}>
        {current
          ? <FieldPanel catalog={current} catalogs={catalogMap} paths={paths} selected={qs.columns} onToggle={(key) => dispatch({ type: 'toggleColumn', key })} />
          : <div className="pane fields"><p className="muted">No entity.</p></div>}
        <div className="resizer" onPointerDown={startResize} role="separator" aria-orientation="vertical" title="Drag to resize">
          <span className="resizer-grip" />
        </div>
        <div className="pane main">
          <EntityTabs catalogs={catalogs} current={qs.entity} onSelect={selectEntity} />
          {mode === 'metrics'
            ? (current ? <MetricsPanel key={current.entity} catalog={current} /> : <p className="muted">No entity.</p>)
            : (
              <>
                {current && <FilterBuilder rootEntity={current.entity} catalogs={catalogMap} paths={paths} tree={tree} onChange={onTreeChange} />}
                <ResultsPanel
                  result={result}
                  running={running}
                  request={request}
                  limit={qs.page.limit}
                  offset={qs.page.offset}
                  sort={qs.sort}
                  onLimitChange={onLimitChange}
                  onOffsetChange={onOffsetChange}
                  onToggleSort={onToggleSort}
                  onRun={run}
                  onRowClick={setDrillId}
                  colLabel={current ? (c) => columnLabel(c, current, catalogMap, paths) : undefined}
                />
              </>
            )}
        </div>
      </div>
      )}

      {drillId && current && (
        <DrillDrawer key={drillId} entity={current.entity} id={drillId} catalog={current} onClose={() => setDrillId(null)} />
      )}
    </div>
  );
}

// Shown in dark mode (click → light).
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// Shown in light mode (click → dark).
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
