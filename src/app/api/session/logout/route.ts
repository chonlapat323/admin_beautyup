import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out successfully." });

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.SECURE_COOKIE !== "false",
    path: "/",
    maxAge: 0,
  });

  return response;
}
