import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl;

  // Support domain
  if (host === "jbc-support.vercel.app") {
    url.pathname = `/support${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Distributor domain
  if (host === "distributor.jimmyboss.com") {
    url.pathname = `/distributor${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Launchgate domain
  if (host === "launchgate.jimmyboss.com") {
    url.pathname = `/launchgate${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};