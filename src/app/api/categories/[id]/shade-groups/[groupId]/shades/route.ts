import { NextResponse } from "next/server";

function getBackend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = { params: Promise<{ id: string; groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, groupId } = await context.params;
  try {
    const body = await request.json();
    const res = await fetch(`${getBackend()}/categories/${id}/shade-groups/${groupId}/shades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างเฉดสีได้" }, { status: 503 });
  }
}
