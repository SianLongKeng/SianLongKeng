"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

interface ChoiceDraft {
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  text: string;
  imageUrl: string | null;
  choices: ChoiceDraft[];
}

function emptyQuestion(): QuestionDraft {
  return {
    text: "",
    imageUrl: null,
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

const ASSIGN_TARGETS: { key: string; label: (cls?: ClassOption) => string }[] = [
  { key: "class", label: (cls) => `ทั้งห้อง ${cls ? cls.name : ""}` },
  { key: "concept_gap", label: () => "กลุ่ม Concept Gap" },
  { key: "application_gap", label: () => "กลุ่ม Application Gap" },
  { key: "mastery", label: () => "กลุ่ม Mastery (ระดับยากขึ้น)" },
];

export default function MissionBuilderForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [scenarioText, setScenarioText] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [assignTarget, setAssignTarget] = useState<string>("class");
  const [dueAt, setDueAt] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === classId);

  async function onImagePicked(qi: number, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploadingIndex(qi);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/missions/upload-image",
      });
      setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, imageUrl: blob.url } : q)));
    } catch {
      setUploadError("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง (ไฟล์ต้องเป็นรูปภาพ ไม่เกิน 5MB)");
    } finally {
      setUploadingIndex(null);
    }
  }

  function removeImage(qi: number) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, imageUrl: null } : q)));
  }

  function updateQuestionText(qi: number, text: string) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, text } : q)));
  }

  function updateChoiceText(qi: number, ci: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? { ...c, text } : c)) } : q))
    );
  }

  function setCorrect(qi: number, ci: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === ci })) } : q
      )
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(qi: number) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((_, i) => i !== qi) : qs));
  }

  async function onSubmit() {
    if (classes.length === 0) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const missionRes = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, title, scenarioText, questions }),
      });
      const missionData = await missionRes.json().catch(() => ({}));
      if (!missionRes.ok) {
        setError(missionData.error || "บันทึกมิชชันไม่สำเร็จ");
        return;
      }

      const assignBody =
        assignTarget === "class"
          ? { missionId: missionData.missionId, classId, dueAt: dueAt || null }
          : { missionId: missionData.missionId, classId, bucket: assignTarget, dueAt: dueAt || null };

      const assignRes = await fetch("/api/mission-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignBody),
      });
      const assignData = await assignRes.json().catch(() => ({}));
      if (!assignRes.ok) {
        setError(assignData.error || "มอบหมายมิชชันไม่สำเร็จ");
        return;
      }

      setSuccess("บันทึกและมอบหมายมิชชันสำเร็จแล้ว");
      setTitle("");
      setScenarioText("");
      setQuestions([emptyQuestion()]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (classes.length === 0) {
    return <p className="lede">ยังไม่มีห้องเรียนในระบบ — ต้องสร้างห้องเรียนก่อนสร้างมิชชัน</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 24, alignItems: "start" }} className="mission-builder-layout">
      <div className="card">
        <label>
          <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
            MISSION TITLE · ชื่อมิชชัน
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น มิชชันที่ 4 · ตลาดนัดโรงเรียน" />
        </label>

        <label style={{ marginTop: 14, display: "block" }}>
          <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
            SCENARIO · สถานการณ์
          </span>
          <textarea
            value={scenarioText}
            onChange={(e) => setScenarioText(e.target.value)}
            style={{ minHeight: 110 }}
            placeholder="อธิบายสถานการณ์ที่นักเรียนต้องตัดสินใจ..."
          />
        </label>

        <div style={{ marginTop: 20 }}>
          <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
            QUESTIONS · คำถาม ({questions.length} ข้อ)
          </span>
          {questions.map((q, qi) => (
            <div key={qi} style={{ marginTop: 12, padding: 16, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span
                  className="mono"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "rgba(124,58,237,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.78rem",
                    flexShrink: 0,
                  }}
                >
                  {qi + 1}
                </span>
                <input
                  value={q.text}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  placeholder={`คำถามข้อที่ ${qi + 1}...`}
                  style={{ margin: 0, flex: 1 }}
                />
                {questions.length > 1 && (
                  <button type="button" className="row-chip danger" onClick={() => removeQuestion(qi)}>
                    ลบ
                  </button>
                )}
              </div>

              <div className="question-image-field">
                {q.imageUrl ? (
                  <div className="question-image-preview">
                    <img src={q.imageUrl} alt="" />
                    <button type="button" className="row-chip danger" onClick={() => removeImage(qi)}>
                      ลบรูป
                    </button>
                  </div>
                ) : (
                  <label className="btn btn-ghost btn-small question-image-upload-btn">
                    {uploadingIndex === qi ? "กำลังอัปโหลด..." : "🖼️ เพิ่มรูปภาพ (ไม่บังคับ)"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      style={{ display: "none" }}
                      disabled={uploadingIndex !== null}
                      onChange={(e) => onImagePicked(qi, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.choices.map((c, ci) => (
                  <label key={ci} style={{ display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={c.isCorrect}
                      onChange={() => setCorrect(qi, ci)}
                      style={{ width: "auto", flexShrink: 0 }}
                    />
                    <input
                      value={c.text}
                      onChange={(e) => updateChoiceText(qi, ci, e.target.value)}
                      placeholder={`ตัวเลือก ${String.fromCharCode(65 + ci)}`}
                      style={{ margin: 0, flex: 1 }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: 12 }} onClick={addQuestion}>
            + เพิ่มคำถาม
          </button>
        </div>

        {uploadError && <p className="error">{uploadError}</p>}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button className="btn btn-primary" type="button" disabled={busy} onClick={onSubmit} style={{ marginTop: 20 }}>
          {busy ? "Saving... · กำลังบันทึก..." : "Save Mission · บันทึกมิชชัน"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="class-card">
          <label style={{ margin: 0, display: "block" }}>
            <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
              CLASS · ห้องเรียน
            </span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.subject}
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginTop: 16 }}>
            <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
              ASSIGN TO
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {ASSIGN_TARGETS.map((t) => {
                const selected = assignTarget === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAssignTarget(t.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: selected ? "1px solid rgba(167,139,250,0.5)" : "1px solid var(--border-strong)",
                      background: selected ? "rgba(124,58,237,0.24)" : "var(--surface-2)",
                      color: "var(--ink)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.88rem",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: "1px solid var(--border-strong)",
                        background: selected ? "var(--accent-soft)" : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    {t.label(selectedClass)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <span className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)" }}>
            DUE · กำหนดส่ง
          </span>
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={{ marginTop: 8 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} style={{ width: "auto" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>แจ้งเตือน 1 วันก่อน</span>
          </label>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .mission-builder-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
