import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const response = await backendFetch(`/roles/${id}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลสิทธิ์ได้" }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const body = await request.json();
    const response = await backendFetch(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขสิทธิ์ได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const response = await backendFetch(`/roles/${id}`, {
      method: "DELETE",
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบสิทธิ์ได้" }, { status: 503 });
  }
}
