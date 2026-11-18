import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Only the store.* subdomain gets rewritten - dashboard.amaraagent.com
  // (and any other host) passes through completely unchanged, so this
  // never affects the existing admin panel at all.
  if (host.startsWith("store.")) {
    const url = request.nextUrl.clone();
    url.pathname = `/store${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next's own internal assets and API routes - only real pages
  // need the subdomain check.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
