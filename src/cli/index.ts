#!/usr/bin/env bun
// query-surface — CLI for consumer projects (bun).
//
//   query-surface init                          scaffold a query-surface.config.ts
//   query-surface doctor [--json]               relationship gaps in your schema (+ fixes)
//   query-surface describe [entity] [--json]    list entities, or one entity's catalog
//   query-surface graph [--json]                the data model as a tree
//
// Everything is parameterized by the consumer's schema via a
// `query-surface.config.ts` in the working directory:
//
//   import * as schema from './src/schema';
//   export default { schema, exclude: [...], names: {...}, eav: {...} };
//
// All commands are schema-only (no DB). --json emits machine output and
// silences human chrome, so CI/agents consume the CLI directly. Dispatch is
// hand-rolled — a command framework (Clipanion, per codegen-patterns) is
// deferred until this grows a noun×verb tree.

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { buildRegistrationsFromSchema, type RegisterSchemaOptions } from '../query/schema-registry';
import { diagnose, type Finding, type Severity } from '../query/doctor';
import { configureQueryRegistry } from '../query/registry';
import { buildEntityCatalog, type EntityCatalog } from '../query/catalog';
import type { EntityName } from '../query/types';
import { graphAdjacency, renderEntityGraph } from './graph';
import * as ui from './ui';

interface QuerySurfaceConfig extends RegisterSchemaOptions {
  schema: Record<string, unknown>;
}

const CONFIG_BASENAME = 'query-surface.config';
const CONFIG_CANDIDATES = ['.ts', '.mjs', '.js'].map((ext) => `${CONFIG_BASENAME}${ext}`);

function fail(msg: string): never {
  ui.printError(msg);
  process.exit(1);
}

async function loadConfig(): Promise<QuerySurfaceConfig> {
  const found = CONFIG_CANDIDATES.map((f) => resolve(process.cwd(), f)).find(existsSync);
  if (!found) {
    fail(`no ${CONFIG_BASENAME}.ts found in ${process.cwd()}. Run \`query-surface init\` to scaffold one.`);
  }
  const mod = (await import(pathToFileURL(found).href)) as { default?: QuerySurfaceConfig };
  const config = mod.default;
  if (!config?.schema) fail(`${found} must default-export an object with a \`schema\` field.`);
  return config;
}

function catalogs(config: QuerySurfaceConfig): EntityCatalog[] {
  const { schema, ...options } = config;
  const regs = buildRegistrationsFromSchema(schema, options);
  configureQueryRegistry(regs);
  return regs.map((r) => buildEntityCatalog(r.name as EntityName));
}

const CONFIG_TEMPLATE = `// query-surface config — points the CLI at your Drizzle schema.
// \`query-surface doctor\` / \`describe\` / \`graph\` read this. Adjust the import path.
import * as schema from './src/schema';

export default {
  schema,
  // exclude: ['audit_log'],            // tables to hide (EAV substrate auto-excluded)
  // names: { opportunities: 'opportunity' },  // table -> exposed entity name
  // eav: { /* entityName: EavStrategy */ },   // value-table overlay (see EavStrategy)
};
`;

function cmdInit(): void {
  const target = resolve(process.cwd(), `${CONFIG_BASENAME}.ts`);
  if (existsSync(target)) fail(`${target} already exists — not overwriting.`);
  writeFileSync(target, CONFIG_TEMPLATE);
  ui.printSuccess(`Wrote ${target}`);
  ui.printMuted('Edit the schema import path, then run `query-surface doctor`.');
}

// ---------------------------------------------------------------------------
// doctor
// ---------------------------------------------------------------------------

const SEV_ICON: Record<Severity, string> = { error: ui.glyph.err, warn: ui.glyph.warn, info: ui.glyph.info };
const SEV_COLOR: Record<Severity, (s: string) => string> = {
  error: ui.theme.error,
  warn: ui.theme.warning,
  info: ui.theme.muted,
};
const SEV_ORDER: Severity[] = ['error', 'warn', 'info'];

function renderFindings(findings: Finding[]): void {
  const n = (s: Severity) => findings.filter((f) => f.severity === s).length;
  ui.heading('schema doctor');
  if (findings.length === 0) {
    ui.printSuccess('no relationship gaps — the surface can see every declared FK.');
    return;
  }
  const errors = n('error');
  const summary = [
    (errors ? ui.theme.error : ui.theme.success)(`${errors} error${errors === 1 ? '' : 's'}`),
    ui.theme.warning(`${n('warn')} warning${n('warn') === 1 ? '' : 's'}`),
    ui.theme.muted(`${n('info')} info`),
  ].join(ui.theme.muted('  ·  '));
  ui.printMuted(`${findings.length} finding${findings.length === 1 ? '' : 's'}`);
  console.log(`  ${summary}`);
  ui.blank();

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
}

async function cmdDoctor(): Promise<void> {
  const findings = diagnose(registrationsFor(await loadConfig()));
  if (ui.isJsonMode()) {
    ui.printJson(findings);
  } else {
    renderFindings(findings);
    if (findings.some((f) => f.severity === 'error')) {
      ui.printHints([{ cmd: 'query-surface graph', desc: 'see the relationships you do have' }]);
    }
  }
  if (findings.some((f) => f.severity === 'error')) process.exit(1);
}

