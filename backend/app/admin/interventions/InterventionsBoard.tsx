"use client";

import { useState } from "react";
import Link from "next/link";

export interface InterventionRow {
  id: string;
  title: string;
  description: string;
  status: "recommended" | "assigned" | "completed" | "dismissed";
  student_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  top_mistake_label: string | null;
  top_mistake_pct: string | null;
}

const COLUMNS: { key: InterventionRow["status"]; title: string; className: string }[] = [
  { key: "recommended", title: "Recommended", className: "recommended" },
  { key: "assigned", title: "Assigned", className: "assigned" },
  { key: "completed", title: "Completed", className: "completed" },
];

function studentName(r: InterventionRow) {
  return r.nickname || r.first_name;
}

function Card({
  row,
  onMove,
}: {
  row: InterventionRow;
  onMove: (id: string, status: InterventionRow["status"]) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function move(status: InterventionRow["status"]) {
    setBusy(true);
    try {
      const res = await fetch(`/api/interventions/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onMove(row.id, status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="board-card">
      <div className="board-card-head">
        <span className="board-card-name">{studentName(row)}</span>
        {row.top_mistake_label && (
          <span className="board-card-tag mono">
            {row.top_mistake_label} {row.top_mistake_pct ? `${Math.round(Number(row.top_mistake_pct))}%` : ""}
          </span>
        )}
      </div>
      <div className="board-card-title">{row.title}</div>
      <p className="board-card-desc">{row.description}</p>
      <div className="board-card-actions">
        {row.status === "recommended" && (
          <>
            <button className="row-chip filled" type="button" disabled={busy} onClick={() => move("assigned")}>
              มอบหมาย
            </button>
            <button className="row-chip outline" type="button" disabled={busy} onClick={() => move("dismissed")}>
              ปรับแผน
            </button>
          </>
        )}
        {row.status === "assigned" && (
          <>
            <Link className="row-chip outline" href={`/students/${row.student_id}/diagnosis`}>
              ดูความคืบหน้า
            </Link>
            <button className="row-chip filled" type="button" disabled={busy} onClick={() => move("completed")}>
              ปิดงาน
            </button>
          </>
        )}
        {row.status === "completed" && (
          <>
            <Link className="row-chip filled" href={`/students/${row.student_id}/progress`}>
              ดูผลเทียบ
            </Link>
            <button className="row-chip outline" type="button" disabled={busy} onClick={() => move("dismissed")}>
              เก็บเข้าคลัง
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function InterventionsBoard({ initialRows }: { initialRows: InterventionRow[] }) {
  const [rows, setRows] = useState(initialRows);

  function handleMove(id: string, status: InterventionRow["status"]) {
    setRows((prev) =>
      status === "dismissed" ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  return (
    <div className="board-columns">
      {COLUMNS.map((col) => {
        const list = rows.filter((r) => r.status === col.key);
        return (
          <div className={`board-column ${col.className}`} key={col.key}>
            <div className="board-column-head">
              <span className="board-column-dot" />
              <span>{col.title}</span>
              <span className="board-column-count mono">{list.length}</span>
            </div>
            <div className="board-cards">
              {list.map((row) => (
                <Card key={row.id} row={row} onMove={handleMove} />
              ))}
              {list.length === 0 && <p className="board-empty">ไม่มีรายการ</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
