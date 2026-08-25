"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

interface ClassItem extends ClassOption {
  student_count: number;
  join_code: string;
}

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  class_id: string;
  class_name: string;
}

function initialOf(s: { first_name: string; nickname: string | null }) {
  return (s.nickname || s.first_name).slice(0, 1);
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
      <div className="class-card">
        <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <label>
            <span>CLASS · ห้องเรียน</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>SUBJECT · วิชา</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        </div>
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
      </div>
    );
  }

  return (
    <div className="class-card">
      <div className="class-card-head">
        <div>
          <div className="class-card-name">{cls.name}</div>
          <div className="class-card-subject">{cls.subject}</div>
        </div>
        <div>
          <div className="class-card-code-label">JOIN CODE</div>
          <div className="join-code-chip mono" style={{ marginTop: 8, fontSize: "1.05rem" }}>
            {cls.join_code}
          </div>
        </div>
      </div>
      <div className="class-card-foot">
        <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>{cls.student_count} คน</span>
        <span className="roster-actions">
          <Link className="row-chip filled" href={`/admin/classes/${cls.id}/insights`}>
            Insights · ภาพรวม AI
          </Link>
          <button className="row-chip outline" type="button" onClick={() => setEditing(true)}>
            Edit · แก้ไข
          </button>
          <button className="row-chip danger" type="button" onClick={remove} disabled={busy}>
            Delete · ลบ
          </button>
        </span>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
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
    <form onSubmit={onSubmit} className="dashed-panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>
      <label style={{ margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
          NEW CLASS · ห้องเรียนใหม่
        </span>
        <input required placeholder="เช่น ป.6/1" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label style={{ margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
          SUBJECT · วิชา
        </span>
        <input required placeholder="เช่น ภาษาไทย" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Adding... · กำลังเพิ่ม..." : "Add Class +"}
      </button>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
    </form>
  );
}

export function ClassManager({ classes }: { classes: ClassItem[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid var(--border-strong)", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>Classes</span>
          <h2 style={{ fontSize: "1.9rem" }}>Classes You Teach · ห้องเรียนที่สอน</h2>
          <p className="lede" style={{ marginTop: 10, maxWidth: 640 }}>
            อาจารย์หนึ่งคนสอนได้หลายห้อง หลายวิชา — เพิ่มห้องใหม่ได้ตลอดเวลา แจก Join Code ให้นักเรียนกรอกที่หน้า{" "}
            <a href="/join">/join</a> เพื่อเข้าทำมิชชันเองได้เลย ไม่ต้องมีรหัสผ่าน
          </p>
        </div>
      </div>

      <div className="class-card-grid" style={{ marginBottom: 28 }}>
        {classes.map((c) => (
          <ClassRow key={c.id} cls={c} />
        ))}
        {classes.length === 0 && <p className="lede">No classes yet · ยังไม่มีห้องเรียน</p>}
      </div>

      <AddClassForm />
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={onClick}>
      Log Out · ออกจากระบบ
    </button>
  );
}

function StudentRow({ student }: { student: Student }) {
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
      <div className="roster-grid-row roster-grid">
        <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} style={{ margin: 0 }} />
        <span style={{ display: "flex", gap: 6 }}>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ margin: 0 }} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ margin: 0 }} />
        </span>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ margin: 0 }} />
        <span style={{ color: "var(--ink-soft)" }}>{student.class_name}</span>
        <span>
          <span className="roster-actions">
            <button className="row-chip filled" type="button" onClick={save} disabled={busy}>
              Save · บันทึก
            </button>
            <button className="row-chip outline" type="button" onClick={cancelEdit} disabled={busy}>
              Cancel · ยกเลิก
            </button>
          </span>
          {error && <p className="error">{error}</p>}
        </span>
      </div>
    );
  }

  return (
    <div className="roster-grid-row roster-grid">
      <span className="mono" style={{ color: "var(--ink-soft)" }}>{student.student_number}</span>
      <span className="roster-name-cell">
        <span className="avatar-grad" style={{ width: 28, height: 28, fontSize: "0.68rem" }}>
          {initialOf(student)}
        </span>
        {student.first_name} {student.last_name}
      </span>
      <span style={{ color: "var(--ink-soft)" }}>{student.nickname || "—"}</span>
      <span style={{ color: "var(--ink-soft)" }}>{student.class_name}</span>
      <span className="roster-actions">
        <Link className="row-chip filled" href={`/students/${student.id}/mission`}>
          Mission
        </Link>
        <Link className="row-chip outline" href={`/students/${student.id}/diagnosis`}>
          Diagnosis
        </Link>
        <Link className="row-chip outline" href={`/students/${student.id}/report`}>
          Report
        </Link>
        <button className="row-chip outline" type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="row-chip danger" type="button" onClick={remove} disabled={busy}>
          Delete
        </button>
      </span>
      {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
    </div>
  );
}

