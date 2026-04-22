import { NextResponse } from "next/server";

function backend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${backend()}/commissions/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถจ่าย commission ได้" }, { status: 503 });
  }
}
