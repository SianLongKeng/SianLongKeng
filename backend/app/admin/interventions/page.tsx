import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import InterventionsBoard, { type InterventionRow } from "./InterventionsBoard";
import { AdminNavLinks } from "@/app/admin/components";

export const dynamic = "force-dynamic";

export default async function InterventionsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const rows = await query<InterventionRow>(
    `select i.id, i.title, i.description, i.status,
            s.id as student_id, s.first_name, s.last_name, s.nickname,
            mt.label_en as top_mistake_label, mr.pct::text as top_mistake_pct
       from interventions i
       join students s on s.id = i.student_id
       join classes c on c.id = s.class_id
       left join root_cause_analyses rca on rca.id = i.root_cause_id
       left join lateral (
         select mr.pct, mr.mistake_type_id
           from mistake_records mr
          where mr.attempt_id = rca.attempt_id
          order by mr.pct desc
          limit 1
       ) mr on true
       left join mistake_types mt on mt.id = mr.mistake_type_id
      where c.teacher_id = $1 and i.status != 'dismissed'
      order by i.created_at desc`,
    [session.teacherId]
  );

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div
        className="bg-glow"
        style={{
          top: -240,
          left: -160,
          width: 720,
          height: 720,
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(10,8,16,0) 66%)",
        }}
      />
      <div className="page-content" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 20,
            borderBottom: "1px solid var(--border-strong)",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
              Teacher Copilot · Interventions
            </span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Intervention Loop</h2>
          </div>
          <AdminNavLinks current="interventions" />
        </div>

        <InterventionsBoard initialRows={rows} />
      </div>
    </div>
  );
}
