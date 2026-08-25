import Link from "next/link";

export default function Home() {
  return (
    <div className="screen">
      <div
        className="bg-glow"
        style={{
          top: -340,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1180,
          height: 1180,
          background:
            "radial-gradient(circle, rgba(124,58,237,0.30) 0%, rgba(76,29,149,0.10) 40%, rgba(10,8,16,0) 68%)",
        }}
      />
      <div className="bg-dotgrid" style={{ opacity: 0.45 }} />

      <div
        className="page-content"
        style={{
          minHeight: "calc(100vh - 57px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 32px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 860 }}>
          <div className="eyebrow" style={{ color: "var(--accent-2)", fontSize: "0.75rem", letterSpacing: "0.26em", marginBottom: 24 }}>
            WELCOME · ยินดีต้อนรับ
          </div>
          <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)", lineHeight: 1.0, textWrap: "pretty" }}>
            Who&apos;s using
            <br />
            <span style={{ color: "var(--accent-2)" }}>EduTwin</span> today?
          </h1>
          <p style={{ margin: "22px auto 44px", maxWidth: 520, fontSize: "1.05rem", lineHeight: 1.75, color: "var(--ink-soft)" }}>
            วันนี้ใครจะเข้าใช้งาน — เลือกบทบาทของคุณเพื่อเริ่มต้น
          </p>
          <div className="role-pill-row">
            <Link href="/join" className="role-pill primary">
              <span className="role-pill-label">
                <span className="role-pill-title">I&apos;m a Student</span>
                <span className="role-pill-sub">ฉันเป็นนักเรียน · กรอกรหัสห้องเรียน</span>
              </span>
              <span className="role-pill-badge">→</span>
            </Link>
            <Link href="/login" className="role-pill secondary">
              <span className="role-pill-label">
                <span className="role-pill-title">I&apos;m a Teacher</span>
                <span className="role-pill-sub">ฉันเป็นครู · เข้าสู่ระบบ</span>
              </span>
              <span className="role-pill-badge">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
