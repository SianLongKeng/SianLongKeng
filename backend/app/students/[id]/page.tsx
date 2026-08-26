import { query, canAccessStudent } from "@/lib/server";
import { notFound } from "next/navigation";
import { bucketFor } from "@/lib/grouping";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
  class_name: string;
  subject: string;
}

interface DoneMissionRow {
  attempt_id: string;
  mission_id: string;
  title: string;
  score: number | null;
  completed_at: string;
  total: number;
}

interface StreakRow {
  day: string;
}

interface TopMistakeRow {
  completed_at: string | null;
  top_mistake_code: string | null;
  top_mistake_pct: string | null;
}

interface AssignedMissionRow {
  mission_id: string;
  title: string;
  due_at: string | null;
  bucket: string | null;
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

const DNA_AXES: { key: keyof DnaRow; label: string }[] = [
  { key: "concept_score", label: "Concept" },
  { key: "application_score", label: "Application" },
  { key: "critical_thinking_score", label: "Critical Thinking" },
  { key: "problem_solving_score", label: "Problem Solving" },
  { key: "creativity_score", label: "Creativity" },
  { key: "collaboration_score", label: "Collaboration" },
  { key: "confidence_score", label: "Confidence" },
];

function computeStreak(days: string[]): number {
  const set = new Set(days.map((d) => new Date(d).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (set.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function StudentHomePage({ params }: { params: { id: string } }) {
  if (!(await canAccessStudent(params.id))) notFound();

  const studentRows = await query<StudentRow>(
    `select s.id, s.first_name, s.last_name, s.nickname, c.id as class_id, c.name as class_name, c.subject
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1`,
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();

  const [doneMissions, streakRows, topMistakeRows, assignedMissions, dnaRows] = await Promise.all([
    query<DoneMissionRow>(
      `select att.id as attempt_id, att.mission_id, m.title, att.score, att.completed_at,
              (select count(*)::int from mission_questions mq where mq.mission_id = m.id) as total
         from mission_attempts att
         join missions m on m.id = att.mission_id
        where att.student_id = $1 and att.completed_at is not null
        order by att.completed_at desc`,
      [student.id]
    ),
    query<StreakRow>(
      `select distinct completed_at::date as day
         from mission_attempts
        where student_id = $1 and completed_at is not null
        order by day desc
        limit 30`,
      [student.id]
    ),
    query<TopMistakeRow>(
      `select att.completed_at, mt.code as top_mistake_code, mr.pct::text as top_mistake_pct
         from (
           select id, completed_at from mission_attempts
            where student_id = $1 and completed_at is not null
            order by completed_at desc limit 1
         ) att
         left join lateral (
           select mistake_type_id, pct from mistake_records where attempt_id = att.id order by pct desc limit 1
         ) mr on true
         left join mistake_types mt on mt.id = mr.mistake_type_id`,
      [student.id]
    ),
    query<AssignedMissionRow>(
      `select distinct m.id as mission_id, m.title, ma.due_at, ma.bucket
         from mission_assignments ma
         join missions m on m.id = ma.mission_id
        where ma.class_id = $1
          and (ma.student_id = $2 or ma.student_id is null)
          and not exists (
            select 1 from mission_attempts att2
             where att2.student_id = $2 and att2.mission_id = m.id
          )
        order by ma.due_at nulls last`,
      [student.class_id, student.id]
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
  ]);

  const bucket = bucketFor(topMistakeRows[0] ?? { completed_at: null, top_mistake_code: null, top_mistake_pct: null });
  const assignedFiltered = assignedMissions.filter((m) => !m.bucket || m.bucket === bucket);

  const nickname = student.nickname || student.first_name;
  const streak = computeStreak(streakRows.map((r) => r.day));
  const missionsDone = doneMissions.length;
  const avgScorePct =
    missionsDone > 0
      ? Math.round(
          (doneMissions.reduce((sum, m) => sum + (m.total > 0 ? (m.score ?? 0) / m.total : 0), 0) / missionsDone) * 100
        )
      : 0;

  const dna = dnaRows[0];
  const topAxis = dna
    ? DNA_AXES.reduce((best, axis) => (dna[axis.key] > dna[best.key] ? axis : best), DNA_AXES[0])
    : null;

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -220,
          right: -160,
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.4rem)" }}>สวัสดี {nickname}</h1>
            <p className="lede" style={{ marginTop: 8 }}>
              {student.class_name} · {student.subject} — มีมิชชันรอทำอยู่ {assignedFiltered.length} อัน
            </p>
          </div>
          <div className="stat-pill-row">
            <div className="stat-pill">
              <div className="stat-pill-value mono">{missionsDone}</div>
              <div className="stat-pill-label">MISSIONS DONE</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-value mono">{avgScorePct}%</div>
              <div className="stat-pill-label">AVG SCORE</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-value mono">{streak}</div>
              <div className="stat-pill-label">DAY STREAK</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }} className="student-home-layout">
          <div>
            {assignedFiltered.map((m) => (
              <div className="mission-row todo" key={m.mission_id}>
                <div>
                  <span className="chip" style={{ background: "var(--accent-soft)", color: "var(--accent-soft-ink)", marginBottom: 8 }}>
                    TO DO · รอทำ
                  </span>
                  <div className="mission-row-title">{m.title}</div>
                  {m.due_at && <div className="mission-row-meta">กำหนดส่ง {new Date(m.due_at).toLocaleDateString("th-TH")}</div>}
                </div>
                <a className="btn btn-soft btn-small" href={`/students/${student.id}/mission?mission=${m.mission_id}`}>
                  เริ่มทำ
                </a>
              </div>
            ))}
            {doneMissions.map((m) => (
              <div className="mission-row" key={m.attempt_id}>
                <div>
                  <span className="chip good" style={{ marginBottom: 8 }}>
                    DONE · เสร็จแล้ว
                  </span>
                  <div className="mission-row-title">{m.title}</div>
                  <div className="mission-row-meta">
                    {new Date(m.completed_at).toLocaleDateString("th-TH")} · {m.score ?? 0}/{m.total}
                  </div>
                </div>
                <div className="row-actions">
                  <a className="row-chip outline" href={`/students/${student.id}/diagnosis`}>
                    ดูผลวิเคราะห์
                  </a>
                  <a className="row-chip outline" href={`/students/${student.id}/progress`}>
                    ดูผลเทียบ
                  </a>
                </div>
              </div>
            ))}
            {assignedFiltered.length === 0 && doneMissions.length === 0 && (
              <p className="lede">ยังไม่มีมิชชันสำหรับหนูตอนนี้</p>
            )}
          </div>

          <div className="card" style={{ background: "linear-gradient(160deg, rgba(124,58,237,0.16), rgba(255,255,255,0.02))" }}>
            <span className="eyebrow" style={{ fontSize: "0.72rem" }}>MY LEARNING DNA · จุดแข็งของหนู</span>
            {dna ? (
              <>
                <div className="mistake-bars" style={{ marginTop: 14 }}>
                  {DNA_AXES.map((axis) => (
                    <div className="mbar-row" key={axis.key}>
                      <span className="mbar-label">{axis.label}</span>
                      <span className="mbar-track">
                        <span className="mbar-fill" style={{ width: `${dna[axis.key]}%`, background: "var(--accent-soft)" }} />
                      </span>
                      <span className="mbar-pct mono">{dna[axis.key]}%</span>
                    </div>
                  ))}
                </div>
                {topAxis && (
                  <p className="lede" style={{ marginTop: 16 }}>
                    หนูเก่งเรื่อง <strong style={{ color: "var(--ink)" }}>{topAxis.label}</strong> ที่สุดตอนนี้ — ลองท้าทายตัวเองด้วยมิชชันที่ยากขึ้นดูนะคะ
                  </p>
                )}
              </>
            ) : (
              <p className="lede" style={{ marginTop: 14 }}>ทำมิชชันให้เสร็จสักอันเพื่อดู Learning DNA ของหนูนะคะ</p>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .student-home-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
