import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const body = await req.text();
    const response = await backendFetch(`/commissions/withdrawals/${id}/approve`, {
      method: "PATCH",
      body: body || undefined,
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเชื่อมต่อ API ได้" }, { status: 503 });
  }
}
