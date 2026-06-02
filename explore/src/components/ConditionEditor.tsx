import { useEffect, useState } from 'react';
import {
  defaultValueForOp, MULTI_OPS, NO_VALUE_OPS, opsForField, RANGE_OPS,
} from '../filter';
import { ValueWidget, shapeOf } from './FilterBuilder';
import { EntityIcon } from './EntityIcon';
import { entityLabel } from '../labels';
import type { CatalogField, EntityCatalog, Op } from '../types';

interface Draft { on: string; op: Op; value: unknown }

interface Props {
  leaf?: Draft;                 // present → editing; absent → creating
  groups: EntityCatalog[];
  catalogMap: Map<string, EntityCatalog>;
  onApply: (patch: Draft) => void;
  onRemove?: () => void;        // delete this condition (edit mode)
  onClose: () => void;
}

const parseAbs = (on: string): { entity: string; field: string } | null => {
  const i = on.indexOf('::');
  return i < 0 ? null : { entity: on.slice(0, i), field: on.slice(i + 2) };
};

const OP_PHRASE: Record<Op, string> = {
  eq: 'is', neq: 'is not', contains: 'contains', startswith: 'starts with', endswith: 'ends with',
  gt: '>', gte: '≥', lt: '<', lte: '≤', between: 'between', in: 'in', nin: 'not in',
  is_null: 'is empty', is_not_null: 'is not empty',
};

const fmtVal = (op: Op, value: unknown): string => {
  if (NO_VALUE_OPS.has(op)) return '';
  if (RANGE_OPS.has(op)) { const [a, b] = Array.isArray(value) ? value : ['', '']; return `${a ?? ''} – ${b ?? ''}`; }
  if (MULTI_OPS.has(op)) return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return String(value ?? '');
};

const isComplete = (fieldChosen: boolean, op: Op, value: unknown): boolean => {
  if (!fieldChosen) return false;
  if (NO_VALUE_OPS.has(op)) return true;
  if (RANGE_OPS.has(op)) { const [a, b] = Array.isArray(value) ? value : []; return a !== '' && a != null && b !== '' && b != null; }
  if (MULTI_OPS.has(op)) { const arr = Array.isArray(value) ? value : String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean); return arr.length > 0; }
  return value !== '' && value != null;
};

/** Human-readable one-liner for a built condition (used by the chip + the preview). */
export function describeCondition(d: Draft, catalogMap: Map<string, EntityCatalog>): string {
  if (d.on === 'text') return `text ${OP_PHRASE[d.op]} ${fmtVal(d.op, d.value) ? `“${fmtVal(d.op, d.value)}”` : ''}`.trim();
  const abs = parseAbs(d.on);
  if (!abs) return '…';
  const f = catalogMap.get(abs.entity)?.fields.find((x) => x.key === abs.field);
  const lhs = `${entityLabel(abs.entity)} · ${f?.label ?? abs.field}`;
  const v = fmtVal(d.op, d.value);
  return `${lhs} ${OP_PHRASE[d.op]}${v ? ` ${v}` : ''}`.trim();
}

/**
 * Walk a full condition in one modal: entity → field → operator → value, left to
 * right, with a live readable preview. Used to add a new condition or edit one.
 */
