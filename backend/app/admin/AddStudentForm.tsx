"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

export default function AddStudentForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [studentNumber, setStudentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentNumber, firstName, lastName, nickname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "เพิ่มนักเรียนไม่สำเร็จ");
        return;
      }
      setStudentNumber("");
      setFirstName("");
      setLastName("");
      setNickname("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (classes.length === 0) {
    return <p>ยังไม่มีห้องเรียนในระบบ — ต้องสร้างห้องเรียนก่อนเพิ่มนักเรียน</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="classId">Class · ห้องเรียน</label>
      <select id="classId" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.subject}
          </option>
        ))}
      </select>

      <label htmlFor="studentNumber">Student ID · เลขประจำตัว</label>
      <input id="studentNumber" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} />

      <label htmlFor="firstName">First Name · ชื่อ</label>
      <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />

      <label htmlFor="lastName">Last Name · นามสกุล</label>
      <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />

      <label htmlFor="nickname">Nickname (optional) · ชื่อเล่น (ไม่บังคับ)</label>
      <input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />

      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? "Saving... · กำลังบันทึก..." : "Add Student · เพิ่มนักเรียน"}
      </button>
    </form>
  );
}
