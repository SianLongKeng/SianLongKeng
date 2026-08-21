import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import AddStudentPanel from "./AddStudentPanel";
import LogoutButton from "./LogoutButton";
import StudentRow from "./StudentRow";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
}

interface StudentRowData {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_name: string;
}

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const classes = await query<ClassRow>(
    "select id, name, subject from classes where teacher_id = $1 order by name",
    [session.teacherId]
  );

  const students = await query<StudentRowData>(
    `select s.id, s.student_number, s.first_name, s.last_name, s.nickname, c.name as class_name
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

        <table>
          <thead>
            <tr>
              <th>เลขประจำตัว</th>
              <th>ชื่อ-สกุล</th>
              <th>ชื่อเล่น</th>
              <th>ห้อง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <StudentRow key={s.id} student={s} />
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5}>ยังไม่มีนักเรียนในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <span className="eyebrow">Roster</span>
        <h2 style={{ marginBottom: 16 }}>เพิ่มนักเรียน</h2>
        <AddStudentPanel classes={classes} />
      </div>
    </div>
  );
}
