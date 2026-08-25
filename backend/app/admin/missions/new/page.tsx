import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import MissionBuilderForm from "./MissionBuilderForm";

export const dynamic = "force-dynamic";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

export default async function NewMissionPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const classes = await query<ClassOption>(
    "select id, name, subject from classes where teacher_id = $1 order by name",
    [session.teacherId]
  );

  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="bg-dotgrid" style={{ opacity: 0.3 }} />
      <div className="page-content" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: "0.72rem", display: "block", marginBottom: 12 }}>
              Teacher Copilot · Mission Builder
            </span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Build &amp; Assign a Mission</h2>
          </div>
          <a className="btn btn-ghost" href="/admin">
            ← Dashboard
          </a>
        </div>
        <MissionBuilderForm classes={classes} />
      </div>
    </div>
  );
}
