import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  student_count: number;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query<ClassRow>(
    `select c.id, c.name, c.subject,
            (select count(*)::int from students s where s.class_id = c.id) as student_count
       from classes c
      where c.teacher_id = $1
      order by c.name, c.subject`,
    [session.teacherId]
  );
  return NextResponse.json({ classes: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";

  if (!name || !subject) {
    return NextResponse.json({ error: "กรุณากรอกชื่อห้องเรียนและวิชา" }, { status: 400 });
  }

  const rows = await query<{ id: string; name: string; subject: string }>(
    `insert into classes (school_id, teacher_id, name, subject)
     values ($1, $2, $3, $4)
     returning id, name, subject`,
    [session.schoolId, session.teacherId, name, subject]
  );
  return NextResponse.json({ class: { ...rows[0], student_count: 0 } }, { status: 201 });
}
