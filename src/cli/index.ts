#!/usr/bin/env bun
// query-surface — CLI for consumer projects (bun).
//
//   query-surface init                          scaffold a query-surface.config.ts
//   query-surface doctor [--json]               relationship gaps in your schema (+ fixes)
//   query-surface describe [entity] [--json]    list entities, or one entity's catalog
//   query-surface graph [--json]                the data model as a tree
//   query-surface stats [--json]                schema overview at a glance
//
// Parameterized by the consumer's schema via a `query-surface.config.ts` in the
// working directory:
//
//   import * as schema from './src/schema';
//   export default { schema, exclude: [...], names: {...}, eav: {...} };
//
// All commands are schema-only (no DB). --json emits machine output and skips
// the human panels. This file is thin: parse args → load config → build a
// context → compose the command's panels. The output sections themselves live
// in panels.ts (the unit of add/remove/reorder). Dispatch is hand-rolled — a
// command framework (Clipanion, per codegen-patterns) waits for a noun×verb tree.

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { buildRegistrationsFromSchema, type RegisterSchemaOptions } from '../query/schema-registry';
import { diagnose } from '../query/doctor';
import { configureQueryRegistry, type EntityRegistration } from '../query/registry';
import { buildEntityCatalog, type EntityCatalog } from '../query/catalog';
import type { EntityName } from '../query/types';
import { graphAdjacency } from './graph';
import {
  compose,
  doctorPanels,
  entityPanels,
  graphPanels,
  listPanels,
  statsPanels,
} from './panels';
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

function registrationsFor(config: QuerySurfaceConfig): EntityRegistration[] {
  const { schema, ...options } = config;
  return buildRegistrationsFromSchema(schema, options);
}

/** Registrations → configured registry → catalogs (the common describe/graph path). */
function catalogsFor(config: QuerySurfaceConfig): EntityCatalog[] {
  const regs = registrationsFor(config);
  configureQueryRegistry(regs);
  return regs.map((r) => buildEntityCatalog(r.name as EntityName));
}

const CONFIG_TEMPLATE = `// query-surface config — points the CLI at your Drizzle schema.
// \`query-surface doctor\` / \`describe\` / \`graph\` / \`stats\` read this. Adjust the import path.
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

async function cmdDoctor(): Promise<void> {
  const findings = diagnose(registrationsFor(await loadConfig()));
  if (ui.isJsonMode()) ui.printJson(findings);
  else compose(doctorPanels, { findings });
  if (findings.some((f) => f.severity === 'error')) process.exit(1);
}

async function cmdDescribe(entity?: string): Promise<void> {
  const cats = catalogsFor(await loadConfig());
  if (!entity) {
    if (ui.isJsonMode()) return ui.printJson(cats);
    return compose(listPanels, { cats });
  }
  const cat = cats.find((c) => String(c.entity) === entity);
  if (!cat) fail(`unknown entity '${entity}'. Known: ${cats.map((c) => String(c.entity)).join(', ')}`);
  if (ui.isJsonMode()) return ui.printJson(cat);
  compose(entityPanels, { cat, byName: new Map(cats.map((c) => [String(c.entity), c])) });
}

async function cmdGraph(): Promise<void> {
  const cats = catalogsFor(await loadConfig());
  if (ui.isJsonMode()) return ui.printJson(graphAdjacency(cats));
  compose(graphPanels, { cats });
}

async function cmdStats(): Promise<void> {
  const config = await loadConfig();
  const cats = catalogsFor(config);
  const findings = diagnose(registrationsFor(config));
  if (ui.isJsonMode()) {
    return ui.printJson({
      entities: cats.length,
      fields: cats.reduce((s, c) => s + c.fields.length, 0),
      eavFields: cats.reduce((s, c) => s + c.fields.filter((f) => f.eav).length, 0),
      relationships: cats.reduce((s, c) => s + c.relationships.filter((r) => r.kind === 'belongs_to').length, 0),
      searchableEntities: cats.filter((c) => c.searchableColumns.length > 0).length,
      findings: { error: findings.filter((f) => f.severity === 'error').length, warn: findings.filter((f) => f.severity === 'warn').length },
    });
  }
  compose(statsPanels, { cats, findings });
}

const USAGE = `${ui.theme.bold('query-surface')} — semantic query surface CLI

${ui.theme.muted('Usage:')}
  query-surface init                       scaffold a query-surface.config.ts
  query-surface doctor [--json]            report relationship gaps (+ relations() fixes)
  query-surface describe [entity] [--json] list entities, or one entity's catalog
  query-surface graph [--json]             render the data model as a tree
  query-surface stats [--json]             schema overview at a glance

${ui.theme.muted('Reads query-surface.config.ts from the current directory (except `init`).')}`;

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
    case 'stats':
      return cmdStats();
    case undefined:
    case 'help':
      console.log(USAGE);
      return;
    default:
      fail(`unknown command '${cmd}'.\n\n${USAGE}`);
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
