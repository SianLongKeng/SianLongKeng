import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { createStudentSessionToken, STUDENT_SESSION_COOKIE } from "@/lib/server";

interface StudentRow {
  id: string;
  class_id: string;
  student_number: string;
}

// Issues a student session cookie once someone has proven they know the
// exact class name, picked a real student id from that exact class, AND
// entered that student's own student_number as a PIN — the class name
// alone used to be enough (same as the old random join code), which meant
// any student in a class could open any classmate's mission by picking
// their name off the list. The PIN (their own id number, which they
// already know) closes that hole without adding a real password students
// would have to be issued and remember.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const className = typeof body?.className === "string" ? body.className.trim() : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (!className || !studentId || !pin) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const rows = await query<StudentRow>(
    `select s.id, s.class_id, s.student_number
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.name = $2`,
    [studentId, className]
  );
  const student = rows[0];
  if (!student) {
    return NextResponse.json({ error: "ไม่พบนักเรียนในห้องเรียนนี้ ลองใหม่อีกครั้ง" }, { status: 404 });
  }
  if (student.student_number !== pin) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง ลองใหม่อีกครั้งค่ะ" }, { status: 401 });
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
