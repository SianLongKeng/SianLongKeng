import Link from "next/link";

function helixPaths() {
  const w = 300;
  const h = 320;
  const turns = 3;
  const steps = 60;
  const pathA: [number, number][] = [];
  const pathB: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 20 + t * (h - 40);
    const x1 = w / 2 + Math.sin(t * turns * 2 * Math.PI) * 62;
    const x2 = w / 2 - Math.sin(t * turns * 2 * Math.PI) * 62;
    pathA.push([x1, y]);
    pathB.push([x2, y]);
  }
  const toPath = (pts: [number, number][]) =>
    "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const rungs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 4; i < pathA.length; i += 6) {
    rungs.push({ x1: pathA[i][0], y1: pathA[i][1], x2: pathB[i][0], y2: pathB[i][1] });
  }
  return { pathA: toPath(pathA), pathB: toPath(pathB), rungs };
}

const KPI_GROUPS = [
  {
    key: "student",
    title: "Student",
    items: [
      { label: "Student Learning Gap", value: "-32%", pct: 68, target: "Target: ลดลง 30–40% ภายใน 1 ภาคเรียน" },
      { label: "Completion Rate", value: "87%", pct: 87, target: "Target: มากกว่า 85%" },
      { label: "Active Learning Participation", value: "+26%", pct: 63, target: "Target: เพิ่มขึ้นจาก Baseline" },
      { label: "Reflection Quality Index", value: "+41%", pct: 55, target: "Target: เพิ่มขึ้นจาก Baseline" },
    ],
  },
  {
    key: "teacher",
    title: "Teacher",
    items: [
      { label: "Teacher Analysis Time", value: "-58%", pct: 58, target: "Target: ลดเวลาวิเคราะห์รายบุคคล" },
      {
        label: "Learning Gap Identification Accuracy",
        value: "88%",
        pct: 88,
        target: "Target: > 85% เทียบกับการประเมินของครู",
      },
      { label: "Interventions Issued / เดือน", value: "54", pct: 68, target: "Target: เพิ่มขึ้นจาก Baseline (ครูออกแบบเอง)" },
    ],
  },
  {
    key: "system",
    title: "System",
    items: [
      { label: "AI Diagnosis Accuracy", value: "91%", pct: 91, target: "Target: > 90% (Prototype Eval)" },
      { label: "Recommendation Acceptance Rate", value: "76%", pct: 76, target: "Target: > 70% ครูตอบรับคำแนะนำของ AI" },
      { label: "Student Retention", value: "92%", pct: 92, target: "Target: มากกว่า 90% ระหว่าง Pilot" },
    ],
  },
];

