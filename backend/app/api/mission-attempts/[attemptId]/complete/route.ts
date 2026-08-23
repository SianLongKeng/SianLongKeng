import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { query, withTransaction } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getAnthropicClient } from "@/lib/anthropic";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

interface AttemptRow {
  id: string;
  student_id: string;
  mission_id: string;
}

// Confirms the attempt belongs to a student in a class owned by this
// teacher, and returns the attempt's student_id/mission_id for use below.
async function attemptOwnedByTeacher(attemptId: string, teacherId: string): Promise<AttemptRow | null> {
  const rows = await query<AttemptRow>(
    `select a.id, a.student_id, a.mission_id
       from mission_attempts a
       join students s on s.id = a.student_id
       join classes c on c.id = s.class_id
      where a.id = $1 and c.teacher_id = $2`,
    [attemptId, teacherId]
  );
  return rows[0] ?? null;
}

interface ResponseRow {
  order_index: number;
  question_text: string;
  attempt_number: number;
  is_correct: boolean;
  picked_choice_text: string;
  correct_choice_text: string | null;
}

const GradeSchema = z.object({
  mistakeBreakdown: z
    .array(
      z.object({
        code: z.enum([
          "misconception",
          "logic_gap",
          "calculation_error",
          "misread_question",
          "wrong_concept_recall",
          "guessing",
        ]),
        pct: z.number().describe("0-100, all entries should sum to ~100"),
      })
    )
    .describe(
      "only include categories that actually apply given the transcript; if the student got everything right on the first try, return a single entry with the dominant strength area at low/zero pct or an empty-ish breakdown — use judgement"
    ),
  dna: z.object({
    concept: z.number(),
    application: z.number(),
    criticalThinking: z.number(),
    problemSolving: z.number(),
    creativity: z.number(),
    collaboration: z.number(),
    confidence: z.number(),
  }).describe("each 0-100, the student's Learning DNA axis scores inferred from this transcript"),
  rootCause: z.string().describe("1-2 Thai sentences, the real underlying cause of any mistakes, or a positive note if none"),
  intervention: z.string().describe("1 Thai sentence, a concrete actionable next step for the teacher"),
});

const SYSTEM_PROMPT = `คุณคือ AI Learning Analyst ของแพลตฟอร์ม EduTwin กำลังวิเคราะห์ transcript การทำมิชชันจริงของนักเรียนคนหนึ่ง เรื่องงบประมาณสวนสาธารณะ (เปอร์เซ็นต์ของพื้นที่/งบประมาณ) มี 5 ข้อเรียงลำดับ แต่ละข้ออาจถูกตั้งแต่ครั้งแรก, ตอบผิดครั้งแรกแล้วถูกครั้งที่สอง, หรือตอบผิดทั้งสองครั้ง

หน้าที่ของคุณ: วิเคราะห์ pattern ของคำตอบถูก/ผิดจริง และตัวเลือกที่ผิดที่นักเรียนเลือกจริง เพื่ออนุมาน Mistake DNA และ Learning DNA ที่แท้จริง — ไม่ใช่แค่นับจำนวนข้อถูก/ผิด ตัวอย่างเช่น การเลือกตัวเลือกที่สะท้อนการลืมลบพื้นที่ที่ใช้ไปแล้ว กับการเลือกตัวเลือกที่เป็นแค่การคำนวณเลขผิด บ่งบอกถึงประเภทข้อผิดพลาดคนละแบบ

ตอบกระชับ ไม่ใช้ markdown ฟิลด์ข้อความ (rootCause, intervention) ใช้ภาษาไทยเท่านั้น`;

const SOURCE_MODEL = "claude-opus-5";

