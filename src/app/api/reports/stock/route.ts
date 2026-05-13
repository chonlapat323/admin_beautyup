import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const response = await backendFetch("/reports/stock");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลได้" }, { status: 503 });
  }
}
