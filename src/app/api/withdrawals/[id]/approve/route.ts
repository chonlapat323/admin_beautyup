import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-session.server";

function backend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  try {
    const response = await fetch(`${backend()}/commissions/withdrawals/${id}/approve`, {
      method: "PATCH",
      headers: session?.admin.email ? { "x-processed-by": session.admin.email } : {},
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเชื่อมต่อ API ได้" }, { status: 503 });
  }
}
