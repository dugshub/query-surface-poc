// Output panels — every section the CLI prints is a named Panel here, collected
// into a list per command. This is the unit of "manageability": to drop an
// output, remove it from the list; to add one, write a Panel and append it; to
// reorder, move it. `compose()` optionally filters by id, so a future
// `--only` / `--without` flag is a one-line wire-up (not built yet).
//
// Panels render human output; JSON mode is handled by the command (it emits a
// structured payload and skips panels entirely).

import type { EntityCatalog, CatalogField } from '../query/catalog';
import type { Finding, Severity } from '../query/doctor';
import { renderEntityGraph } from './graph';
import * as ui from './ui';

export interface Panel<C> {
  id: string;
  render(ctx: C): void;
}

export function compose<C>(panels: Panel<C>[], ctx: C, opts?: { only?: string[]; without?: string[] }): void {
  let list = panels;
  if (opts?.only) list = list.filter((p) => opts.only!.includes(p.id));
  if (opts?.without) list = list.filter((p) => !opts.without!.includes(p.id));
  for (const p of list) p.render(ctx);
}

const STRUCTURAL = new Set(['id', 'created_at', 'updated_at']);
const fieldTags = (f: CatalogField): string =>
  [f.searchable ? 'searchable' : '', f.eav ? 'eav' : '', f.preview ? 'preview' : '', f.nullable ? 'nullable' : '']
    .filter(Boolean)
    .join(' ');

// ===========================================================================
// describe <entity>
// ===========================================================================

export interface EntityCtx {
  cat: EntityCatalog;
  byName: Map<string, EntityCatalog>;
}

const summaryPanel: Panel<EntityCtx> = {
  id: 'summary',
  render: ({ cat }) => {
    ui.printPane(String(cat.entity), [cat.summary ?? '(no summary)']);
    ui.blank();
  },
};

const fieldsPanel: Panel<EntityCtx> = {
  id: 'fields',
  render: ({ cat }) => {
    ui.heading('  fields');
    const keyW = Math.max(5, ...cat.fields.map((f) => f.key.length));
    const typeW = Math.max(4, ...cat.fields.map((f) => f.type.length));
    const tagW = Math.max(...cat.fields.map((f) => fieldTags(f).length), 10);
    for (const f of cat.fields) {
      const keyColor = f.eav ? ui.theme.enum : ui.theme.accent;
      const label = f.label ? f.label : '';
      const enums = f.enumValues?.length ? ui.theme.muted('  ' + ui.truncate(`[${f.enumValues.join(', ')}]`, 44)) : '';
      console.log(
        `    ${ui.pad(f.key, keyW, keyColor)}  ${ui.pad(f.type, typeW, ui.theme.muted)}  ` +
          `${ui.pad(fieldTags(f), tagW, ui.theme.muted)}  ${label}${enums}`,
      );
    }
  },
};

const relationshipsPanel: Panel<EntityCtx> = {
  id: 'relationships',
  render: ({ cat }) => {
    if (!cat.relationships.length) return;
    ui.blank();
    ui.heading('  relationships');
    const relW = Math.max(...cat.relationships.map((r) => r.name.length));
    for (const rel of cat.relationships) {
      const arrow = rel.kind === 'belongs_to' ? ui.glyph.arrowR : ui.glyph.arrowL;
      console.log(
        `    ${ui.theme.rel(arrow)} ${ui.pad(rel.name, relW)}  ${ui.theme.muted(rel.kind.padEnd(11))} ` +
          `${ui.theme.entity(String(rel.target))}  ${ui.theme.muted(`${ui.glyph.arrowL} ${rel.fk}`)}`,
      );
    }
  },
};

// The signature capability: cross-entity dotted-path filters reachable from
// this entity through its belongs_to relationships (1 hop).
const reachPanel: Panel<EntityCtx> = {
  id: 'reach',
  render: ({ cat, byName }) => {
    const belongs = cat.relationships.filter((r) => r.kind === 'belongs_to');
    const paths: { path: string; type: string; searchable: boolean }[] = [];
    for (const rel of belongs) {
      const target = byName.get(String(rel.target));
      if (!target) continue;
      for (const f of target.fields) {
        if (STRUCTURAL.has(f.key) || f.type === 'uuid') continue;
        paths.push({ path: `${rel.name}.${f.key}`, type: f.type, searchable: f.searchable });
      }
    }
    if (!paths.length) return;
    ui.blank();
    ui.heading('  reachable (cross-entity, 1 hop)');
    const w = Math.max(...paths.map((p) => p.path.length));
    for (const p of paths) {
      const s = p.searchable ? ui.theme.muted('  searchable') : '';
      console.log(`    ${ui.pad(p.path, w, ui.theme.rel)}  ${ui.theme.muted(p.type)}${s}`);
    }
    const example = paths.find((p) => p.searchable) ?? paths[0];
    ui.printMuted(`    ${ui.glyph.bullet} filter like { on: "${example.path}", op: "eq", value: … }`);
  },
};

const entityHints: Panel<EntityCtx> = {
  id: 'hints',
  render: () => ui.printHints([{ cmd: 'query-surface graph', desc: 'see this entity in the full data model' }]),
};

export const entityPanels: Panel<EntityCtx>[] = [
  summaryPanel,
  fieldsPanel,
  relationshipsPanel,
  reachPanel,
  entityHints,
];

// ===========================================================================
// describe (list)
// ===========================================================================

