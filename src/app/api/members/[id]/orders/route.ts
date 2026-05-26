import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const res = await backendFetch(`/members/${id}/orders`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดข้อมูลได้" }, { status: 503 });
  }
}
