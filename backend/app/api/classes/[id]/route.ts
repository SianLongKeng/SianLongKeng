import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  if (!name || !subject) {
    return NextResponse.json({ error: "กรุณากรอกชื่อห้องเรียนและวิชา" }, { status: 400 });
  }

  const rows = await query<{ id: string; name: string; subject: string }>(
    `update classes set name = $1, subject = $2
      where id = $3 and teacher_id = $4
      returning id, name, subject`,
    [name, subject, params.id, session.teacherId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json({ class: rows[0] });
}

// Deleting a class cascades to delete every student in it (students.class_id
// has ON DELETE CASCADE) — the UI makes the caller confirm that explicitly
// before this ever gets called.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query<{ id: string }>(
    "delete from classes where id = $1 and teacher_id = $2 returning id",
    [params.id, session.teacherId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
