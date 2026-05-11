import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const body = await request.json();
    const response = await backendFetch(`/roles/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเปลี่ยนสถานะสิทธิ์ได้" }, { status: 503 });
  }
}
