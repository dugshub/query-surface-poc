// `bun src/doctor.ts` — run the schema health check against the demo schema and
// print findings grouped by severity, each with a paste-ready relations() fix.
//
// A consumer runs the same check on their own schema by importing `diagnose`
// (exported from the package) in their bootstrap or a CI step:
//
//   import { diagnose, buildRegistrationsFromSchema } from 'query-surface-poc';
//   import * as schema from './schema';
//   const findings = diagnose(buildRegistrationsFromSchema(schema, { eav, exclude }));
//
// Exit code is 1 when any error-severity finding is present, so it can gate CI.

import { buildRegistrationsFromSchema } from './query/schema-registry';
import { diagnose, type Finding, type Severity } from './query/doctor';
import * as schema from './schema';

const LABEL: Record<Severity, string> = { error: 'ERROR', warn: 'WARN', info: 'INFO' };
const ORDER: Severity[] = ['error', 'warn', 'info'];

function indent(text: string, pad = '    '): string {
  return text
    .split('\n')
    .map((l) => pad + l)
    .join('\n');
}

function render(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log('schema doctor: no relationship gaps found — the surface can see every declared FK.\n');
    return;
  }

  const counts = ORDER.map((s) => `${findings.filter((f) => f.severity === s).length} ${s}`).join(', ');
  console.log(`schema doctor: ${findings.length} finding(s) — ${counts}\n`);

  for (const sev of ORDER) {
    const group = findings.filter((f) => f.severity === sev);
    for (const f of group) {
      const where = f.column ? `${f.entity}.${f.column}` : f.entity;
      console.log(`[${LABEL[sev]}] ${f.code} — ${where}`);
      console.log(indent(f.message, '  '));
      if (f.fix) {
        console.log('  fix:');
        console.log(indent(f.fix));
      }
      console.log('');
    }
  }
}

// EAV substrate is excluded by default in buildRegistrationsFromSchema; the demo
// adds no extra excludes. A real consumer passes their { exclude, names, eav }.
const registrations = buildRegistrationsFromSchema(schema);
const findings = diagnose(registrations);
render(findings);

if (findings.some((f) => f.severity === 'error')) process.exit(1);
