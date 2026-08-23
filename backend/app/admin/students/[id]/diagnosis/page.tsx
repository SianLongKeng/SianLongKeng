import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

interface AttemptRow {
  id: string;
  score: number | null;
  completed_at: string | null;
}

interface MistakeRow {
  code: string;
  label_th: string;
  label_en: string;
  pct: string;
}

interface DnaRow {
  concept_score: number;
  application_score: number;
  critical_thinking_score: number;
  problem_solving_score: number;
  creativity_score: number;
  collaboration_score: number;
  confidence_score: number;
}

interface RootCauseRow {
  id: string;
  summary_text: string;
}

interface InterventionRow {
  title: string;
  description: string;
  status: string;
}

const MISTAKE_COLORS: Record<string, string> = {
  misconception: "var(--cat-1)",
  logic_gap: "var(--cat-2)",
  calculation_error: "var(--cat-3)",
  misread_question: "var(--cat-4)",
  wrong_concept_recall: "var(--cat-5)",
  guessing: "var(--cat-6)",
};

const DNA_AXES: { key: keyof DnaRow; label: string }[] = [
  { key: "concept_score", label: "Concept" },
  { key: "application_score", label: "Application" },
  { key: "critical_thinking_score", label: "Critical Thinking" },
  { key: "problem_solving_score", label: "Problem Solving" },
  { key: "creativity_score", label: "Creativity" },
  { key: "collaboration_score", label: "Collaboration" },
  { key: "confidence_score", label: "Confidence" },
];

