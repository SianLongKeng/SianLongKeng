import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function MissionLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 22 }}>
          <SkelLine width={180} height={12} />
        </div>
        <SkelLine width="70%" height={16} />

        <div className="skel-card" style={{ marginTop: 18 }}>
          <SkelBlock height={8} radius={999} width="100%" />
          <div style={{ marginTop: 24 }}>
            <SkelLine width="90%" height={20} />
            <SkelLine width="60%" height={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkelBlock key={i} height={52} radius={12} width="100%" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
