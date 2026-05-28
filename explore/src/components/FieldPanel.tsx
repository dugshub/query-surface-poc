import type { CatalogField, EntityCatalog, FacetSource } from '../types';

interface Props {
  catalog: EntityCatalog;
  /** Currently-projected column keys (query-state.columns). */
  selected: string[];
  onToggle: (key: string) => void;
}

const SRC_CLASS: Record<FacetSource, string> = {
  drizzle: 'src-drizzle',
  field_definition: 'src-field-def',
  field_meta: 'src-field-meta',
  derived: 'src-derived',
};
const SRC_LABEL: Record<FacetSource, string> = {
  drizzle: 'drizzle',
  field_definition: 'field_def',
  field_meta: 'qField',
  derived: 'derived',
};

/**
 * Middle pane — the describe-driven field catalog for the current entity. Each
 * field's checkbox toggles it as a result column (projection); coloured dots show
 * where its metadata came from (provenance). Hidden (isVisible:false) fields never
 * appear here — describe() already excludes them. Relationships are read-only.
 */
export function FieldPanel({ catalog, selected, onToggle }: Props) {
  const sel = new Set(selected);
  const native = catalog.fields.filter((f) => !f.eav);
  const eav = catalog.fields.filter((f) => f.eav);

  const row = (f: CatalogField) => {
    const srcs = [...new Set(Object.values(f.sources))] as FacetSource[];
    return (
      <label className="field" key={f.key} title={f.label ?? f.key}>
        <input type="checkbox" checked={sel.has(f.key)} onChange={() => onToggle(f.key)} />
        <span className="fname">{f.key}</span>
        {f.eav && <span className="tag eav">eav</span>}
        <span className="prov">
          {srcs.map((s) => <span key={s} className={'dot ' + SRC_CLASS[s]} title={SRC_LABEL[s]} />)}
        </span>
        <span className="ftype">{f.type === 'enum' && f.enumValues ? `enum(${f.enumValues.length})` : f.type}</span>
      </label>
    );
  };

  return (
    <div className="pane fields">
      <div className="pane-label">Fields — check to add as column</div>
      <div className="prov-legend">
        {(Object.keys(SRC_LABEL) as FacetSource[]).map((s) => (
          <span key={s} className="prov-item"><span className={'dot ' + SRC_CLASS[s]} /> {SRC_LABEL[s]}</span>
        ))}
      </div>
      {native.length > 0 && <div className="field-section">native</div>}
      {native.map(row)}
      {eav.length > 0 && <div className="field-section">eav / custom</div>}
      {eav.map(row)}
      {catalog.relationships.length > 0 && <div className="field-section">relationships</div>}
      {catalog.relationships.map((r) => (
        <div className="field" key={r.name} title={`${r.kind} → ${r.target}`}>
          <span className="fname" style={{ marginLeft: 20 }}>{r.name}</span>
          <span className="tag rel">{r.kind === 'has_many' ? 'has many' : 'belongs to'}</span>
          <span className="ftype">{r.target}</span>
        </div>
      ))}
    </div>
  );
}
