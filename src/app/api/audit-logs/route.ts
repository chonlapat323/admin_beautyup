import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const path = query ? `/audit-logs?${query}` : "/audit-logs";
    const response = await backendFetch(path);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึง audit log ได้" }, { status: 503 });
  }
}
