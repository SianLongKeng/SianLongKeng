import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/server";
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
  join_code: string;
  student_count: number;
}

// Excludes visually ambiguous characters (0/O, 1/I/L) so a code read off a
// whiteboard is never misheard between students typing it in on /join.
const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query<ClassRow>(
    `select c.id, c.name, c.subject, c.join_code,
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

  // The join_code unique index makes a collision fail loudly rather than
  // silently double-assign a code — retry a few times before giving up.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const rows = await query<{ id: string; name: string; subject: string; join_code: string }>(
        `insert into classes (school_id, teacher_id, name, subject, join_code)
         values ($1, $2, $3, $4, $5)
         returning id, name, subject, join_code`,
        [session.schoolId, session.teacherId, name, subject, generateJoinCode()]
      );
      return NextResponse.json({ class: { ...rows[0], student_count: 0 } }, { status: 201 });
    } catch (err) {
      const pgErr = err as { code?: string };
      if (pgErr.code !== "23505" || attempt === 4) throw err;
    }
  }
  return NextResponse.json({ error: "เพิ่มห้องเรียนไม่สำเร็จ ลองอีกครั้งค่ะ" }, { status: 500 });
}
