"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function lookupEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "ไม่พบบัญชีนี้");
        return;
      }
      setQuestion(data.question);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), answer: answer.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
        return;
      }
      setSuccess(true);
    } finally {
      setBusy(false);
    }
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
      <div className="page-content" style={{ textAlign: "center", maxWidth: 460, padding: "40px 32px", width: "100%" }}>
        <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
          RESET PASSWORD
        </span>

        {success ? (
          <>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: 12 }}>ตั้งรหัสผ่านใหม่สำเร็จ</h2>
            <p className="lede" style={{ marginBottom: 30 }}>เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลยค่ะ</p>
            <button className="btn btn-primary" type="button" onClick={() => router.push("/login")}>
              ไปหน้าเข้าสู่ระบบ →
            </button>
          </>
        ) : question === null ? (
          <>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: 12 }}>ลืมรหัสผ่าน</h2>
            <p className="lede" style={{ marginBottom: 30 }}>
              กรอกอีเมลบัญชีครูของคุณ ระบบจะถามคำถามกันลืมที่ตั้งไว้ตอนสมัคร
            </p>
            <form onSubmit={lookupEmail} className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label htmlFor="email">
                <span>EMAIL · อีเมล</span>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
                {busy ? "กำลังค้นหา..." : "ต่อไป →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: 12 }}>ตอบคำถามกันลืม</h2>
            <p className="lede" style={{ marginBottom: 30 }}>{question}</p>
            <form onSubmit={resetPassword} className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label htmlFor="answer">
                <span>ANSWER · คำตอบ</span>
                <input
                  id="answer"
                  required
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </label>
              <label htmlFor="newPassword">
                <span>NEW PASSWORD (MIN. 8 CHARACTERS) · รหัสผ่านใหม่</span>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
                {busy ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่ →"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: "0.88rem" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setQuestion(null);
                  setError(null);
                }}
              >
                ← ใส่อีเมลอื่น
              </a>
            </p>
          </>
        )}

        {!success && (
          <p className="auth-link">
            <a href="/login">← กลับไปหน้าเข้าสู่ระบบ</a>
          </p>
        )}
      </div>
    </div>
  );
}
