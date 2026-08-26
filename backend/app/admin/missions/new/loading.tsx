import { SkelLine, SkelBlock } from "@/app/components/Skeleton";

export default function MissionBuilderLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 900, margin: "0 auto" }}>
        <SkelLine width={200} height={13} />
        <SkelLine width={260} height={30} />

        <div className="skel-card" style={{ marginTop: 24 }}>
          <SkelLine width="30%" height={12} />
          <SkelBlock height={40} radius={10} />
          <SkelLine width="30%" height={12} />
          <SkelBlock height={80} radius={10} />
          <SkelLine width="30%" height={12} />
          <SkelBlock height={40} radius={10} />
        </div>
        <div className="skel-card" style={{ marginTop: 16 }}>
          <SkelLine width="40%" height={12} />
          <SkelBlock height={40} radius={10} />
          <SkelBlock height={40} radius={10} />
        </div>
      </div>
    </div>
  );
}
