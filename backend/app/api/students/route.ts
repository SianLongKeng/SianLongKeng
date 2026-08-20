import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// middleware.ts already blocks unauthenticated requests to this path, but
// route handlers re-verify independently rather than trusting middleware
// alone — defense in depth, and it's what gives us the teacher/school id
// to scope every query by.
async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

interface StudentRow {
  id: string;
  class_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Scoped to classes this teacher actually owns — a teacher can never
  // list another teacher's students, even by guessing a class_id.
  const rows = await query<StudentRow>(
    `select s.id, s.class_id, s.student_number, s.first_name, s.last_name, s.nickname
       from students s
       join classes c on c.id = s.class_id
      where c.teacher_id = $1
      order by s.last_name, s.first_name`,
    [session.teacherId]
  );
  return NextResponse.json({ students: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const studentNumber = typeof body?.studentNumber === "string" ? body.studentNumber.trim() : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : null;

  if (!classId || !studentNumber || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Confirm the class belongs to this teacher before inserting into it —
  // otherwise any authenticated teacher could add students to any class.
  const owned = await query<{ id: string }>(
    "select id from classes where id = $1 and teacher_id = $2",
    [classId, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const rows = await query<StudentRow>(
    `insert into students (class_id, student_number, first_name, last_name, nickname)
     values ($1, $2, $3, $4, $5)
     returning id, class_id, student_number, first_name, last_name, nickname`,
    [classId, studentNumber, firstName, lastName, nickname]
  );
  return NextResponse.json({ student: rows[0] }, { status: 201 });
}
