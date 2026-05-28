import type { CatalogField, EntityCatalog } from '../types';

interface Props {
  catalog: EntityCatalog;
  /** Currently-projected column keys (query-state.columns). */
  selected: string[];
  onToggle: (key: string) => void;
}

/**
 * Middle pane — the describe-driven field catalog for the current entity. Each
 * field's checkbox toggles it as a result column (projection). Hidden
 * (isVisible:false) fields never appear here: describe() already excludes them.
 * Relationships are listed read-only for now; traversal lands in M2.
 */
export function FieldPanel({ catalog, selected, onToggle }: Props) {
  const sel = new Set(selected);
  const native = catalog.fields.filter((f) => !f.eav);
  const eav = catalog.fields.filter((f) => f.eav);

  const row = (f: CatalogField) => (
    <label className="field" key={f.key} title={f.label ?? f.key}>
      <input
        type="checkbox"
        checked={sel.has(f.key)}
        onChange={() => onToggle(f.key)}
      />
      <span className="fname">{f.key}</span>
      {f.eav && <span className="tag eav">eav</span>}
      <span className="ftype">{f.type === 'enum' && f.enumValues ? `enum(${f.enumValues.length})` : f.type}</span>
    </label>
  );

  return (
    <div className="pane fields">
      <div className="pane-label">Fields — check to add as column</div>
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
