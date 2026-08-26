"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function studentLinks(id: string) {
  return [
    { href: `/students/${id}`, label: "Home" },
    { href: `/students/${id}/mission`, label: "Mission" },
    { href: `/students/${id}/diagnosis`, label: "Diagnosis" },
    { href: `/students/${id}/growth-plan`, label: "Growth Plan" },
    { href: `/students/${id}/progress`, label: "Progress" },
  ];
}

export default function TopNav() {
  const pathname = usePathname() || "/";

  const studentMatch = pathname.match(/^\/students\/([^/]+)/);
  const links = studentMatch ? studentLinks(studentMatch[1]) : [];

  return (
    <nav className="top-nav no-print">
      <Link href="/" className="top-nav-wordmark">
        EDUTWIN
      </Link>
      {links.length > 0 && (
        <div className="top-nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`top-nav-link${pathname === l.href ? " active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
