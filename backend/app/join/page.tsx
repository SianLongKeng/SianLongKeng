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
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [pin, setPin] = useState("");

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

  async function confirmPin(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setEnteringId(selectedStudent.id);
    setError(null);
    try {
      const res = await fetch("/api/join/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code.trim(), studentId: selectedStudent.id, pin: pin.trim() }),
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
      <div style={{ position: "relative", overflow: "hidden", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
      <div style={{ position: "relative", overflow: "hidden", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
            <span className="join-code-chip mono">{code.trim().toUpperCase()}</span>
          </div>
          <h2 style={{ fontSize: "1.9rem", marginBottom: 6 }}>{className}</h2>
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
                setClassName(null);
              }}
            >
              ← Enter a different code · ใส่รหัสอื่น
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
        <h2 style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.75rem)", marginBottom: 12 }}>Enter Your Class Code</h2>
        <p className="lede" style={{ marginBottom: 34, fontSize: "1rem" }}>
          กรอกรหัสห้องเรียน 6 หลักที่ได้จากคุณครู — ไม่ต้องใช้รหัสผ่าน
        </p>
        <form onSubmit={lookupCode}>
          <input
            id="joinCode"
            required
            autoFocus
            maxLength={6}
            placeholder="A3F9K2"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="code-input"
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
