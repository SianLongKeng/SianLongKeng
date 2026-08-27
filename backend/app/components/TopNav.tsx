"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavLinks } from "@/app/admin/components";

function studentLinks(id: string) {
  return [
    { href: `/students/${id}`, label: "Home" },
    { href: `/students/${id}/mission`, label: "Mission" },
    { href: `/students/${id}/diagnosis`, label: "Diagnosis" },
    { href: `/students/${id}/growth-plan`, label: "Growth Plan" },
    { href: `/students/${id}/progress`, label: "Progress" },
  ];
}

// isTeacherSession comes from the server (layout.tsx reads the httpOnly
// teacher cookie there — client JS can't) so a teacher clicking into a
// student's Report/Diagnosis/etc. from the Roster keeps seeing their own
// teacher nav instead of silently switching to that student's nav, which
// read like the page had dropped them into the student's own account.
export default function TopNav({ isTeacherSession }: { isTeacherSession: boolean }) {
  const pathname = usePathname() || "/";
  const studentMatch = pathname.match(/^\/students\/([^/]+)/);

  return (
    <nav className="top-nav no-print">
      <Link href="/" className="top-nav-wordmark">
        EDUTWIN
      </Link>
      <div className="top-nav-scroll">
        {studentMatch && isTeacherSession && (
          <>
            <span className="top-nav-viewing-badge mono">TEACHER VIEW</span>
            <AdminNavLinks />
          </>
        )}
        {studentMatch && !isTeacherSession && (
          <div className="top-nav-links">
            {studentLinks(studentMatch[1]).map((l) => (
              <Link key={l.href} href={l.href} className={`top-nav-link${pathname === l.href ? " active" : ""}`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
