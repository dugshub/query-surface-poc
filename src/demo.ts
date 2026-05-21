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
  // Light pretty-print: line breaks after major clauses.
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
  // Trim noisy fields for readability.
  for (const [k, v] of Object.entries(r)) {
    if (['createdAt', 'updatedAt', 'deletedAt', 'externalId'].includes(k)) continue;
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
  console.log('  query-surface-poc — demo CLI');
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
    'List opportunities at accounts in the fintech industry',
    {
      entity: 'opportunity',
      filter: { on: 'account.industry', op: 'eq', value: 'fintech' },
    },
  );

  await runDemo(
    'Q3 — boolean composition with numeric + categorical + cross-entity',
    'Opportunities in stage closing|negotiation at fintech|saas accounts with amount over $30K',
    {
      entity: 'opportunity',
      filter: {
        and: [
          { on: 'stage', op: 'in', value: ['closing', 'negotiation'] },
          { on: 'account.industry', op: 'in', value: ['fintech', 'saas'] },
          { on: 'amount', op: 'gt', value: 3000000 },
        ],
      },
      sort: [{ field: 'amount', dir: 'desc' }],
    },
  );

  await runDemo(
    'Q4 — text search ACROSS (grep over the corpus)',
    'List transcripts where ANY chunk mentions pricing — has_many subquery',
    {
      entity: 'transcript',
      filter: { on: 'chunks.body', op: 'contains', value: 'pricing' },
      sort: [{ field: 'occurred_at', dir: 'desc' }],
    },
  );

  // Q5 needs a real transcript id — pull one from Q4's result domain.
  // For demo determinism, hard-code one of the seeded transcript ids.
  const ACME_PRICING_TS = '00000000-0000-0000-0000-0000000000c2';

  await runDemo(
    'Q5 — text search WITHIN (grep inside one document)',
    'In the Acme pricing transcript, find the chunks that mention pricing',
    {
      entity: 'transcript_chunk',
      filter: {
        and: [
          { on: 'transcript_id', op: 'eq', value: ACME_PRICING_TS },
          { on: 'body', op: 'contains', value: 'pricing' },
        ],
      },
      sort: [{ field: 'position', dir: 'asc' }],
    },
  );

  await runDemo(
    'Q6 — THE PROOF POINT',
    "Chunks mentioning 'pricing' in transcripts of opportunities currently in stage 'closing'",
    {
      entity: 'transcript_chunk',
      filter: {
        and: [
          { on: 'body', op: 'contains', value: 'pricing' },
          { on: 'transcript.opportunity.stage', op: 'eq', value: 'closing' },
        ],
      },
      sort: [{ field: 'position', dir: 'asc' }],
      page: { limit: 20 },
    },
  );

  console.log(`\n${'═'.repeat(78)}`);
  console.log('  Demo complete. One primitive. Six queries.');
  console.log(`  Cross-entity composition + text search compose without operator inflation.`);
  console.log('═'.repeat(78));
  console.log('');
}

main()
  .catch(err => {
    console.error('\nDemo failed:', err);
    process.exit(1);
  })
  .finally(() => closeDb());
