import { EntityIcon } from './EntityIcon';
import { entityLabel } from '../labels';
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
  // Junctions are traversable but not first-class query roots — keep them out of
  // the root picker (they're still reachable via relationship paths / filters).
  const roots = catalogs.filter((c) => c.kind !== 'junction');
  return (
    <div className="entity-bar" role="tablist">
      {roots.map((c) => (
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
          <span className="n">{entityLabel(c.entity)}</span>
          <span className="c">{c.fields.length}f · {c.relationships.length}r</span>
        </button>
      ))}
    </div>
  );
}
