import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Node-only combined module (bcryptjs, pg, Anthropic SDK are not Edge-safe) —
// import this only from Node-runtime route handlers/pages, never from
// middleware.ts. Session token helpers for the teacher cookie live in
// lib/session.ts, which middleware.ts uses directly instead.

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A lightweight, separate session for students who self-join via a class
// code (see /join) — deliberately not the teacher session: no password was
// ever involved, so this cookie only ever proves "picked this name after
// entering a valid class join code," and only unlocks the mission/coach/
// diagnosis pages for that one student id, never the /admin dashboard.
export const STUDENT_SESSION_COOKIE = "edutwin_student_session";
const STUDENT_SESSION_TTL_SECONDS = 60 * 60 * 3; // one class period, generous

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface StudentSessionPayload {
  studentId: string;
  classId: string;
}

export async function createStudentSessionToken(payload: StudentSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STUDENT_SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyStudentSessionToken(token: string): Promise<StudentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as StudentSessionPayload;
  } catch {
    return null;
  }
}

// A single pooled connection reused across serverless invocations in the
// same warm lambda. DATABASE_URL must be set as a Vercel environment
// variable (never hardcoded, never committed).
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _anthropicClient: Anthropic | undefined;
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

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!global._anthropicClient) {
    global._anthropicClient = new Anthropic();
  }
  return global._anthropicClient;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Mission/diagnosis/coach pages and APIs are reachable two ways: a teacher
// viewing one of their own students (existing teacher session + ownership
// join), or the student themself after self-joining via a class code
// (student session cookie scoped to exactly that studentId).
export async function canAccessStudent(studentId: string): Promise<boolean> {
  const teacherToken = cookies().get(SESSION_COOKIE)?.value;
  const teacherSession = teacherToken ? await verifySessionToken(teacherToken) : null;
  if (teacherSession) {
    const owned = await query<{ id: string }>(
      `select s.id from students s join classes c on c.id = s.class_id where s.id = $1 and c.teacher_id = $2`,
      [studentId, teacherSession.teacherId]
    );
    if (owned.length > 0) return true;
  }

  const studentToken = cookies().get(STUDENT_SESSION_COOKIE)?.value;
  const studentSession = studentToken ? await verifyStudentSessionToken(studentToken) : null;
  if (studentSession && studentSession.studentId === studentId) return true;

  return false;
}

// Same check, but starting from a mission_attempts id instead of a student
// id directly — resolves the owning student first, then re-checks access.
export async function canAccessAttempt(attemptId: string): Promise<string | null> {
  const rows = await query<{ student_id: string }>(
    "select student_id from mission_attempts where id = $1",
    [attemptId]
  );
  const studentId = rows[0]?.student_id;
  if (!studentId) return null;
  return (await canAccessStudent(studentId)) ? studentId : null;
}
