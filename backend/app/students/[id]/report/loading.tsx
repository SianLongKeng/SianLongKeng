import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function ReportLoading() {
  return (
    <div className="screen" style={{ padding: "48px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 780 }}>
        <div className="skel-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <SkelLine width={160} height={12} />
            <SkelLine width={110} height={12} />
          </div>
          <SkelLine width="40%" height={20} />
          <SkelLine width="55%" height={13} />

          <div style={{ marginTop: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <SkelLine width={130} height={11} />
                <SkelBlock width="55%" height={9} radius={999} />
                <SkelLine width={28} height={11} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
