import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { bucketFor } from "@/lib/grouping";

export const dynamic = "force-dynamic";

interface StudentGapRow {
  student_id: string;
  class_id: string;
  class_name: string;
  completed_at: string | null;
  top_mistake_code: string | null;
  top_mistake_pct: string | null;
}

interface InterventionCountRow {
  status: string;
  n: string;
}

interface KpiCountRow {
  students_active: string;
  missions_completed: string;
}

const GAP_COLORS: Record<string, string> = {
  concept_gap: "var(--accent)",
  application_gap: "#eb6834",
  mastery: "#1baf7a",
};

const GAP_LABELS: Record<string, string> = {
  concept_gap: "Concept Gap",
  application_gap: "Application Gap",
  mastery: "Mastery",
};

export default async function SchoolAnalyticsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const [gapRows, interventionRows, kpiRows] = await Promise.all([
    query<StudentGapRow>(
      `select s.id as student_id, c.id as class_id, c.name as class_name, att.completed_at,
              mt.code as top_mistake_code, mr.pct::text as top_mistake_pct
         from students s
         join classes c on c.id = s.class_id
         left join lateral (
           select id, completed_at from mission_attempts
            where student_id = s.id and completed_at is not null
            order by completed_at desc limit 1
         ) att on true
         left join lateral (
           select mistake_type_id, pct from mistake_records where attempt_id = att.id order by pct desc limit 1
         ) mr on true
         left join mistake_types mt on mt.id = mr.mistake_type_id
        where c.teacher_id = $1`,
      [session.teacherId]
    ),
    query<InterventionCountRow>(
      `select i.status, count(*)::text as n
         from interventions i
         join students s on s.id = i.student_id
         join classes c on c.id = s.class_id
        where c.teacher_id = $1
        group by i.status`,
      [session.teacherId]
    ),
    query<KpiCountRow>(
      `select
         (select count(*) from students s join classes c on c.id = s.class_id where c.teacher_id = $1)::text as students_active,
         (select count(*) from mission_attempts att join students s on s.id = att.student_id join classes c on c.id = s.class_id
           where c.teacher_id = $1 and att.completed_at is not null)::text as missions_completed`,
      [session.teacherId]
    ),
  ]);

  const buckets = gapRows.map((r) => ({ ...r, bucket: bucketFor(r) }));
  const classified = buckets.filter((b) => b.bucket !== "pending");
  const masteryCount = classified.filter((b) => b.bucket === "mastery").length;
  const avgMastery = classified.length > 0 ? Math.round((masteryCount / classified.length) * 100) : 0;

  const interventionTotal = interventionRows.reduce((sum, r) => sum + Number(r.n), 0);
  const completedCount = Number(interventionRows.find((r) => r.status === "completed")?.n ?? 0);
  const interventionsClosedPct = interventionTotal > 0 ? Math.round((completedCount / interventionTotal) * 100) : 0;

  const classMap = new Map<string, { name: string; concept: number; application: number; mastery: number; total: number }>();
  for (const b of classified) {
    if (!classMap.has(b.class_id)) {
      classMap.set(b.class_id, { name: b.class_name, concept: 0, application: 0, mastery: 0, total: 0 });
    }
    const entry = classMap.get(b.class_id)!;
    entry.total += 1;
    if (b.bucket === "concept_gap") entry.concept += 1;
    else if (b.bucket === "application_gap") entry.application += 1;
    else if (b.bucket === "mastery") entry.mastery += 1;
  }
  const classGaps = Array.from(classMap.values()).map((c) => {
    const topGap = c.concept >= c.application ? (c.concept > 0 ? "concept_gap" : null) : "application_gap";
    return { ...c, topGap };
  });

  const kpi = kpiRows[0];

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -220,
          left: -160,
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
              School Analytics
            </span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>ภาพรวมทุกห้องที่คุณสอน</h2>
          </div>
          <a className="btn btn-ghost" href="/admin">
            ← Dashboard
          </a>
        </div>

        <div className="kpi-grid" style={{ marginBottom: 28 }}>
          <div className="kpi-card accent">
            <span className="kpi-label mono">STUDENTS · นักเรียน</span>
            <div className="kpi-value mono">{kpi?.students_active ?? 0}</div>
            <div className="kpi-sub">รวมทุกห้องที่คุณสอน</div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label mono">MISSIONS COMPLETED</span>
            <div className="kpi-value mono">{kpi?.missions_completed ?? 0}</div>
            <div className="kpi-sub">มิชชันที่ทำเสร็จแล้ว</div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label mono">AVG MASTERY</span>
            <div className="kpi-value mono">{avgMastery}%</div>
            <div className="kpi-sub">นักเรียนที่อยู่กลุ่ม Mastery</div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label mono">INTERVENTIONS CLOSED</span>
            <div className="kpi-value mono">{interventionsClosedPct}%</div>
            <div className="kpi-sub">แผนช่วยเหลือที่ปิดงานแล้ว</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Learning Gap แยกตามห้อง</h3>
          {classGaps.length === 0 ? (
            <p className="lede">ยังไม่มีนักเรียนที่ทำมิชชันเสร็จ</p>
          ) : (
            classGaps.map((c) => (
              <div className="gap-table-row" key={c.name}>
                <span>{c.name}</span>
                <span className="gap-stack">
                  {c.concept > 0 && <span style={{ width: `${(c.concept / c.total) * 100}%`, background: GAP_COLORS.concept_gap }} />}
                  {c.application > 0 && (
                    <span style={{ width: `${(c.application / c.total) * 100}%`, background: GAP_COLORS.application_gap }} />
                  )}
                  {c.mastery > 0 && <span style={{ width: `${(c.mastery / c.total) * 100}%`, background: GAP_COLORS.mastery }} />}
                </span>
                <span className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                  {c.topGap ? GAP_LABELS[c.topGap] : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
