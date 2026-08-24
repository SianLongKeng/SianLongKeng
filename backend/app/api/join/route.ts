import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

// Public lookup by class join code — no auth required, matches a game-PIN
// trust model. Never returns anything beyond names needed to pick yourself
// from the roster (no student numbers, no other classes).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) {
    return NextResponse.json({ error: "กรุณากรอกรหัสห้องเรียน" }, { status: 400 });
  }

  const classRows = await query<ClassRow>(
    "select id, name, subject from classes where join_code = $1",
    [code]
  );
  const cls = classRows[0];
  if (!cls) {
    return NextResponse.json({ error: "ไม่พบห้องเรียนสำหรับรหัสนี้ ลองตรวจสอบรหัสอีกครั้ง" }, { status: 404 });
  }

  const students = await query<StudentRow>(
    "select id, first_name, last_name, nickname from students where class_id = $1 order by first_name, last_name",
    [cls.id]
  );

  return NextResponse.json({
    class: { id: cls.id, name: cls.name, subject: cls.subject },
    students: students.map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      nickname: s.nickname,
    })),
  });
}
