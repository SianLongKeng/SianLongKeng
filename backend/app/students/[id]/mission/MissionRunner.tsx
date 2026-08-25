"use client";

import { useEffect, useRef, useState } from "react";

interface CoachMessage {
  who: "student" | "ai";
  text: string;
}

interface Choice {
  id: string;
  orderIndex: number;
  choiceText: string;
}

interface Question {
  id: string;
  orderIndex: number;
  questionText: string;
  choices: Choice[];
}

interface Mission {
  title: string;
  scenarioText: string;
}

const LETTERS = ["A", "B", "C", "D"];
const STEPS = ["Explore", "Fail", "Reflect", "Improve"];

type Phase = "starting" | "running" | "grading" | "complete" | "start-error";

export default function MissionRunner({
  studentId,
  mission,
  questions,
}: {
  studentId: string;
  mission: Mission;
  questions: Question[];
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [startError, setStartError] = useState<string | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [attemptsOnQuestion, setAttemptsOnQuestion] = useState(0);
  const [locked, setLocked] = useState(false);
  const [revealCorrectId, setRevealCorrectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ show: boolean; ok: boolean; text: string }>({
    show: false,
    ok: false,
    text: "",
  });
  const [showNext, setShowNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completeResult, setCompleteResult] = useState<{ score: number; total: number } | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachSending, setCoachSending] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const coachScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mission-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || typeof data.attemptId !== "string") {
          setStartError(data.error || "เริ่มมิชชันไม่สำเร็จ ลองรีเฟรชหน้านี้ค่ะ");
          setPhase("start-error");
          return;
        }
        setAttemptId(data.attemptId);
        setPhase("running");
        questionStartRef.current = Date.now();
      })
      .catch(() => {
        if (cancelled) return;
        setStartError("เริ่มมิชชันไม่สำเร็จ ลองรีเฟรชหน้านี้ค่ะ");
        setPhase("start-error");
      });
    return () => {
      cancelled = true;
    };
    // studentId is stable for the lifetime of this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[questionIndex];
  const isLast = questionIndex === questions.length - 1;
  const stepIndex = !feedback.show ? 0 : feedback.ok ? 3 : attemptsOnQuestion === 1 ? 1 : 2;

  function resetForNextQuestion() {
    setSelectedChoiceId(null);
    setAttemptsOnQuestion(0);
    setLocked(false);
    setRevealCorrectId(null);
    setFeedback({ show: false, ok: false, text: "" });
    setShowNext(false);
    setSubmitError(null);
    questionStartRef.current = Date.now();
  }

  async function completeMission() {
    if (!attemptId) return;
    setPhase("grading");
    try {
      const res = await fetch(`/api/mission-attempts/${attemptId}/complete`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCompleteError(data.error || "วิเคราะห์ผลไม่สำเร็จ ลองใหม่อีกครั้งค่ะ");
        setPhase("complete");
        return;
      }
      setCompleteResult({ score: data.score, total: data.total });
      setPhase("complete");
    } catch {
      setCompleteError("วิเคราะห์ผลไม่สำเร็จ ลองใหม่อีกครั้งค่ะ");
      setPhase("complete");
    }
  }

  function goNext() {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
      resetForNextQuestion();
    } else {
      completeMission();
    }
  }

  async function submitAnswer() {
    if (!attemptId || !selectedChoiceId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const nextAttemptNumber = attemptsOnQuestion + 1;
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
    try {
      const res = await fetch(`/api/mission-attempts/${attemptId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          choiceId: selectedChoiceId,
          attemptNumber: nextAttemptNumber,
          timeSpentSeconds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "ส่งคำตอบไม่สำเร็จ ลองอีกครั้งนะคะ");
        return;
      }
      const correct = !!data.isCorrect;
      setAttemptsOnQuestion(nextAttemptNumber);

      if (correct) {
        setScore((s) => s + 1);
        setLocked(true);
        setFeedback({
          show: true,
          ok: true,
          text:
            "ถูกต้อง! บันทึกวิธีคิดของหนูไว้ใน Learning DNA แล้ว" +
            (isLast ? " — ทำครบทุกข้อแล้ว" : " — ไปข้อถัดไปกันเลย"),
        });
        setShowNext(true);
      } else if (nextAttemptNumber === 1) {
        setFeedback({
          show: true,
          ok: false,
          text: "ยังไม่ถูกค่ะ — EduTwin บันทึกไว้แล้วว่าข้อนี้พลาดตรงไหน ลองใช้ AI Coach ช่วยไล่ทีละขั้นตอน หรือลองใหม่อีกครั้งได้เลย",
        });
        setSelectedChoiceId(null);
      } else {
        setLocked(true);
        if (typeof data.correctChoiceId === "string") {
          setRevealCorrectId(data.correctChoiceId);
        }
        setFeedback({
          show: true,
          ok: false,
          text: "ลองอีกครั้งก็ยังไม่ตรงค่ะ — ไม่เป็นไร ไปข้อถัดไปก่อน แล้วค่อยกลับมาสะท้อนคิดทีหลัง",
        });
        setShowNext(true);
      }
    } catch {
      setSubmitError("ส่งคำตอบไม่สำเร็จ ลองอีกครั้งนะคะ");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    coachScrollRef.current?.scrollTo({ top: coachScrollRef.current.scrollHeight });
  }, [coachMessages, coachSending]);

  async function sendCoachMessage() {
    const text = coachInput.trim();
    if (!text || coachSending) return;
    const nextMessages: CoachMessage[] = [...coachMessages, { who: "student", text }];
    setCoachMessages(nextMessages);
    setCoachInput("");
    setCoachError(null);
    setCoachSending(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, studentId, attemptId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.reply !== "string") {
        setCoachError(data.error || "AI Coach ไม่พร้อมใช้งานตอนนี้ ลองใหม่อีกครั้งค่ะ");
        return;
      }
      setCoachMessages((prev) => [...prev, { who: "ai", text: data.reply }]);
    } catch {
      setCoachError("AI Coach ไม่พร้อมใช้งานตอนนี้ ลองใหม่อีกครั้งค่ะ");
    } finally {
      setCoachSending(false);
    }
  }

  if (phase === "starting") {
    return (
      <div className="card mission-card">
        <p className="lede">กำลังเริ่มมิชชัน… · Starting mission…</p>
      </div>
    );
  }

  if (phase === "start-error") {
    return (
      <div className="card mission-card">
        <p className="error">{startError}</p>
      </div>
    );
  }

  if (phase === "grading") {
    return (
      <div className="card mission-complete">
        <h3>AI กำลังวิเคราะห์… · AI is Analyzing…</h3>
        <p>EduTwin กำลังประมวลผล Learning DNA และ Mistake DNA จากคำตอบของหนู รอสักครู่นะคะ</p>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="card mission-complete">
        <h3>Mission Complete · ภารกิจสำเร็จ</h3>
        {completeError ? (
          <p className="error">{completeError}</p>
        ) : (
          <>
            <div className="mission-complete-score mono">
              {completeResult ? `${completeResult.score} / ${completeResult.total}` : `${score} / ${questions.length}`}
            </div>
            <p>EduTwin ประมวลผล Learning DNA และ Mistake DNA จากคำตอบของหนูเรียบร้อยแล้ว</p>
          </>
        )}
        <div className="mission-actions">
          <a className="btn btn-soft" href={`/students/${studentId}/diagnosis`}>
            View Diagnosis · ดูผลวิเคราะห์ →
          </a>
          <a className="btn btn-ghost" href={`/students/${studentId}/mission`}>
            Retry Mission · ทำใหม่
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stepper">
        {STEPS.map((label, i) => (
          <span key={label} className={`step-pill${i < stepIndex ? " done" : ""}${i === stepIndex ? " on" : ""}`}>
            {label}
          </span>
        ))}
      </div>

      <div className="mission-layout">
        <div className="card mission-card">
          <div className="mission-title">{mission.title}</div>
          <p className="mission-scenario">{mission.scenarioText}</p>
          <span className="progress-label mono">
            ข้อที่ {questionIndex + 1} / {questions.length}
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((questionIndex / questions.length) * 100)}%` }}
            />
          </div>
          <p className="question-text">{question.questionText}</p>
          <div className="choices">
            {question.choices.map((choice, i) => {
              const classes = ["choice"];
              if (choice.id === selectedChoiceId) classes.push("selected");
              if (choice.id === revealCorrectId) classes.push("reveal-correct");
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={classes.join(" ")}
                  disabled={locked}
                  onClick={() => setSelectedChoiceId(choice.id)}
                >
                  <span className="letter">{LETTERS[i] ?? i + 1}</span>
                  {choice.choiceText}
                </button>
              );
            })}
          </div>
          <div className="mission-actions">
            {!showNext ? (
              <button className="btn btn-primary" type="button" onClick={submitAnswer} disabled={submitting || !selectedChoiceId}>
                Submit Answer · ส่งคำตอบ
              </button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={goNext}>
                {isLast ? "View Results → · ดูสรุปผล →" : "Next Question → · ข้อถัดไป →"}
              </button>
            )}
          </div>
          {submitError && <p className="error">{submitError}</p>}
          <div className={`feedback${feedback.show ? " show" : ""} ${feedback.ok ? "ok" : "no"}`}>{feedback.text}</div>
        </div>

        <div className="card side-note">
          <h3>What EduTwin Is Observing · EduTwin กำลังสังเกตอะไรอยู่</h3>
          <ul>
            <li>เวลาที่ใช้คิดต่อข้อ และรูปแบบการลองผิดลองถูก</li>
            <li>จำนวนครั้งที่ตอบผิดต่อข้อ</li>
            <li>ลำดับคำตอบก่อนไปถึงคำตอบสุดท้าย</li>
          </ul>
          <p style={{ marginTop: 14 }}>
            ข้อมูลทั้งหมดนี้จะถูกประมวลผลเป็น <strong>Learning DNA</strong> และ <strong>Mistake DNA</strong> ไม่ใช่แค่ถูก/ผิด
          </p>
        </div>
      </div>

      <div className="coach-widget">
        {coachOpen ? (
          <div className="card coach-panel-float">
            <div className="coach-panel-head">
              <span>💬 AI Coach · ถามครูเอไอ</span>
              <button type="button" className="coach-close" onClick={() => setCoachOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="coach-messages" ref={coachScrollRef}>
              {coachMessages.length === 0 && !coachSending && (
                <p className="coach-empty">
                  ติดตรงไหนของโจทย์ ถามได้เลยค่ะ — AI Coach จะช่วยตั้งคำถามนำให้คิดเอง ไม่เฉลยตรงๆ
                </p>
              )}
              {coachMessages.map((m, i) => (
                <div key={i} className={`coach-msg ${m.who}`}>
                  {m.text}
                </div>
              ))}
              {coachSending && <div className="coach-msg ai coach-typing">กำลังพิมพ์…</div>}
            </div>
            {coachError && (
              <p className="error" style={{ margin: "0 16px 8px" }}>
                {coachError}
              </p>
            )}
            <div className="coach-input-row">
              <input
                className="coach-input"
                placeholder="พิมพ์คำถามที่นี่..."
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendCoachMessage();
                }}
                disabled={coachSending}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={sendCoachMessage}
                disabled={coachSending || !coachInput.trim()}
              >
                ส่ง
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="coach-fab" onClick={() => setCoachOpen(true)} aria-label="Open AI Coach">
            💬
          </button>
        )}
      </div>
    </>
  );
}
