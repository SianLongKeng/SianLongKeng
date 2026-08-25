"use client";

import { useState } from "react";

interface NotStartedStudent {
  id: string;
  name: string;
}

interface InProgressStudent {
  id: string;
  name: string;
  answered: number;
  total: number;
}

export default function NudgePanel({
  notStarted,
  inProgress,
}: {
  notStarted: NotStartedStudent[];
  inProgress: InProgressStudent[];
}) {
  const [sent, setSent] = useState(false);
  const total = notStarted.length + inProgress.length;

  if (total === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <span className="eyebrow" style={{ fontSize: "0.72rem" }}>NUDGE</span>
        <button className="btn btn-ghost btn-small" type="button" onClick={() => setSent(true)}>
          {sent ? "ส่งแจ้งเตือนแล้ว ✓" : "ส่งแจ้งเตือนทั้งหมด"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notStarted.map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", padding: "6px 0" }}>
            <span>{s.name}</span>
            <span className="mono" style={{ color: "var(--ink-muted)" }}>ยังไม่เริ่ม</span>
          </div>
        ))}
        {inProgress.map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", padding: "6px 0" }}>
            <span>{s.name}</span>
            <span className="mono" style={{ color: "var(--warning)" }}>
              ทำค้าง ข้อ {s.answered}/{s.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
