import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await backendFetch(
      `/reward-products/redemptions/${id}/status`,
      { method: "PATCH", body: JSON.stringify(body) },
      session.admin.email
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปเดตสถานะได้" }, { status: 503 });
  }
}
