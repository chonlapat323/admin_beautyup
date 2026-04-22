import { NextResponse } from "next/server";

function backend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") ?? "day";
    const response = await fetch(`${backend()}/commissions/report?period=${period}`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดรายงานได้" }, { status: 503 });
  }
}
