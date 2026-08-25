import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
}

interface StudentInsightRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  attempt_id: string | null;
  completed_at: string | null;
  score: number | null;
  top_mistake_code: string | null;
  top_mistake_label: string | null;
  top_mistake_pct: string | null;
}

interface DnaAvgRow {
  concept: number | null;
  application: number | null;
  critical_thinking: number | null;
  problem_solving: number | null;
  creativity: number | null;
  collaboration: number | null;
  confidence: number | null;
}

type Bucket = "concept_gap" | "application_gap" | "mastery" | "pending";

// Same two categories the "Killer Demo" in the pitch uses: two students with
// the same score can land in different buckets depending on *which* mistake
// type dominated their attempt, not how many they got wrong.
const CONCEPT_CODES = new Set(["misconception", "wrong_concept_recall"]);
const APPLICATION_CODES = new Set(["logic_gap", "calculation_error", "misread_question", "guessing"]);

const GROUP_META: Record<Bucket, { title: string; titleTh: string; suggestion: string }> = {
  concept_gap: {
    title: "Concept Gap",
    titleTh: "ยังไม่แม่น Concept",
    suggestion: "ทบทวน Concept พื้นฐานร่วมกันทั้งกลุ่ม ก่อนให้ทำโจทย์ประยุกต์ต่อ",
  },
  application_gap: {
    title: "Application Gap",
    titleTh: "เข้าใจแต่ประยุกต์ใช้ไม่คล่อง",
    suggestion: "เข้าใจ Concept ดีแล้ว แนะนำให้ฝึกโจทย์ประยุกต์ใกล้เคียงสถานการณ์จริงเพิ่ม",
  },
  mastery: {
    title: "Mastery",
    titleTh: "พร้อมท้าทายเพิ่ม",
    suggestion: "พร้อมสำหรับมิชชันที่ยากขึ้น หรือช่วยอธิบายให้เพื่อนกลุ่มอื่นได้",
  },
  pending: {
    title: "Not Started",
    titleTh: "ยังไม่ได้ทำมิชชัน",
    suggestion: "ยังไม่มีข้อมูล — รอให้นักเรียนทำมิชชันให้เสร็จก่อน",
  },
};

const BUCKET_ORDER: Bucket[] = ["concept_gap", "application_gap", "mastery", "pending"];

function bucketFor(row: StudentInsightRow): Bucket {
  if (!row.completed_at) return "pending";
  const pct = row.top_mistake_pct ? Number(row.top_mistake_pct) : 0;
  if (!row.top_mistake_code || pct < 15) return "mastery";
  if (CONCEPT_CODES.has(row.top_mistake_code)) return "concept_gap";
  if (APPLICATION_CODES.has(row.top_mistake_code)) return "application_gap";
  return "mastery";
}

const DNA_AXES: { key: keyof DnaAvgRow; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "application", label: "Application" },
  { key: "critical_thinking", label: "Critical Thinking" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "creativity", label: "Creativity" },
  { key: "collaboration", label: "Collaboration" },
  { key: "confidence", label: "Confidence" },
];