export interface ListCtx {
  cats: EntityCatalog[];
}

export const listPanels: Panel<ListCtx>[] = [
  {
    id: 'table',
    render: ({ cats }) => {
      ui.heading(`entities (${cats.length})`);
      ui.blank();
      const nameW = Math.max(...cats.map((c) => String(c.entity).length));
      const cols = process.stdout.columns ?? 100;
      for (const cat of cats) {
        const counts = `${cat.fields.length} fields, ${cat.relationships.length} rel`;
        const head = `  ${ui.pad(String(cat.entity), nameW, ui.theme.entity)}  ${ui.theme.muted(counts.padEnd(20))}`;
        const room = Math.max(10, cols - ui.plainLen(head) - 3);
        console.log(`${head}${cat.summary ? ui.theme.muted(ui.truncate(cat.summary, room)) : ''}`);
      }
    },
  },
  {
    id: 'hints',
    render: () =>
      ui.printHints([
        { cmd: 'query-surface describe <entity>', desc: 'fields, relationships, reachable paths' },
        { cmd: 'query-surface graph', desc: 'the data model as a tree' },
      ]),
  },
];

// ===========================================================================
// graph
// ===========================================================================

export interface GraphCtx {
  cats: EntityCatalog[];
}

export const graphPanels: Panel<GraphCtx>[] = [
  { id: 'heading', render: () => (ui.heading('data model'), ui.blank()) },
  { id: 'tree', render: ({ cats }) => renderEntityGraph(cats) },
];

// ===========================================================================
// doctor
// ===========================================================================

export interface DoctorCtx {
  findings: Finding[];
}

const SEV_ICON: Record<Severity, string> = { error: ui.glyph.err, warn: ui.glyph.warn, info: ui.glyph.info };
const SEV_COLOR: Record<Severity, (s: string) => string> = {
  error: ui.theme.error,
  warn: ui.theme.warning,
  info: ui.theme.muted,
};
const SEV_ORDER: Severity[] = ['error', 'warn', 'info'];

export const doctorPanels: Panel<DoctorCtx>[] = [
  {
    id: 'summary',
    render: ({ findings }) => {
      ui.heading('schema doctor');
      if (findings.length === 0) {
        ui.printSuccess('no relationship gaps — the surface can see every declared FK.');
        return;
      }
      const n = (s: Severity) => findings.filter((f) => f.severity === s).length;
      const errors = n('error');
      const summary = [
        (errors ? ui.theme.error : ui.theme.success)(`${errors} error${errors === 1 ? '' : 's'}`),
        ui.theme.warning(`${n('warn')} warning${n('warn') === 1 ? '' : 's'}`),
        ui.theme.muted(`${n('info')} info`),
      ].join(ui.theme.muted('  ·  '));
      ui.printMuted(`${findings.length} finding${findings.length === 1 ? '' : 's'}`);
      console.log(`  ${summary}`);
      ui.blank();
    },
  },
  {
    id: 'findings',
    render: ({ findings }) => {
      for (const sev of SEV_ORDER) {
        for (const f of findings.filter((x) => x.severity === sev)) {
          const where = f.column ? `${f.entity}.${f.column}` : f.entity;
          console.log(`${SEV_COLOR[sev](SEV_ICON[sev])} ${SEV_COLOR[sev](f.code)}  ${ui.theme.bold(where)}`);
          console.log(`  ${f.message}`);
          if (f.fix) {
            console.log(`  ${ui.theme.muted('fix:')}`);
            for (const line of f.fix.split('\n')) console.log(ui.theme.muted('    ' + line));
          }
          ui.blank();
        }
      }
    },
  },
  {
    id: 'hints',
    render: ({ findings }) => {
      if (findings.some((f) => f.severity === 'error')) {
        ui.printHints([{ cmd: 'query-surface graph', desc: 'see the relationships you do have' }]);
      }
    },
  },
];

// ===========================================================================
// stats
// ===========================================================================

export interface StatsCtx {
  cats: EntityCatalog[];
  findings: Finding[];
}

export const statsPanels: Panel<StatsCtx>[] = [
  {
    id: 'overview',
    render: ({ cats, findings }) => {
      const fields = cats.reduce((s, c) => s + c.fields.length, 0);
      const eav = cats.reduce((s, c) => s + c.fields.filter((f) => f.eav).length, 0);
      const rels = cats.reduce((s, c) => s + c.relationships.filter((r) => r.kind === 'belongs_to').length, 0);
      const searchable = cats.filter((c) => c.searchableColumns.length > 0).length;
      const errors = findings.filter((f) => f.severity === 'error').length;
      const warns = findings.filter((f) => f.severity === 'warn').length;
      const health = errors
        ? ui.theme.error(`${errors} error${errors === 1 ? '' : 's'}`)
        : warns
          ? ui.theme.warning(`${warns} warning${warns === 1 ? '' : 's'}`)
          : ui.theme.success('healthy');
      const sep = ui.theme.muted('  ·  ');
      ui.printPane('query-surface', [
        [
          `${ui.theme.bold(String(cats.length))} entities`,
          `${ui.theme.bold(String(fields))} fields ${ui.theme.muted(`(${eav} eav)`)}`,
          `${ui.theme.bold(String(rels))} relationships`,
          `${ui.theme.bold(String(searchable))} searchable`,
        ].join(sep),
        `doctor: ${health}`,
      ]);
    },
  },
];
