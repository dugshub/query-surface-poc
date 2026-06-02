import { composeOn, type PathInfo } from '../graph';
import { entityLabel, fieldLabel } from '../labels';
import type { CatalogField, EntityCatalog, FacetSource } from '../types';

interface Props {
  catalog: EntityCatalog;                  // the root entity
  catalogs: Map<string, EntityCatalog>;    // all entities (for related attrs)
  paths: Map<string, PathInfo>;            // root → reachable entity paths
  selected: string[];                       // projected column keys (query-state.columns)
  onToggle: (key: string) => void;
}

const SRC_CLASS: Record<FacetSource, string> = {
  drizzle: 'src-drizzle', field_definition: 'src-field-def', field_meta: 'src-field-meta', derived: 'src-derived',
};
const SRC_LABEL: Record<FacetSource, string> = {
  drizzle: 'drizzle', field_definition: 'field_def', field_meta: 'qField', derived: 'derived',
};

/**
 * Middle pane — projectable columns. The root entity's fields, plus the
 * attributes of every belongs_to-reachable related entity (keyed by dotted path,
 * e.g. account.name). has_many-reachable entities can't be scalar columns (no
 * aggregation here) — they're filter-only, listed for orientation. Hidden
 * (isVisible:false) fields never appear; describe() already excludes them.
 */
export function FieldPanel({ catalog, catalogs, paths, selected, onToggle }: Props) {
  const sel = new Set(selected);
  const root = catalog.entity;

  const row = (f: CatalogField, columnKey: string) => {
    const srcs = [...new Set(Object.values(f.sources))] as FacetSource[];
    return (
      <label className="field" key={columnKey} title={columnKey}>
        <input type="checkbox" checked={sel.has(columnKey)} onChange={() => onToggle(columnKey)} />
        <span className="fname">{fieldLabel(f)}</span>
        {f.eav && <span className="tag eav">eav</span>}
        <span className="prov">{srcs.map((s) => <span key={s} className={'dot ' + SRC_CLASS[s]} title={SRC_LABEL[s]} />)}</span>
        <span className="ftype">{f.type === 'enum' && f.enumValues ? `enum(${f.enumValues.length})` : f.type}</span>
      </label>
    );
  };

  const related = [...paths.values()].filter((p) => p.entity !== root);
  const projectable = related.filter((p) => !p.hasMany);   // belongs_to-reachable → columns
  const filterOnly = related.filter((p) => p.hasMany);     // has_many → filter-only

  return (
    <div className="pane fields">
      <div className="pane-label">Fields — check to add as column</div>
      <div className="prov-legend">
        {(Object.keys(SRC_LABEL) as FacetSource[]).map((s) => (
          <span key={s} className="prov-item"><span className={'dot ' + SRC_CLASS[s]} /> {SRC_LABEL[s]}</span>
        ))}
      </div>

      {catalog.fields.filter((f) => !f.eav).length > 0 && <div className="field-section">native</div>}
      {catalog.fields.filter((f) => !f.eav).map((f) => row(f, f.key))}
      {catalog.fields.filter((f) => f.eav).length > 0 && <div className="field-section">eav / custom</div>}
      {catalog.fields.filter((f) => f.eav).map((f) => row(f, f.key))}

      {projectable.length > 0 && <div className="field-section">related — projectable columns</div>}
      {projectable.map((p) => {
        const cat = catalogs.get(p.entity);
        if (!cat) return null;
        return (
          <details className="relcols" key={p.entity} title={`via ${p.prefix.join('.')}`}>
            <summary>{entityLabel(p.entity)}</summary>
            {cat.fields.map((f) => row(f, composeOn(p.prefix, f.key)))}
          </details>
        );
      })}

      {filterOnly.length > 0 && (
        <>
          <div className="field-section">related — filter-only (has_many)</div>
          <div className="filteronly-note">
            {filterOnly.map((p) => entityLabel(p.entity)).join(', ')} — query via the filter builder (EXISTS); not projectable as columns.
          </div>
        </>
      )}
    </div>
  );
}
