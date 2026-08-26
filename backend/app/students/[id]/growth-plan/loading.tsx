import { SkelLine, SkelCircle } from "@/app/components/Skeleton";

export default function GrowthPlanLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 760, margin: "0 auto" }}>
        <SkelLine width={140} height={13} />
        <SkelLine width={340} height={30} />
        <SkelLine width="80%" height={14} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel-card" style={{ display: "flex", gap: 16 }}>
              <SkelCircle size={32} />
              <div style={{ flex: 1 }}>
                <SkelLine width="40%" height={15} />
                <SkelLine width="90%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
