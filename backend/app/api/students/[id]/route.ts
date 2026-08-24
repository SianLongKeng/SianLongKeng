import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

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

// Every query here joins through classes.teacher_id, so a teacher can only
// ever touch a student that belongs to one of their own classes — passing
// someone else's student id just returns "not found", never someone else's data.
async function studentBelongsToTeacher(studentId: string, teacherId: string) {
  const rows = await query<{ id: string }>(
    `select s.id from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.teacher_id = $2`,
    [studentId, teacherId]
  );
  return rows.length > 0;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await studentBelongsToTeacher(params.id, session.teacherId))) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const studentNumber = typeof body?.studentNumber === "string" ? body.studentNumber.trim() : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() || null : null;

  if (!studentNumber || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rows = await query<StudentRow>(
    `update students
        set student_number = $1, first_name = $2, last_name = $3, nickname = $4
      where id = $5
      returning id, class_id, student_number, first_name, last_name, nickname`,
    [studentNumber, firstName, lastName, nickname, params.id]
  );
  return NextResponse.json({ student: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await studentBelongsToTeacher(params.id, session.teacherId))) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await query("delete from students where id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