const PITCH_SEGMENTS = [
  {
    time: "0:00–0:25",
    label: "Hook",
    text: 'ถ้านักเรียนสองคนได้คะแนนเท่ากัน 6 เต็ม 10 เราจะสรุปได้ไหมว่าเขาเรียนรู้เหมือนกัน? คำตอบคือไม่ คนหนึ่งอาจจำ Concept ได้แต่ประยุกต์ใช้ไม่ได้ อีกคนอาจ Concept ยังไม่แม่นแต่มีทักษะการคิดวิเคราะห์ที่ดี แต่ในห้องเรียนทั้งสองคนอาจถูกมองว่าเป็นเพียง "เด็กที่ได้ 6 คะแนน" เหมือนกัน',
  },
  {
    time: "0:25–0:50",
    label: "Problem",
    text: "ครูในห้องเรียนต้องดูแลนักเรียนจำนวนมาก และข้อมูลที่มีมักบอกเพียงผลลัพธ์ เช่น คะแนนหรือข้อถูกผิด แต่สิ่งที่หายไปคือกระบวนการเรียนรู้ เราจึงตั้งคำถามว่า ถ้าเราไม่ได้แค่รู้ว่าเด็กตอบผิด แต่รู้ว่าเขาผิดเพราะอะไร จะเกิดอะไรขึ้น?",
  },
  {
    time: "0:50–1:20",
    label: "Solution",
    text: "นี่คือ EduTwin — AI Learning Twin ระบบที่สร้าง Digital Twin ของการเรียนรู้ของนักเรียน EduTwin วิเคราะห์ทั้งคำตอบ วิธีคิด การขอ Hint การอธิบายเหตุผล และกิจกรรมที่นักเรียนทำ แล้วเปลี่ยนข้อมูลเหล่านี้เป็น Learning DNA เพื่อให้เราเห็นว่าเด็กเก่งอะไร ติดตรงไหน และควรพัฒนาอย่างไร",
  },
  {
    time: "1:20–1:50",
    label: "Killer Feature",
    text: "สิ่งที่แตกต่างที่สุดคือ Mistake DNA เพราะ EduTwin ไม่ได้บอกแค่ว่าข้อนี้ผิด แต่บอกว่าผิดเพราะ Concept Gap, อ่านโจทย์ หรือไม่สามารถนำความรู้ไปประยุกต์ใช้ จากนั้น AI จะสร้าง Learning Path ที่เหมาะกับนักเรียนแต่ละคน",
  },
  {
    time: "1:50–2:15",
    label: "Teacher",
    text: "สำหรับครู EduTwin เปลี่ยนข้อมูลของนักเรียนเป็น Teacher Copilot ครูเห็นได้ทันทีว่าใครต้องทบทวน ใครต้องฝึกเพิ่ม และใครพร้อมสำหรับ Challenge AI ยังช่วยจัดกลุ่มนักเรียนและแนะนำกิจกรรมที่เหมาะสม",
  },
  {
    time: "2:15–2:35",
    label: "Technology & Feasibility",
    text: "เบื้องหลัง EduTwin ใช้ Web Technology, Learning Analytics และ LLM โดยมี AI Analysis Engine ทำหน้าที่วิเคราะห์ Learning Pattern และ Mistake Pattern เราสามารถเริ่มจากหนึ่งวิชา หนึ่งบทเรียน และหนึ่งห้องเรียนก่อนขยายไปยังหลายวิชาและหลายโรงเรียน",
  },
  {
    time: "2:35–2:50",
    label: "Impact",
    text: 'เราต้องการเปลี่ยนการศึกษา จากการถามว่า "เด็กได้กี่คะแนน?" ไปสู่คำถามว่า "เด็กกำลังเรียนรู้อย่างไร และเราจะช่วยเขาได้อย่างไร?"',
  },
  {
    time: "2:50–3:00",
    label: "Closing",
    text: "EduTwin — From Scores to Learning DNA เพราะเราเชื่อว่า Same Score ≠ Same Learning และเด็กทุกคนควรมีเส้นทางการเรียนรู้ที่เป็นของตัวเอง",
  },
];

const ROADMAP_PHASES = [
  { phase: "Phase 1 — Prototype", timeframe: "เดือน 1", goal: "Student App, Mission, Learning DNA, Mistake DNA; Prototype End-to-End" },
  { phase: "Phase 2 — Pilot", timeframe: "เดือน 2–3", goal: "ทดลองกับ 1 โรงเรียน 1–2 ห้องเรียน 1 วิชา และเก็บ Feedback" },
  { phase: "Phase 3 — Improve", timeframe: "เดือน 4–6", goal: "Teacher Copilot, Adaptive Mission, Learning Analytics" },
  { phase: "Phase 4 — Scale", timeframe: "เดือน 7–12", goal: "ขยายหลายวิชา หลายระดับชั้น และหลายโรงเรียน" },
];

const DECK_ITEMS = [
  { num: "01", title: "Cover", desc: "— MINDMESH × EduTwin" },
  { num: "02", title: "Problem", desc: "— Same Score ≠ Same Learning" },
  { num: "03", title: "Why Now?", desc: "— AI + Learning Analytics + Digital Education" },
  { num: "04", title: "Solution", desc: "— EduTwin" },
  { num: "05", title: "How It Works", desc: "— Flowchart" },
  { num: "06", title: "Product Demo", desc: "— Learning DNA + Mistake DNA" },
  { num: "07", title: "Teacher Copilot", desc: "— Data → Action" },
  { num: "08", title: "Impact", desc: "— Student + Teacher + School" },
  { num: "09", title: "Business Model Canvas", desc: "" },
  { num: "10", title: "Roadmap + Closing", desc: "" },
];

