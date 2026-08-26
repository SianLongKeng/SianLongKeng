import { SkelLine } from "@/app/components/Skeleton";

export default function InterventionsLoading() {
  return (
    <div className="screen" style={{ padding: "52px 48px 80px" }}>
      <div className="page-content" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SkelLine width={200} height={13} />
        <SkelLine width={260} height={30} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 28 }}>
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col}>
              <SkelLine width="60%" height={13} />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skel-card" style={{ marginTop: 12 }}>
                  <SkelLine width="70%" height={16} />
                  <SkelLine width="90%" />
                  <SkelLine width="40%" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
