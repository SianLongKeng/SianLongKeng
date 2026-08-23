import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import CoachChat from "./CoachChat";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

interface AttemptRow {
  id: string;
}

export default async function CoachPage({ params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const studentRows = await query<StudentRow>(
    `select s.id, s.first_name, s.last_name, s.nickname
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1 and c.teacher_id = $2`,
    [params.id, session.teacherId]
  );
  const student = studentRows[0];
  if (!student) notFound();

  // Optionally attach the student's most recent (not necessarily completed)
  // mission attempt, so the coach conversation is grouped with it.
  const attemptRows = await query<AttemptRow>(
    "select id from mission_attempts where student_id = $1 order by started_at desc limit 1",
    [student.id]
  );
  const attemptId = attemptRows[0]?.id ?? null;

  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;

  return (
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>

      <div className="section-head" style={{ margin: "0 0 22px" }}>
        <span className="eyebrow">AI Learning Coach</span>
        <h1>Socratic Questioning · ไม่เฉลย ช่วยให้คิดเอง</h1>
        <p className="lede">นักเรียน: {studentName}</p>
      </div>

      <CoachChat studentId={student.id} attemptId={attemptId} />
    </div>
  );
}
