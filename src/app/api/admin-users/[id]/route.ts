import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const response = await backendFetch(`/admin-users/${id}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้" }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const body = await request.json();
    const response = await backendFetch(`/admin-users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขผู้ดูแลระบบได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const response = await backendFetch(`/admin-users/${id}`, {
      method: "DELETE",
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบผู้ดูแลระบบได้" }, { status: 503 });
  }
}
