import { query, canAccessStudent } from "@/lib/server";
import { notFound } from "next/navigation";
import { bucketFor, type Bucket } from "@/lib/grouping";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

interface TopMistakeRow {
  completed_at: string | null;
  top_mistake_code: string | null;
  top_mistake_label: string | null;
  top_mistake_pct: string | null;
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

interface InterventionRow {
  title: string;
  description: string;
  status: string;
}

interface AssignedRow {
  mission_id: string;
  title: string;
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

const STEP1_COPY: Record<Bucket, { title: string; text: string }> = {
  concept_gap: {
    title: "ทบทวน Concept",
    text: "ยังไม่แม่น Concept พื้นฐานของเรื่องนี้ ลองทบทวนแนวคิดหลักอีกครั้งก่อนนะคะ",
  },
  application_gap: {
    title: "ฝึกประยุกต์ใช้",
    text: "เข้าใจ Concept ดีแล้ว แต่ยังไม่คล่องตอนนำไปใช้จริง ลองฝึกโจทย์ที่ใกล้เคียงสถานการณ์จริงเพิ่มนะคะ",
  },
  mastery: {
    title: "พร้อมท้าทายเพิ่ม",
    text: "ทำได้ดีมาก! เรื่องนี้แม่นแล้ว พร้อมสำหรับความท้าทายที่ยากขึ้น",
  },
  pending: {
    title: "เริ่มมิชชันแรก",
    text: "ยังไม่มีข้อมูล Learning DNA ของหนูเลย เริ่มทำมิชชันแรกกันก่อนนะคะ",
  },
};

export default async function GrowthPlanPage({ params }: { params: { id: string } }) {
  if (!(await canAccessStudent(params.id))) notFound();

  const studentRows = await query<StudentRow>(
    "select id, first_name, last_name, nickname from students where id = $1",
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();
  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;

  const [topMistakeRows, dnaRows, interventionRows, assignedRows] = await Promise.all([
    query<TopMistakeRow>(
      `select att.completed_at, mt.code as top_mistake_code, mt.label_en as top_mistake_label, mr.pct::text as top_mistake_pct
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
    query<DnaRow>(
      `select concept_score, application_score, critical_thinking_score, problem_solving_score,
              creativity_score, collaboration_score, confidence_score
         from learning_dna_snapshots
        where student_id = $1
        order by computed_at desc
        limit 1`,
      [student.id]
    ),
    query<InterventionRow>(
      `select title, description, status from interventions
        where student_id = $1 and status in ('recommended', 'assigned')
        order by created_at desc
        limit 1`,
      [student.id]
    ),
    query<AssignedRow>(
      `select m.id as mission_id, m.title
         from mission_assignments ma
         join missions m on m.id = ma.mission_id
        where ma.class_id = (select class_id from students where id = $1)
          and (ma.student_id = $1 or ma.student_id is null)
          and not exists (select 1 from mission_attempts a2 where a2.student_id = $1 and a2.mission_id = m.id)
        order by ma.due_at nulls last
        limit 1`,
      [student.id]
    ),
  ]);

  const bucket = bucketFor(topMistakeRows[0] ?? { completed_at: null, top_mistake_code: null, top_mistake_pct: null });
  const dna = dnaRows[0];
  const intervention = interventionRows[0];
  const nextAssigned = assignedRows[0];

  const weakestAxis = dna
    ? DNA_AXES.reduce((worst, axis) => (dna[axis.key] < dna[worst.key] ? axis : worst), DNA_AXES[0])
    : null;

  const step1 = STEP1_COPY[bucket];

  const steps = [
    {
      title: step1.title,
      text: weakestAxis && bucket !== "pending" ? `${step1.text} (จุดที่ควรโฟกัส: ${weakestAxis.label})` : step1.text,
    },
    {
      title: "ลงมือทำ",
      text: intervention
        ? intervention.description
        : bucket === "mastery"
        ? "ลองอธิบายวิธีคิดให้เพื่อนฟัง จะช่วยให้เข้าใจลึกขึ้นไปอีก"
        : "ฝึกโจทย์เพิ่มเติมในหัวข้อเดียวกัน แล้วลองอธิบายวิธีคิดออกมาเป็นคำพูด",
    },
    {
      title: "ฝึกซ้ำ",
      text: nextAssigned
        ? `ครูมอบหมายมิชชันใหม่ให้แล้ว: "${nextAssigned.title}" — ลองทำต่อได้เลย`
        : "ลองทำมิชชันเดิมอีกครั้ง ดูว่าคราวนี้คิดได้เร็วขึ้นไหม",
    },
    {
      title: "ท้าทายเพิ่ม",
      text:
        bucket === "mastery"
          ? "พร้อมสำหรับมิชชันที่ยากขึ้นแล้ว รอครูมอบหมายมิชชันใหม่ได้เลย"
          : "เมื่อมั่นใจในหัวข้อนี้แล้ว ลองท้าทายตัวเองด้วยมิชชันที่ยากขึ้นในครั้งถัดไป",
    },
  ];

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -220,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
          AI Growth Plan
        </span>
        <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", marginBottom: 8 }}>เส้นทางพัฒนาของ {studentName}</h2>
        <p className="lede" style={{ marginBottom: 30 }}>
          แผนที่ AI แนะนำ ต่อยอดจาก Learning DNA และ Mistake DNA ล่าสุด — ทำตามลำดับได้เลย
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="card"
              style={{
                display: "flex",
                gap: 16,
                padding: 22,
                background: i === 0 ? "linear-gradient(160deg, rgba(124,58,237,0.16), rgba(255,255,255,0.02))" : undefined,
              }}
            >
              <span
                className="mono"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>{s.title}</div>
                <p className="lede">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a
            className="btn btn-soft"
            href={nextAssigned ? `/students/${student.id}/mission?mission=${nextAssigned.mission_id}` : `/students/${student.id}/mission`}
          >
            เริ่มทำตามแผน →
          </a>
          <a className="btn btn-ghost" href={`/students/${student.id}/diagnosis`}>
            ← ดู Diagnosis
          </a>
        </div>
      </div>
    </div>
  );
}
