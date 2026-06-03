// Drizzle client shared by every surface (the scripted example, the web UI, the
// MCP server, and seed scripts) — one Pool over DATABASE_URL.

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://qsp:qsp@localhost:5532/qsp',
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

/**
 * Construct a standalone drizzle client over an arbitrary connection string,
 * sharing this package's drizzle-orm instance (so the query engine's compiled
 * SQL executes cleanly). Returns the db plus a `close()` for the pool. Schema is
 * optional — the query surface resolves everything from its own registry, not
 * from drizzle's relational schema arg. Used to point the surface at a consumer
 * database (e.g. an external app's DATABASE_URL) without their drizzle copy.
 */
export function makeDb(connectionString: string): {
  db: ReturnType<typeof drizzle>;
  close: () => Promise<void>;
} {
  const p = new Pool({ connectionString });
  return { db: drizzle(p), close: () => p.end() };
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
