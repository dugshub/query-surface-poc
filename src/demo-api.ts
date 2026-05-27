// Agent-facing demo — drives /search + /fetch over HTTP, no direct DB calls.
//
// This is what the team sees: an external HTTP client (could be a frontend,
// could be Claude Code, could be curl) using the same JSON FilterExpression
// language to find and fetch data with composable filters + text magic +
// cross-entity reach.
//
// Run:  bun src/demo-api.ts
// (assumes server is running on PORT=3577 — see PROGRESS.md "Boot the server")

const API_URL = process.env.QUERY_URL ?? 'http://localhost:3577';

const HR = '─'.repeat(78);
const HR_BOLD = '═'.repeat(78);

async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${err}`);
  }
  return (await res.json()) as T;
}

function header(title: string, narration: string) {
  console.log('');
  console.log(HR);
  console.log(`▶ ${title}`);
  console.log(`  ${narration}`);
  console.log(HR);
}

async function main() {
  console.log('');
  console.log(HR_BOLD);
  console.log('  query-surface-poc — agent-facing HTTP demo (dealbrain schema)');
  console.log(HR_BOLD);
  console.log('  Same JSON in. Different roots. Real HTTP. Real rows.');
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 1 — Cast a wide net via text magic across two entity types
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 1 — "Where did pricing come up?"',
    'Multi-entity search with the magic `text` field — one filter expression spans email + transcript',
  );

  const wideNet = await post<{ results: Record<string, { ids: string[]; total: number; preview?: unknown[] }> }>(
    '/search',
    {
      queries: [
        { entity: 'email',      filter: { on: 'text', op: 'contains', value: 'pricing' } },
        { entity: 'transcript', filter: { on: 'text', op: 'contains', value: 'pricing' } },
      ],
      preview: true,
    },
  );

  for (const [entity, result] of Object.entries(wideNet.results)) {
    console.log(`\n  ${entity}: ${result.total} matches`);
    for (const p of (result.preview ?? []).slice(0, 3)) {
      const r = p as Record<string, unknown>;
      console.log(`    ${entity === 'email'
        ? `[${r.direction}] ${r.subject}`
        : `${r.title} (${r.source})`}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 2 — Narrow: of those, only deals in StageName=Proposal/Price Quote
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 2 — Narrow: "only the ones tied to deals in Proposal/Price Quote"',
    'Same text-magic filter AND a cross-entity reach via opportunity.StageName (EAV field)',
  );

  const narrowed = await post<{ results: Record<string, { ids: string[]; total: number; preview?: unknown[] }> }>(
    '/search',
    {
      queries: [
        {
          entity: 'email',
          filter: {
            and: [
              { on: 'text', op: 'contains', value: 'pricing' },
              { on: 'opportunity.StageName', op: 'eq', value: 'Proposal/Price Quote' },
            ],
          },
        },
        {
          entity: 'transcript',
          filter: {
            and: [
              { on: 'text', op: 'contains', value: 'pricing' },
              { on: 'opportunity.StageName', op: 'eq', value: 'Proposal/Price Quote' },
            ],
          },
        },
      ],
      preview: true,
    },
  );

  for (const [entity, result] of Object.entries(narrowed.results)) {
    console.log(`\n  ${entity}: ${result.total} matches in Proposal/Price Quote-stage deals`);
    for (const p of (result.preview ?? []).slice(0, 3)) {
      const r = p as Record<string, unknown>;
      console.log(`    ${entity === 'email'
        ? `[${r.direction}] ${r.subject}`
        : `${r.title}`}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 3 — Two-hop cross-entity (transcript → opportunity → account)
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 3 — "Pricing came up in transcripts at Acme — show me those"',
    'Two-hop reach: transcript → opportunity → account.name',
  );

  const acmeHits = await post<{ ids: string[]; total: number; preview?: unknown[] }>('/search', {
    entity: 'transcript',
    filter: {
      and: [
        { on: 'transcript', op: 'contains', value: 'pricing' },
        { on: 'opportunity.account.name', op: 'eq', value: 'Acme Corp' },
      ],
    },
    preview: true,
    sort: [{ field: 'occurred_at', dir: 'asc' }],
  });

  console.log(`\n  ${acmeHits.total} transcripts matched. Preview:`);
  for (const p of acmeHits.preview ?? []) {
    const r = p as Record<string, unknown>;
    console.log(`    ${r.title} (${r.source})`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 4 — Hydrate full rows with expand chain
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 4 — "Pull the full transcripts with opportunity + account inline"',
    'Two-stage pattern: IDs from /search → /fetch hydrates with expand for relational context',
  );

  console.log(`\n  Fetching ${acmeHits.ids.length} transcript IDs with expand chain…`);

  const hydrated = await post<{ rows: Record<string, unknown>[]; count: number }>('/fetch', {
    entity: 'transcript',
    ids: acmeHits.ids,
    expand: ['opportunity', 'opportunity.account'],
  });

  console.log(`\n  ${hydrated.count} rows hydrated:`);
  for (const row of hydrated.rows) {
    const opp = row.opportunity as Record<string, unknown> | null;
    const acct = opp?.account as Record<string, unknown> | null;
    console.log(`    ${row.title}`);
    console.log(`      └ opportunity: ${opp?.name} | StageName=${opp?.StageName}`);
    console.log(`      └ account:     ${acct?.name} (${acct?.website})`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 5 — Refinement at fetch time
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 5 — "Of these 4 opportunities, give me only the ones in Proposal/Price Quote"',
    'Refinement filter (on an EAV field) passed to /fetch — narrows within the ID set without a fresh search',
  );

  const allOppIds = [
    '00000000-0000-0000-0000-bbbb00000001', // Acme — Q3 New Logo (Proposal/Price Quote)
    '00000000-0000-0000-0000-bbbb00000003', // Initech — Multi-location Rollout (Negotiation/Review)
    '00000000-0000-0000-0000-bbbb00000006', // Stark — Year 3 Renewal + Expansion (Proposal/Price Quote)
    '00000000-0000-0000-0000-bbbb00000009', // Vehement — Portfolio Analytics Tier (Proposal/Price Quote)
  ];
  console.log(`\n  Sending ${allOppIds.length} opportunity IDs + refinement {StageName: Proposal/Price Quote}…`);

  const refined = await post<{ rows: Record<string, unknown>[]; count: number }>('/fetch', {
    entity: 'opportunity',
    ids: allOppIds,
    filter: { on: 'StageName', op: 'eq', value: 'Proposal/Price Quote' },
  });

  console.log(`\n  ${refined.count} of ${allOppIds.length} matched the refinement:`);
  for (const row of refined.rows) {
    console.log(`    ${row.name} | StageName=${row.StageName} | Amount=$${Number(row.Amount).toLocaleString()}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log('');
  console.log(HR_BOLD);
  console.log('  Demo complete.');
  console.log('  One language. Multi-entity. Text magic. Cross-entity reach. Two-stage IDs→fetch.');
  console.log(HR_BOLD);
  console.log('');
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
