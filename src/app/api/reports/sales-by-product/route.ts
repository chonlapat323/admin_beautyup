import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const response = await backendFetch(`/reports/sales-by-product?${searchParams.toString()}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลได้" }, { status: 503 });
  }
}
