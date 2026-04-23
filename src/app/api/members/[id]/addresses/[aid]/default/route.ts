import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  try {
    const { id, aid } = await params;
    const res = await fetch(`${getBackendApiBaseUrl()}/members/${id}/addresses/${aid}/default`, {
      method: "PATCH",
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถตั้งที่อยู่หลักได้" }, { status: 503 });
  }
}
