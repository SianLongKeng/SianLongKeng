"use client";

import { useState } from "react";

export interface ScorePoint {
  date: string;
  score: number;
  total: number;
}

export interface DnaPoint {
  label: string;
  before: number;
  after: number;
}

function TrendChart({ points }: { points: ScorePoint[] }) {
  if (points.length === 0) {
    return <p className="lede">ยังไม่มีข้อมูลคะแนนมิชชัน</p>;
  }
  const maxTotal = Math.max(...points.map((p) => p.total), 1);
  return (
    <>
      <div className="trend-chart">
        {points.map((p, i) => {
          const heightPct = Math.max(6, (p.score / maxTotal) * 100);
          const isNewest = i === points.length - 1;
          const opacity = 0.14 + (0.86 * (i + 1)) / points.length;
          return (
            <div className="trend-bar-col" key={i}>
              <span className="trend-bar-score mono">
                {p.score}/{p.total}
              </span>
              <div
                className="trend-bar"
                style={{
                  height: `${heightPct}%`,
                  background: isNewest ? "#7c3aed" : `rgba(124,58,237,${opacity})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="trend-baseline">
        {points.map((p, i) => (
          <span className="trend-date" key={i}>
            {p.date}
          </span>
        ))}
      </div>
    </>
  );
}

function BeforeAfter({ points }: { points: DnaPoint[] }) {
  if (points.length === 0) {
    return <p className="lede">ยังไม่มีข้อมูลเปรียบเทียบ Learning DNA</p>;
  }
  return (
    <>
      {points.map((p) => {
        const delta = p.after - p.before;
        return (
          <div className="ba-row" key={p.label}>
            <span style={{ color: "var(--ink-soft)" }}>{p.label}</span>
            <div className="ba-bars">
              <span className="ba-track">
                <span className="ba-fill" style={{ width: `${p.before}%`, background: "rgba(255,255,255,0.22)" }} />
              </span>
              <span className="ba-track">
                <span className="ba-fill" style={{ width: `${p.after}%`, background: "var(--accent)" }} />
              </span>
            </div>
            <span className={`mono ba-delta ${delta >= 0 ? "good" : "serious"}`}>
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.78rem", color: "var(--ink-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.22)" }} /> Before
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)" }} /> After
        </span>
      </div>
    </>
  );
}

export default function ProgressView({
  individualScores,
  classScores,
  individualDna,
  classDna,
}: {
  individualScores: ScorePoint[];
  classScores: ScorePoint[];
  individualDna: DnaPoint[];
  classDna: DnaPoint[];
}) {
  const [mode, setMode] = useState<"individual" | "class">("individual");
  const scores = mode === "individual" ? individualScores : classScores;
  const dna = mode === "individual" ? individualDna : classDna;

  return (
    <div>
      <div className="tab-toggle" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "individual"} onClick={() => setMode("individual")}>
          รายคน
        </button>
        <button type="button" role="tab" aria-selected={mode === "class"} onClick={() => setMode("class")}>
          ทั้งห้อง
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="progress-layout">
        <div className="card">
          <span className="eyebrow" style={{ fontSize: "0.72rem" }}>MISSION SCORE TREND</span>
          <div style={{ marginTop: 18 }}>
            <TrendChart points={scores} />
          </div>
        </div>
        <div className="card">
          <span className="eyebrow" style={{ fontSize: "0.72rem" }}>BEFORE / AFTER · เทียบก่อน–หลัง retry</span>
          <div style={{ marginTop: 18 }}>
            <BeforeAfter points={dna} />
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .progress-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
