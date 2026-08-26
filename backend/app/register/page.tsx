"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          fullName,
          email,
          password,
          className,
          subject,
          securityQuestion,
          securityAnswer,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen" style={{ padding: "56px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -260,
          right: -160,
          width: 760,
          height: 760,
          background: "radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(10,8,16,0) 65%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.75rem)", marginBottom: 8 }}>Sign Up as a Teacher</h2>
        <p style={{ margin: "0 0 40px", fontSize: "1rem", color: "var(--ink-soft)" }}>
          สมัครใช้งานสำหรับครู — สร้างห้องเรียนแรกได้ทันทีหลังสมัคร
        </p>
        <form onSubmit={onSubmit} className="field-grid">
          <label htmlFor="schoolName" className="field-span-2">
            <span>SCHOOL NAME · ชื่อโรงเรียน</span>
            <input id="schoolName" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </label>

          <label htmlFor="fullName">
            <span>TEACHER&apos;S FULL NAME · ชื่อ-นามสกุลครู</span>
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>

          <label htmlFor="email">
            <span>EMAIL · อีเมล</span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="kruaom@edutwin.app"
            />
          </label>

          <label htmlFor="password">
            <span>PASSWORD (MIN. 8 CHARACTERS) · รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</span>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label htmlFor="className">
            <span>FIRST CLASS · ห้องเรียนแรก</span>
            <input id="className" required placeholder="เช่น ป.6/1" value={className} onChange={(e) => setClassName(e.target.value)} />
          </label>

          <label htmlFor="subject" className="field-span-2">
            <span>SUBJECT · วิชา</span>
            <input id="subject" required placeholder="เช่น ภาษาไทย" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>

          <label htmlFor="securityQuestion" className="field-span-2">
            <span>SECURITY QUESTION · คำถามกันลืม (ใช้ตอนลืมรหัสผ่าน)</span>
            <input
              id="securityQuestion"
              required
              placeholder="เช่น ชื่อเล่นสมัยเด็กของคุณคืออะไร"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
            />
          </label>

          <label htmlFor="securityAnswer" className="field-span-2">
            <span>ANSWER · คำตอบ</span>
            <input
              id="securityAnswer"
              required
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
            />
          </label>

          {error && (
            <p className="error field-span-2">
              {error}
            </p>
          )}

          <div className="field-span-2" style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn btn-soft" type="submit" disabled={busy}>
              {busy ? "Signing up... · กำลังสมัคร..." : "Create Account · สร้างบัญชี →"}
            </button>
            <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
              Already have an account? <a href="/login">Log In</a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
