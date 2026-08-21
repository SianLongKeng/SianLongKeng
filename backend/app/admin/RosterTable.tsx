"use client";

import { useMemo, useState } from "react";
import StudentRow from "./StudentRow";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
  class_name: string;
}

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

export default function RosterTable({ students, classes }: { students: Student[]; classes: ClassOption[] }) {
  const [classFilter, setClassFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (classFilter === "all" ? students : students.filter((s) => s.class_id === classFilter)),
    [students, classFilter]
  );

  return (
    <>
      {classes.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="classFilter" style={{ margin: "0 0 6px" }}>
            กรองตามห้องเรียน
          </label>
          <select id="classFilter" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">All Classes ({students.length}) · ทุกห้อง ({students.length} คน)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Student ID · เลขประจำตัว</th>
            <th>Name · ชื่อ-สกุล</th>
            <th>Nickname · ชื่อเล่น</th>
            <th>Class · ห้อง</th>
            <th>Actions · จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <StudentRow key={s.id} student={s} />
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5}>
                {students.length === 0
                  ? "No students yet · ยังไม่มีนักเรียนในระบบ"
                  : "No students in this class · ไม่มีนักเรียนในห้องนี้"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