export function ConditionEditor({ leaf, groups, catalogMap, onApply, onRemove, onClose }: Props) {
  const initAbs = leaf && leaf.on !== 'text' ? parseAbs(leaf.on) : null;
  const [entity, setEntity] = useState<string>(leaf?.on === 'text' ? 'text' : (initAbs?.entity ?? ''));
  const [fieldKey, setFieldKey] = useState<string | null>(initAbs?.field ?? null);
  const [op, setOp] = useState<Op>(leaf?.op ?? 'contains');
  const [value, setValue] = useState<unknown>(leaf?.value ?? '');
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isText = entity === 'text';
  const cat = !isText && entity ? catalogMap.get(entity) : null;
  const field: CatalogField | undefined = cat && fieldKey ? cat.fields.find((f) => f.key === fieldKey) : undefined;
  const fieldChosen = isText || !!field;
  const ops = opsForField(isText ? undefined : field);
  const curOp = ops.includes(op) ? op : ops[0];

  const pickEntity = (e: string) => {
    if (e === 'text') {
      setEntity('text'); setFieldKey(null);
      const nops = opsForField(undefined);
      if (!nops.includes(op)) { setOp(nops[0]); setValue(defaultValueForOp(nops[0])); }
    } else {
      setEntity(e); setFieldKey(null); setQ('');
    }
  };
  const pickField = (f: CatalogField) => {
    setFieldKey(f.key);
    const nops = opsForField(f);
    if (!nops.includes(op)) { setOp(nops[0]); setValue(defaultValueForOp(nops[0])); }
  };
  const pickOp = (o: Op) => {
    setOp(o);
    if (shapeOf(o) !== shapeOf(curOp)) setValue(defaultValueForOp(o));
  };

  const on = isText ? 'text' : (fieldKey ? `${entity}::${fieldKey}` : '');
  const complete = on !== '' && isComplete(fieldChosen, curOp, value);
  const apply = () => { if (complete) { onApply({ on, op: curOp, value }); onClose(); } };

  const needle = q.trim().toLowerCase();
  const fields = (cat?.fields ?? []).filter((f) =>
    !needle || f.key.toLowerCase().includes(needle) || (f.label ?? '').toLowerCase().includes(needle));

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal ce" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="fp-head">
          <span>{leaf ? 'Edit condition' : 'Add condition'}</span>
          <span className="x" title="close" onClick={onClose}>✕</span>
        </div>

        <div className="ce-body">
          {/* 1 — entity (what to filter by) */}
          <div className="ce-col">
            <div className="ce-col-label">1 · Filter by</div>
            <div className="ce-list">
              <button type="button" className={'fp-ent' + (isText ? ' active' : '')} onClick={() => pickEntity('text')}>
                <span className="fp-ent-ico"><SearchGlyph /></span>
                <span className="fp-ent-n">Text</span>
                <span className="fp-ent-c">comm body</span>
              </button>
              {groups.map((g) => (
                <button type="button" key={g.entity} className={'fp-ent' + (g.entity === entity ? ' active' : '')} onClick={() => pickEntity(g.entity)}>
                  <span className="fp-ent-ico"><EntityIcon name={g.entity} /></span>
                  <span className="fp-ent-n">{entityLabel(g.entity)}</span>
                  <span className="fp-ent-c">{g.fields.length}f</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2 — field */}
          <div className="ce-col">
            <div className="ce-col-label">2 · Field</div>
            {isText ? (
              <p className="ce-note">Full-text across the communication body — no field needed.</p>
            ) : !entity ? (
              <p className="ce-note">Pick something to filter by.</p>
            ) : (
              <>
                <input className="fp-search" autoFocus placeholder="Filter fields…" value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="ce-list">
                  {fields.length === 0 ? <p className="empty">No fields.</p> : fields.map((f) => (
                    <button type="button" key={f.key} className={'fp-field' + (f.key === fieldKey ? ' active' : '')} onClick={() => pickField(f)}>
                      <span className="fp-field-n">{f.label ?? f.key}</span>
                      <span className="fp-field-meta">{f.eav && <span className="tag eav">eav</span>}<span className="fp-field-t">{f.type}</span></span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 3 — operator + value */}
          <div className="ce-col">
            <div className="ce-col-label">3 · Condition</div>
            {!fieldChosen ? (
              <p className="ce-note">Pick a field first.</p>
            ) : (
              <div className="ce-cond">
                <div className="ce-ops">
                  {ops.map((o) => (
                    <button type="button" key={o} className={'ce-op' + (o === curOp ? ' active' : '')} onClick={() => pickOp(o)}>
                      {OP_PHRASE[o]}
                    </button>
                  ))}
                </div>
                {!NO_VALUE_OPS.has(curOp) && (
                  <div className="ce-value">
                    <ValueWidget op={curOp} field={isText ? undefined : field} value={value} onChange={setValue} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ce-foot">
          <span className="ce-preview">{on ? describeCondition({ on, op: curOp, value }, catalogMap) : 'Build a condition…'}</span>
          <span className="spacer" />
          {onRemove && <button type="button" className="ghost danger" onClick={() => { onRemove(); onClose(); }}>Delete</button>}
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="button" onClick={apply} disabled={!complete}>{leaf ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
