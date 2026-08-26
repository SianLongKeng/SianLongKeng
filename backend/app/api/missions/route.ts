import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, withTransaction } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

interface ChoiceInput {
  text: string;
  isCorrect: boolean;
}

interface QuestionInput {
  text: string;
  imageUrl?: string;
  choices: ChoiceInput[];
}

// Creates a teacher-authored mission with its questions/choices in one
// transaction — a mission with only some of its questions saved would be
// unplayable, so partial success is not an acceptable outcome here.
export async function POST(req: NextRequest) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const scenarioText = typeof body?.scenarioText === "string" ? body.scenarioText.trim() : "";
  const questions: QuestionInput[] = Array.isArray(body?.questions) ? body.questions : [];

  if (!classId || !title || !scenarioText) {
    return NextResponse.json({ error: "กรุณากรอกชื่อมิชชันและสถานการณ์ให้ครบ" }, { status: 400 });
  }
  if (questions.length === 0) {
    return NextResponse.json({ error: "ต้องมีอย่างน้อย 1 คำถาม" }, { status: 400 });
  }
  for (const q of questions) {
    const text = typeof q?.text === "string" ? q.text.trim() : "";
    const choices = Array.isArray(q?.choices) ? q.choices : [];
    const validChoices = choices.filter((c) => typeof c?.text === "string" && c.text.trim());
    if (!text || validChoices.length < 2) {
      return NextResponse.json({ error: "แต่ละคำถามต้องมีข้อความและอย่างน้อย 2 ตัวเลือก" }, { status: 400 });
    }
    if (!validChoices.some((c) => c.isCorrect)) {
      return NextResponse.json({ error: "แต่ละคำถามต้องมีคำตอบที่ถูกต้อง 1 ข้อ" }, { status: 400 });
    }
  }

  const owned = await query<{ id: string }>(
    "select id from classes where id = $1 and teacher_id = $2",
    [classId, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "ไม่พบห้องเรียนนี้" }, { status: 404 });
  }

  const missionId = await withTransaction(async (client) => {
    const missionResult = await client.query<{ id: string }>(
      `insert into missions (class_id, title, scenario_text, created_by)
       values ($1, $2, $3, $4)
       returning id`,
      [classId, title, scenarioText, session.teacherId]
    );
    const id = missionResult.rows[0].id;

    let orderIndex = 0;
    for (const q of questions) {
      orderIndex += 1;
      const imageUrl = typeof q.imageUrl === "string" && q.imageUrl.startsWith("https://") ? q.imageUrl : null;
      const questionResult = await client.query<{ id: string }>(
        `insert into mission_questions (mission_id, order_index, question_text, image_url)
         values ($1, $2, $3, $4)
         returning id`,
        [id, orderIndex, q.text.trim(), imageUrl]
      );
      const questionId = questionResult.rows[0].id;

      const validChoices = q.choices.filter((c) => typeof c?.text === "string" && c.text.trim());
      let choiceIndex = 0;
      for (const c of validChoices) {
        choiceIndex += 1;
        await client.query(
          `insert into question_choices (question_id, order_index, choice_text, is_correct)
           values ($1, $2, $3, $4)`,
          [questionId, choiceIndex, c.text.trim(), !!c.isCorrect]
        );
      }
    }
    return id;
  });

  return NextResponse.json({ missionId });
}
