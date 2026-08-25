"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/admin/components";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/interventions", label: "Interventions" },
  { href: "/admin/missions/new", label: "Mission Builder" },
  { href: "/admin/school", label: "School Analytics" },
];

function studentLinks(id: string) {
  return [
    { href: `/students/${id}`, label: "Home" },
    { href: `/students/${id}/mission`, label: "Mission" },
    { href: `/students/${id}/diagnosis`, label: "Diagnosis" },
    { href: `/students/${id}/progress`, label: "Progress" },
  ];
}

export default function TopNav() {
  const pathname = usePathname() || "/";

  const isAdmin = pathname.startsWith("/admin");
  const studentMatch = pathname.match(/^\/students\/([^/]+)/);

  const links = isAdmin ? ADMIN_LINKS : studentMatch ? studentLinks(studentMatch[1]) : [];

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
      {isAdmin && (
        <div className="top-nav-logout">
          <LogoutButton />
        </div>
      )}
    </nav>
  );
}
