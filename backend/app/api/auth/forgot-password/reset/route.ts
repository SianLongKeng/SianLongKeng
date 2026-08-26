import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { hashPassword, verifyPassword } from "@/lib/server";

interface TeacherRow {
  id: string;
  security_answer_hash: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim().toLowerCase() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!email || !answer || !newPassword) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const rows = await query<TeacherRow>(
    "select id, security_answer_hash from teachers where email = $1",
    [email]
  );
  const teacher = rows[0];
  if (!teacher || !teacher.security_answer_hash) {
    return NextResponse.json({ error: "คำตอบไม่ถูกต้อง" }, { status: 401 });
  }

  const answerOk = await verifyPassword(answer, teacher.security_answer_hash);
  if (!answerOk) {
    return NextResponse.json({ error: "คำตอบไม่ถูกต้อง" }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await query("update teachers set password_hash = $1 where id = $2", [passwordHash, teacher.id]);

  return NextResponse.json({ ok: true });
}
