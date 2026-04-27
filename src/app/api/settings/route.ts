import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function GET() {
  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/settings`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงการตั้งค่าได้" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as unknown;
    const res = await fetch(`${getBackendApiBaseUrl()}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถบันทึกการตั้งค่าได้" }, { status: 503 });
  }
}
