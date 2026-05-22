import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const response = await backendFetch(`/reward-products/redemptions/${id}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดข้อมูลได้" }, { status: 503 });
  }
}
