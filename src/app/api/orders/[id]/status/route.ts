import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/auth-session";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const cookieStore = await cookies();
    const session = decodeAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
    const changedByName = session?.admin?.email ?? "Admin";

    const body = await request.json() as Record<string, unknown>;
    const response = await fetch(`${getBackendApiBaseUrl()}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, changedByName }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถเปลี่ยนสถานะคำสั่งซื้อได้" }, { status: 503 });
  }
}
