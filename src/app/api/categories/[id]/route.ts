import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-session.server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

function buildProcessedByHeader(processedBy?: string): Record<string, string> {
  return processedBy ? { "x-processed-by": processedBy } : {};
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/categories/${id}`, {
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลหมวดหมู่ได้" }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const session = await getAdminSession();
    const response = await fetch(`${getBackendApiBaseUrl()}/categories/${id}`, {
      method: "PATCH",
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
    return NextResponse.json({ message: "ไม่สามารถแก้ไขหมวดหมู่ได้" }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const session = await getAdminSession();
    const response = await fetch(`${getBackendApiBaseUrl()}/categories/${id}`, {
      method: "DELETE",
      headers: buildProcessedByHeader(session?.admin.email),
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบหมวดหมู่ได้" }, { status: 503 });
  }
}
