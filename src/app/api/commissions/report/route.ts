import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") ?? "day";
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const qs = new URLSearchParams({ period });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const response = await backendFetch(`/commissions/report?${qs.toString()}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดรายงานได้" }, { status: 503 });
  }
}
