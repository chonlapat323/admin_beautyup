import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const path = query ? `/commissions?${query}` : "/commissions";
    const response = await backendFetch(path);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเชื่อมต่อ API คอมมิชชันได้" }, { status: 503 });
  }
}
