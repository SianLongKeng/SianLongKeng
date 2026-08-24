"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
}

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [className, setClassName] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentOption[] | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  async function lookupCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/join?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "ไม่พบห้องเรียน");
        return;
      }
      setClassName(`${data.class.name} · ${data.class.subject}`);
      setStudents(data.students);
    } finally {
      setBusy(false);
    }
  }

  async function enterAs(studentId: string) {
    setEnteringId(studentId);
    setError(null);
    try {
      const res = await fetch("/api/join/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code.trim(), studentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(`/students/${studentId}/mission`);
    } finally {
      setEnteringId(null);
    }
  }

  if (students) {
    return (
      <div className="wrap">
        <span className="brand-mark">EduTwin</span>
        <div className="card">
          <span className="eyebrow">Student Join · เข้าห้องเรียน</span>
          <h1>{className}</h1>
          <p className="lede">เลือกชื่อของหนูเลยจ้ะ</p>
          <div className="join-name-grid">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                className="join-name-btn"
                disabled={enteringId !== null}
                onClick={() => enterAs(s.id)}
              >
                {s.nickname || s.firstName}
                <span className="join-name-sub">
                  {s.firstName} {s.lastName}
                </span>
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button
            className="btn btn-ghost"
            type="button"
            style={{ marginTop: 20 }}
            onClick={() => {
              setStudents(null);
              setClassName(null);
            }}
          >
            ← ใส่รหัสห้องใหม่ · Enter a different code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>
      <div className="card">
        <span className="eyebrow">Student · เข้าห้องเรียน</span>
        <h1>Enter Your Class Code · กรอกรหัสห้องเรียน</h1>
        <p className="lede">รหัสห้องเรียน 6 ตัว ที่ครูให้ไว้ — ไม่ต้องมีรหัสผ่าน</p>
        <form onSubmit={lookupCode}>
          <label htmlFor="joinCode">Class Code · รหัสห้องเรียน</label>
          <input
            id="joinCode"
            required
            autoFocus
            maxLength={6}
            placeholder="เช่น A3F9K2"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "IBM Plex Mono, monospace", fontSize: "1.2rem", textAlign: "center" }}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 20 }}>
            {busy ? "กำลังค้นหา..." : "Continue · ต่อไป"}
          </button>
        </form>
        <p className="auth-link">
          Are you a teacher? · เป็นคุณครูใช่ไหม? <a href="/login">Teacher Login · เข้าสู่ระบบครู</a>
        </p>
      </div>
    </div>
  );
}
