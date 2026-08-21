"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

export default function BulkAddForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "เพิ่มรายชื่อไม่สำเร็จ");
        return;
      }
      setSummary(
        `เพิ่มสำเร็จ ${data.inserted} คน` +
          (data.duplicatesSkipped ? ` · ข้าม ${data.duplicatesSkipped} คนที่ซ้ำเลขประจำตัว` : "") +
          (data.malformedSkipped ? ` · ข้าม ${data.malformedSkipped} แถวที่ข้อมูลไม่ครบ` : "")
      );
      setText("");
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
      <label htmlFor="bulkClassId">ห้องเรียน</label>
      <select id="bulkClassId" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.subject}
          </option>
        ))}
      </select>

      <label htmlFor="bulkText">รายชื่อนักเรียน (บรรทัดละ 1 คน)</label>
      <textarea
        id="bulkText"
        required
        placeholder={"1094, ชนะกันต์, อินทรักษา, Non\n1214, ณัฐพัชร์, เขียวแก้ว"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="hint">รูปแบบ: เลขประจำตัว, ชื่อ, นามสกุล, ชื่อเล่น (ไม่บังคับ) — คั่นด้วยจุลภาคหรือ Tab</p>

      {error && <p className="error">{error}</p>}
      {summary && <p className="success">{summary}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? "กำลังบันทึก..." : "เพิ่มรายชื่อทั้งหมด"}
      </button>
    </form>
  );
}
