import { Pool } from "pg";

// A single pooled connection reused across serverless invocations in the
// same warm lambda. DATABASE_URL must be set as a Vercel environment
// variable (never hardcoded, never committed) once the real Postgres
// instance exists.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return global._pgPool;
}

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}
