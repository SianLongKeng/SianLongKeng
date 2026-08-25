import { query, canAccessStudent } from "@/lib/server";
import { notFound } from "next/navigation";
import ProgressView, { type DnaPoint, type ScorePoint } from "./ProgressView";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
}

interface ScoreRow {
  score: number | null;
  completed_at: string;
  total: number;
}

interface ClassScoreRow {
  day: string;
  avg_score: string;
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

interface DnaAvgRow {
  concept: number | null;
  application: number | null;
  critical_thinking: number | null;
  problem_solving: number | null;
  creativity: number | null;
  collaboration: number | null;
  confidence: number | null;
}

const DNA_AXES: { key: keyof DnaRow; avgKey: keyof DnaAvgRow; label: string }[] = [
  { key: "concept_score", avgKey: "concept", label: "Concept" },
  { key: "application_score", avgKey: "application", label: "Application" },
  { key: "critical_thinking_score", avgKey: "critical_thinking", label: "Critical Thinking" },
  { key: "problem_solving_score", avgKey: "problem_solving", label: "Problem Solving" },
  { key: "creativity_score", avgKey: "creativity", label: "Creativity" },
  { key: "collaboration_score", avgKey: "collaboration", label: "Collaboration" },
  { key: "confidence_score", avgKey: "confidence", label: "Confidence" },
];

export default async function ProgressPage({ params }: { params: { id: string } }) {
  if (!(await canAccessStudent(params.id))) notFound();

  const studentRows = await query<StudentRow>(
    "select id, first_name, last_name, nickname, class_id from students where id = $1",
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();
  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;

  const [scoreRows, classScoreRows, firstSnap, lastSnap, classFirstAvg, classLastAvg] = await Promise.all([
    query<ScoreRow>(
      `select att.score, att.completed_at, (select count(*)::int from mission_questions where mission_id = att.mission_id) as total
         from mission_attempts att
        where att.student_id = $1 and att.completed_at is not null
        order by att.completed_at desc
        limit 4`,
      [student.id]
    ),
    query<ClassScoreRow>(
      `select att.completed_at::date::text as day, avg(att.score)::numeric(5,2)::text as avg_score
         from mission_attempts att
         join students s on s.id = att.student_id
        where s.class_id = $1 and att.completed_at is not null
        group by day
        order by day desc
        limit 4`,
      [student.class_id]
    ),
    query<DnaRow>(
      `select concept_score, application_score, critical_thinking_score, problem_solving_score,
              creativity_score, collaboration_score, confidence_score
         from learning_dna_snapshots
        where student_id = $1
        order by computed_at asc
        limit 1`,
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
    query<DnaAvgRow>(
      `select avg(concept_score)::int as concept, avg(application_score)::int as application,
              avg(critical_thinking_score)::int as critical_thinking, avg(problem_solving_score)::int as problem_solving,
              avg(creativity_score)::int as creativity, avg(collaboration_score)::int as collaboration,
              avg(confidence_score)::int as confidence
         from (
           select distinct on (d.student_id) d.*
             from learning_dna_snapshots d
             join students s on s.id = d.student_id
            where s.class_id = $1
            order by d.student_id, d.computed_at asc
         ) first_snap`,
      [student.class_id]
    ),
    query<DnaAvgRow>(
      `select avg(concept_score)::int as concept, avg(application_score)::int as application,
              avg(critical_thinking_score)::int as critical_thinking, avg(problem_solving_score)::int as problem_solving,
              avg(creativity_score)::int as creativity, avg(collaboration_score)::int as collaboration,
              avg(confidence_score)::int as confidence
         from (
           select distinct on (d.student_id) d.*
             from learning_dna_snapshots d
             join students s on s.id = d.student_id
            where s.class_id = $1
            order by d.student_id, d.computed_at desc
         ) last_snap`,
      [student.class_id]
    ),
  ]);

  const individualScores: ScorePoint[] = [...scoreRows].reverse().map((r) => ({
    date: new Date(r.completed_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
    score: r.score ?? 0,
    total: r.total,
  }));

  const classScores: ScorePoint[] = [...classScoreRows].reverse().map((r) => ({
    date: new Date(r.day).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
    score: Math.round(Number(r.avg_score)),
    total: 5,
  }));

  const before = firstSnap[0];
  const after = lastSnap[0];
  const individualDna: DnaPoint[] = before && after
    ? DNA_AXES.map((axis) => ({ label: axis.label, before: before[axis.key], after: after[axis.key] }))
    : [];

  const classBefore = classFirstAvg[0];
  const classAfter = classLastAvg[0];
  const classDna: DnaPoint[] = classBefore && classAfter && classBefore.concept !== null && classAfter.concept !== null
    ? DNA_AXES.map((axis) => ({
        label: axis.label,
        before: classBefore[axis.avgKey] ?? 0,
        after: classAfter[axis.avgKey] ?? 0,
      }))
    : [];

  return (
    <div style={{ position: "relative", overflow: "hidden", padding: "52px 48px 80px" }}>
      <div className="bg-dotgrid" style={{ opacity: 0.3 }} />
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
            Progress
          </span>
          <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>{studentName}</h2>
        </div>

        <ProgressView individualScores={individualScores} classScores={classScores} individualDna={individualDna} classDna={classDna} />

        <div style={{ marginTop: 24 }}>
          <a className="btn btn-ghost" href={`/students/${student.id}/diagnosis`}>
            ← Diagnosis
          </a>
        </div>
      </div>
    </div>
  );
}
