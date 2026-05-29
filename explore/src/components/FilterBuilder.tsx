import {
  applyEdit, defaultValueForOp, MULTI_OPS, newGroup, newLeaf,
  NO_VALUE_OPS, opsForField, RANGE_OPS,
  type FGroup, type FLeaf,
} from '../filter';
import { composeOn, parseOn, type PathInfo } from '../graph';
import { EntityIcon } from './EntityIcon';
import type { CatalogField, EntityCatalog, Op } from '../types';

interface Props {
  rootEntity: string;
  catalogs: Map<string, EntityCatalog>;
  paths: Map<string, PathInfo>;
  tree: FGroup;
  onChange: (tree: FGroup) => void;
}

type Shape = 'none' | 'range' | 'multi' | 'single';
const shapeOf = (op: Op): Shape =>
  NO_VALUE_OPS.has(op) ? 'none' : RANGE_OPS.has(op) ? 'range' : MULTI_OPS.has(op) ? 'multi' : 'single';

/** The filter tree editor. Renders one root group; groups nest arbitrarily. */
export function FilterBuilder({ rootEntity, catalogs, paths, tree, onChange }: Props) {
  return (
    <div className="filter">
      <div className="pane-label" style={{ padding: '0 0 6px' }}>Filter</div>
      <GroupView
        node={tree}
        isRoot
        rootEntity={rootEntity}
        catalogs={catalogs}
        paths={paths}
        edit={(e) => onChange(applyEdit(tree, e))}
      />
    </div>
  );
}

interface NodeProps {
  rootEntity: string;
  catalogs: Map<string, EntityCatalog>;
  paths: Map<string, PathInfo>;
  edit: (e: Parameters<typeof applyEdit>[1]) => void;
}

function GroupView({ node, isRoot, ...p }: { node: FGroup; isRoot?: boolean } & NodeProps) {
  return (
    <div className={'fgroup' + (node.negate ? ' negated' : '')}>
      <div className="fgroup-head">
        <button className="conj" title="Toggle AND / OR"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { conj: node.conj === 'and' ? 'or' : 'and' } })}>
          {node.conj.toUpperCase()}
        </button>
        <button className={'ghost neg' + (node.negate ? ' on' : '')} title="Negate this group (NOT)"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { negate: !node.negate } })}>
          NOT
        </button>
        <span className="spacer" />
        <button className="ghost" onClick={() => p.edit({ op: 'add', groupId: node.id, node: newLeaf() })}>+ condition</button>
        <button className="ghost" onClick={() => p.edit({ op: 'add', groupId: node.id, node: newGroup(node.conj === 'and' ? 'or' : 'and') })}>+ group</button>
        {!isRoot && <span className="x" title="remove group" onClick={() => p.edit({ op: 'remove', id: node.id })}>✕</span>}
      </div>
      <div className="fgroup-body">
        {node.children.length === 0 && <div className="muted" style={{ fontSize: 12 }}>empty group</div>}
        {node.children.map((c) =>
          c.kind === 'group'
            ? <GroupView key={c.id} node={c} {...p} />
            : <LeafView key={c.id} leaf={c} {...p} />,
        )}
      </div>
    </div>
  );
}

