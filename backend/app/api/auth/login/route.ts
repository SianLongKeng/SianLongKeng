import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { verifyPassword } from "@/lib/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

interface TeacherRow {
  id: string;
  school_id: string;
  email: string;
  password_hash: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const rows = await query<TeacherRow>(
    "select id, school_id, email, password_hash from teachers where email = $1",
    [email]
  );
  const teacher = rows[0];

  // Constant-shape response whether the email exists or not, to avoid
  // leaking which teacher accounts exist.
  const passwordOk = teacher ? await verifyPassword(password, teacher.password_hash) : false;
  if (!teacher || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken({
    teacherId: teacher.id,
    schoolId: teacher.school_id,
    email: teacher.email,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
