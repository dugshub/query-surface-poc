// `bun run doctor` — run the schema health check against this repo's demo
// schema. The reusable entry point is the CLI (`query-surface doctor`, which
// reads a consumer's query-surface.config.ts); this bin just dogfoods diagnose()
// on the demo without a config file.
//
// Consumer usage: `import { diagnose, formatFindings, buildRegistrationsFromSchema }`
// or run `query-surface doctor` (see src/cli/index.ts).

import { buildRegistrationsFromSchema } from './query/schema-registry';
import { diagnose, formatFindings } from './query/doctor';
import * as schema from './schema';

const findings = diagnose(buildRegistrationsFromSchema(schema));
console.log(formatFindings(findings));

if (findings.some((f) => f.severity === 'error')) process.exit(1);