export function RosterTable({ students, classes }: { students: Student[]; classes: ClassOption[] }) {
  const [classFilter, setClassFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (classFilter === "all" ? students : students.filter((s) => s.class_id === classFilter)),
    [students, classFilter]
  );

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: "0.66rem", letterSpacing: "0.16em", color: "var(--ink-muted)" }}>
            กรองตามห้องเรียน
          </span>
          <select
            aria-label="กรองตามห้องเรียน"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: "auto", padding: "9px 16px", borderRadius: 12, fontSize: "0.88rem" }}
          >
            <option value="all">All Classes ({students.length}) · ทุกห้อง ({students.length} คน)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
        </div>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
          {students.length} STUDENTS · {classes.length} CLASSES
        </span>
      </div>

      <div className="roster-grid roster-grid-head">
        <span>STUDENT ID</span>
        <span>NAME · ชื่อ-สกุล</span>
        <span>NICKNAME</span>
        <span>CLASS</span>
        <span>ACTIONS · จัดการ</span>
      </div>
      {filtered.map((s) => (
        <StudentRow key={s.id} student={s} />
      ))}
      {filtered.length === 0 && (
        <p className="lede" style={{ padding: "16px 0" }}>
          {students.length === 0 ? "No students yet · ยังไม่มีนักเรียนในระบบ" : "No students in this class · ไม่มีนักเรียนในห้องนี้"}
        </p>
      )}
    </div>
  );
}

function AddStudentForm({ classes }: { classes: ClassOption[] }) {
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
    return <p className="lede">ยังไม่มีห้องเรียนในระบบ — ต้องสร้างห้องเรียนก่อนเพิ่มนักเรียน</p>;
  }

  return (
    <form onSubmit={onSubmit} className="field-grid">
      <label className="field-span-2">
        <span>CLASS · ห้องเรียน</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.subject}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>STUDENT ID · เลขประจำตัว</span>
        <input required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} />
      </label>

      <label>
        <span>NICKNAME · ชื่อเล่น</span>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </label>

      <label>
        <span>FIRST NAME · ชื่อ</span>
        <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>

      <label>
        <span>LAST NAME · นามสกุล</span>
        <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </label>

      {error && <p className="error field-span-2">{error}</p>}
      <div className="field-span-2">
        <button className="btn btn-soft" type="submit" disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "Saving... · กำลังบันทึก..." : "Add Student · เพิ่มนักเรียน →"}
        </button>
      </div>
    </form>
  );
}

function BulkAddForm({ classes }: { classes: ClassOption[] }) {
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
    return <p className="lede">ยังไม่มีห้องเรียนในระบบ — ต้องสร้างห้องเรียนก่อนเพิ่มนักเรียน</p>;
  }

  return (
    <div style={{ padding: 28, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="mono" style={{ fontSize: "0.66rem", letterSpacing: "0.16em", color: "var(--ink-muted)", marginBottom: 16 }}>
        BULK ADD · วางรายชื่อทั้งห้อง
      </div>
      <form onSubmit={onSubmit}>
        <label style={{ margin: "0 0 9px" }}>
          <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
            CLASS · ห้องเรียน
          </span>
        </label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ marginBottom: 16 }}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.subject}
            </option>
          ))}
        </select>

        <textarea
          required
          placeholder={"1094, ชนะกันต์, อินทรักษา, Non\n1214, ณัฐพัชร์, เขียวแก้ว"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ background: "rgba(0,0,0,0.3)", lineHeight: 2 }}
        />
        <p className="hint">รูปแบบ: เลขประจำตัว, ชื่อ, นามสกุล, ชื่อเล่น (ไม่บังคับ) — คั่นด้วยจุลภาคหรือ Tab</p>

        {error && <p className="error">{error}</p>}
        {summary && <p className="success">{summary}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "Saving... · กำลังบันทึก..." : "Add All · เพิ่มรายชื่อทั้งหมด"}
        </button>
      </form>
    </div>
  );
}

export function AddStudentPanel({ classes }: { classes: ClassOption[] }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }} className="add-student-layout">
      <div>
        <div className="tab-toggle" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "single"} onClick={() => setMode("single")}>
            Add One · เพิ่มทีละคน
          </button>
          <button type="button" role="tab" aria-selected={mode === "bulk"} onClick={() => setMode("bulk")}>
            Bulk Add · เพิ่มทีละหลายคน
          </button>
        </div>
        {mode === "single" && <AddStudentForm classes={classes} />}
      </div>
      <BulkAddForm classes={classes} />
      <style>{`
        @media (max-width: 760px) {
          .add-student-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

type AdminTab = "roster" | "classes" | "add";

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "roster", label: "Roster · รายชื่อนักเรียน" },
  { key: "classes", label: "Classes · ห้องเรียน" },
  { key: "add", label: "Add Students · เพิ่มนักเรียน" },
];

export function AdminTabs({ classes, students, email }: { classes: ClassItem[]; students: Student[]; email: string }) {
  const [tab, setTab] = useState<AdminTab>("roster");

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 16 }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>Teacher Copilot</span>
          <h1 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.6rem)" }}>Dashboard</h1>
          <p className="lede" style={{ marginTop: 10 }}>เข้าสู่ระบบในนาม {email}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-ghost btn-small" href="/admin/interventions">
            Interventions
          </Link>
          <Link className="btn btn-ghost btn-small" href="/admin/missions/new">
            Mission Builder
          </Link>
          <Link className="btn btn-ghost btn-small" href="/admin/school">
            School Analytics
          </Link>
          <LogoutButton />
        </div>
      </div>
      <div className="tab-toggle" role="tablist">
        {ADMIN_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roster" && <RosterTable students={students} classes={classes} />}
      {tab === "classes" && <ClassManager classes={classes} />}
      {tab === "add" && (
        <div>
          <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>Roster</span>
          <h2 style={{ fontSize: "1.9rem", marginBottom: 24 }}>Add Students · เพิ่มนักเรียน</h2>
          <AddStudentPanel classes={classes} />
        </div>
      )}
    </>
  );
}
