import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "EduTwin Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
