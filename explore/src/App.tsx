import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { describe, queryRequest, runQuery } from './api';
import { queryReducer } from './state';
import { camelize, rootGroup, toExpression, type FGroup } from './filter';
import { pathsFrom, type PathInfo } from './graph';
import type { FilterExpression } from './types';
import {
  clearHistory, loadHistory, pushHistory, readHash, summarize, writeHash,
  type HistEntry, type Snapshot,
} from './url';
import { emptyQueryState, type EntityCatalog, type SearchResult } from './types';
import { Sidebar } from './components/Sidebar';
import { FieldPanel } from './components/FieldPanel';
import { FilterBuilder } from './components/FilterBuilder';
import { ResultsPanel } from './components/ResultsPanel';
import { DrillDrawer } from './components/DrillDrawer';
import { QueryBar } from './components/QueryBar';

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
  // Monotonic run id — guards against out-of-order responses clobbering newer ones.
  const seqRef = useRef(0);

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
    let filter: FilterExpression | undefined;
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
        <h1>Query Surface — Explore</h1>
        <span className="sub">describe · query · fetch</span>
        <QueryBar snapshot={snapshot} history={history} onLoad={load} onClearHistory={() => { clearHistory(); setHistory([]); }} />
        <span className="spacer" />
        <span className="sub">
          {qs.columns.length ? `projecting ${qs.columns.length} column${qs.columns.length === 1 ? '' : 's'}` : 'curated preview'}
        </span>
      </header>

      <div className="layout">
        <Sidebar catalogs={catalogs} current={qs.entity} onSelect={selectEntity} />
        {current
          ? <FieldPanel catalog={current} catalogs={catalogMap} paths={paths} selected={qs.columns} onToggle={(key) => dispatch({ type: 'toggleColumn', key })} />
          : <div className="pane fields"><p className="muted">No entity.</p></div>}
        <div className="pane main">
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
          />
        </div>
      </div>

      {drillId && current && (
        <DrillDrawer key={drillId} entity={current.entity} id={drillId} catalog={current} onClose={() => setDrillId(null)} />
      )}
    </div>
  );
}
