import { EntityIcon } from './EntityIcon';
import type { EntityCatalog } from '../types';

interface Props {
  catalogs: EntityCatalog[];
  current: string | null;
  onSelect: (entity: string) => void;
}

/** Horizontal root selector — one entity is the query root at a time. Spans
 *  the full width below the header so it governs both the field panel and the
 *  query panel beneath it. */
export function EntityTabs({ catalogs, current, onSelect }: Props) {
  return (
    <div className="entity-bar" role="tablist">
      {catalogs.map((c) => (
        <button
          key={c.entity}
          type="button"
          role="tab"
          aria-selected={c.entity === current}
          className={'entity-tab' + (c.entity === current ? ' active' : '')}
          onClick={() => onSelect(c.entity)}
          title={c.entity}
        >
          <span className="entity-tab-ico"><EntityIcon name={c.entity} /></span>
          <span className="n">{c.entity}</span>
          <span className="c">{c.fields.length}f · {c.relationships.length}r</span>
        </button>
      ))}
    </div>
  );
}
