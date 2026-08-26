import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";

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

// Public lookup by the class's own name (e.g. "5/2") — no auth required,
// same trust model a game PIN has. Class names are unique across the whole
// system precisely so they can double as this lookup key. Never returns
// anything beyond names needed to pick yourself from the roster (no
// student numbers, no other classes).
export async function GET(req: NextRequest) {
  const className = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!className) {
    return NextResponse.json({ error: "กรุณากรอกชื่อห้องเรียน" }, { status: 400 });
  }

  const classRows = await query<ClassRow>(
    "select id, name, subject from classes where name = $1",
    [className]
  );
  const cls = classRows[0];
  if (!cls) {
    return NextResponse.json({ error: "ไม่พบห้องเรียนชื่อนี้ ลองตรวจสอบอีกครั้ง" }, { status: 404 });
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
