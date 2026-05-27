// Lightweight web adapter — Bun.serve over the three primitives, with the ENTIRE
// Drizzle schema auto-exposed (registerSchema). No framework, no per-entity code.
//   DATABASE_URL=postgresql://qsp:qsp@localhost:5532/qsp bun src/server.ts
//   → http://localhost:3577

import 'reflect-metadata';
import { db } from './db';
import { QueryApplicationService } from './query/query.application-service';
import { registerSchema } from './query/schema-registry';
import * as schema from './schema';
import { fieldValues, fieldValuesJsonb } from './query/eav/schema';

// Minimal ambient typing for the Bun runtime global (avoids a @types/bun dep).
declare const Bun: {
  serve(options: { port: number; fetch: (req: Request) => Response | Promise<Response> }): unknown;
  file(path: string | URL): Blob;
};

// EAV overlay — the only thing that can't be auto-introspected.
// Extracted as a constant so /api/expose can re-register with a different exclude list.
const EAV_OVERLAY = {
  opportunities:           { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'opportunity' },
  transcript_observations: { kind: 'typed-columns' as const, valueTable: fieldValues, entityTypeValue: 'transcript_observation' },
  accounts:                { kind: 'jsonb-value' as const, valueTable: fieldValuesJsonb, entityTypeValue: 'account', valueColumn: 'value', currentOnly: true, validToColumn: 'validTo' },
};

// Point it at the schema → auto-expose every table. EAV is the only overlay.
let regs = registerSchema(schema as unknown as Record<string, unknown>, { eav: EAV_OVERLAY });

const q = new QueryApplicationService(db);
const PORT = Number(process.env.PORT ?? 3577);
const INDEX = new URL('./web/index.html', import.meta.url);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
        return new Response(Bun.file(INDEX), { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
      if (req.method === 'GET' && p === '/api/describe') return json(await q.describe());
      if (req.method === 'GET' && p.startsWith('/api/describe/')) {
        return json(await q.describe(decodeURIComponent(p.slice('/api/describe/'.length))));
      }
      if (req.method === 'POST' && p === '/api/query') {
        const b = (await req.json()) as Record<string, never>;
        return json(await q.query(b.entity, { filter: b.filter, sort: b.sort, page: b.page, preview: b.preview ?? true, include_sql: true }));
      }
      if (req.method === 'POST' && p === '/api/fetch') {
        const b = (await req.json()) as Record<string, never>;
        return json(await q.fetch(b.entity, b.ids, { filter: b.filter, expand: b.expand }));
      }
      if (req.method === 'POST' && p === '/api/expose') {
        const b = (await req.json()) as { exclude?: string[] };
        // Re-register the schema with the new exclude list; flush the EAV cache.
        regs = registerSchema(schema as unknown as Record<string, unknown>, { eav: EAV_OVERLAY, exclude: b.exclude ?? [] });
        q.resetCache();
        return json(await q.describe());
      }
      return json({ error: 'not_found' }, 404);
    } catch (err) {
      return json({ error: 'query_error', message: err instanceof Error ? err.message : String(err) }, 400);
    }
  },
});

// eslint-disable-next-line no-console
console.log(`query-surface web → http://localhost:${PORT}  (auto-exposed ${regs.length} entities)`);
