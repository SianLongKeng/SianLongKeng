import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Page routes only. API routes (/api/students/*) do their own auth check
// and return a JSON 401 — a redirect response there would break fetch()
// callers expecting JSON, since fetch follows redirects by default.
export const config = {
  matcher: ["/admin/:path*"],
};
