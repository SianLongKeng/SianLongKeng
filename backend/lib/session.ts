import { SignJWT, jwtVerify } from "jose";

// Edge-runtime-safe half of auth: only jose (no bcryptjs), so middleware.ts
// can import this without pulling a Node-only password-hashing library
// into the Edge bundle. Password hashing lives in lib/auth.ts instead,
// imported only from Node-runtime route handlers.
export const SESSION_COOKIE = "edutwin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  teacherId: string;
  schoolId: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
