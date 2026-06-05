import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const path = query ? `/carriers?${query}` : "/carriers";
    const res = await backendFetch(path);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถโหลดข้อมูลได้" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const res = await backendFetch("/carriers", { method: "POST", body: JSON.stringify(body) }, session.admin.email);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างข้อมูลได้" }, { status: 503 });
  }
}