export default function Home() {
  const { pathA, pathB, rungs } = helixPaths();

  return (
    <>
      <nav className="landing-nav">
        <span className="brand-mark">EduTwin</span>
        <div className="landing-nav-links">
          <Link href="/login" className="btn btn-ghost">
            Log In · เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn btn-primary">
            Sign Up · สมัครใช้งาน
          </Link>
        </div>
      </nav>

      <div className="landing-wrap">
        {/* ============ HERO ============ */}
        <div className="hero">
          <div>
            <span className="eyebrow">EduTwin — AI Learning Twin Platform</span>
            <h1>
              From Scores to
              <br />
              Learning DNA.
            </h1>
            <span className="same-score">&ldquo;Same Score ≠ Same Learning.&rdquo;</span>
            <p className="lede">
              EduTwin สร้าง Digital Learning Twin ของนักเรียนจากพฤติกรรมการเรียนรู้จริง — คำตอบ วิธีคิด การขอ Hint
              การอธิบายเหตุผล และ Reflection — แล้วเปลี่ยนข้อมูลเหล่านี้เป็น Learning DNA
              เพื่อช่วยนักเรียนและครูเข้าใจว่า &ldquo;เรียนรู้อย่างไร&rdquo; ไม่ใช่แค่ดูคะแนน
            </p>
            <div className="cta-row" style={{ marginTop: 26 }}>
              <Link href="/register" className="btn btn-primary">
                Get Started · เริ่มใช้งาน
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Log In · เข้าสู่ระบบ
              </Link>
            </div>
            <div className="flow-row">
              <span className="flow-step">LEARN</span>
              <span className="flow-arrow">→</span>
              <span className="flow-step">DIAGNOSE</span>
              <span className="flow-arrow">→</span>
              <span className="flow-step">ADAPT</span>
            </div>
          </div>
          <div className="helix-wrap" aria-hidden="true">
            <svg viewBox="0 0 300 320" width="100%" height="100%" style={{ overflow: "visible" }}>
              {rungs.map((r, i) => (
                <line
                  key={i}
                  x1={r.x1.toFixed(1)}
                  y1={r.y1.toFixed(1)}
                  x2={r.x2.toFixed(1)}
                  y2={r.y2.toFixed(1)}
                  stroke="var(--border-strong)"
                  strokeWidth="1.5"
                />
              ))}
              <path d={pathA} fill="none" stroke="var(--cat-1)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <path d={pathB} fill="none" stroke="var(--cat-2)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            </svg>
          </div>
        </div>

        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Same Score ≠ Same Learning.</h2>
          <p className="lede">
            นักเรียนที่ได้คะแนนเท่ากันอาจมี Learning Gap คนละแบบ — ระบบทั่วไปตอบแค่ &ldquo;ได้กี่คะแนน&rdquo; แต่
            EduTwin อธิบายว่า &ldquo;ผิดเพราะอะไร&rdquo;
          </p>
        </div>
        <div className="value-grid">
          <div className="value-cell">
            <span className="value-num">01</span>
            <h3>Learning DNA</h3>
            <p>Profile รายบุคคล — Concept, Application, Critical Thinking, Problem Solving, Creativity, Collaboration, Confidence</p>
          </div>
          <div className="value-cell">
            <span className="value-num">02</span>
            <h3>Mistake DNA</h3>
            <p>จำแนก Root Cause ของความผิดพลาด แล้วเชื่อมไปยัง Intervention ที่ตรงจุด ไม่ใช่การเฉลยซ้ำ</p>
          </div>
          <div className="value-cell">
            <span className="value-num">03</span>
            <h3>Teacher Copilot</h3>
            <p>เปลี่ยนข้อมูลนักเรียนทั้งห้องเป็น Action — จัดกลุ่มตาม Learning Gap และแนะนำ Intervention</p>
          </div>
        </div>

        {/* ============ IMPACT ============ */}
        <div className="section-head">
          <span className="eyebrow">Impact Dashboard</span>
          <h2>Learning Outcome Goals · เป้าหมายผลลัพธ์การเรียนรู้</h2>
        </div>
        <div className="sim-banner">
          <span>⚠</span>
          <span>
            <b>Prototype Simulation:</b> ตัวเลขด้านล่างเป็นเป้าหมายจำลองสำหรับสาธิตแนวคิด ยังไม่ใช่ผลการทดลองจริงจากโรงเรียน
          </span>
        </div>
        {KPI_GROUPS.map((group) => (
          <div className="kpi-group" key={group.key}>
            <div className="kpi-group-title">{group.title}</div>
            <div className="kpi-grid">
              {group.items.map((k) => (
                <div className="card kpi-tile" key={k.label}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-bar">
                    <div className="kpi-bar-fill" style={{ width: `${k.pct}%` }} />
                  </div>
                  <div className="kpi-target">{k.target}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ============ BUSINESS MODEL ============ */}
        <div className="section-head">
          <span className="eyebrow">Business Model Canvas</span>
          <h2>EduTwin&apos;s Business Model · โมเดลธุรกิจของ EduTwin</h2>
        </div>
        <div className="bmc-grid">
          <div className="bmc-cell bmc-partners">
            <h4>Key Partners</h4>
            <ul>
              <li>โรงเรียน</li>
              <li>ครู</li>
              <li>EdTech Partner</li>
              <li>ผู้เชี่ยวชาญการศึกษา</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-activities">
            <h4>Key Activities</h4>
            <ul>
              <li>AI Analysis</li>
              <li>Platform Development</li>
              <li>Content Development</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-resources">
            <h4>Key Resources</h4>
            <ul>
              <li>AI Model</li>
              <li>Learning Data</li>
              <li>Platform</li>
              <li>Education Content</li>
            </ul>
          </div>
          <div className="bmc-cell value-prop bmc-value">
            <h4>Value Proposition</h4>
            <ul>
              <li>วิเคราะห์ &quot;วิธีเรียนรู้&quot; ไม่ใช่แค่คะแนน</li>
              <li>Learning DNA + Mistake DNA เฉพาะบุคคล</li>
              <li>Intervention ที่ตรงจุด ไม่ใช่การเฉลยซ้ำ</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-relationships">
            <h4>Customer Relationships</h4>
            <ul>
              <li>Dashboard</li>
              <li>AI Assistant</li>
              <li>Support</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-channels">
            <h4>Channels</h4>
            <ul>
              <li>โรงเรียน</li>
              <li>EdTech Partnership</li>
              <li>Demo / Workshop</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-segments">
            <h4>Customer Segments</h4>
            <ul>
              <li>โรงเรียน</li>
              <li>ครู</li>
              <li>นักเรียน</li>
              <li>หน่วยงานการศึกษา</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-cost">
            <h4>Cost Structure</h4>
            <ul>
              <li>AI API</li>
              <li>Cloud</li>
              <li>Development</li>
              <li>Maintenance</li>
            </ul>
          </div>
          <div className="bmc-cell bmc-revenue">
            <h4>Revenue Streams</h4>
            <ul>
              <li>School Subscription</li>
              <li>Premium Analytics</li>
              <li>API</li>
            </ul>
          </div>
        </div>

        {/* ============ PRICING ============ */}
        <div className="section-head">
          <span className="eyebrow">Revenue Model</span>
          <h2>3-Tier Pricing Plan · แผนราคา 3 ระดับ</h2>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-tier">Free</div>
            <div className="price-name">Student Trial</div>
            <ul className="price-features">
              <li>Student Learning DNA สำหรับทดลอง</li>
            </ul>
          </div>
          <div className="price-card featured">
            <div className="price-tier">แนะนำ</div>
            <div className="price-name">School Plan</div>
            <ul className="price-features">
              <li>Teacher Dashboard</li>
              <li>AI Analysis</li>
              <li>Class Analytics</li>
              <li>Intervention Recommendation</li>
            </ul>
          </div>
          <div className="price-card">
            <div className="price-tier">Custom</div>
            <div className="price-name">Enterprise</div>
            <ul className="price-features">
              <li>Advanced Analytics</li>
              <li>API Access</li>
              <li>Custom Integration</li>
            </ul>
          </div>
        </div>

        {/* ============ IMPLEMENTATION ROADMAP ============ */}
        <div className="section-head">
          <span className="eyebrow">Implementation Roadmap</span>
          <h2>4-Phase Rollout Plan · แผนดำเนินงาน 4 ระยะ</h2>
        </div>
        <div className="table-wrap">
          <table className="tech-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Timeframe</th>
                <th>Goal</th>
              </tr>
            </thead>
            <tbody>
              {ROADMAP_PHASES.map((r) => (
                <tr key={r.phase}>
                  <td>{r.phase}</td>
                  <td>{r.timeframe}</td>
                  <td>{r.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ============ COMPETITIVE POSITIONING ============ */}
        <div className="section-head">
          <span className="eyebrow">Competitive Positioning</span>
          <h2>How Is This Different From Typical Systems? · ต่างจากระบบทั่วไปอย่างไร</h2>
        </div>
        <div className="table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Typical System · ระบบทั่วไป</th>
                <th className="edutwin-col">EduTwin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>วัดคะแนน</td>
                <td className="edutwin-col">วิเคราะห์กระบวนการเรียนรู้</td>
              </tr>
              <tr>
                <td>บอกถูก / ผิด</td>
                <td className="edutwin-col">วิเคราะห์ Root Cause</td>
              </tr>
              <tr>
                <td>เนื้อหาเดียวกัน</td>
                <td className="edutwin-col">Adaptive Learning Path</td>
              </tr>
              <tr>
                <td>Dashboard รายงาน</td>
                <td className="edutwin-col">Teacher Copilot ที่แนะนำ Action</td>
              </tr>
              <tr>
                <td>AI ตอบคำถาม</td>
                <td className="edutwin-col">AI Coach ที่กระตุ้นการคิด</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ============ PRODUCT FLOW ============ */}
        <div className="section-head">
          <span className="eyebrow">Product Flow</span>
          <h2>How Student Data Becomes Learning DNA · ข้อมูลนักเรียนไหลไปเป็น Learning DNA ได้อย่างไร</h2>
        </div>
        <figure className="flow-figure">
          <div className="flow-scroll">
            <svg
              viewBox="0 0 1020 260"
              role="img"
              aria-label="Product flow: Student generates Learning Actions, processed by the Data Engine and AI Learning Analysis into Learning DNA and Mistake DNA, which drive AI Recommendation into Student Coach and Teacher Copilot, producing Better Learning Outcome."
            >
              <defs>
                <marker id="flow-arrow" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
                  <polygon points="0,0 8,3.5 0,7" fill="var(--ink-muted)" />
                </marker>
              </defs>

              <line x1="240" y1="62" x2="266" y2="62" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="490" y1="62" x2="516" y2="62" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="740" y1="62" x2="766" y2="62" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="880" y1="94" x2="880" y2="166" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="770" y1="202" x2="744" y2="202" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="520" y1="202" x2="494" y2="202" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />
              <line x1="270" y1="202" x2="244" y2="202" stroke="var(--ink-muted)" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />

              <rect x="20" y="30" width="220" height="64" rx="10" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="32" y="46" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--ink-muted)">01</text>
              <text x="130" y="68" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Student</text>

              <rect x="270" y="30" width="220" height="64" rx="10" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="282" y="46" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--ink-muted)">02</text>
              <text x="380" y="68" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Learning Actions</text>

              <rect x="520" y="30" width="220" height="64" rx="10" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="532" y="46" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--ink-muted)">03</text>
              <text x="630" y="68" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Data Engine</text>

              <rect x="770" y="30" width="220" height="64" rx="10" fill="var(--accent-wash)" stroke="var(--accent)" strokeWidth="1.5" />
              <text x="782" y="46" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--accent-strong)">04</text>
              <text x="880" y="59" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">AI Learning</text>
              <text x="880" y="76" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Analysis</text>

              <rect x="770" y="170" width="220" height="64" rx="10" fill="var(--accent-wash)" stroke="var(--accent)" strokeWidth="1.5" />
              <text x="782" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--accent-strong)">05</text>
              <text x="880" y="199" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Learning DNA +</text>
              <text x="880" y="216" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Mistake DNA</text>

              <rect x="520" y="170" width="220" height="64" rx="10" fill="var(--accent-wash)" stroke="var(--accent)" strokeWidth="1.5" />
              <text x="532" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--accent-strong)">06</text>
              <text x="630" y="199" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">AI</text>
              <text x="630" y="216" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Recommendation</text>

              <rect x="270" y="170" width="220" height="64" rx="10" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="282" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--ink-muted)">07</text>
              <text x="380" y="199" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Student Coach /</text>
              <text x="380" y="216" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Teacher Copilot</text>

              <rect x="20" y="170" width="220" height="64" rx="10" fill="var(--good-wash)" stroke="var(--good)" strokeWidth="1.5" />
              <text x="32" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="var(--good)">08</text>
              <text x="130" y="199" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Better Learning</text>
              <text x="130" y="216" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fill="var(--ink)">Outcome</text>
            </svg>
          </div>
          <figcaption className="flow-caption">
            พฤติกรรมของนักเรียน (คำตอบ, Hint, เหตุผล, Reflection) ไหลผ่าน Data Engine และ AI Learning Analysis กลายเป็น
            Learning DNA + Mistake DNA จากนั้น AI สร้างคำแนะนำที่ส่งต่อให้ทั้งนักเรียน (ผ่าน Coach) และครู (ผ่าน Copilot)
            เพื่อผลลัพธ์การเรียนรู้ที่ดีขึ้น
          </figcaption>
        </figure>

        {/* ============ ARCHITECTURE ============ */}
        <div className="section-head">
          <span className="eyebrow">Technology &amp; Architecture</span>
          <h2>Technology Stack · สแต็กเทคโนโลยี</h2>
        </div>
        <div className="table-wrap">
          <table className="tech-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technology / Approach</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend</td>
                <td>Next.js, Tailwind CSS, Recharts / Chart.js</td>
              </tr>
              <tr>
                <td>Backend</td>
                <td>Python FastAPI, PostgreSQL</td>
              </tr>
              <tr>
                <td>AI Layer</td>
                <td>LLM API, Prompt Engineering, Structured Output, Embedding / Vector Search</td>
              </tr>
              <tr>
                <td>Analytics</td>
                <td>Python, Pandas, Scoring Engine, Rule-based + AI Classification</td>
              </tr>
            </tbody>
          </table>
          <div className="arch-flow">
            Student → Next.js Web App → FastAPI → Learning Data → Analytics Engine → LLM → Learning DNA Engine →
            Student App / Teacher Dashboard
          </div>
        </div>

        {/* ============ PITCH SCRIPT ============ */}
        <div className="section-head">
          <span className="eyebrow">Pitch Script — 3 Minutes</span>
          <h2>Pitch Script · สคริปต์นำเสนอ</h2>
        </div>
        <div className="pitch-timeline">
          {PITCH_SEGMENTS.map((seg) => (
            <div className="pitch-seg" key={seg.label}>
              <div className="pitch-time">{seg.time}</div>
              <div>
                <div className="pitch-label">{seg.label}</div>
                <div className="pitch-text">{seg.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ============ PITCH DECK OUTLINE ============ */}
        <div className="section-head">
          <span className="eyebrow">Pitch Deck Structure</span>
          <h2>10-Slide Deck Outline · โครงสไลด์ 10 หน้า</h2>
        </div>
        <div className="deck-list">
          {DECK_ITEMS.map((item) => (
            <div className="deck-item" key={item.num}>
              <span className="deck-num">{item.num}</span>
              <span className="deck-title">{item.title}</span>
              <span className="deck-desc">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="deck-note">
          ⚠ นี่คือโครงร่างสไลด์เท่านั้น ยังไม่ใช่ไฟล์ .pptx จริงที่แก้ไขได้ — ถ้าต้องการไฟล์สไลด์จริงสำหรับพรีเซนต์ บอกได้เลย
          จะสร้างเป็นไฟล์ต่างหากให้
        </div>

        <div className="closing-line">
          <h2>EduTwin</h2>
          <span>From Scores to Learning DNA · Same Score ≠ Same Learning</span>
        </div>

        <div className="footer-tag">
          <span>EduTwin — From Scores to Learning DNA.</span>
          <span>MINDMESH · Hackathon 2026 Prototype</span>
        </div>
      </div>
    </>
  );
}