function LeafView({ leaf, rootEntity, catalogs, paths, edit }: { leaf: FLeaf } & NodeProps) {
  // Resolve the leaf's dotted `on` back into (scope entity, field) for the two pickers.
  const parsed = parseOn(leaf.on, paths);
  const scopeEntity = parsed?.entity ?? rootEntity;
  const fieldKey = parsed?.field ?? 'text';
  const path = paths.get(scopeEntity);
  const scopeCat = catalogs.get(scopeEntity);
  const field = fieldKey === 'text' ? undefined : scopeCat?.fields.find((f) => f.key === fieldKey);
  const ops = opsForField(field);
  const curOp = ops.includes(leaf.op) ? leaf.op : ops[0];

  // Scope dropdown order: root, then reachable, then unreachable (disabled).
  const all = [...catalogs.keys()];
  const reachable = all.filter((e) => e !== rootEntity && paths.has(e)).sort();
  const unreachable = all.filter((e) => e !== rootEntity && !paths.has(e)).sort();

  const fieldKeys = scopeEntity === rootEntity
    ? ['text', ...(scopeCat?.fields.map((f) => f.key) ?? [])]
    : (scopeCat?.fields.map((f) => f.key) ?? []);

  const setSelection = (entity: string, fk: string) => {
    const pth = paths.get(entity);
    if (!pth) return;
    const cat = catalogs.get(entity);
    const f = fk === 'text' ? undefined : cat?.fields.find((x) => x.key === fk);
    const nops = opsForField(f);
    const op = nops.includes(leaf.op) ? leaf.op : nops[0];
    const value = shapeOf(op) === shapeOf(leaf.op) ? leaf.value : defaultValueForOp(op);
    edit({ op: 'patchLeaf', id: leaf.id, patch: { on: composeOn(pth.prefix, fk), op, value } });
  };
  const onScopeChange = (entity: string) => {
    const cat = catalogs.get(entity);
    setSelection(entity, entity === rootEntity ? 'text' : (cat?.fields[0]?.key ?? ''));
  };
  const onOpChange = (op: Op) => {
    const patch: Partial<FLeaf> = { op };
    if (shapeOf(op) !== shapeOf(leaf.op)) patch.value = defaultValueForOp(op);
    edit({ op: 'patchLeaf', id: leaf.id, patch });
  };

  return (
    <div className="fleaf">
      <span className="scope-icons" role="group" aria-label="entity to filter on">
        {[rootEntity, ...reachable, ...unreachable].map((e) => {
          const isReach = e === rootEntity || paths.has(e);
          const info = paths.get(e);
          const hm = !!info?.hasMany;
          const via = info && info.prefix.length ? ` · via ${info.prefix.join('.')}` : '';
          const title = isReach ? `${e}${hm ? ' · any (EXISTS)' : ''}${via}` : `${e} · no path from ${rootEntity}`;
          return (
            <button
              key={e} type="button"
              className={'scope-icon' + (e === scopeEntity ? ' active' : '') + (hm ? ' many' : '')}
              disabled={!isReach} title={title}
              onClick={() => onScopeChange(e)}
            >
              <EntityIcon name={e} />
            </button>
          );
        })}
      </span>
      {path?.hasMany && <span className="any" title="reached via a has_many → compiles to an EXISTS sub-query">any</span>}
      <select className="fld" value={fieldKey} title="field" onChange={(e) => setSelection(scopeEntity, e.target.value)}>
        {fieldKeys.map((k) => <option key={k} value={k}>{k === 'text' ? 'text — search all' : k}</option>)}
      </select>
      <select className="op" value={curOp} onChange={(e) => onOpChange(e.target.value as Op)}>
        {ops.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ValueWidget op={curOp} field={field} value={leaf.value} onChange={(value) => edit({ op: 'patchLeaf', id: leaf.id, patch: { value } })} />
      <span className="x" title="remove condition" onClick={() => edit({ op: 'remove', id: leaf.id })}>✕</span>
    </div>
  );
}

function ValueWidget({ op, field, value, onChange }: { op: Op; field?: CatalogField; value: unknown; onChange: (v: unknown) => void }) {
  const shape = shapeOf(op);
  if (shape === 'none') return <span className="novalue">—</span>;

  const inputType = field?.type === 'number' || field?.type === 'integer' ? 'number'
    : field?.type === 'date' ? 'date'
    : field?.type === 'datetime' ? 'datetime-local'
    : 'text';
  const coerce = (raw: string): string | number => (inputType === 'number' && raw !== '' ? Number(raw) : raw);

  if (shape === 'range') {
    const [a, b] = Array.isArray(value) ? (value as unknown[]) : ['', ''];
    return (
      <span className="range">
        <input className="val" type={inputType} value={String(a ?? '')} onChange={(e) => onChange([coerce(e.target.value), b])} />
        <span className="to">to</span>
        <input className="val" type={inputType} value={String(b ?? '')} onChange={(e) => onChange([a, coerce(e.target.value)])} />
      </span>
    );
  }

  if (shape === 'multi') {
    if (field?.type === 'enum' && field.enumValues) {
      const set = new Set(Array.isArray(value) ? (value as string[]) : []);
      return (
        <span className="multi">
          {field.enumValues.map((ev) => (
            <label key={ev} className="chk">
              <input type="checkbox" checked={set.has(ev)}
                onChange={() => { const n = new Set(set); n.has(ev) ? n.delete(ev) : n.add(ev); onChange([...n]); }} />
              {ev}
            </label>
          ))}
        </span>
      );
    }
    return (
      <input className="val" placeholder="a, b, c"
        value={Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
        onChange={(e) => onChange(e.target.value)} />
    );
  }

  // single
  if (field?.type === 'enum' && field.enumValues) {
    return (
      <select className="val" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {field.enumValues.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
      </select>
    );
  }
  if (field?.type === 'boolean') {
    return (
      <select className="val" value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value === 'true')}>
        <option value="">—</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <input className="val" type={inputType} placeholder="value…" value={String(value ?? '')}
      onChange={(e) => onChange(coerce(e.target.value))} />
  );
}
