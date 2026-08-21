"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_name: string;
}

export default function StudentRow({ student }: { student: Student }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentNumber, setStudentNumber] = useState(student.student_number);
  const [firstName, setFirstName] = useState(student.first_name);
  const [lastName, setLastName] = useState(student.last_name);
  const [nickname, setNickname] = useState(student.nickname ?? "");

  function cancelEdit() {
    setStudentNumber(student.student_number);
    setFirstName(student.first_name);
    setLastName(student.last_name);
    setNickname(student.nickname ?? "");
    setError(null);
    setEditing(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, firstName, lastName, nickname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`ลบ ${student.first_name} ${student.last_name} ออกจากระบบ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "ลบไม่สำเร็จ");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <tr>
        <td>
          <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} style={{ margin: 0 }} />
        </td>
        <td style={{ display: "flex", gap: 6 }}>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ margin: 0 }} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ margin: 0 }} />
        </td>
        <td>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ margin: 0 }} />
        </td>
        <td>{student.class_name}</td>
        <td>
          <div className="row-actions">
            <button className="btn btn-primary btn-small" type="button" onClick={save} disabled={busy}>
              บันทึก
            </button>
            <button className="btn btn-ghost btn-small" type="button" onClick={cancelEdit} disabled={busy}>
              ยกเลิก
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{student.student_number}</td>
      <td>
        {student.first_name} {student.last_name}
      </td>
      <td>{student.nickname || "—"}</td>
      <td>{student.class_name}</td>
      <td>
        <div className="row-actions">
          <button className="btn btn-ghost btn-small" type="button" onClick={() => setEditing(true)}>
            แก้ไข
          </button>
          <button className="btn btn-danger btn-small" type="button" onClick={remove} disabled={busy}>
            ลบ
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </td>
    </tr>
  );
}
