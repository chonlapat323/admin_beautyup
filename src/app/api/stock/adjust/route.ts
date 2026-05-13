import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const response = await backendFetch("/stock/adjust", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถปรับ stock ได้" }, { status: 503 });
  }
}
