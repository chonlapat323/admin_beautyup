import { NextResponse } from "next/server";
import { requireSession, getBackendUrl } from "@/lib/backend-fetch";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const formData = await request.formData();
    const response = await fetch(`${getBackendUrl()}/banners/${id}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดรูปแบนเนอร์ได้" }, { status: 503 });
  }
}
