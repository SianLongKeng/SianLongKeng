import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function StudentHomeLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 20 }}>
          <div>
            <SkelLine width={260} height={32} />
            <SkelLine width={320} height={14} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <SkelBlock width={90} height={64} radius={14} />
            <SkelBlock width={90} height={64} radius={14} />
            <SkelBlock width={90} height={64} radius={14} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }} className="student-home-layout">
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skel-card" style={{ marginBottom: 12 }}>
                <SkelLine width="30%" height={12} />
                <SkelLine width="60%" height={16} />
              </div>
            ))}
          </div>
          <div className="skel-card">
            <SkelLine width="70%" height={12} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <SkelLine width={100} height={11} />
                <SkelBlock width="50%" height={9} radius={999} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .student-home-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
