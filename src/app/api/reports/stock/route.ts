import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const qs = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const response = await backendFetch(`/reports/stock${qs}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลได้" }, { status: 503 });
  }
}
