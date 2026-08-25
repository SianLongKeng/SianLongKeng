import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const VALID_STATUSES = ["recommended", "assigned", "completed", "dismissed"];

// Moves an intervention through recommended -> assigned -> completed|dismissed.
// Ownership is checked via the student's class teacher_id, same pattern as
// every other teacher-facing mutation in this app.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }

  const rows = await query<{ id: string; status: string }>(
    `update interventions i
        set status = $1, reviewed_by = $2, updated_at = now()
       from students s, classes c
      where i.id = $3
        and s.id = i.student_id
        and c.id = s.class_id
        and c.teacher_id = $2
      returning i.id, i.status`,
    [status, session.teacherId, params.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
  }
  return NextResponse.json({ intervention: rows[0] });
}
