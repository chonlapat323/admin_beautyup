import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const path = productId ? `/stock/movements?productId=${productId}` : "/stock/movements";
    const response = await backendFetch(path);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงประวัติ stock ได้" }, { status: 503 });
  }
}