// diagnose() wants registrations (it reads FKs off the tables); reuse the
// config → registrations path without rebuilding catalogs.
function registrationsFor(config: QuerySurfaceConfig) {
  const { schema, ...options } = config;
  return buildRegistrationsFromSchema(schema, options);
}

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

function describeList(cats: EntityCatalog[]): void {
  ui.heading(`entities (${cats.length})`);
  ui.blank();
  const nameW = Math.max(...cats.map((c) => String(c.entity).length));
  const cols = process.stdout.columns ?? 100;
  for (const cat of cats) {
    const counts = `${cat.fields.length} fields, ${cat.relationships.length} rel`;
    const head = `  ${ui.pad(String(cat.entity), nameW, ui.theme.entity)}  ${ui.theme.muted(counts.padEnd(20))}`;
    const room = Math.max(10, cols - ui.plainLen(head) - 3);
    const summary = cat.summary ? ui.theme.muted(truncate(cat.summary, room)) : '';
    console.log(`${head}${summary}`);
  }
  ui.printHints([
    { cmd: 'query-surface describe <entity>', desc: 'fields + relationships for one entity' },
    { cmd: 'query-surface graph', desc: 'the data model as a tree' },
  ]);
}

function describeOne(cat: EntityCatalog): void {
  ui.printPane(String(cat.entity), [cat.summary ?? '(no summary)']);
  ui.blank();

  // Fields table.
  const keyW = Math.max(5, ...cat.fields.map((f) => f.key.length));
  const typeW = Math.max(4, ...cat.fields.map((f) => f.type.length));
  ui.heading('  fields');
  for (const f of cat.fields) {
    const tags = [f.searchable ? 'searchable' : '', f.eav ? 'eav' : '', f.nullable ? 'nullable' : '']
      .filter(Boolean)
      .join(' ');
    const keyColor = f.eav ? ui.theme.enum : ui.theme.accent;
    const enumNote = f.enumValues?.length ? ui.theme.muted(`{${f.enumValues.length}}`) : '';
    console.log(
      `    ${ui.pad(f.key, keyW, keyColor)}  ${ui.pad(f.type, typeW, ui.theme.muted)} ${enumNote}` +
        `  ${ui.pad(tags, 28, ui.theme.muted)}${f.label ?? ''}`,
    );
  }

  // Relationships.
  if (cat.relationships.length) {
    ui.blank();
    ui.heading('  relationships');
    const relW = Math.max(...cat.relationships.map((r) => r.name.length));
    for (const rel of cat.relationships) {
      const arrow = rel.kind === 'belongs_to' ? ui.glyph.arrowR : ui.glyph.arrowL;
      console.log(
        `    ${ui.theme.rel(arrow)} ${ui.pad(rel.name, relW)}  ${ui.theme.muted(rel.kind.padEnd(11))} ${ui.theme.entity(String(rel.target))}`,
      );
    }
  }
  ui.printHints([{ cmd: 'query-surface graph', desc: 'see this entity in the full data model' }]);
}

async function cmdDescribe(entity?: string): Promise<void> {
  const cats = catalogs(await loadConfig());
  if (!entity) {
    if (ui.isJsonMode()) return ui.printJson(cats);
    return describeList(cats);
  }
  const cat = cats.find((c) => String(c.entity) === entity);
  if (!cat) fail(`unknown entity '${entity}'. Known: ${cats.map((c) => String(c.entity)).join(', ')}`);
  if (ui.isJsonMode()) return ui.printJson(cat);
  describeOne(cat);
}

// ---------------------------------------------------------------------------
// graph
// ---------------------------------------------------------------------------

async function cmdGraph(): Promise<void> {
  const cats = catalogs(await loadConfig());
  if (ui.isJsonMode()) return ui.printJson(graphAdjacency(cats));
  ui.heading('data model');
  ui.blank();
  renderEntityGraph(cats);
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

const USAGE = `${ui.theme.bold('query-surface')} — semantic query surface CLI

${ui.theme.muted('Usage:')}
  query-surface init                       scaffold a query-surface.config.ts
  query-surface doctor [--json]            report relationship gaps (+ relations() fixes)
  query-surface describe [entity] [--json] list entities, or one entity's catalog
  query-surface graph [--json]             render the data model as a tree

${ui.theme.muted('Reads query-surface.config.ts from the current directory (except `init`).')}`;

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, Math.max(1, max - 1)) + '…';
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--json')) ui.setJsonMode(true);
  const [cmd, arg] = args.filter((a) => !a.startsWith('-'));
  switch (cmd) {
    case 'init':
      return cmdInit();
    case 'doctor':
      return cmdDoctor();
    case 'describe':
      return cmdDescribe(arg);
    case 'graph':
      return cmdGraph();
    case undefined:
    case 'help':
      console.log(USAGE);
      return;
    default:
      fail(`unknown command '${cmd}'.\n\n${USAGE}`);
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
