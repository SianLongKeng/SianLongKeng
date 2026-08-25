import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { bucketFor, type Bucket } from "@/lib/grouping";
import NudgePanel from "./NudgePanel";

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

  const inProgressRows = await query<{
    id: string;
    first_name: string;
    nickname: string | null;
    started_at: string;
    answered: number;
    total: number;
  }>(
    `select s.id, s.first_name, s.nickname, att.started_at, att.answered, att.total
       from students s
       join lateral (
         select ma.id, ma.started_at, ma.mission_id,
                (select count(distinct question_id)::int from question_responses where attempt_id = ma.id) as answered,
                (select count(*)::int from mission_questions where mission_id = ma.mission_id) as total
           from mission_attempts ma
          where ma.student_id = s.id and ma.completed_at is null
          order by ma.started_at desc
          limit 1
       ) att on true
      where s.class_id = $1`,
    [cls.id]
  );

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
    <div style={{ position: "relative", overflow: "hidden", padding: "52px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -240,
          right: -180,
          width: 760,
          height: 760,
          background: "radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 20,
            borderBottom: "1px solid var(--border-strong)",
            marginBottom: 30,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span className="eyebrow" style={{ fontSize: "0.72rem" }}>Teacher Copilot · AI Grouping</span>
            <h2 style={{ marginTop: 12, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>
              {cls.name} · {cls.subject}
            </h2>
            <p className="lede" style={{ marginTop: 10, maxWidth: 660 }}>
              ภาพรวมทั้งห้อง — จัดกลุ่มนักเรียนตาม Learning Gap จริง (ไม่ใช่แค่คะแนน) พร้อมคำแนะนำต่อกลุ่ม
            </p>
          </div>
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
            CLASS PULSE · {students.length} STUDENTS
          </span>
        </div>

        {hasDnaData ? (
          <div className="pulse-grid">
            {DNA_AXES.map((axis) => {
              const value = dnaAvg[axis.key] ?? 0;
              return (
                <div className="pulse-cell" key={axis.key}>
                  <span className="pulse-cell-label">{axis.label}</span>
                  <span className="pulse-cell-value">{value}%</span>
                  <span className="pulse-cell-track">
                    <span className="pulse-cell-fill" style={{ width: `${value}%` }} />
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="lede" style={{ marginBottom: 26 }}>ยังไม่มีนักเรียนทำมิชชันเสร็จในห้องนี้เลย</p>
        )}

        <div className="insight-groups">
          {BUCKET_ORDER.filter((b) => groups[b].length > 0).map((bucket) => {
            const meta = GROUP_META[bucket];
            const list = groups[bucket];
            return (
              <div className={`card insight-group${bucket === "concept_gap" ? " accent" : ""}`} key={bucket}>
                <div className="insight-group-head">
                  <span className={`chip ${bucket === "mastery" ? "good" : bucket === "pending" ? "" : "warning"}`}>
                    {meta.title}
                  </span>
                  <span className="mono" style={{ fontSize: "0.76rem" }}>
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
                        <span className="mono" style={{ fontSize: "0.76rem", opacity: 0.7 }}>
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

        <NudgePanel
          notStarted={groups.pending.map((s) => ({ id: s.id, name: s.nickname || s.first_name }))}
          inProgress={inProgressRows.map((r) => ({
            id: r.id,
            name: r.nickname || r.first_name,
            answered: r.answered,
            total: r.total,
          }))}
        />

        <div style={{ marginTop: 26 }}>
          <a className="btn btn-ghost" href="/admin">
            ← กลับไปหน้า Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
