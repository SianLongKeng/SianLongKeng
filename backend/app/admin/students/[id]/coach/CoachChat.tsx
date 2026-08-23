"use client";

import { useEffect, useRef, useState } from "react";

interface Turn {
  who: "student" | "ai";
  text: string;
}

const QUICK_CHIPS = ["หนูไม่รู้จะเริ่มตรงไหนค่ะ", "200 ตร.ม. ค่ะ", "60% ค่ะ"];

export default function CoachChat({ studentId, attemptId }: { studentId: string; attemptId: string | null }) {
  const [history, setHistory] = useState<Turn[]>([
    { who: "ai", text: "สวัสดีค่ะ ติดตรงไหนบอกครูได้เลยนะคะ พิมพ์เล่าให้ฟังหน่อยว่าหนูคิดถึงไหนแล้ว" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reflectShown, setReflectShown] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [history, busy]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const nextHistory: Turn[] = [...history, { who: "student", text: trimmed }];
    setHistory(nextHistory);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory, studentId, attemptId: attemptId ?? undefined }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = typeof data.reply === "string" ? data.reply : "ขอโทษค่ะ ลองพิมพ์อีกครั้งนะคะ";
      const afterReply = [...nextHistory, { who: "ai" as const, text: reply }];
      setHistory(afterReply);
      const studentTurns = afterReply.filter((m) => m.who === "student").length;
      if (!reflectShown && studentTurns >= 3) {
        setReflectShown(true);
      }
    } catch {
      setHistory((h) => [...h, { who: "ai", text: "ขอโทษค่ะ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะคะ" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="coach-layout card">
      <div className="chat" ref={chatRef}>
        {history.map((m, i) => (
          <div className={`bubble ${m.who}`} key={i}>
            <span className="who">{m.who === "student" ? "นักเรียน" : "AI Coach"}</span>
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="bubble ai typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>

      <div className={`reflect-prompt${reflectShown ? " show" : ""}`}>
        <b>Reflection Prompt:</b> อะไรทำให้ตอนแรกหนูไม่มั่นใจว่าจะเริ่มตรงไหน?
      </div>

      <div className="coach-quick">
        {QUICK_CHIPS.map((chip) => (
          <button className="quick-chip" type="button" key={chip} onClick={() => sendMessage(chip)}>
            {chip}
          </button>
        ))}
      </div>

      <div className="coach-input-row">
        <input
          type="text"
          className="coach-input"
          placeholder="พิมพ์ข้อความถึง AI Coach…"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />
        <button className="btn btn-primary coach-send" type="button" onClick={() => sendMessage(input)} disabled={busy}>
          Send · ส่ง
        </button>
      </div>
    </div>
  );
}
