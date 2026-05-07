import { NextResponse } from "next/server";

function backend() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${backend()}/commissions/withdrawals/${params.id}/approve`, {
      method: "PATCH",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเชื่อมต่อ API ได้" }, { status: 503 });
  }
}
