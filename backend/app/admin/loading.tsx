import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="screen" style={{ padding: "48px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <SkelLine width={160} height={13} />
        <SkelLine width={280} height={30} />

        <div className="dash-tabs-skel" style={{ display: "flex", gap: 10, margin: "24px 0" }}>
          <SkelBlock width={110} height={38} radius={999} />
          <SkelBlock width={110} height={38} radius={999} />
          <SkelBlock width={130} height={38} radius={999} />
        </div>

        <div className="skel-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
              <SkelBlock width={32} height={32} radius={8} />
              <SkelLine width="18%" />
              <SkelLine width="22%" />
              <SkelLine width="14%" />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 400px) {
          .dash-tabs-skel { max-width: 100%; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
