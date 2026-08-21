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
        body: JSON.stringify({ schoolName, fullName, email, password, className, subject }),
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
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>
      <div className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Get started</span>
            <h1>สมัครใช้งานสำหรับครู</h1>
          </div>
        </div>
        <p className="lede">สร้างบัญชีโรงเรียน + ห้องเรียนแรกของคุณ ใช้เวลาไม่ถึงนาที</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="schoolName">ชื่อโรงเรียน</label>
          <input id="schoolName" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />

          <label htmlFor="fullName">ชื่อ-นามสกุลครู</label>
          <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <label htmlFor="password">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label htmlFor="className">ห้องเรียนแรก</label>
          <input
            id="className"
            required
            placeholder="เช่น ป.5/2"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />

          <label htmlFor="subject">วิชา</label>
          <input
            id="subject"
            required
            placeholder="เช่น คณิตศาสตร์"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 20 }}>
            {busy ? "กำลังสมัคร..." : "สร้างบัญชี"}
          </button>
        </form>
        <p className="auth-link">
          มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
