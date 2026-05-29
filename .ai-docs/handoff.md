# Handoff — 2026-05-29

**Branch:** `feat/explore-m0` (11 commits, NOT pushed)
**Last action:** Built the semantic-layer **"Metrics · preview"** mode in the Explore app (`db8c4af`), faithful to `codegen-patterns/runtime/analytics`; fixed the pathfinder 400 (`c5098c3`) + entity icon picker / price-tag.
**Next action:** Decide push vs split PR (projection core `ad8c140` is separable from the `explore/` app); optionally the visual "coat of paint". Later: make Metrics preview real once `qField()` carries measure/dimension facets.
**Obstacles:**
- Metrics preview is INFERRED, not powered — becomes real when `qField()` gains `SemanticFieldConfig` facets + `describe()` surfaces them + the field-metadata→Cube compiler lands (the bridge codegen-patterns stubs).
- `in`/`nin` numeric coercion still string-based (works via engine/Postgres coercion; deferred).
- Doctor-in-UI (inline relationship warnings in the field picker) needs a small `/api/doctor` endpoint (not built).

## Notes
- **Run:** `DATABASE_URL=… bun src/server.ts` (:3577 surface) + `cd explore && bun install && bun run dev` (:5377 Explore). Open **:5377** — NOT :3577 (that's the old reference page `src/web/index.html`). Metrics mode deep-links via `?mode=metrics`.
- The Explore instrument is a **separate Vite+React app under `explore/`** (own package.json / node_modules); the package stays dependency-free. The only core-package change is backend **projection** (`columns`, `ad8c140`) in `src/query`.
- Full rung history in memory [[explore-ui-build]]; projection/governance in [[query-surface-architecture]]; the Cube/metrics model in [[codegen-analytics-model]].
- Don't squat default dev ports / leave servers running — see [[local-ports-and-procs]].
