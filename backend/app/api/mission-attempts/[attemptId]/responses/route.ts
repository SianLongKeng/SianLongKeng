import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { canAccessAttempt } from "@/lib/missionAccess";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  if (!(await canAccessAttempt(params.attemptId))) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const questionId = typeof body?.questionId === "string" ? body.questionId : "";
  const choiceId = typeof body?.choiceId === "string" ? body.choiceId : "";
  const attemptNumber = typeof body?.attemptNumber === "number" ? body.attemptNumber : 1;
  const timeSpentSeconds = typeof body?.timeSpentSeconds === "number" ? body.timeSpentSeconds : null;

  if (!questionId || !choiceId) {
    return NextResponse.json({ error: "Missing questionId or choiceId" }, { status: 400 });
  }

  // Never trust a client-submitted correctness flag — look it up server-side.
  const choiceRows = await query<{ is_correct: boolean }>(
    "select is_correct from question_choices where id = $1 and question_id = $2",
    [choiceId, questionId]
  );
  if (choiceRows.length === 0) {
    return NextResponse.json({ error: "Choice not found" }, { status: 404 });
  }
  const isCorrect = choiceRows[0].is_correct;

  await query(
    `insert into question_responses (attempt_id, question_id, choice_id, attempt_number, is_correct, time_spent_seconds)
     values ($1, $2, $3, $4, $5, $6)`,
    [params.attemptId, questionId, choiceId, attemptNumber, isCorrect, timeSpentSeconds]
  );

  // On a wrong answer also hand back the correct choice id so the client can
  // reveal it (the original demo's ".reveal-correct" state) once the student
  // has used up their retries — the client still never decides correctness
  // itself, it only learns the answer after the server has recorded the miss.
  let correctChoiceId: string | null = null;
  if (!isCorrect) {
    const correctRows = await query<{ id: string }>(
      "select id from question_choices where question_id = $1 and is_correct = true limit 1",
      [questionId]
    );
    correctChoiceId = correctRows[0]?.id ?? null;
  }

  return NextResponse.json({ isCorrect, correctChoiceId });
}
