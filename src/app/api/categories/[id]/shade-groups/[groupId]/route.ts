import { NextResponse } from "next/server";

function getBackend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = { params: Promise<{ id: string; groupId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, groupId } = await context.params;
  try {
    const body = await request.json();
    const res = await fetch(`${getBackend()}/categories/${id}/shade-groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขกลุ่มเฉดสีได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id, groupId } = await context.params;
  try {
    const res = await fetch(`${getBackend()}/categories/${id}/shade-groups/${groupId}`, { method: "DELETE" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบกลุ่มเฉดสีได้" }, { status: 503 });
  }
}
