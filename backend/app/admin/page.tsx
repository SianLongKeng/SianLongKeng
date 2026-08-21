import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import AddStudentPanel from "./AddStudentPanel";
import ClassManager from "./ClassManager";
import LogoutButton from "./LogoutButton";
import RosterTable from "./RosterTable";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  student_count: number;
}

interface StudentRowData {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
  class_name: string;
}

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const classes = await query<ClassRow>(
    `select c.id, c.name, c.subject,
            (select count(*)::int from students s where s.class_id = c.id) as student_count
       from classes c
      where c.teacher_id = $1
      order by c.name, c.subject`,
    [session.teacherId]
  );

  const students = await query<StudentRowData>(
    `select s.id, s.student_number, s.first_name, s.last_name, s.nickname, s.class_id, c.name as class_name
       from students s
       join classes c on c.id = s.class_id
      where c.teacher_id = $1
      order by c.name, s.last_name, s.first_name`,
    [session.teacherId]
  );

  return (
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>

      <div className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Teacher Copilot</span>
            <h1>รายชื่อนักเรียน</h1>
            <p className="lede">เข้าสู่ระบบในนาม {session.email}</p>
          </div>
          <LogoutButton />
        </div>

        <RosterTable students={students} classes={classes} />
      </div>

      <ClassManager classes={classes} />

      <div className="card">
        <span className="eyebrow">Roster</span>
        <h2 style={{ marginBottom: 16 }}>เพิ่มนักเรียน</h2>
        <AddStudentPanel classes={classes} />
      </div>
    </div>
  );
}
