import { NextResponse } from "next/server";
import { requireSession } from "@/lib/backend-fetch";
import { getBackendUrl } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string; shadeId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, shadeId } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const formData = await request.formData();
    const response = await fetch(`${getBackendUrl()}/categories/${id}/shades/${shadeId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดรูปได้" }, { status: 503 });
  }
}
