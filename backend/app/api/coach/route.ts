import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnthropicClient, CORS_HEADERS } from "@/lib/server";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Kept in sync with the "สวนสาธารณะ" (public park) percentage-of-area
// mission in the public demo (index.html) so the coach's guidance stays
// consistent with the problem the student is actually looking at.
const MISSION_CONTEXT =
  'โจทย์ที่นักเรียนกำลังทำ: "สวนสาธารณะแห่งหนึ่งมีพื้นที่ทั้งหมด 200 ตารางเมตร ใช้พื้นที่ปูหญ้า 60% ของพื้นที่ทั้งหมด พื้นที่ปูหญ้ามีกี่ตารางเมตร" คำตอบที่ถูกต้องคือ 120 ตารางเมตร (200 × 0.6 = 120)';

const SYSTEM_PROMPT = `คุณคือ "AI Coach" ผู้ช่วยติวคณิตศาสตร์ของแพลตฟอร์ม EduTwin สำหรับนักเรียนชั้นประถมศึกษาปีที่ 5

หลักการสอน (Socratic Questioning):
- ห้ามบอกคำตอบสุดท้ายตรงๆ เด็ดขาด แม้นักเรียนจะขอคำตอบ
- ใช้คำถามนำ ให้ตัวอย่างที่ใกล้เคียง หรือชวนคิดทีละขั้น เพื่อให้นักเรียนหาคำตอบด้วยตัวเอง
- ถ้านักเรียนตอบถูกในขั้นตอนย่อย ให้ชมสั้นๆ แล้วถามคำถามถัดไปที่นำไปสู่คำตอบ
- ถ้านักเรียนตอบครบทุกขั้นตอนย่อยจนได้คำตอบสุดท้ายแล้ว (ทั้งพื้นที่รวมและเปอร์เซ็นต์ถูกต้อง) ให้ชื่นชมและบอกให้กลับไปเลือกคำตอบในหน้ามิชชัน
- น้ำเสียงอบอุ่น เป็นกันเอง ให้กำลังใจ ใช้ภาษาไทยเท่านั้น ลงท้ายแบบครูผู้หญิงที่เป็นมิตร (ใช้ "ค่ะ"/"นะคะ")
- ตอบสั้นกระชับ 1-3 ประโยคต่อครั้ง ไม่ยืดยาว ไม่ใช้ markdown

${MISSION_CONTEXT}`;

interface CoachTurn {
  who: "student" | "ai";
  text: string;
}

// Optional persistence: the static pitch site (edutwin-mindmesh) calls this
// endpoint unauthenticated and cross-origin with no studentId, and must keep
// working exactly as before. Persistence only ever kicks in when a caller
// sends a studentId AND has a valid teacher session cookie AND that student
// is owned by that teacher — any other case falls through and this returns
// null, silently skipping all persistence.
async function resolveOwnedStudentId(studentId: unknown): Promise<string | null> {
  if (typeof studentId !== "string" || !studentId) return null;
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return null;

  const rows = await query<{ id: string }>(
    `select s.id from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.teacher_id = $2`,
    [studentId, session.teacherId]
  );
  return rows[0]?.id ?? null;
}

async function findOrCreateConversationId(ownedStudentId: string, attemptId: unknown): Promise<string> {
  const validAttemptId = typeof attemptId === "string" && attemptId ? attemptId : null;

  if (validAttemptId) {
    const existing = await query<{ id: string }>(
      "select id from coach_conversations where attempt_id = $1 order by started_at desc limit 1",
      [validAttemptId]
    );
    if (existing[0]) return existing[0].id;
    const created = await query<{ id: string }>(
      "insert into coach_conversations (student_id, attempt_id) values ($1, $2) returning id",
      [ownedStudentId, validAttemptId]
    );
    return created[0].id;
  }

  // No attempt to key off — a fresh conversation per call is fine here,
  // this is a rare path (coach used before any mission attempt exists).
  const created = await query<{ id: string }>(
    "insert into coach_conversations (student_id) values ($1) returning id",
    [ownedStudentId]
  );
  return created[0].id;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const history: unknown = body?.messages;

  const turns: CoachTurn[] = Array.isArray(history)
    ? history.filter(
        (m): m is CoachTurn =>
          !!m && typeof m.text === "string" && (m.who === "student" || m.who === "ai")
      )
    : [];

  const messages = turns.map((m) => ({
    role: (m.who === "student" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Missing latest student message" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    let reply = "";
    for (const block of response.content) {
      if (block.type === "text") reply += block.text;
    }
    if (!reply) reply = "ขอโทษค่ะ ช่วยพิมพ์อีกครั้งได้ไหมคะ";

    // Best-effort persistence — never let a DB hiccup break the chat reply
    // that the student is waiting on.
    try {
      const ownedStudentId = await resolveOwnedStudentId(body?.studentId);
      if (ownedStudentId) {
        const conversationId = await findOrCreateConversationId(ownedStudentId, body?.attemptId);
        const lastStudentTurn = turns[turns.length - 1];
        await query(
          "insert into coach_messages (conversation_id, sender, message_text) values ($1, 'student', $2)",
          [conversationId, lastStudentTurn.text]
        );
        await query(
          "insert into coach_messages (conversation_id, sender, message_text) values ($1, 'ai', $2)",
          [conversationId, reply]
        );
      }
    } catch (persistErr) {
      console.error("coach api: persistence skipped after error", persistErr);
    }

    return NextResponse.json({ reply }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("coach api error", err);
    return NextResponse.json(
      { error: "AI Coach ไม่พร้อมใช้งานตอนนี้ ลองใหม่อีกครั้งค่ะ" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
