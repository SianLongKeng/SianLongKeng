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
  const [classInput, setClassInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [classInfo, setClassInfo] = useState<{ name: string; subject: string } | null>(null);
  const [students, setStudents] = useState<StudentOption[] | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [pin, setPin] = useState("");

  async function lookupClass(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/join?name=${encodeURIComponent(classInput.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "ไม่พบห้องเรียน");
        return;
      }
      setClassInfo({ name: data.class.name, subject: data.class.subject });
      setStudents(data.students);
    } finally {
      setBusy(false);
    }
  }

  async function confirmPin(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !classInfo) return;
    setEnteringId(selectedStudent.id);
    setError(null);
    try {
      const res = await fetch("/api/join/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className: classInfo.name, studentId: selectedStudent.id, pin: pin.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(`/students/${selectedStudent.id}/mission`);
    } finally {
      setEnteringId(null);
    }
  }

  if (selectedStudent) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="bg-dotgrid" style={{ opacity: 0.4 }} />
        <div className="page-content" style={{ textAlign: "center", maxWidth: 500, padding: "40px 32px" }}>
          <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
            SECURE JOIN
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: 12 }}>
            สวัสดี {selectedStudent.nickname || selectedStudent.firstName}
          </h2>
          <p className="lede" style={{ marginBottom: 30 }}>ใส่เลขประจำตัวนักเรียนของหนูเพื่อยืนยันตัวตน</p>
          <form onSubmit={confirmPin}>
            <input
              autoFocus
              inputMode="numeric"
              placeholder="1094"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="code-input pin-cell"
              style={{ width: "100%", height: "auto", padding: "16px", fontSize: "1.4rem" }}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={enteringId !== null} style={{ marginTop: 24 }}>
              {enteringId ? "กำลังเข้าสู่ระบบ..." : "ยืนยันและเข้าทำมิชชัน →"}
            </button>
          </form>
          <p style={{ marginTop: 20, fontSize: "0.88rem" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedStudent(null);
                setPin("");
                setError(null);
              }}
            >
              ← เลือกชื่ออื่น
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (students) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="bg-dotgrid" style={{ opacity: 0.4 }} />
        <div
          className="page-content"
          style={{
            width: "100%",
            maxWidth: 580,
            margin: "40px 24px",
            padding: 38,
            borderRadius: 26,
            border: "1px solid var(--border)",
            background: "linear-gradient(160deg, rgba(124,58,237,0.16), rgba(255,255,255,0.02))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 26 }}>
            <span className="join-code-chip mono">{classInfo?.name}</span>
          </div>
          <h2 style={{ fontSize: "1.9rem", marginBottom: 6 }}>
            {classInfo?.name} · {classInfo?.subject}
          </h2>
          <p className="lede" style={{ marginBottom: 26 }}>Who are you? แตะชื่อของคุณเพื่อเข้าทำมิชชัน</p>
          <div className="join-name-grid">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                className="join-name-btn"
                onClick={() => setSelectedStudent(s)}
                style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, textAlign: "left" }}
              >
                <span className="avatar-grad" style={{ width: 32, height: 32, fontSize: "0.72rem" }}>
                  {(s.nickname || s.firstName).slice(0, 1)}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>{s.nickname || s.firstName}</span>
                  <span className="join-name-sub">
                    {s.firstName} {s.lastName}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <p style={{ marginTop: 24, fontSize: "0.88rem" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStudents(null);
                setClassInfo(null);
              }}
            >
              ← Enter a different class · ใส่ชื่อห้องอื่น
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        className="bg-glow"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 900,
          height: 900,
          background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(10,8,16,0) 62%)",
        }}
      />
      <div className="page-content" style={{ textAlign: "center", maxWidth: 600, padding: "40px 32px" }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.75rem)", marginBottom: 12 }}>Enter Your Class</h2>
        <p className="lede" style={{ marginBottom: 34, fontSize: "1rem" }}>
          กรอกชื่อห้องเรียนที่คุณครูบอก เช่น 5/2 — ไม่ต้องใช้รหัสผ่าน
        </p>
        <form onSubmit={lookupClass}>
          <input
            id="className"
            required
            autoFocus
            placeholder="5/2"
            value={classInput}
            onChange={(e) => setClassInput(e.target.value)}
            className="classname-input"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 30 }}>
            {busy ? "กำลังค้นหา..." : "Continue · ต่อไป →"}
          </button>
        </form>
        <p className="auth-link">
          Are you a teacher? · เป็นคุณครูใช่ไหม? <a href="/login">Teacher Login · เข้าสู่ระบบครู</a>
        </p>
      </div>
    </div>
  );
}
