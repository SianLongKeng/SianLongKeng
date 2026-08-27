import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { query, canAccessStudent, verifyReportToken } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_name: string;
  subject: string;
}

interface AttemptRow {
  id: string;
  score: number | null;
  completed_at: string | null;
  total: number;
}

interface DnaRow {
  concept_score: number;
  application_score: number;
  critical_thinking_score: number;
  problem_solving_score: number;
}

interface InterventionRow {
  description: string;
}

const DNA_AXES: { key: keyof DnaRow; label: string }[] = [
  { key: "concept_score", label: "Concept" },
  { key: "application_score", label: "Application" },
  { key: "critical_thinking_score", label: "Critical Thinking" },
  { key: "problem_solving_score", label: "Problem Solving" },
];

export default async function ParentReportPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const tokenParam = searchParams?.token;
  const viaToken = tokenParam ? await verifyReportToken(tokenParam, params.id) : false;
  const viaSession = viaToken ? true : await canAccessStudent(params.id);
  if (!viaSession) notFound();

  const teacherToken = cookies().get(SESSION_COOKIE)?.value;
  const teacherSession = teacherToken ? await verifySessionToken(teacherToken) : null;

  const studentRows = await query<StudentRow>(
    `select s.id, s.first_name, s.last_name, s.nickname, c.name as class_name, c.subject
       from students s join classes c on c.id = s.class_id
      where s.id = $1`,
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();
  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;

  const [attemptRows, dnaRows, interventionRows] = await Promise.all([
    query<AttemptRow>(
      `select id, score, completed_at, (select count(*)::int from mission_questions where mission_id = mission_attempts.mission_id) as total
         from mission_attempts
        where student_id = $1 and completed_at is not null
        order by completed_at desc
        limit 1`,
      [student.id]
    ),
    query<DnaRow>(
      `select concept_score, application_score, critical_thinking_score, problem_solving_score
         from learning_dna_snapshots where student_id = $1 order by computed_at desc limit 1`,
      [student.id]
    ),
    query<InterventionRow>(
      `select description from interventions where student_id = $1 order by created_at desc limit 1`,
      [student.id]
    ),
  ]);
  const attempt = attemptRows[0];
  const dna = dnaRows[0];
  const intervention = interventionRows[0];

  const monthLabel = new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="screen" style={{ padding: "48px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 780 }}>
        <div className="report-sheet">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
            <span className="eyebrow mono">EDUTWIN · LEARNING REPORT</span>
            {attempt && (
              <span className="mono" style={{ fontSize: "0.9rem" }}>
                MISSION SCORE {attempt.score ?? 0}/{attempt.total}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 6 }}>{studentName}</h2>
          <p style={{ marginBottom: 24 }}>
            {student.class_name} · {student.subject} — {monthLabel}
          </p>

          {dna ? (
            <div className="mistake-bars">
              {DNA_AXES.map((axis) => (
                <div className="mbar-row" key={axis.key}>
                  <span className="mbar-label">{axis.label}</span>
                  <span className="mbar-track">
                    <span className="mbar-fill" style={{ width: `${dna[axis.key]}%` }} />
                  </span>
                  <span className="mbar-pct mono">{dna[axis.key]}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p>ยังไม่มีข้อมูล Learning DNA — รอให้นักเรียนทำมิชชันให้เสร็จก่อน</p>
          )}

          {intervention && (
            <p style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border-light)" }}>
              <b>ครูแนะนำ:</b> {intervention.description}
            </p>
          )}
        </div>

        <ReportActions studentId={student.id} showCopyLink={!!teacherSession} />
      </div>
    </div>
  );
}
