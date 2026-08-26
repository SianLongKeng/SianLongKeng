import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/server";
import { canAccessStudent } from "@/lib/server";

// The shared hackathon demo mission (public-park budget), pinned to a fixed
// id — see db/migration_002_missions.sql. Used when no missionId is given,
// or when the given one doesn't check out.
const MISSION_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  const requestedMissionId = typeof body?.missionId === "string" ? body.missionId : "";
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  // Either a teacher viewing one of their own students, or the student
  // themself after self-joining via a class code — see lib/missionAccess.
  if (!(await canAccessStudent(studentId))) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // A student can only ever start a mission that's either the shared demo
  // or actually assigned to their own class — never an arbitrary mission id
  // belonging to some other teacher's class.
  let missionId = MISSION_ID;
  if (requestedMissionId && requestedMissionId !== MISSION_ID) {
    const owned = await query<{ id: string }>(
      `select m.id from missions m
         join students s on s.class_id = m.class_id
        where m.id = $1 and s.id = $2`,
      [requestedMissionId, studentId]
    );
    if (owned.length > 0) missionId = requestedMissionId;
  }

  const rows = await query<{ id: string }>(
    `insert into mission_attempts (student_id, mission_id)
     values ($1, $2)
     returning id`,
    [studentId, missionId]
  );

  return NextResponse.json({ attemptId: rows[0].id }, { status: 201 });
}