export async function POST(_req: NextRequest, { params }: { params: { attemptId: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await attemptOwnedByTeacher(params.attemptId, session.teacherId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const totalRows = await query<{ count: number }>(
    "select count(*)::int as count from mission_questions where mission_id = $1",
    [attempt.mission_id]
  );
  const total = totalRows[0]?.count ?? 0;

  // Score = number of distinct questions ever answered correctly in this attempt.
  const scoreRows = await query<{ count: number }>(
    "select count(distinct question_id)::int as count from question_responses where attempt_id = $1 and is_correct = true",
    [params.attemptId]
  );
  const score = scoreRows[0]?.count ?? 0;

  await query("update mission_attempts set completed_at = now(), score = $1 where id = $2", [
    score,
    params.attemptId,
  ]);

  const responseRows = await query<ResponseRow>(
    `select mq.order_index, mq.question_text, qr.attempt_number, qr.is_correct,
            qc.choice_text as picked_choice_text,
            (select choice_text from question_choices where question_id = mq.id and is_correct = true limit 1) as correct_choice_text
       from question_responses qr
       join mission_questions mq on mq.id = qr.question_id
       join question_choices qc on qc.id = qr.choice_id
      where qr.attempt_id = $1
      order by mq.order_index, qr.attempt_number`,
    [params.attemptId]
  );

  const byQuestion = new Map<number, { questionText: string; rows: ResponseRow[] }>();
  for (const row of responseRows) {
    const entry = byQuestion.get(row.order_index) ?? { questionText: row.question_text, rows: [] };
    entry.rows.push(row);
    byQuestion.set(row.order_index, entry);
  }

  const transcriptLines: string[] = [];
  for (const [orderIndex, entry] of [...byQuestion.entries()].sort((a, b) => a[0] - b[0])) {
    const gotRight = entry.rows.some((r) => r.is_correct);
    const wrongPicks = entry.rows.filter((r) => !r.is_correct);
    let line = `ข้อ ${orderIndex}: "${entry.questionText}" — `;
    if (gotRight && wrongPicks.length === 0) {
      line += "ตอบถูกตั้งแต่ครั้งแรก";
    } else if (gotRight && wrongPicks.length > 0) {
      line += `ตอบผิดก่อน (เลือก "${wrongPicks
        .map((w) => w.picked_choice_text)
        .join('", "')}" ทั้งที่คำตอบถูกคือ "${wrongPicks[0].correct_choice_text}") แล้วตอบถูกในครั้งถัดไป`;
    } else {
      line += `ตอบผิดทั้ง ${wrongPicks.length} ครั้ง (เลือก "${wrongPicks
        .map((w) => w.picked_choice_text)
        .join('", "')}" ทั้งที่คำตอบถูกคือ "${wrongPicks[0]?.correct_choice_text}")`;
    }
    transcriptLines.push(line);
  }

  const userContent = `Transcript การทำมิชชันของนักเรียน (คะแนนรวม ${score}/${total}):\n${transcriptLines.join("\n")}`;

  let graded: z.infer<typeof GradeSchema>;
  try {
    const client = getAnthropicClient();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: zodOutputFormat(GradeSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้งค่ะ" }, { status: 502 });
    }
    graded = response.parsed_output;
  } catch (err) {
    console.error("mission-attempts complete: AI grading error", err);
    return NextResponse.json({ error: "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้งค่ะ" }, { status: 500 });
  }

  const mistakeTypeRows = await query<{ id: number; code: string }>("select id, code from mistake_types", []);
  const mistakeTypeIdByCode = new Map(mistakeTypeRows.map((r) => [r.code, r.id]));

  await withTransaction(async (client) => {
    for (const entry of graded.mistakeBreakdown) {
      const mistakeTypeId = mistakeTypeIdByCode.get(entry.code);
      if (!mistakeTypeId) continue;
      await client.query(
        `insert into mistake_records (attempt_id, mistake_type_id, pct, source_model)
         values ($1, $2, $3, $4)`,
        [params.attemptId, mistakeTypeId, entry.pct, SOURCE_MODEL]
      );
    }

    await client.query(
      `insert into learning_dna_snapshots
         (student_id, concept_score, application_score, critical_thinking_score, problem_solving_score,
          creativity_score, collaboration_score, confidence_score, source_model, source_attempt_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        attempt.student_id,
        graded.dna.concept,
        graded.dna.application,
        graded.dna.criticalThinking,
        graded.dna.problemSolving,
        graded.dna.creativity,
        graded.dna.collaboration,
        graded.dna.confidence,
        SOURCE_MODEL,
        params.attemptId,
      ]
    );

    const rootCauseRows = await client.query<{ id: string }>(
      `insert into root_cause_analyses (student_id, attempt_id, summary_text, source_model)
       values ($1, $2, $3, $4)
       returning id`,
      [attempt.student_id, params.attemptId, graded.rootCause, SOURCE_MODEL]
    );
    const rootCauseId = rootCauseRows.rows[0].id;

    await client.query(
      `insert into interventions (student_id, root_cause_id, title, description)
       values ($1, $2, $3, $4)`,
      [attempt.student_id, rootCauseId, "AI แนะนำ", graded.intervention]
    );
  });

  return NextResponse.json({
    score,
    total,
    mistakeBreakdown: graded.mistakeBreakdown,
    dna: graded.dna,
    rootCause: graded.rootCause,
    intervention: graded.intervention,
  });
}
