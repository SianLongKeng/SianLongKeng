import { NextRequest, NextResponse } from "next/server";
import { query, canAccessAttempt } from "@/lib/server";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const studentId = await canAccessAttempt(params.attemptId);
  if (!studentId) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const promptText = typeof body?.promptText === "string" ? body.promptText.trim() : "";
  const responseText = typeof body?.responseText === "string" ? body.responseText.trim() : "";
  if (!promptText || !responseText) {
    return NextResponse.json({ error: "กรุณาเขียนสะท้อนความคิดก่อนส่งนะคะ" }, { status: 400 });
  }

  await query("insert into reflections (attempt_id, prompt_text, response_text) values ($1, $2, $3)", [
    params.attemptId,
    promptText,
    responseText,
  ]);

  return NextResponse.json({ ok: true });
}
