import { NextResponse } from "next/server";

export async function GET() {
  // Prefer explicit socket URL, fallback to deriving from ADMIN_API_URL
  const socketUrl =
    process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL ||
    (process.env.ADMIN_API_URL || "http://localhost:3000/api").replace(/\/api$/, "");
  return NextResponse.json({ socketUrl });
}
