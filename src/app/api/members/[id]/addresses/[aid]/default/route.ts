import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id, aid } = await params;
    const response = await backendFetch(`/members/${id}/addresses/${aid}/default`, {
      method: "PATCH",
    }, session.admin.email);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถตั้งที่อยู่หลักได้" }, { status: 503 });
  }
}
