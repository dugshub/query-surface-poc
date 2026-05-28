import type { EntityCatalog } from '../types';

interface Props {
  catalogs: EntityCatalog[];
  current: string | null;
  onSelect: (entity: string) => void;
}

/** Left pane — the Explore roots. One entity is the query root at a time. */
export function Sidebar({ catalogs, current, onSelect }: Props) {
  return (
    <div className="pane sidebar">
      <div className="pane-label">Entities</div>
      {catalogs.map((c) => (
        <div
          key={c.entity}
          className={'ent' + (c.entity === current ? ' active' : '')}
          onClick={() => onSelect(c.entity)}
        >
          <span className="n" title={c.entity}>{c.entity}</span>
          <span className="c">{c.fields.length}f · {c.relationships.length}r</span>
        </div>
      ))}
    </div>
  );
}
