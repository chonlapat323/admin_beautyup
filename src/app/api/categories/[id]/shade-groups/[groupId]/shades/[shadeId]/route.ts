import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string; groupId: string; shadeId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, groupId, shadeId } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const response = await backendFetch(`/categories/${id}/shade-groups/${groupId}/shades/${shadeId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, session.admin.email);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขเฉดสีได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id, groupId, shadeId } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const response = await backendFetch(`/categories/${id}/shade-groups/${groupId}/shades/${shadeId}`, {
      method: "DELETE",
    }, session.admin.email);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบเฉดสีได้" }, { status: 503 });
  }
}
