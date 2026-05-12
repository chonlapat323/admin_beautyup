import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const response = await backendFetch(`/members/${id}/credit-transactions`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถดึงประวัติเครดิตได้" }, { status: 503 });
  }
}
