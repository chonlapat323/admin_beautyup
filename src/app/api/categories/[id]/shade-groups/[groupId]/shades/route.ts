import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string; groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, groupId } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const response = await backendFetch(`/categories/${id}/shade-groups/${groupId}/shades`, {
      method: "POST",
      body: JSON.stringify(body),
    }, session.admin.email);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างเฉดสีได้" }, { status: 503 });
  }
}
