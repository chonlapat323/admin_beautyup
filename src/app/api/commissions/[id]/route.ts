import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const response = await backendFetch(`/commissions/${id}/cancel`, {
      method: "PATCH",
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถยกเลิกคอมมิชชันได้" }, { status: 503 });
  }
}
