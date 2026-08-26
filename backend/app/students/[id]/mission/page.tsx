import { query } from "@/lib/server";
import { notFound } from "next/navigation";
import { canAccessStudent } from "@/lib/server";
import MissionRunner from "./MissionRunner";

export const dynamic = "force-dynamic";

const MISSION_ID = "00000000-0000-0000-0000-000000000001";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
  class_name: string;
}

interface MissionRow {
  id: string;
  title: string;
  scenario_text: string;
}

interface QuestionRow {
  id: string;
  order_index: number;
  question_text: string;
  image_url: string | null;
}

interface ChoiceRow {
  id: string;
  question_id: string;
  order_index: number;
  choice_text: string;
}

interface NextAssignedRow {
  mission_id: string;
}

// Which mission a student lands on: the one Student Home already picked
// (passed as ?mission=, since that page filters by Learning-Gap bucket too),
// or — landing here directly with no param — the earliest-due assigned
// mission this student hasn't attempted yet, falling back to the shared
// demo mission when nothing is assigned. Either way, the id must actually
// belong to this student's class before we trust it.
async function resolveMissionId(studentId: string, classId: string, requested?: string): Promise<string> {
  if (requested) {
    const owned = await query<{ id: string }>(
      "select id from missions where id = $1 and (class_id = $2 or id = $3)",
      [requested, classId, MISSION_ID]
    );
    if (owned.length > 0) return requested;
  }

  const nextAssigned = await query<NextAssignedRow>(
    `select ma.mission_id
       from mission_assignments ma
      where ma.class_id = $1
        and (ma.student_id = $2 or ma.student_id is null)
        and not exists (
          select 1 from mission_attempts att where att.student_id = $2 and att.mission_id = ma.mission_id
        )
      order by ma.due_at nulls last
      limit 1`,
    [classId, studentId]
  );
  return nextAssigned[0]?.mission_id ?? MISSION_ID;
}

export default async function MissionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { mission?: string };
}) {
  if (!(await canAccessStudent(params.id))) notFound();

  const studentRows = await query<StudentRow>(
    `select s.id, s.first_name, s.last_name, s.nickname, s.class_id, c.name as class_name
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1`,
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();

  const missionId = await resolveMissionId(student.id, student.class_id, searchParams?.mission);

  const [missionRows, questionRows, choiceRows] = await Promise.all([
    query<MissionRow>("select id, title, scenario_text from missions where id = $1", [missionId]),
    query<QuestionRow>(
      "select id, order_index, question_text, image_url from mission_questions where mission_id = $1 order by order_index",
      [missionId]
    ),
    query<ChoiceRow>(
      `select qc.id, qc.question_id, qc.order_index, qc.choice_text
         from question_choices qc
         join mission_questions mq on mq.id = qc.question_id
        where mq.mission_id = $1
        order by qc.order_index`,
      [missionId]
    ),
  ]);

  const mission = missionRows[0];
  if (!mission) notFound();

  const questions = questionRows.map((q) => ({
    id: q.id,
    orderIndex: q.order_index,
    questionText: q.question_text,
    imageUrl: q.image_url,
    choices: choiceRows
      .filter((c) => c.question_id === q.id)
      .map((c) => ({ id: c.id, orderIndex: c.order_index, choiceText: c.choice_text })),
  }));

  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;
  const studentShort = student.nickname || student.first_name;

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="bg-dotgrid" style={{ opacity: 0.35 }} />
      <div className="page-content" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: 22,
            fontSize: "0.72rem",
            letterSpacing: "0.16em",
          }}
        >
          <span style={{ color: "var(--accent-2)" }}>
            {studentShort} · {student.class_name}
          </span>
        </div>
        <p className="lede" style={{ marginBottom: 18 }}>
          {mission.title} — นักเรียน: {studentName}
        </p>
        <MissionRunner
          studentId={student.id}
          mission={{ id: mission.id, title: mission.title, scenarioText: mission.scenario_text }}
          questions={questions}
        />
      </div>
    </div>
  );
}
