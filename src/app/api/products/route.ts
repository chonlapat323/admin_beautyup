import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const path = query ? `/products?${query}` : "/products";
    const response = await backendFetch(path);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเชื่อมต่อ API สินค้าได้ในขณะนี้" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const response = await backendFetch("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }, session.admin.email);

    const data = await response.json();
    if (response.status === 500) {
      return NextResponse.json({ message: "ชื่อสินค้านี้มีอยู่แล้วในระบบ กรุณาเปลี่ยนชื่อสินค้า" }, { status: 409 });
    }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างสินค้าได้ในขณะนี้" }, { status: 503 });
  }
}
