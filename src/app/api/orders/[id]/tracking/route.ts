import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as Record<string, unknown>;
    const response = await backendFetch(`/orders/${id}/tracking`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถบันทึกเลขพัสดุได้" }, { status: 503 });
  }
}
