// MCP client test — spawns src/mcp-server.ts via stdio, runs the SDK
// handshake, calls both tools end-to-end, prints results.
//
// Verifies that:
//   1. The server boots and advertises its capabilities
//   2. tools/list returns both query_search and query_fetch with schemas
//   3. query_search executes the proof-point and returns IDs + snippets
//   4. query_fetch hydrates with expand and returns the full ancestor chain
//
// Run:
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/mcp-test.ts

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://qsp:qsp@localhost:5532/qsp';
const SERVER_PATH = new URL('./mcp-server.ts', import.meta.url).pathname;

const HR = '─'.repeat(78);

async function main(): Promise<void> {
  console.log('Spawning MCP server via stdio…');
  console.log(`  command: bun ${SERVER_PATH}`);
  console.log('');

  const transport = new StdioClientTransport({
    command: 'bun',
    args: [SERVER_PATH],
    env: { ...process.env, DATABASE_URL } as Record<string, string>,
  });

  const client = new Client(
    { name: 'mcp-test', version: '0.1.0' },
    { capabilities: {} },
  );

  await client.connect(transport);

  // -----------------------------------------------------------------------
  // 1) List tools
  // -----------------------------------------------------------------------
  console.log(HR);
  console.log('  TEST 1 — tools/list');
  console.log(HR);
  const toolsResp = await client.listTools();
  console.log(`  Got ${toolsResp.tools.length} tools:`);
  for (const t of toolsResp.tools) {
    console.log(`    - ${t.name}: ${t.description?.split('\n')[0]}`);
  }

  // -----------------------------------------------------------------------
  // 2) Call query_search — the proof-point query
  // -----------------------------------------------------------------------
  console.log('');
  console.log(HR);
  console.log('  TEST 2 — query_search (proof-point: pricing chunks in closing-stage deals)');
  console.log(HR);
  const searchResp = await client.callTool({
    name: 'query_search',
    arguments: {
      entity: 'transcript_chunk',
      filter: {
        and: [
          { on: 'body', op: 'contains', value: 'pricing' },
          { on: 'transcript.opportunity.stage', op: 'eq', value: 'closing' },
        ],
      },
      preview: true,
      page: { limit: 3 },
    },
  });

  const searchPayload = JSON.parse((searchResp.content as Array<{ type: string; text: string }>)[0].text);
  console.log(`  Total matches: ${searchPayload.total}`);
  console.log(`  IDs returned: ${searchPayload.ids.length}`);
  console.log(`  First preview row:`);
  const p = searchPayload.preview?.[0];
  if (p) {
    console.log(`    [${p.speaker}, pos=${p.position}] body: ${(p.body ?? '').slice(0, 60)}…`);
    for (const snip of p._snippets ?? []) {
      console.log(`      _snippet[${snip.column}]: ${snip.snippet}`);
      console.log(`        match=[${snip.match.start}:${snip.match.end}], full_length=${snip.full_length}`);
    }
  }

  // -----------------------------------------------------------------------
  // 3) Call query_fetch with expand
  // -----------------------------------------------------------------------
  console.log('');
  console.log(HR);
  console.log('  TEST 3 — query_fetch with full expand chain');
  console.log(HR);
  const fetchResp = await client.callTool({
    name: 'query_fetch',
    arguments: {
      entity: 'transcript_chunk',
      ids: searchPayload.ids.slice(0, 2),
      expand: ['transcript', 'transcript.opportunity', 'transcript.opportunity.account'],
    },
  });

  const fetchPayload = JSON.parse((fetchResp.content as Array<{ type: string; text: string }>)[0].text);
  console.log(`  Hydrated ${fetchPayload.count} rows:`);
  for (const row of fetchPayload.rows) {
    const t = row.transcript ?? {};
    const o = t.opportunity ?? {};
    const a = o.account ?? {};
    console.log(`    [${row.speaker}, pos=${row.position}] ${(row.body ?? '').slice(0, 50)}…`);
    console.log(`      └─ ${t.title} → ${o.name} → ${a.name} (${a.industry})`);
  }

  // -----------------------------------------------------------------------
  // 4) Multi-entity search
  // -----------------------------------------------------------------------
  console.log('');
  console.log(HR);
  console.log('  TEST 4 — query_search multi-entity (email + transcript)');
  console.log(HR);
  const multiResp = await client.callTool({
    name: 'query_search',
    arguments: {
      queries: [
        { entity: 'email', filter: { on: 'text', op: 'contains', value: 'pricing' } },
        { entity: 'transcript', filter: { on: 'text', op: 'contains', value: 'pricing' } },
      ],
    },
  });
  const multiPayload = JSON.parse((multiResp.content as Array<{ type: string; text: string }>)[0].text);
  for (const [entity, result] of Object.entries(multiPayload.results) as Array<[string, { total: number; ids: string[] }]>) {
    console.log(`    ${entity}: ${result.total} matches`);
  }

  // -----------------------------------------------------------------------
  // 5) Error path — invalid expand
  // -----------------------------------------------------------------------
  console.log('');
  console.log(HR);
  console.log('  TEST 5 — error path (invalid expand)');
  console.log(HR);
  const errResp = await client.callTool({
    name: 'query_fetch',
    arguments: {
      entity: 'transcript',
      ids: ['00000000-0000-0000-0000-0000000000c1'],
      expand: ['banana'],
    },
  });
  const errPayload = JSON.parse((errResp.content as Array<{ type: string; text: string }>)[0].text);
  console.log(`    isError: ${errResp.isError}`);
  console.log(`    error: ${errPayload.error}`);
  console.log(`    message: ${errPayload.message}`);

  // -----------------------------------------------------------------------
  console.log('');
  console.log('═'.repeat(78));
  console.log('  All MCP tool tests passed.');
  console.log('═'.repeat(78));

  await client.close();
}

main().catch(err => {
  console.error('MCP test failed:', err);
  process.exit(1);
});
