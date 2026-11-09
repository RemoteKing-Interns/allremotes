import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session-token";

const OPEN = new Set(["/api/admin/invite/accept", "/api/admin/2fa"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN.has(pathname)) return NextResponse.next();
  // Invite token validation (GET ?token=) is needed by the accept-invite page;
  // POST/DELETE and bare GET (which lists tokens) stay gated.
  if (pathname === "/api/admin/invite" && req.method === "GET" && req.nextUrl.searchParams.get("token")) {
    return NextResponse.next();
  }
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
