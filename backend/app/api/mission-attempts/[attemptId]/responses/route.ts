import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

// Confirms the attempt belongs to a student in a class owned by this
// teacher — same ownership-check pattern as the students routes.
async function attemptBelongsToTeacher(attemptId: string, teacherId: string) {
  const rows = await query<{ id: string }>(
    `select a.id from mission_attempts a
       join students s on s.id = a.student_id
       join classes c on c.id = s.class_id
      where a.id = $1 and c.teacher_id = $2`,
    [attemptId, teacherId]
  );
  return rows.length > 0;
}

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await attemptBelongsToTeacher(params.attemptId, session.teacherId))) {
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
