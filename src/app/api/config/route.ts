import { NextResponse } from "next/server";

export async function GET() {
  // Derive socket URL from server-side ADMIN_API_URL (strip /api suffix)
  const apiUrl = process.env.ADMIN_API_URL || "http://localhost:3000/api";
  const socketUrl = apiUrl.replace(/\/api$/, "");
  return NextResponse.json({ socketUrl });
}