export default async function ClassInsightsPage({ params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const classRows = await query<ClassRow>(
    "select id, name, subject from classes where id = $1 and teacher_id = $2",
    [params.id, session.teacherId]
  );
  const cls = classRows[0];
  if (!cls) notFound();

  const students = await query<StudentInsightRow>(
    `select s.id, s.first_name, s.last_name, s.nickname,
            att.id as attempt_id, att.completed_at, att.score,
            tm.code as top_mistake_code, tm.label_en as top_mistake_label, tm.pct as top_mistake_pct
       from students s
       left join lateral (
         select id, completed_at, score
           from mission_attempts
          where student_id = s.id and completed_at is not null
          order by completed_at desc
          limit 1
       ) att on true
       left join lateral (
         select mt.code, mt.label_en, mr.pct::text as pct
           from mistake_records mr
           join mistake_types mt on mt.id = mr.mistake_type_id
          where mr.attempt_id = att.id
          order by mr.pct desc
          limit 1
       ) tm on true
      where s.class_id = $1
      order by s.first_name, s.last_name`,
    [cls.id]
  );

  const dnaAvgRows = await query<DnaAvgRow>(
    `select avg(d.concept_score)::int as concept, avg(d.application_score)::int as application,
            avg(d.critical_thinking_score)::int as critical_thinking, avg(d.problem_solving_score)::int as problem_solving,
            avg(d.creativity_score)::int as creativity, avg(d.collaboration_score)::int as collaboration,
            avg(d.confidence_score)::int as confidence
       from students s
       join lateral (
         select * from learning_dna_snapshots where student_id = s.id order by computed_at desc limit 1
       ) d on true
      where s.class_id = $1`,
    [cls.id]
  );
  const dnaAvg = dnaAvgRows[0];
  const hasDnaData = dnaAvg && dnaAvg.concept !== null;

  const groups: Record<Bucket, StudentInsightRow[]> = {
    concept_gap: [],
    application_gap: [],
    mastery: [],
    pending: [],
  };
  for (const s of students) {
    groups[bucketFor(s)].push(s);
  }

  const studentName = (s: StudentInsightRow) =>
    `${s.nickname || s.first_name} ${s.nickname ? `(${s.first_name})` : ""}`.trim();

  return (
    <div className="wrap" style={{ maxWidth: 960 }}>
      <span className="brand-mark">EduTwin</span>
      <div className="section-head" style={{ margin: "0 0 22px" }}>
        <span className="eyebrow">Teacher Copilot · AI Grouping</span>
        <h1>
          {cls.name} · {cls.subject}
        </h1>
        <p className="lede">
          ภาพรวมทั้งห้อง — จัดกลุ่มนักเรียนตาม Learning Gap จริง (ไม่ใช่แค่คะแนน) พร้อมคำแนะนำต่อกลุ่ม
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Class Pulse</span>
        <h3 style={{ marginTop: 6, marginBottom: 12 }}>ค่าเฉลี่ย Learning DNA ทั้งห้อง</h3>
        {hasDnaData ? (
          <div className="mistake-bars">
            {DNA_AXES.map((axis) => {
              const value = dnaAvg[axis.key] ?? 0;
              return (
                <div className="mbar-row" key={axis.key}>
                  <span className="mbar-label">{axis.label}</span>
                  <span className="mbar-track">
                    <span className="mbar-fill" style={{ width: `${value}%`, background: "var(--accent)" }} />
                  </span>
                  <span className="mbar-pct mono">{value}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="lede">ยังไม่มีนักเรียนทำมิชชันเสร็จในห้องนี้เลย</p>
        )}
      </div>

      <div className="insight-groups">
        {BUCKET_ORDER.filter((b) => groups[b].length > 0).map((bucket) => {
          const meta = GROUP_META[bucket];
          const list = groups[bucket];
          return (
            <div className="card insight-group" key={bucket}>
              <div className="insight-group-head">
                <span className={`chip ${bucket === "mastery" ? "good" : bucket === "pending" ? "" : "warning"}`}>
                  {meta.title}
                </span>
                <span className="mono" style={{ color: "var(--ink-muted)", fontSize: "0.8rem" }}>
                  {list.length} คน
                </span>
              </div>
              <p className="lede" style={{ marginBottom: 12 }}>
                {meta.titleTh}
              </p>
              <ul className="insight-student-list">
                {list.map((s) => (
                  <li key={s.id}>
                    <a href={`/students/${s.id}/diagnosis`}>{studentName(s)}</a>
                    {s.completed_at && s.top_mistake_label && (
                      <span className="mono" style={{ color: "var(--ink-muted)", fontSize: "0.76rem" }}>
                        {" "}
                        · {s.top_mistake_label} {Math.round(Number(s.top_mistake_pct))}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="intervention" style={{ marginTop: 14 }}>
                <b>AI แนะนำ</b>
                {meta.suggestion}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <a className="btn btn-ghost" href="/admin">
          ← กลับไปหน้า Dashboard
        </a>
      </div>
    </div>
  );
}
