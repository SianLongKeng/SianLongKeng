import { SignJWT, jwtVerify } from "jose";

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
