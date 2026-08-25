import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const VALID_BUCKETS = ["concept_gap", "application_gap", "mastery"];

export async function POST(req: NextRequest) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const missionId = typeof body?.missionId === "string" ? body.missionId : "";
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const bucket = typeof body?.bucket === "string" && VALID_BUCKETS.includes(body.bucket) ? body.bucket : null;
  const studentId = typeof body?.studentId === "string" ? body.studentId : null;
  const dueAt = typeof body?.dueAt === "string" && body.dueAt ? body.dueAt : null;

  if (!missionId || !classId) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const owned = await query<{ id: string }>(
    `select m.id
       from missions m
       join classes c on c.id = m.class_id
      where m.id = $1 and c.id = $2 and c.teacher_id = $3`,
    [missionId, classId, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "ไม่พบมิชชันหรือห้องเรียนนี้" }, { status: 404 });
  }

  const rows = await query<{ id: string }>(
    `insert into mission_assignments (mission_id, class_id, bucket, student_id, due_at, created_by)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [missionId, classId, bucket, studentId, dueAt, session.teacherId]
  );

  return NextResponse.json({ assignmentId: rows[0].id });
}
