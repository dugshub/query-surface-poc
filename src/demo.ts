// Demo CLI — runs the 6 escalating queries against the seeded data, printing
// the JSON FilterExpression (what the agent emits), the compiled SQL, and a
// preview of the result rows. This is what the team sees in the meeting.

import { db, closeDb } from './db';
import { runQuery } from './query';
import type { DomainQueryRequest } from './query';
import { loadFieldMaps, POC_ACTOR_USER_ID, type EavContext } from './query/field-map';

const HR = '─'.repeat(78);

async function runDemo(label: string, narration: string, req: DomainQueryRequest, eav: EavContext): Promise<void> {
  console.log(`\n${HR}`);
  console.log(`▶ ${label}`);
  console.log(`  ${narration}`);
  console.log(HR);
  console.log('\nFilterExpression (what the agent emits):');
  console.log(indent(JSON.stringify(req, null, 2), 2));

  const reqWithSql = { ...req, include_sql: true };
  const result = await runQuery(db, reqWithSql, eav);

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
  console.log('  query-surface-poc — demo CLI (dealbrain schema, EAV fields)');
  console.log('═'.repeat(78));
  console.log('  Runs 6 queries against the seeded data, escalating from simple');
  console.log('  filters to the proof-point: cross-entity composable filter + text');
  console.log('  search, all expressed in ONE FilterExpression.');
  console.log('  Note: StageName / Amount / CloseDate are EAV-backed (field_values),');
  console.log('  yet filter / sort exactly like columns — the seam is invisible.');

  // EAV field map (actor-scoped) — resolves StageName/Amount/… to field_values.
  const eav = await loadFieldMaps(db, POC_ACTOR_USER_ID);

  await runDemo(
    'Q1 — single entity, exact filter (EAV field)',
    'List opportunities currently in stage "Proposal/Price Quote"',
    {
      entity: 'opportunity',
      filter: { on: 'StageName', op: 'eq', value: 'Proposal/Price Quote' },
      sort: [{ field: 'Amount', dir: 'desc' }],
    },
    eav,
  );

  await runDemo(
    'Q2 — cross-entity belongs_to (1 hop)',
    'List opportunities at Acme Corp',
    {
      entity: 'opportunity',
      filter: { on: 'account.name', op: 'eq', value: 'Acme Corp' },
    },
    eav,
  );

  await runDemo(
    'Q3 — boolean composition: EAV categorical + EAV numeric + cross-entity',
    'Opportunities in Proposal/Price Quote|Negotiation/Review at Acme|Globex with amount over $30K',
    {
      entity: 'opportunity',
      filter: {
        and: [
          { on: 'StageName', op: 'in', value: ['Proposal/Price Quote', 'Negotiation/Review'] },
          { on: 'account.name', op: 'in', value: ['Acme Corp', 'Globex'] },
          { on: 'Amount', op: 'gt', value: 30000 },
        ],
      },
      sort: [{ field: 'Amount', dir: 'desc' }],
    },
    eav,
  );

  await runDemo(
    'Q4 — text search (ILIKE on a single column)',
    'Find transcripts where the body mentions "pricing"',
    {
      entity: 'transcript',
      filter: { on: 'transcript', op: 'contains', value: 'pricing' },
      sort: [{ field: 'occurred_at', dir: 'desc' }],
    },
    eav,
  );

  await runDemo(
    'Q5 — text-magic fan-out across all searchable text columns',
    'Find transcripts where ANY text column (title / transcript / summary / notes) mentions "renewal"',
    {
      entity: 'transcript',
      filter: { on: 'text', op: 'contains', value: 'renewal' },
      sort: [{ field: 'occurred_at', dir: 'desc' }],
    },
    eav,
  );

  await runDemo(
    'Q6 — THE PROOF POINT (2-hop cross-entity + text search + EAV filter)',
    "Transcripts mentioning 'pricing' for opportunities in stage Proposal/Price Quote",
    {
      entity: 'transcript',
      filter: {
        and: [
          { on: 'transcript', op: 'contains', value: 'pricing' },
          { on: 'opportunity.StageName', op: 'eq', value: 'Proposal/Price Quote' },
        ],
      },
      sort: [{ field: 'occurred_at', dir: 'asc' }],
      page: { limit: 20 },
    },
    eav,
  );

  await runDemo(
    'Q7 — EAV Shape B (account, jsonb-backed fields)',
    'Enterprise-tier accounts in manufacturing — account fields live in a single jsonb value column, yet filter/sort like columns',
    {
      entity: 'account',
      filter: { and: [
        { on: 'Tier', op: 'eq', value: 'Enterprise' },
        { on: 'Industry', op: 'eq', value: 'manufacturing' },
      ] },
      sort: [{ field: 'EmployeeCount', dir: 'desc' }],
    },
    eav,
  );

  await runDemo(
    'Q8 — BOTH shapes in one query (Shape A entity → Shape B field)',
    "Opportunities whose account is in fintech — opportunity fields are Shape A (typed cols), account.Industry is Shape B (jsonb), resolved in one statement",
    {
      entity: 'opportunity',
      filter: { on: 'account.Industry', op: 'eq', value: 'fintech' },
    },
    eav,
  );

  console.log(`\n${'═'.repeat(78)}`);
  console.log('  Demo complete. One primitive. Eight queries.');
  console.log('  Cross-entity composition + text search + text-magic fan-out, and');
  console.log('  TWO EAV storage shapes (typed columns + jsonb) behind one contract —');
  console.log('  the agent never sees the seam.');
  console.log('═'.repeat(78));
  console.log('');
}

main()
  .catch(err => {
    console.error('\nDemo failed:', err);
    process.exit(1);
  })
  .finally(() => closeDb());
