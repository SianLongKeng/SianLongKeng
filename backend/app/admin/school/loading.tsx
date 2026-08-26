import { SkelLine } from "@/app/components/Skeleton";

function KpiCardSkel() {
  return (
    <div className="kpi-card">
      <SkelLine width="60%" height={11} />
      <SkelLine width="35%" height={30} />
      <SkelLine width="80%" height={11} />
    </div>
  );
}

export default function SchoolAnalyticsLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <SkelLine width={160} height={13} />
        <SkelLine width={280} height={30} />

        {["30%", "24%", "22%"].map((w, section) => (
          <div key={section}>
            <div style={{ margin: "30px 0 12px" }}>
              <SkelLine width={w} height={12} />
            </div>
            <div className="kpi-grid">
              {Array.from({ length: section === 0 ? 5 : 3 }).map((_, i) => (
                <KpiCardSkel key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
