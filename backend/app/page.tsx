import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <span className="brand-mark">EduTwin</span>
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <span className="eyebrow">Welcome · ยินดีต้อนรับ</span>
        <h1 style={{ margin: "10px 0 24px" }}>Who&apos;s using EduTwin today? · วันนี้ใครจะเข้าใช้งาน</h1>
        <div className="role-pick-grid">
          <Link href="/join" className="role-pick-card">
            <span className="role-pick-title">I&apos;m a Student</span>
            <span className="role-pick-sub">ฉันเป็นนักเรียน · กรอกรหัสห้องเรียน</span>
          </Link>
          <Link href="/login" className="role-pick-card">
            <span className="role-pick-title">I&apos;m a Teacher</span>
            <span className="role-pick-sub">ฉันเป็นครู · เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
