import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import AddStudentForm from "./AddStudentForm";
import LogoutButton from "./LogoutButton";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
}

interface StudentRow {
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

  const students = await query<StudentRow>(
    `select s.id, s.student_number, s.first_name, s.last_name, s.nickname, c.name as class_name
       from students s
       join classes c on c.id = s.class_id
      where c.teacher_id = $1
      order by c.name, s.last_name, s.first_name`,
    [session.teacherId]
  );

  return (
    <div className="wrap">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>รายชื่อนักเรียน</h1>
          <LogoutButton />
        </div>
        <p>เข้าสู่ระบบในนาม {session.email}</p>

        <table>
          <thead>
            <tr>
              <th>เลขประจำตัว</th>
              <th>ชื่อ-สกุล</th>
              <th>ชื่อเล่น</th>
              <th>ห้อง</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.student_number}</td>
                <td>
                  {s.first_name} {s.last_name}
                </td>
                <td>{s.nickname || "—"}</td>
                <td>{s.class_name}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4}>ยังไม่มีนักเรียนในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>เพิ่มนักเรียน</h2>
        <AddStudentForm classes={classes} />
      </div>
    </div>
  );
}
