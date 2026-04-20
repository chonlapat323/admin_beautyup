import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/admin-users/${id}`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้" }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const response = await fetch(`${getBackendApiBaseUrl()}/admin-users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขผู้ดูแลระบบได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/admin-users/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบผู้ดูแลระบบได้" }, { status: 503 });
  }
}
