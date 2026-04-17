import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/auth-session";

const PUBLIC_PATHS = ["/login", "/auth/sign-in"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isSessionApi = pathname.startsWith("/api/session");
  const isNextAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  if (isSessionApi || isNextAsset) {
    return NextResponse.next();
  }

  const session = decodeAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
