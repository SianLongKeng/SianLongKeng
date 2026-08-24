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
    "select id, first_name, last_name, nickname from students where id = $1",
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

  return (
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>
      <div className="section-head" style={{ margin: "0 0 22px" }}>
        <span className="eyebrow">Student · Adaptive Mission</span>
        <h1>Mission: Design a Public Park Budget · ภารกิจ: ออกแบบงบประมาณสวนสาธารณะ</h1>
        <p className="lede">นักเรียน: {studentName}</p>
      </div>
      <MissionRunner
        studentId={student.id}
        mission={{ title: mission.title, scenarioText: mission.scenario_text }}
        questions={questions}
      />
    </div>
  );
}
