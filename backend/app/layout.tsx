import type { ReactNode } from "react";
import "./globals.css";
import TopNav from "./components/TopNav";

export const metadata = {
  title: "EduTwin Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;600;700&display=swap"
        />
      </head>
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
