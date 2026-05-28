import {
  applyEdit, defaultValueForOp, fieldOptions, MULTI_OPS, newGroup, newLeaf,
  NO_VALUE_OPS, opsForField, RANGE_OPS,
  type FGroup, type FieldOption, type FLeaf,
} from '../filter';
import type { CatalogField, EntityCatalog, Op } from '../types';

interface Props {
  rootEntity: string;
  catalogs: Map<string, EntityCatalog>;
  tree: FGroup;
  onChange: (tree: FGroup) => void;
}

type Shape = 'none' | 'range' | 'multi' | 'single';
const shapeOf = (op: Op): Shape =>
  NO_VALUE_OPS.has(op) ? 'none' : RANGE_OPS.has(op) ? 'range' : MULTI_OPS.has(op) ? 'multi' : 'single';

/** The filter tree editor. Renders one root group; groups nest arbitrarily. */
export function FilterBuilder({ rootEntity, catalogs, tree, onChange }: Props) {
  const options = fieldOptions(rootEntity, catalogs);
  const byValue = new Map(options.map((o) => [o.value, o]));
  const groups = [...new Set(options.map((o) => o.group))];

  return (
    <div className="filter">
      <div className="pane-label" style={{ padding: '0 0 6px' }}>Filter</div>
      <GroupView
        node={tree}
        isRoot
        options={options}
        optionGroups={groups}
        byValue={byValue}
        edit={(e) => onChange(applyEdit(tree, e))}
      />
    </div>
  );
}

interface NodeProps {
  options: FieldOption[];
  optionGroups: string[];
  byValue: Map<string, FieldOption>;
  edit: (e: Parameters<typeof applyEdit>[1]) => void;
}

function GroupView({ node, isRoot, ...p }: { node: FGroup; isRoot?: boolean } & NodeProps) {
  return (
    <div className={'fgroup' + (node.negate ? ' negated' : '')}>
      <div className="fgroup-head">
        <button
          className="conj"
          title="Toggle AND / OR"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { conj: node.conj === 'and' ? 'or' : 'and' } })}
        >
          {node.conj.toUpperCase()}
        </button>
        <button
          className={'ghost neg' + (node.negate ? ' on' : '')}
          title="Negate this group (NOT)"
          onClick={() => p.edit({ op: 'patchGroup', id: node.id, patch: { negate: !node.negate } })}
        >
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

function LeafView({ leaf, options, optionGroups, byValue, edit }: { leaf: FLeaf } & NodeProps) {
  const opt = byValue.get(leaf.on);
  const field = opt?.field;
  const ops = opsForField(field);
  const curOp = ops.includes(leaf.op) ? leaf.op : ops[0];

  const onFieldChange = (on: string) => {
    const nf = byValue.get(on)?.field;
    const nops = opsForField(nf);
    const op = nops.includes(leaf.op) ? leaf.op : nops[0];
    edit({ op: 'patchLeaf', id: leaf.id, patch: { on, op, value: defaultValueForOp(op) } });
  };
  const onOpChange = (op: Op) => {
    const patch: Partial<FLeaf> = { op };
    if (shapeOf(op) !== shapeOf(leaf.op)) patch.value = defaultValueForOp(op);
    edit({ op: 'patchLeaf', id: leaf.id, patch });
  };
  const setValue = (value: unknown) => edit({ op: 'patchLeaf', id: leaf.id, patch: { value } });

  return (
    <div className="fleaf">
      {opt?.hasMany && <span className="any" title="crosses a has_many → compiles to EXISTS">any</span>}
      <select className="fld" value={leaf.on} onChange={(e) => onFieldChange(e.target.value)}>
        {optionGroups.map((g) => (
          <optgroup key={g} label={g}>
            {options.filter((o) => o.group === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
      <select className="op" value={curOp} onChange={(e) => onOpChange(e.target.value as Op)}>
        {ops.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ValueWidget op={curOp} field={field} value={leaf.value} onChange={setValue} />
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
              <input
                type="checkbox"
                checked={set.has(ev)}
                onChange={() => { const n = new Set(set); n.has(ev) ? n.delete(ev) : n.add(ev); onChange([...n]); }}
              />
              {ev}
            </label>
          ))}
        </span>
      );
    }
    return (
      <input
        className="val"
        placeholder="a, b, c"
        value={Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
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
      <select className="val" value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value === 'true')}>
        <option value="">—</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <input
      className="val"
      type={inputType}
      placeholder="value…"
      value={String(value ?? '')}
      onChange={(e) => onChange(coerce(e.target.value))}
    />
  );
}
