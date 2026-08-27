import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function InsightsLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 90px" }}>
      <div className="page-content" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <SkelLine width={180} height={13} />
        <SkelLine width={260} height={30} />

        <div className="skel-card" style={{ marginTop: 24 }}>
          <SkelLine width={140} height={13} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <SkelLine width={110} height={12} />
              <SkelBlock width="60%" height={10} radius={999} />
              <SkelLine width={30} height={12} />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 24 }} className="insights-loading-grid">
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col} className="skel-card">
              <SkelLine width="50%" height={13} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <SkelBlock height={64} radius={12} width="100%" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .insights-loading-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .insights-loading-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
