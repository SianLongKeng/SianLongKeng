// Shared building blocks for route-level loading.tsx skeletons. Plain
// markup only (no client state) so each loading.tsx can stay a server
// component and paint instantly while the real page's data fetch runs.

export function SkelLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <span className="skel skel-line" style={{ width, height }} />;
}

export function SkelBlock({
  width = "100%",
  height = 80,
  radius,
}: {
  width?: string | number;
  height?: number;
  radius?: number;
}) {
  return <span className="skel" style={{ width, height, borderRadius: radius, display: "block" }} />;
}

export function SkelCircle({ size = 40 }: { size?: number }) {
  return <span className="skel skel-circle" style={{ width: size, height: size }} />;
}

export function SkelCard({ children }: { children: React.ReactNode }) {
  return <div className="skel-card">{children}</div>;
}
