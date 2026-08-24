import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, withTransaction } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function requireSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session;
}

interface BulkRow {
  studentNumber: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
}

// Accepts one student per non-empty line, tab- or comma-separated:
// studentNumber, firstName, lastName[, nickname]
function parseRows(raw: string): { rows: BulkRow[]; skipped: number } {
  const rows: BulkRow[] = [];
  let skipped = 0;
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(/\t|,/).map((p) => p.trim());
    const [studentNumber, firstName, lastName, nickname] = parts;
    if (!studentNumber || !firstName || !lastName) {
      skipped++;
      continue;
    }
    rows.push({ studentNumber, firstName, lastName, nickname: nickname || null });
  }
  return { rows, skipped };
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const text = typeof body?.text === "string" ? body.text : "";

  if (!classId || !text.trim()) {
    return NextResponse.json({ error: "Missing class or student list" }, { status: 400 });
  }

  const owned = await query<{ id: string }>(
    "select id from classes where id = $1 and teacher_id = $2",
    [classId, session.teacherId]
  );
  if (owned.length === 0) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const { rows, skipped: malformed } = parseRows(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found" }, { status: 400 });
  }

  const inserted = await withTransaction(async (client) => {
    let count = 0;
    for (const r of rows) {
      const result = await client.query(
        `insert into students (class_id, student_number, first_name, last_name, nickname)
         values ($1, $2, $3, $4, $5)
         on conflict (class_id, student_number) do nothing
         returning id`,
        [classId, r.studentNumber, r.firstName, r.lastName, r.nickname]
      );
      count += result.rowCount ?? 0;
    }
    return count;
  });

  return NextResponse.json({
    inserted,
    duplicatesSkipped: rows.length - inserted,
    malformedSkipped: malformed,
  });
}
