import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

// The single hackathon demo mission (public-park budget), pinned to a fixed
// id — see db/migration_002_missions.sql.
const MISSION_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  // Confirm the student belongs to a class owned by this teacher before
  // creating an attempt on their behalf.
  const owned = await query<{ id: string }>(
    `select s.id from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.teacher_id = $2`,
    [studentId, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const rows = await query<{ id: string }>(
    `insert into mission_attempts (student_id, mission_id)
     values ($1, $2)
     returning id`,
    [studentId, MISSION_ID]
  );

  return NextResponse.json({ attemptId: rows[0].id }, { status: 201 });
}
