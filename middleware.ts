import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/auth-session";

const PUBLIC_PATHS = ["/login", "/auth/sign-in", "/privacy", "/privacy.html"];

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

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  // Sliding window: reset session expiry on every authenticated request
  if (session) {
    const cookieVal = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (cookieVal) {
      response.cookies.set(ADMIN_SESSION_COOKIE, cookieVal, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && process.env.SECURE_COOKIE !== "false",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
