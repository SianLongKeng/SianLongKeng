import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, createReportToken } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Teacher-only: mints a signed, read-only report link for one student to
// hand to a parent. Ownership-checked the same way every other
// teacher-facing mutation in this app is.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await query<{ id: string }>(
    `select s.id from students s join classes c on c.id = s.class_id where s.id = $1 and c.teacher_id = $2`,
    [params.id, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "ไม่พบนักเรียนนี้" }, { status: 404 });
  }

  const reportToken = await createReportToken(params.id);
  const url = new URL(`/students/${params.id}/report`, req.url);
  url.searchParams.set("token", reportToken);
  return NextResponse.json({ url: url.toString() });
}
