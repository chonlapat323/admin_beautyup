import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function POST(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const response = await backendFetch(
      "/orders/admin",
      { method: "POST", body: JSON.stringify({ ...body, adminEmail: session.admin.email }) },
      session.admin.email,
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างคำสั่งซื้อได้" }, { status: 503 });
  }
}
