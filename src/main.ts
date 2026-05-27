import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { QueryApplicationService } from './query/query.application-service';

// Minimal example — boot the DI context and exercise the three primitives.
// This is a library, not an HTTP server. Run:
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/main.ts
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const q = app.get(QueryApplicationService);

  const catalog = await q.describe();
  console.log('describe →', catalog.map((c) => `${c.entity}(${c.fields.length} fields)`).join('  '));

  const search = await q.query('opportunity', {
    filter: { on: 'StageName', op: 'eq', value: 'Negotiation/Review' },
    preview: true,
    page: { limit: 3 },
  });
  console.log(`\nquery opportunity StageName=Negotiation/Review → ${search.total} match`);
  console.log('preview[0] →', JSON.stringify(search.preview?.[0]));

  if (search.ids.length) {
    const fetched = await q.fetch('opportunity', search.ids.slice(0, 1), { expand: ['account'] });
    console.log('\nfetch + expand(account) → row[0] keys:', Object.keys(fetched.rows[0] ?? {}).join(', '));
  }

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
