import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { AdminTabs } from "./components";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  join_code: string;
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
    `select c.id, c.name, c.subject, c.join_code,
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
    <div style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "48px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -240,
          left: -140,
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <AdminTabs classes={classes} students={students} email={session.email} />
      </div>
    </div>
  );
}
