import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const response = await backendFetch("/commissions/settings");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดการตั้งค่า commission ได้" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const response = await backendFetch("/commissions/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถบันทึกการตั้งค่าได้" }, { status: 503 });
  }
}
