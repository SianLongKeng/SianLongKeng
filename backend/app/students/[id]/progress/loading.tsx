import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function ProgressLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <SkelLine width={100} height={13} />
        <SkelLine width={260} height={30} />

        <div style={{ display: "flex", gap: 10, margin: "18px 0" }}>
          <SkelBlock width={120} height={34} radius={999} />
          <SkelBlock width={120} height={34} radius={999} />
        </div>

        <div className="skel-card">
          <SkelLine width="20%" height={12} />
          <SkelBlock height={220} radius={12} />
        </div>
        <div className="skel-card" style={{ marginTop: 16 }}>
          <SkelLine width="30%" height={12} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <SkelLine width={130} height={11} />
              <SkelBlock width="50%" height={9} radius={999} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
