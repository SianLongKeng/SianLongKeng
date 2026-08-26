import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

function DiagCardSkel() {
  return (
    <div className="skel-card">
      <SkelLine width="40%" height={14} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <SkelLine width={100} height={11} />
          <SkelBlock width="55%" height={9} radius={999} />
          <SkelLine width={28} height={11} />
        </div>
      ))}
    </div>
  );
}

export default function DiagnosisLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 90px" }}>
      <div className="page-content" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <SkelLine width={200} height={13} />
        <SkelLine width={320} height={30} />

        <div className="skel-card" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <SkelBlock width={48} height={48} radius={999} />
          <div style={{ flex: 1 }}>
            <SkelLine width="30%" height={16} />
            <SkelLine width="20%" height={11} />
          </div>
          <SkelLine width={70} height={30} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <DiagCardSkel />
          <DiagCardSkel />
        </div>
      </div>
    </div>
  );
}
