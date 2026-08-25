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
}

interface ChoiceRow {
  id: string;
  question_id: string;
  order_index: number;
  choice_text: string;
}

export default async function MissionPage({ params }: { params: { id: string } }) {
  if (!(await canAccessStudent(params.id))) notFound();

  const studentRows = await query<StudentRow>(
    `select s.id, s.first_name, s.last_name, s.nickname, c.name as class_name
       from students s
       join classes c on c.id = s.class_id
      where s.id = $1`,
    [params.id]
  );
  const student = studentRows[0];
  if (!student) notFound();

  const missionRows = await query<MissionRow>(
    "select id, title, scenario_text from missions where id = $1",
    [MISSION_ID]
  );
  const mission = missionRows[0];
  if (!mission) notFound();

  const questionRows = await query<QuestionRow>(
    "select id, order_index, question_text from mission_questions where mission_id = $1 order by order_index",
    [mission.id]
  );
  const choiceRows = await query<ChoiceRow>(
    `select qc.id, qc.question_id, qc.order_index, qc.choice_text
       from question_choices qc
       join mission_questions mq on mq.id = qc.question_id
      where mq.mission_id = $1
      order by qc.order_index`,
    [mission.id]
  );

  const questions = questionRows.map((q) => ({
    id: q.id,
    orderIndex: q.order_index,
    questionText: q.question_text,
    choices: choiceRows
      .filter((c) => c.question_id === q.id)
      .map((c) => ({ id: c.id, orderIndex: c.order_index, choiceText: c.choice_text })),
  }));

  const studentName = `${student.first_name} ${student.last_name}${student.nickname ? ` (${student.nickname})` : ""}`;
  const studentShort = student.nickname || student.first_name;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "52px 48px 80px" }}>
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
          Mission: Design a Public Park Budget · ภารกิจ: ออกแบบงบประมาณสวนสาธารณะ — นักเรียน: {studentName}
        </p>
        <MissionRunner
          studentId={student.id}
          mission={{ title: mission.title, scenarioText: mission.scenario_text }}
          questions={questions}
        />
      </div>
    </div>
  );
}
