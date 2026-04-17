import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-session.server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

function buildProcessedByHeader(processedBy?: string): Record<string, string> {
  return processedBy ? { "x-processed-by": processedBy } : {};
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const targetUrl = query
      ? `${getBackendApiBaseUrl()}/categories?${query}`
      : `${getBackendApiBaseUrl()}/categories`;

    const response = await fetch(targetUrl, {
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ API หมวดหมู่ได้ในขณะนี้" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getAdminSession();

    const response = await fetch(`${getBackendApiBaseUrl()}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildProcessedByHeader(session?.admin.email),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถสร้างหมวดหมู่ได้ในขณะนี้" },
      { status: 503 },
    );
  }
}
