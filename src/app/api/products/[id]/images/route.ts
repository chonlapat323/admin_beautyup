import { NextResponse } from "next/server";
import { requireSession, getBackendUrl } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const formData = await request.formData();
    const response = await fetch(`${getBackendUrl()}/products/${id}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดรูปภาพได้" }, { status: 503 });
  }
}
