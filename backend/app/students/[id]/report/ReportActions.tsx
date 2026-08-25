"use client";

import { useState } from "react";

export default function ReportActions({ studentId, showCopyLink }: { studentId: string; showCopyLink: boolean }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copyLink() {
    try {
      const res = await fetch(`/api/students/${studentId}/report-link`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error();
      await navigator.clipboard.writeText(data.url);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <div className="no-print" style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn btn-primary" type="button" onClick={() => window.print()}>
        Export PDF · ส่งออก
      </button>
      {showCopyLink && (
        <button className="btn btn-ghost" type="button" onClick={copyLink}>
          {copyState === "copied" ? "คัดลอกลิงก์แล้ว ✓" : copyState === "error" ? "คัดลอกไม่สำเร็จ" : "คัดลอกลิงก์ผู้ปกครอง"}
        </button>
      )}
    </div>
  );
}
