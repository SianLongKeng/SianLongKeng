import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, CORS_HEADERS } from "@/lib/server";

const AXES = ["Concept", "Application", "Think", "Solve", "Create", "Collab", "Confidence"];

const AnalysisSchema = z.object({
  rootCause: z.string().describe("1-2 ประโยคภาษาไทย อธิบายสาเหตุที่แท้จริงของปัญหาการเรียนรู้"),
  intervention: z.string().describe("1 ประโยคภาษาไทย คำแนะนำการช่วยเหลือที่ตรงจุดสำหรับครู"),
});

const SYSTEM_PROMPT = `คุณคือ AI Learning Analyst ของแพลตฟอร์ม EduTwin ที่วิเคราะห์ Mistake DNA ของนักเรียนชั้นประถมศึกษา จากสัดส่วนประเภทข้อผิดพลาด (Mistake Category Breakdown) และคะแนน Learning DNA 7 แกน (คะแนนเต็มแกนละ 100)

หน้าที่ของคุณ:
1. rootCause — อธิบายสาเหตุที่แท้จริงของปัญหาการเรียนรู้ ไม่ใช่แค่บอกว่าผิดกี่ข้อ โดยเชื่อมโยงประเภทข้อผิดพลาดที่มีสัดส่วนสูงสุดเข้ากับแกน Learning DNA ที่คะแนนต่ำ
2. intervention — เสนอวิธีช่วยเหลือที่ตรงจุดและทำได้จริงในห้องเรียน

ตอบเป็นภาษาไทยเท่านั้น กระชับ เข้าใจง่ายสำหรับครู ไม่ใช้ markdown`;

interface MistakeInput {
  cat: string;
  pct: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const studentLabel = typeof body?.studentLabel === "string" ? body.studentLabel : "นักเรียน";
  const mistakes: unknown = body?.mistakes;
  const dna: unknown = body?.dna;

  const mistakeList: MistakeInput[] = Array.isArray(mistakes)
    ? mistakes.filter(
        (m): m is MistakeInput => !!m && typeof m.cat === "string" && typeof m.pct === "number"
      )
    : [];
  const dnaScores: number[] = Array.isArray(dna) ? dna.filter((v) => typeof v === "number") : [];

  if (mistakeList.length === 0) {
    return NextResponse.json(
      { error: "Missing mistake breakdown" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const dnaSummary = AXES.map((axis, i) => `${axis}: ${dnaScores[i] ?? "?"}`).join(", ");
  const mistakeSummary = mistakeList.map((m) => `${m.cat} ${m.pct}%`).join(", ");

  const userContent = `นักเรียน: ${studentLabel}\nสัดส่วนประเภทข้อผิดพลาด: ${mistakeSummary}\nคะแนน Learning DNA 7 แกน: ${dnaSummary}`;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: zodOutputFormat(AnalysisSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้งค่ะ" },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(response.parsed_output, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("mistake-dna api error", err);
    return NextResponse.json(
      { error: "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้งค่ะ" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
