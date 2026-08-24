import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { canAccessStudent } from "@/lib/server";

// The single hackathon demo mission (public-park budget), pinned to a fixed
// id — see db/migration_002_missions.sql.
const MISSION_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  // Either a teacher viewing one of their own students, or the student
  // themself after self-joining via a class code — see lib/missionAccess.
  if (!(await canAccessStudent(studentId))) {
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
