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

export async function closeDb(): Promise<void> {
  await pool.end();
}
