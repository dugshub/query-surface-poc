# Explore

A Looker-Explore-style instrument over the query surface — pick an entity,
project columns, filter, sort, and inspect results. A pure SPA client of the
three primitives (`describe` / `query` / `fetch`); the package itself stays
dependency-free. The original `src/web/index.html` remains as the lightweight
reference UI.

## Run

Two processes, side by side:

```bash
# terminal 1 — the surface (framework-free Bun adapter)
DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/server.ts   # → :3577

# terminal 2 — this app (Vite dev server, proxies /api → :3577)
cd explore
bun install        # first time only
bun run dev        # → http://localhost:5377  (not Vite's default 5173, to avoid clobbering other local apps)
```

Point at a surface on another port with `QS_API_TARGET=http://localhost:3599 bun run dev`.

## Shape

- `src/types.ts` — hand-maintained mirror of the surface contract (no package import).
- `src/api.ts` — typed client; `queryRequest()` is both the request body and the "tool call" shown in the UI.
- `src/state.ts` — the query-state reducer; the one object every pane is a projection of.
- `src/App.tsx` — three-pane shell (entities · fields · results).
- `src/components/` — `Sidebar` · `FieldPanel` · `ResultsPanel`.

## Roadmap (rungs)

- **M0** ✅ shell + projection (pick columns → projection-backed results, SQL + tool-call tabs)
- **M1** type-aware filter leaf (op menus by type, value widgets, provenance badges)
- **M2** nested and/or/not boolean tree + relationship-aware field picker
- **M3** fetch drill-down drawer (hydrate + expand) + click-to-sort + paging
- **M4** save / share (URL hash) + history + copy-as-MCP-call + example seeds
