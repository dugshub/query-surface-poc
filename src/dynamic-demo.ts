import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { count, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DatabaseModule } from './shared/database/database.module';
import { DRIZZLE } from './shared/constants/tokens';
import { QueryModule } from './query/query.module';
import { QueryApplicationService } from './query/query.application-service';
import { configureQueryRegistry } from './query/registry';
import { loadRegistrations, entityRegistrations } from './query/runtime-registry';
import { salesTableCatalog, salesValueTables } from './sales-catalog';

// Runtime registry demo — the exposed ERD is DATA (entity_registrations rows),
// not code. Toggle a row → re-load → the surface changes. No redeploy.
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/dynamic-demo.ts

@Module({ imports: [DatabaseModule, QueryModule.forRoot([])] }) // empty: configured at runtime
class DynamicDemoModule {}

// One-time seed of the registration profile (the 6 sales entities).
async function seedIfEmpty(db: NodePgDatabase<Record<string, unknown>>): Promise<void> {
  const [{ n }] = await db.select({ n: count() }).from(entityRegistrations);
  if (Number(n) > 0) return;
  await db.insert(entityRegistrations).values([
    { name: 'account', tableKey: 'accounts', sortOrder: 0, eav: { kind: 'jsonb-value', entityTypeValue: 'account', valueTableKey: 'field_values_jsonb', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' } },
    { name: 'opportunity', tableKey: 'opportunities', sortOrder: 1, eav: { kind: 'typed-columns', entityTypeValue: 'opportunity', valueTableKey: 'field_values' } },
    { name: 'contact', tableKey: 'contacts', sortOrder: 2, eav: null },
    { name: 'email', tableKey: 'emails', sortOrder: 3, eav: null },
    { name: 'transcript', tableKey: 'transcripts', sortOrder: 4, eav: null },
    { name: 'transcriptObservation', tableKey: 'transcript_observations', sortOrder: 5, eav: { kind: 'typed-columns', entityTypeValue: 'transcript_observation', valueTableKey: 'field_values' } },
  ]);
  console.log('seeded entity_registrations (6 rows)');
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(DynamicDemoModule, { logger: false });
  const db = app.get<NodePgDatabase<Record<string, unknown>>>(DRIZZLE);
  const q = app.get(QueryApplicationService);

  await seedIfEmpty(db);

  const refresh = async (): Promise<void> => {
    configureQueryRegistry(await loadRegistrations(db, salesTableCatalog, salesValueTables));
    q.resetCache();
  };

  await refresh();
  console.log('exposed ERD:                       ', (await q.describe()).map((c) => c.entity).join(', '));

  // Toggle one entity OUT of the ERD — data change, no code/redeploy.
  await db.update(entityRegistrations).set({ enabled: false }).where(eq(entityRegistrations.name, 'transcriptObservation'));
  await refresh();
  console.log('after disabling transcriptObservation:', (await q.describe()).map((c) => c.entity).join(', '));

  // Re-enable (leave the table as we found it).
  await db.update(entityRegistrations).set({ enabled: true }).where(eq(entityRegistrations.name, 'transcriptObservation'));
  await refresh();
  console.log('re-enabled:                        ', (await q.describe()).map((c) => c.entity).join(', '));

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
