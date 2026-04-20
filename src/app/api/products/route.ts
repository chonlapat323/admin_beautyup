import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const targetUrl = query
      ? `${getBackendApiBaseUrl()}/products?${query}`
      : `${getBackendApiBaseUrl()}/products`;

    const response = await fetch(targetUrl, { cache: "no-store" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ API สินค้าได้ในขณะนี้" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${getBackendApiBaseUrl()}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถสร้างสินค้าได้ในขณะนี้" },
      { status: 503 },
    );
  }
}
