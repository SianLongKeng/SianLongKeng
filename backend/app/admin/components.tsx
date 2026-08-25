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
        <td>
          <span className="join-code-badge mono">{cls.join_code}</span>
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
      <td>
        <span className="join-code-badge mono">{cls.join_code}</span>
      </td>
      <td>{cls.student_count}</td>
      <td>
        <div className="row-actions">
          <Link className="btn btn-ghost btn-small" href={`/admin/classes/${cls.id}/insights`}>
            Insights · ภาพรวม AI
          </Link>
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

export function ClassManager({ classes }: { classes: ClassItem[] }) {
  return (
    <div className="card">
      <span className="eyebrow">Classes</span>
      <h2 style={{ marginBottom: 4 }}>Classes You Teach · ห้องเรียนที่สอน</h2>
      <p className="lede" style={{ marginBottom: 12 }}>
        อาจารย์หนึ่งคนสอนได้หลายห้อง หลายวิชา — เพิ่มห้องใหม่ได้ตลอดเวลา แจก Join Code ให้นักเรียนกรอกที่หน้า{" "}
        <a href="/join">/join</a> เพื่อเข้าทำมิชชันเองได้เลย ไม่ต้องมีรหัสผ่าน
      </p>

      <table>
        <thead>
          <tr>
            <th>Class · ห้องเรียน</th>
            <th>Subject · วิชา</th>
            <th>Join Code · รหัสห้องเรียน</th>
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
              <td colSpan={5}>No classes yet · ยังไม่มีห้องเรียน</td>
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

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn btn-ghost btn-small" type="button" onClick={onClick}>
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
              Save · บันทึก
            </button>
            <button className="btn btn-ghost btn-small" type="button" onClick={cancelEdit} disabled={busy}>
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
      <td>{student.student_number}</td>
      <td>
        {student.first_name} {student.last_name}
      </td>
      <td>{student.nickname || "—"}</td>
      <td>{student.class_name}</td>
      <td>
        <div className="row-actions">
          <Link className="btn btn-ghost btn-small" href={`/students/${student.id}/mission`}>
            Mission · เริ่มภารกิจ
          </Link>
          <Link className="btn btn-ghost btn-small" href={`/students/${student.id}/diagnosis`}>
            Diagnosis · ผลวิเคราะห์
          </Link>
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

export function RosterTable({ students, classes }: { students: Student[]; classes: ClassOption[] }) {
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
    return <p>ยังไม่มีห้องเรียนในระบบ — ต้องสร้างห้องเรียนก่อนเพิ่มนักเรียน</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="bulkClassId">Class · ห้องเรียน</label>
      <select id="bulkClassId" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.subject}
          </option>
        ))}
      </select>

      <label htmlFor="bulkText">Student List (one per line) · รายชื่อนักเรียน (บรรทัดละ 1 คน)</label>
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
        {busy ? "Saving... · กำลังบันทึก..." : "Add All · เพิ่มรายชื่อทั้งหมด"}
      </button>
    </form>
  );
}

export function AddStudentPanel({ classes }: { classes: ClassOption[] }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  return (
    <div>
      <div className="tab-toggle" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "single"} onClick={() => setMode("single")}>
          Add One · เพิ่มทีละคน
        </button>
        <button type="button" role="tab" aria-selected={mode === "bulk"} onClick={() => setMode("bulk")}>
          Bulk Add · เพิ่มทีละหลายคน
        </button>
      </div>
      {mode === "single" ? <AddStudentForm classes={classes} /> : <BulkAddForm classes={classes} />}
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
      <div className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Teacher Copilot</span>
            <h1>Dashboard</h1>
            <p className="lede">เข้าสู่ระบบในนาม {email}</p>
          </div>
          <LogoutButton />
        </div>
        <div className="tab-toggle" role="tablist" style={{ marginTop: 16, marginBottom: 0 }}>
          {ADMIN_TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "roster" && (
        <div className="card">
          <RosterTable students={students} classes={classes} />
        </div>
      )}
      {tab === "classes" && <ClassManager classes={classes} />}
      {tab === "add" && (
        <div className="card">
          <span className="eyebrow">Roster</span>
          <h2 style={{ marginBottom: 16 }}>Add Students · เพิ่มนักเรียน</h2>
          <AddStudentPanel classes={classes} />
        </div>
      )}
    </>
  );
}
