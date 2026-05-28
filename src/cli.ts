#!/usr/bin/env bun
// query-surface — CLI for consumer projects (bun).
//
//   query-surface init        scaffold a query-surface.config.ts
//   query-surface doctor      report relationship gaps in your schema (+ fixes)
//   query-surface describe    list registered entities
//   query-surface describe <entity>   show one entity's field catalog
//
// Everything is parameterized by the consumer's schema, so the CLI reads a
// `query-surface.config.ts` in the working directory:
//
//   import * as schema from './src/schema';
//   export default { schema, exclude: [...], names: {...}, eav: {...} };
//
// `doctor` and `describe` are schema-only (no DB). `query`/`fetch` need a live
// Drizzle client + actor wiring and are not exposed here yet — use the library
// API (QueryApplicationService) for those.

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { buildRegistrationsFromSchema, type RegisterSchemaOptions } from './query/schema-registry';
import { diagnose, formatFindings } from './query/doctor';
import { configureQueryRegistry } from './query/registry';
import { buildEntityCatalog } from './query/catalog';
import type { EntityName } from './query/types';

interface QuerySurfaceConfig extends RegisterSchemaOptions {
  schema: Record<string, unknown>;
}

const CONFIG_BASENAME = 'query-surface.config';
const CONFIG_CANDIDATES = ['.ts', '.mjs', '.js'].map((ext) => `${CONFIG_BASENAME}${ext}`);

function fail(msg: string): never {
  console.error(`query-surface: ${msg}`);
  process.exit(1);
}

async function loadConfig(): Promise<QuerySurfaceConfig> {
  const found = CONFIG_CANDIDATES.map((f) => resolve(process.cwd(), f)).find(existsSync);
  if (!found) {
    fail(
      `no ${CONFIG_BASENAME}.ts found in ${process.cwd()}.\n` +
        `Run \`query-surface init\` to scaffold one.`,
    );
  }
  const mod = (await import(pathToFileURL(found).href)) as { default?: QuerySurfaceConfig };
  const config = mod.default;
  if (!config?.schema) fail(`${found} must default-export an object with a \`schema\` field.`);
  return config;
}

function registrations(config: QuerySurfaceConfig) {
  const { schema, ...options } = config;
  return buildRegistrationsFromSchema(schema, options);
}

const CONFIG_TEMPLATE = `// query-surface config — points the CLI at your Drizzle schema.
// \`query-surface doctor\` / \`describe\` read this. Adjust the import path.
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
  console.log(`Wrote ${target}\nEdit the schema import path, then run \`query-surface doctor\`.`);
}

async function cmdDoctor(): Promise<void> {
  const findings = diagnose(registrations(await loadConfig()));
  console.log(formatFindings(findings));
  if (findings.some((f) => f.severity === 'error')) process.exit(1);
}

async function cmdDescribe(entity?: string): Promise<void> {
  const regs = registrations(await loadConfig());
  configureQueryRegistry(regs);

  if (!entity) {
    console.log(`entities (${regs.length}):`);
    for (const r of regs) {
      const cat = buildEntityCatalog(r.name as EntityName);
      const summary = cat.summary ? `  — ${cat.summary}` : '';
      console.log(
        `  ${r.name.padEnd(24)} ${cat.fields.length} fields, ${cat.relationships.length} relationships${summary}`,
      );
    }
    console.log(`\nRun \`query-surface describe <entity>\` for a field catalog.`);
    return;
  }

  if (!regs.some((r) => r.name === entity)) {
    fail(`unknown entity '${entity}'. Known: ${regs.map((r) => r.name).join(', ')}`);
  }
  const cat = buildEntityCatalog(entity as EntityName);
  console.log(`${cat.entity}${cat.summary ? ` — ${cat.summary}` : ''}\n`);
  console.log('  fields:');
  for (const f of cat.fields) {
    const tags = [f.searchable ? 'searchable' : '', f.eav ? 'eav' : '', f.nullable ? 'nullable' : '']
      .filter(Boolean)
      .join(' ');
    console.log(`    ${f.key.padEnd(24)} ${f.type.padEnd(9)} ${tags.padEnd(28)} ${f.label ?? ''}`);
  }
  if (cat.relationships.length) {
    console.log('\n  relationships:');
    for (const rel of cat.relationships) {
      console.log(`    ${rel.name.padEnd(24)} ${rel.kind} -> ${rel.target}`);
    }
  }
}

const USAGE = `query-surface — semantic query surface CLI

Usage:
  query-surface init                 scaffold a query-surface.config.ts
  query-surface doctor               report relationship gaps (+ relations() fixes)
  query-surface describe [entity]    list entities, or show one entity's catalog

Reads query-surface.config.ts from the current directory (except \`init\`).`;

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  switch (cmd) {
    case 'init':
      return cmdInit();
    case 'doctor':
      return cmdDoctor();
    case 'describe':
      return cmdDescribe(arg);
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(USAGE);
      return;
    default:
      fail(`unknown command '${cmd}'.\n\n${USAGE}`);
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
