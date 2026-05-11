import { NextResponse } from "next/server";
import { requireSession, getBackendUrl } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string; groupId: string; shadeId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, groupId, shadeId } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const formData = await request.formData();
    const response = await fetch(
      `${getBackendUrl()}/categories/${id}/shade-groups/${groupId}/shades/${shadeId}/image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      },
    );
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดรูปได้" }, { status: 503 });
  }
}
