import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = { params: Promise<{ filename: string }> };

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
