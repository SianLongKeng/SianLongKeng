import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/server";
import { hashPassword } from "@/lib/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const className = typeof body?.className === "string" ? body.className.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const securityQuestion = typeof body?.securityQuestion === "string" ? body.securityQuestion.trim() : "";
  const securityAnswer = typeof body?.securityAnswer === "string" ? body.securityAnswer.trim() : "";

  if (!schoolName || !fullName || !email || !password || !className || !subject || !securityQuestion || !securityAnswer) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const existing = await query<{ id: string }>("select id from teachers where email = $1", [email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  // Same one-way hashing as the login password — a leaked database still
  // can't be used to answer the security question and take over accounts.
  const securityAnswerHash = await hashPassword(securityAnswer.toLowerCase());

  let teacher: { id: string; school_id: string; email: string };
  try {
    teacher = await withTransaction(async (client) => {
      const schoolRes = await client.query<{ id: string }>(
        "insert into schools (name) values ($1) returning id",
        [schoolName]
      );
      const schoolId = schoolRes.rows[0].id;

      const teacherRes = await client.query<{ id: string; school_id: string; email: string }>(
        `insert into teachers (school_id, full_name, email, password_hash, security_question, security_answer_hash)
         values ($1, $2, $3, $4, $5, $6)
         returning id, school_id, email`,
        [schoolId, fullName, email, passwordHash, securityQuestion, securityAnswerHash]
      );
      const teacherRow = teacherRes.rows[0];

      // Class names double as the join code students type on /join, so
      // they must be unique across every teacher/school, not just this one.
      await client.query(
        "insert into classes (school_id, teacher_id, name, subject) values ($1, $2, $3, $4)",
        [schoolId, teacherRow.id, className, subject]
      );

      return teacherRow;
    });
  } catch (err) {
    // Two concurrent registrations with the same email: the earlier
    // `select` check above can't catch this, only the unique constraint can.
    // The class-name uniqueness constraint can fail the same way, so tell
    // them apart by which constraint actually fired.
    const pgErr = err as { code?: string; constraint?: string };
    if (pgErr.code === "23505") {
      if (pgErr.constraint?.includes("classes_name") || pgErr.constraint?.includes("idx_classes_name")) {
        return NextResponse.json(
          { error: "ชื่อห้องเรียนนี้มีคนใช้แล้วในระบบ กรุณาตั้งชื่ออื่น" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว" }, { status: 409 });
    }
    throw err;
  }

  const token = await createSessionToken({
    teacherId: teacher.id,
    schoolId: teacher.school_id,
    email: teacher.email,
  });

  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
