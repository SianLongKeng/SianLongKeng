import bcrypt from "bcryptjs";

// Node-only half of auth (bcryptjs is not Edge-runtime-safe) — import this
// only from Node-runtime route handlers, never from middleware.ts. Session
// token helpers live in lib/session.ts, which middleware.ts uses instead.
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
