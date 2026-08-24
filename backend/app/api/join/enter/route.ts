import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { createStudentSessionToken, STUDENT_SESSION_COOKIE } from "@/lib/server";

interface StudentRow {
  id: string;
  class_id: string;
}

// Issues a student session cookie once someone has proven they know a valid
// class join code AND picked a real student id from that exact class — the
// join code is what stands in for a password here, never trust choiceId
// alone without re-checking it against the code server-side.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const joinCode = typeof body?.joinCode === "string" ? body.joinCode.trim().toUpperCase() : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!joinCode || !studentId) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const rows = await query<StudentRow>(
    `select s.id, s.class_id
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.join_code = $2`,
    [studentId, joinCode]
  );
  const student = rows[0];
  if (!student) {
    return NextResponse.json({ error: "ไม่พบนักเรียนในห้องเรียนนี้ ลองใหม่อีกครั้ง" }, { status: 404 });
  }

  const token = await createStudentSessionToken({ studentId: student.id, classId: student.class_id });
  const res = NextResponse.json({ ok: true, studentId: student.id });
  res.cookies.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 3,
  });
  return res;
}
