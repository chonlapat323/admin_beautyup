import { NextResponse } from "next/server";

function getBackendBase() {
  const apiUrl = process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api$/, "");
}

type RouteContext = { params: Promise<{ filename: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { filename } = await context.params;
  try {
    const response = await fetch(`${getBackendBase()}/uploads/temp/${filename}`, { cache: "no-store" });
    if (!response.ok) return new NextResponse(null, { status: response.status });
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { filename } = await context.params;
  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/uploads/temp/${filename}`, {
      method: "DELETE",
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบไฟล์ชั่วคราวได้" }, { status: 503 });
  }
}