export default async function DiagnosisPage({ params }: { params: { id: string } }) {
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

  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;

  const attemptRows = await query<AttemptRow>(
    `select id, score, completed_at
       from mission_attempts
      where student_id = $1
      order by completed_at desc nulls last
      limit 1`,
    [student.id]
  );
  const attempt = attemptRows[0];

  if (!attempt || !attempt.completed_at) {
    return (
      <div className="wrap">
        <span className="brand-mark">EduTwin</span>
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <span className="eyebrow">Diagnosis</span>
          <h1 style={{ margin: "10px 0" }}>ยังไม่มีข้อมูลการวิเคราะห์ · No Diagnosis Data Yet</h1>
          <p className="lede" style={{ margin: "0 auto 20px" }}>
            {studentName} ยังไม่ได้ทำมิชชันจนจบ ลองให้นักเรียนทำมิชชันให้เสร็จก่อนนะคะ
          </p>
          <a className="btn btn-primary" href={`/admin/students/${student.id}/mission`}>
            Go to Mission · ไปทำมิชชัน
          </a>
        </div>
      </div>
    );
  }

  const [mistakeRows, dnaRows, rootCauseRows] = await Promise.all([
    query<MistakeRow>(
      `select mt.code, mt.label_th, mt.label_en, mr.pct::text as pct
         from mistake_records mr
         join mistake_types mt on mt.id = mr.mistake_type_id
        where mr.attempt_id = $1
        order by mr.pct desc`,
      [attempt.id]
    ),
    query<DnaRow>(
      `select concept_score, application_score, critical_thinking_score, problem_solving_score,
              creativity_score, collaboration_score, confidence_score
         from learning_dna_snapshots
        where student_id = $1
        order by computed_at desc
        limit 1`,
      [student.id]
    ),
    query<RootCauseRow>(
      `select id, summary_text
         from root_cause_analyses
        where student_id = $1 and attempt_id = $2
        order by created_at desc
        limit 1`,
      [student.id, attempt.id]
    ),
  ]);

  const dna = dnaRows[0];
  const rootCause = rootCauseRows[0];
  const interventionRows = rootCause
    ? await query<InterventionRow>(
        `select title, description, status
           from interventions
          where root_cause_id = $1
          order by created_at desc
          limit 1`,
        [rootCause.id]
      )
    : [];
  const intervention = interventionRows[0];

  const total = 5; // the fixed park-budget mission always has 5 questions — see migration_002_missions.sql
  const topMistake = mistakeRows[0];
  const topMistakePct = topMistake ? Number(topMistake.pct) : 0;
  const chipClass = topMistakePct >= 35 ? "serious" : topMistakePct >= 15 ? "warning" : "good";
  const chipLabel = topMistakePct >= 15 && topMistake ? topMistake.label_en : "Mastery";

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <span className="brand-mark">EduTwin</span>

      <div className="killer-banner">
        <span className="eyebrow">Diagnosis · Learning DNA</span>
        <h2>{studentName}</h2>
        <p>ผลวิเคราะห์จากมิชชัน &ldquo;{"สวนสาธารณะชุมชน"}&rdquo; ที่นักเรียนทำล่าสุด</p>
      </div>

      <div className="score-row">
        <div className="card score-card">
          <div className="score-id">
            <div className="avatar" style={{ background: "var(--accent)" }}>
              {student.first_name.slice(0, 1)}
              {student.last_name.slice(0, 1)}
            </div>
            <div>
              <div className="score-name">{studentName}</div>
              <div className="score-sub">Mission Score · คะแนนมิชชัน</div>
            </div>
          </div>
          <div className="score-num mono">
            {attempt.score ?? 0}
            <span className="score-den">/{total}</span>
          </div>
        </div>
      </div>

      <div className="diag-grid revealed">
        <div className="card diag-card">
          <div className="diag-card-head">
            <h3>Learning DNA</h3>
            {mistakeRows.length > 0 && <span className={`chip ${chipClass}`}>{chipLabel}</span>}
          </div>

          {dna ? (
            <div className="mistake-bars">
              {DNA_AXES.map((axis) => (
                <div className="mbar-row" key={axis.key}>
                  <span className="mbar-label">{axis.label}</span>
                  <span className="mbar-track">
                    <span
                      className="mbar-fill"
                      style={{ width: `${dna[axis.key]}%`, background: "var(--accent)" }}
                    />
                  </span>
                  <span className="mbar-pct mono">{dna[axis.key]}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="lede">ไม่มีข้อมูล Learning DNA</p>
          )}

          {rootCause && (
            <p className="root-cause">
              <b>Root Cause:</b> {rootCause.summary_text}
            </p>
          )}
        </div>

        <div className="card diag-card">
          <div className="diag-card-head">
            <h3>Mistake DNA</h3>
          </div>

          {mistakeRows.length > 0 ? (
            <div className="mistake-bars">
              {mistakeRows.map((m) => (
                <div className="mbar-row" key={m.code}>
                  <span className="mbar-label">{m.label_en}</span>
                  <span className="mbar-track">
                    <span
                      className="mbar-fill"
                      style={{ width: `${m.pct}%`, background: MISTAKE_COLORS[m.code] ?? "var(--ink-muted)" }}
                    />
                  </span>
                  <span className="mbar-pct mono">{Math.round(Number(m.pct))}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="lede">ไม่มีข้อผิดพลาดที่ต้องวิเคราะห์ — ทำได้ดีมาก!</p>
          )}

          {intervention && (
            <div className="intervention">
              <b>{intervention.title}</b>
              {intervention.description}
            </div>
          )}
        </div>
      </div>

      {mistakeRows.length > 0 && (
        <div className="mistake-legend">
          {mistakeRows.map((m) => (
            <span className="legend-item" key={m.code}>
              <span className="legend-dot" style={{ background: MISTAKE_COLORS[m.code] ?? "var(--ink-muted)" }} />
              {m.label_en}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <a className="btn btn-ghost" href={`/admin/students/${student.id}/mission`}>
          Retry Mission · ทำภารกิจใหม่
        </a>
        {" "}
        <a className="btn btn-ghost" href="/admin">
          Back to Roster · กลับไปหน้ารายชื่อ
        </a>
      </div>
    </div>
  );
}
