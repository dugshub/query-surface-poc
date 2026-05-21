// Demo CLI — runs the 6 escalating queries against the seeded data, printing
// the JSON FilterExpression (what the agent emits), the compiled SQL, and a
// preview of the result rows. This is what the team sees in the meeting.

import { db, closeDb } from './db';
import { runQuery } from './query';
import type { DomainQueryRequest } from './query';

const HR = '─'.repeat(78);

async function runDemo(label: string, narration: string, req: DomainQueryRequest): Promise<void> {
  console.log(`\n${HR}`);
  console.log(`▶ ${label}`);
  console.log(`  ${narration}`);
  console.log(HR);
  console.log('\nFilterExpression (what the agent emits):');
  console.log(indent(JSON.stringify(req, null, 2), 2));

  const reqWithSql = { ...req, include_sql: true };
  const result = await runQuery(db, reqWithSql);

  console.log('\nCompiled SQL:');
  console.log(indent(formatSql(result.sql ?? ''), 2));
  if (result.params && result.params.length) {
    console.log(`\nParams: ${JSON.stringify(result.params)}`);
  }

  console.log(`\nResults: ${result.count} row${result.count === 1 ? '' : 's'}`);
  for (const row of result.rows.slice(0, 5)) {
    console.log(indent(formatRow(row), 2));
  }
  if (result.count > 5) console.log(`  … and ${result.count - 5} more`);
}

function indent(s: string, n: number): string {
  return s.split('\n').map(l => ' '.repeat(n) + l).join('\n');
}

function formatSql(s: string): string {
  return s
    .replace(/ from /gi, '\nFROM ')
    .replace(/ left join /gi, '\nLEFT JOIN ')
    .replace(/ where /gi, '\nWHERE ')
    .replace(/ order by /gi, '\nORDER BY ')
    .replace(/ limit /gi, '\nLIMIT ')
    .replace(/ offset /gi, '\nOFFSET ');
}

function formatRow(row: unknown): string {
  const r = row as Record<string, unknown>;
  const interesting: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    if (['createdAt', 'updatedAt', 'deletedAt', 'externalId', 'providerMetadata', 'rawData'].includes(k)) continue;
    if (typeof v === 'string' && v.length > 100) {
      interesting[k] = v.slice(0, 100) + '…';
    } else {
      interesting[k] = v;
    }
  }
  return JSON.stringify(interesting);
}

async function main(): Promise<void> {
  console.log('\n');
  console.log('═'.repeat(78));
  console.log('  query-surface-poc — demo CLI (dealbrain schema)');
  console.log('═'.repeat(78));
  console.log('  Runs 6 queries against the seeded data, escalating from simple');
  console.log('  filters to the proof-point: cross-entity composable filter + text');
  console.log('  search, all expressed in ONE FilterExpression.');

  await runDemo(
    'Q1 — single entity, exact filter',
    'List opportunities currently in stage "closing"',
    {
      entity: 'opportunity',
      filter: { on: 'stage', op: 'eq', value: 'closing' },
      sort: [{ field: 'amount', dir: 'desc' }],
    },
  );

  await runDemo(
    'Q2 — cross-entity belongs_to (1 hop)',
    'List opportunities at Acme Corp',
    {
      entity: 'opportunity',
      filter: { on: 'account.name', op: 'eq', value: 'Acme Corp' },
    },
  );

  await runDemo(
    'Q3 — boolean composition with numeric + categorical + cross-entity',
    'Opportunities in stage closing|negotiation at Acme|Globex with amount over $30K',
    {
      entity: 'opportunity',
      filter: {
        and: [
          { on: 'stage', op: 'in', value: ['closing', 'negotiation'] },
          { on: 'account.name', op: 'in', value: ['Acme Corp', 'Globex'] },
          { on: 'amount', op: 'gt', value: 3000000 },
        ],
      },
      sort: [{ field: 'amount', dir: 'desc' }],
    },
  );

  await runDemo(
    'Q4 — text search (ILIKE on a single column)',
    'Find transcripts where the body mentions "pricing"',
    {
      entity: 'transcript',
      filter: { on: 'transcript', op: 'contains', value: 'pricing' },
      sort: [{ field: 'occurred_at', dir: 'desc' }],
    },
  );

  await runDemo(
    'Q5 — text-magic fan-out across all searchable text columns',
    'Find transcripts where ANY text column (title / transcript / summary / notes) mentions "renewal"',
    {
      entity: 'transcript',
      filter: { on: 'text', op: 'contains', value: 'renewal' },
      sort: [{ field: 'occurred_at', dir: 'desc' }],
    },
  );

  await runDemo(
    'Q6 — THE PROOF POINT (2-hop cross-entity + text search)',
    "Transcripts mentioning 'pricing' for opportunities at Acme Corp",
    {
      entity: 'transcript',
      filter: {
        and: [
          { on: 'transcript', op: 'contains', value: 'pricing' },
          { on: 'opportunity.account.name', op: 'eq', value: 'Acme Corp' },
        ],
      },
      sort: [{ field: 'occurred_at', dir: 'asc' }],
      page: { limit: 20 },
    },
  );

  console.log(`\n${'═'.repeat(78)}`);
  console.log('  Demo complete. One primitive. Six queries.');
  console.log('  Cross-entity composition + text search + text-magic fan-out');
  console.log('  compose without operator inflation.');
  console.log('═'.repeat(78));
  console.log('');
}

main()
  .catch(err => {
    console.error('\nDemo failed:', err);
    process.exit(1);
  })
  .finally(() => closeDb());
