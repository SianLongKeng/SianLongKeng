"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(searchParams.get("next") || "/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: 660,
      }}
      className="login-layout"
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "60px 48px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          className="bg-glow"
          style={{
            bottom: -300,
            left: -160,
            width: 800,
            height: 800,
            background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(10,8,16,0) 65%)",
          }}
        />
        <div className="page-content">
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 1.05 }}>Teacher Login</h2>
          <p style={{ margin: "18px 0 0", maxWidth: 380, fontSize: "1rem", lineHeight: 1.7, color: "var(--ink-soft)" }}>
            เข้าสู่ระบบสำหรับครู — ดูภาพรวมชั้นเรียน จัดกลุ่มด้วย AI และติดตามผลรายคน
          </p>
        </div>
      </div>
      <div style={{ padding: "60px 48px", display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <form onSubmit={onSubmit} className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label htmlFor="email">
              <span>EMAIL · อีเมล</span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label htmlFor="password">
              <span>PASSWORD · รหัสผ่าน</span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 6 }}>
              {busy ? "Logging in... · กำลังเข้าสู่ระบบ..." : "Log In · เข้าสู่ระบบ →"}
            </button>
          </form>
          <p className="auth-link">
            No account yet? · ยังไม่มีบัญชี? <a href="/register">Sign up · สมัครใช้งาน</a>
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .login-layout { grid-template-columns: 1fr !important; }
          .login-layout > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
