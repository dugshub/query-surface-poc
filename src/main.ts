// Minimal scripted example — exercise the three primitives with no framework.
// The web (server.ts), the MCP server (mcp.ts), and this script all share the
// same shape: registerSchema(schema, { eav }) once, then construct the service
// directly with `new QueryApplicationService(db)`.
//
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/main.ts

import { db, closeDb } from './db';
import { QueryApplicationService } from './query/query.application-service';
import { registerSchema } from './query/schema-registry';
import * as schema from './schema';
import { fieldValues, fieldValuesJsonb } from './query/eav/schema';

// EAV overlay — the only thing that can't be auto-introspected (same as server.ts/mcp.ts).
const EAV_OVERLAY = {
  opportunities:           { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'opportunity' },
  transcript_observations: { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  accounts:                { kind: 'jsonb-value' as const, valueTable: fieldValuesJsonb, entityTypeValue: 'account', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' },
};

async function main(): Promise<void> {
  // Point the surface at the schema → every table auto-exposed (names are the
  // plural table names: opportunities, accounts, transcripts, …).
  registerSchema(schema as unknown as Record<string, unknown>, { eav: EAV_OVERLAY });
  const q = new QueryApplicationService(db);

  const catalog = await q.describe();
  console.log('describe →', catalog.map((c) => `${c.entity}(${c.fields.length} fields)`).join('  '));

  const search = await q.query('opportunities', {
    filter: { on: 'StageName', op: 'eq', value: 'Negotiation/Review' },
    preview: true,
    page: { limit: 3 },
  });
  console.log(`\nquery opportunities StageName=Negotiation/Review → ${search.total} match`);
  console.log('preview[0] →', JSON.stringify(search.preview?.[0]));

  if (search.ids.length) {
    const fetched = await q.fetch('opportunities', search.ids.slice(0, 1), { expand: ['account'] });
    console.log('\nfetch + expand(account) → row[0] keys:', Object.keys(fetched.rows[0] ?? {}).join(', '));
  }

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
