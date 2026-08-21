"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  student_count: number;
}

function ClassRow({ cls }: { cls: ClassItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name);
  const [subject, setSubject] = useState(cls.subject);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${cls.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject }),
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
    const warning =
      cls.student_count > 0
        ? `ห้อง "${cls.name}" มีนักเรียนอยู่ ${cls.student_count} คน — ลบห้องนี้จะลบนักเรียนทั้งหมดในห้องไปด้วย ต้องการลบจริงหรือไม่?`
        : `ลบห้อง "${cls.name}" ออกจากระบบ?`;
    if (!confirm(warning)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}`, { method: "DELETE" });
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
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ margin: 0 }} />
        </td>
        <td>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ margin: 0 }} />
        </td>
        <td>{cls.student_count}</td>
        <td>
          <div className="row-actions">
            <button className="btn btn-primary btn-small" type="button" onClick={save} disabled={busy}>
              Save · บันทึก
            </button>
            <button
              className="btn btn-ghost btn-small"
              type="button"
              onClick={() => {
                setName(cls.name);
                setSubject(cls.subject);
                setEditing(false);
              }}
              disabled={busy}
            >
              Cancel · ยกเลิก
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{cls.name}</td>
      <td>{cls.subject}</td>
      <td>{cls.student_count}</td>
      <td>
        <div className="row-actions">
          <button className="btn btn-ghost btn-small" type="button" onClick={() => setEditing(true)}>
            Edit · แก้ไข
          </button>
          <button className="btn btn-danger btn-small" type="button" onClick={remove} disabled={busy}>
            Delete · ลบ
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </td>
    </tr>
  );
}

function AddClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "เพิ่มห้องเรียนไม่สำเร็จ");
        return;
      }
      setName("");
      setSubject("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 160px" }}>
        <label htmlFor="newClassName">New Class · ห้องเรียนใหม่</label>
        <input id="newClassName" required placeholder="เช่น ป.6/1" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ flex: "1 1 160px" }}>
        <label htmlFor="newClassSubject">Subject · วิชา</label>
        <input
          id="newClassSubject"
          required
          placeholder="เช่น ภาษาไทย"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginBottom: 0 }}>
        {busy ? "Adding... · กำลังเพิ่ม..." : "Add Class · เพิ่มห้องเรียน"}
      </button>
      {error && <p className="error" style={{ width: "100%" }}>{error}</p>}
    </form>
  );
}

export default function ClassManager({ classes }: { classes: ClassItem[] }) {
  return (
    <div className="card">
      <span className="eyebrow">Classes</span>
      <h2 style={{ marginBottom: 4 }}>Classes You Teach · ห้องเรียนที่สอน</h2>
      <p className="lede" style={{ marginBottom: 12 }}>
        อาจารย์หนึ่งคนสอนได้หลายห้อง หลายวิชา — เพิ่มห้องใหม่ได้ตลอดเวลา
      </p>

      <table>
        <thead>
          <tr>
            <th>Class · ห้องเรียน</th>
            <th>Subject · วิชา</th>
            <th>Students · จำนวนนักเรียน</th>
            <th>Actions · จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <ClassRow key={c.id} cls={c} />
          ))}
          {classes.length === 0 && (
            <tr>
              <td colSpan={4}>No classes yet · ยังไม่มีห้องเรียน</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border-strong)" }}>
        <AddClassForm />
      </div>
    </div>
  );
}
