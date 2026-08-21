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

// Runs fn with a single checked-out client wrapped in BEGIN/COMMIT, rolling
// back on any error — for bulk inserts where partial success would leave
// the roster in a confusing half-imported state.
export async function withTransaction<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
