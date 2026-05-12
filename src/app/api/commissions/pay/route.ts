import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function POST(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const response = await backendFetch("/commissions/pay", {
      method: "POST",
      body: JSON.stringify(body),
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถจ่ายคอมมิชชันได้" }, { status: 503 });
  }
}
