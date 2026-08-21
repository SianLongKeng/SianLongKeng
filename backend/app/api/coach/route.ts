import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, CORS_HEADERS } from "@/lib/anthropic";

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
