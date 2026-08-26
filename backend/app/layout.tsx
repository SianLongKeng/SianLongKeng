import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import TopNav from "./components/TopNav";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const metadata = {
  title: "EduTwin Admin",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Read server-side (the cookie is httpOnly, invisible to client JS) so
  // TopNav can tell a teacher browsing a student's pages apart from the
  // student themself, instead of guessing purely from the URL.
  const token = cookies().get(SESSION_COOKIE)?.value;
  const isTeacherSession = token ? !!(await verifySessionToken(token)) : false;

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
        <TopNav isTeacherSession={isTeacherSession} />
        {children}
      </body>
    </html>
  );
}
