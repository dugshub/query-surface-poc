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

function show(label: string, value: unknown) {
  console.log(`  ${label}:`);
  console.log(
    JSON.stringify(value, null, 2)
      .split('\n')
      .map(l => '    ' + l)
      .join('\n'),
  );
}

async function main() {
  console.log('');
  console.log(HR_BOLD);
  console.log('  query-surface-poc — agent-facing HTTP demo');
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
  // SCENE 2 — Narrow: of those, only deals in stage=closing
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 2 — Narrow: "only the ones tied to deals currently closing"',
    'Same text-magic filter AND a cross-entity reach via opportunity.stage',
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
              { on: 'opportunity.stage', op: 'eq', value: 'closing' },
            ],
          },
        },
        {
          entity: 'transcript',
          filter: {
            and: [
              { on: 'text', op: 'contains', value: 'pricing' },
              { on: 'opportunity.stage', op: 'eq', value: 'closing' },
            ],
          },
        },
      ],
      preview: true,
    },
  );

  for (const [entity, result] of Object.entries(narrowed.results)) {
    console.log(`\n  ${entity}: ${result.total} matches in closing-stage deals`);
    for (const p of (result.preview ?? []).slice(0, 3)) {
      const r = p as Record<string, unknown>;
      console.log(`    ${entity === 'email'
        ? `[${r.direction}] ${r.subject}`
        : `${r.title}`}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 3 — Drill deeper: WITHIN the transcripts, show me the chunks
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 3 — "OK in those transcripts, show me the actual lines"',
    'Pivot to transcript_chunk root, refine using the IDs we found + the text filter',
  );

  const transcriptIds = narrowed.results.transcript.ids;
  console.log(`\n  Using transcript IDs from Scene 2: ${transcriptIds.length} transcripts`);

  const chunks = await post<{ ids: string[]; total: number; preview?: unknown[] }>('/search', {
    entity: 'transcript_chunk',
    filter: {
      and: [
        { on: 'transcript_id', op: 'in', value: transcriptIds },
        { on: 'text',          op: 'contains', value: 'pricing' },
      ],
    },
    preview: true,
    sort: [{ field: 'position', dir: 'asc' }],
    page: { limit: 5 },
  });

  console.log(`\n  ${chunks.total} chunks total. Showing first ${(chunks.preview ?? []).length}:`);
  for (const p of chunks.preview ?? []) {
    const r = p as Record<string, unknown>;
    console.log(`    [${r.speaker}] ${r.body}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 4 — Hydrate full rows for a specific subset
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 4 — "Pull the full data for these 3"',
    'Two-stage pattern: IDs from /search → /fetch hydrates only the ones we want',
  );

  const top3 = chunks.ids.slice(0, 3);
  console.log(`\n  Fetching ${top3.length} chunk IDs…`);

  const hydrated = await post<{ rows: Record<string, unknown>[]; count: number }>('/fetch', {
    entity: 'transcript_chunk',
    ids: top3,
  });

  console.log(`\n  ${hydrated.count} rows hydrated:`);
  for (const row of hydrated.rows) {
    console.log(`    ${JSON.stringify({
      transcriptId: row.transcriptId,
      position: row.position,
      speaker: row.speaker,
      body: typeof row.body === 'string' ? row.body.slice(0, 80) + '…' : row.body,
      startsAtSec: row.startsAtSec,
    })}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENE 5 — Refinement at fetch time
  // ─────────────────────────────────────────────────────────────────────────
  header(
    'Scene 5 — "Of these 4 opportunities, give me only the ones in closing"',
    'Refinement filter passed to /fetch — narrows within the ID set without a fresh search',
  );

  const allOppIds = [
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000b3',
    '00000000-0000-0000-0000-0000000000b4',
  ];
  console.log(`\n  Sending ${allOppIds.length} opportunity IDs + refinement {stage: closing}…`);

  const refined = await post<{ rows: Record<string, unknown>[]; count: number }>('/fetch', {
    entity: 'opportunity',
    ids: allOppIds,
    filter: { on: 'stage', op: 'eq', value: 'closing' },
  });

  console.log(`\n  ${refined.count} of ${allOppIds.length} matched the refinement:`);
  for (const row of refined.rows) {
    console.log(`    ${row.name} | stage=${row.stage} | amount=$${(Number(row.amount) / 100).toLocaleString()}`);
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
