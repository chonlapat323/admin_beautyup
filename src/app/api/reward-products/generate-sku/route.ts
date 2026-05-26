import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const res = await backendFetch("/reward-products/generate-sku");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างรหัสได้" }, { status: 503 });
  }
}
