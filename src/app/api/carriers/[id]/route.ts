import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const res = await backendFetch(`/carriers/${id}`, { method: "PATCH", body: JSON.stringify(body) }, session.admin.email);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปเดตข้อมูลได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const res = await backendFetch(`/carriers/${id}`, { method: "DELETE" }, session.admin.email);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบข้อมูลได้" }, { status: 503 });
  }
}
