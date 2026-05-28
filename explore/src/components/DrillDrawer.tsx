import { useEffect, useState } from 'react';
import { runFetch } from '../api';
import type { EntityCatalog, FetchResult, RelationshipInfo } from '../types';

interface Props {
  entity: string;
  id: string;
  catalog: EntityCatalog;
  onClose: () => void;
}

const fmtFull = (v: unknown): string =>
  v == null ? '—' : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);

/**
 * Drill-down — hydrate one row via /api/fetch and show the full record (all
 * columns, EAV merged inline). Toggle relationships to expand: belongs_to inlines
 * an object, has_many inlines an array. This is the describe→query→fetch loop's
 * payoff: the coherent object an agent actually consumes.
 */
export function DrillDrawer({ entity, id, catalog, onClose }: Props) {
  const rels = catalog.relationships;
  const [expand, setExpand] = useState<string[]>([]);
  const [res, setRes] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    runFetch(entity, [id], expand)
      .then((r) => { if (live) setRes(r); })
      .catch((e) => { if (live) setRes({ entity, rows: [], count: 0, error: 'fetch_failed', message: e instanceof Error ? e.message : String(e) }); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [entity, id, expand]);

  const row = res?.rows?.[0];
  const relNames = new Set(rels.map((r) => r.name));
  const scalars = row ? Object.entries(row).filter(([k]) => !relNames.has(k)) : [];

  const toggle = (name: string) =>
    setExpand((x) => (x.includes(name) ? x.filter((n) => n !== name) : [...x, name]));

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div><b>{entity}</b> <code className="muted">{id}</code></div>
          <span className="x" onClick={onClose}>✕</span>
        </div>

        <div className="drawer-expand">
          <span className="muted">expand</span>
          {rels.length === 0 && <span className="muted">— no relations</span>}
          {rels.map((r) => (
            <label key={r.name} className="chk" title={`${r.kind} → ${r.target}`}>
              <input type="checkbox" checked={expand.includes(r.name)} onChange={() => toggle(r.name)} />
              {r.name}<span className="muted">{r.kind === 'has_many' ? ' []' : ' {}'}</span>
            </label>
          ))}
        </div>

        <div className="drawer-body">
          {loading && <p className="muted">Loading…</p>}
          {res?.error && <p className="err">{res.error}: {res.message}</p>}
          {!loading && !row && !res?.error && <p className="muted">No row.</p>}
          {row && (
            <>
              <table className="kv"><tbody>
                {scalars.map(([k, v]) => (
                  <tr key={k}><td className="k">{k}</td><td className="v"><code>{fmtFull(v)}</code></td></tr>
                ))}
              </tbody></table>
              {rels.filter((r) => expand.includes(r.name)).map((r) => (
                <RelView key={r.name} rel={r} value={row[r.name]} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function RelView({ rel, value }: { rel: RelationshipInfo; value: unknown }) {
  const items = Array.isArray(value) ? value : value == null ? [] : [value];
  const isMany = rel.kind === 'has_many';
  const shown = items.slice(0, 10);

  return (
    <div className="rel-section">
      <div className="rel-title">
        <b>{rel.name}</b> <span className="muted">{rel.kind} → {rel.target}</span>
        {isMany && <span className="muted"> · {items.length} row{items.length === 1 ? '' : 's'}</span>}
      </div>
      {items.length === 0 && <div className="muted" style={{ fontSize: 12 }}>{isMany ? 'none' : 'null'}</div>}
      {shown.map((it, i) => (
        <table className="kv nested" key={i}><tbody>
          {Object.entries(it as Record<string, unknown>).map(([k, v]) => (
            <tr key={k}><td className="k">{k}</td><td className="v"><code>{fmtFull(v)}</code></td></tr>
          ))}
        </tbody></table>
      ))}
      {items.length > shown.length && <div className="muted" style={{ fontSize: 12 }}>+ {items.length - shown.length} more</div>}
    </div>
  );
}
