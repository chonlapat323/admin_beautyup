import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const response = await backendFetch(`/categories/${id}/shade-groups`);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลกลุ่มเฉดสีได้" }, { status: 503 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const response = await backendFetch(`/categories/${id}/shade-groups`, {
      method: "POST",
      body: JSON.stringify(body),
    }, session.admin.email);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างกลุ่มเฉดสีได้" }, { status: 503 });
  }
}
