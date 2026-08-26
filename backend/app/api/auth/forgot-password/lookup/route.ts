import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";

interface TeacherRow {
  security_question: string | null;
}

// No email/SMS provider exists in this app, so there is no "check your
// inbox" step to hide behind — the security question has to be shown
// directly here for the next step to be answerable. This does mean an
// email's existence in the system is discoverable, a small trade-off
// accepted in exchange for not depending on a third-party mail service.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
  }

  const rows = await query<TeacherRow>("select security_question from teachers where email = $1", [email]);
  const teacher = rows[0];
  if (!teacher || !teacher.security_question) {
    return NextResponse.json(
      { error: "ไม่พบบัญชีนี้ หรือบัญชีนี้ยังไม่ได้ตั้งคำถามกันลืมไว้" },
      { status: 404 }
    );
  }

  return NextResponse.json({ question: teacher.security_question });
}
