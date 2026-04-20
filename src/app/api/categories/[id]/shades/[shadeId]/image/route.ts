import { NextResponse } from "next/server";

function getBackend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = { params: Promise<{ id: string; shadeId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, shadeId } = await context.params;
  try {
    const formData = await request.formData();
    const response = await fetch(`${getBackend()}/categories/${id}/shades/${shadeId}/image`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดรูปได้" }, { status: 503 });
  }
}
