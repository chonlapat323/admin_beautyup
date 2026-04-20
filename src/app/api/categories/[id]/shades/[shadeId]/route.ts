import { NextResponse } from "next/server";

function getBackend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = { params: Promise<{ id: string; shadeId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, shadeId } = await context.params;
  try {
    const body = await request.json();
    const response = await fetch(`${getBackend()}/categories/${id}/shades/${shadeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขเฉดสีได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id, shadeId } = await context.params;
  try {
    const response = await fetch(`${getBackend()}/categories/${id}/shades/${shadeId}`, {
      method: "DELETE",
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบเฉดสีได้" }, { status: 503 });
  }
}
