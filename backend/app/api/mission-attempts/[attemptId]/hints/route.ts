import { NextRequest, NextResponse } from "next/server";
import { query, canAccessAttempt } from "@/lib/server";

// Logs that a student asked for a hint on a question — a lightweight signal
// distinct from the full AI Coach conversation (coach_conversations), used
// as one of the "learning actions" the grading pass reads when it infers
// Learning DNA / Mistake DNA (see mission-attempts/[attemptId]/complete).
export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const studentId = await canAccessAttempt(params.attemptId);
  if (!studentId) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const questionId = typeof body?.questionId === "string" ? body.questionId : null;

  await query("insert into hint_requests (attempt_id, question_id) values ($1, $2)", [
    params.attemptId,
    questionId,
  ]);

  return NextResponse.json({ ok: true });
}
