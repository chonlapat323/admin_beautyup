import { NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await backendFetch(
      `/collections/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      session.admin.email,
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถแก้ไขคอลเลกชันได้" }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const response = await backendFetch(
      `/collections/${id}`,
      { method: "DELETE" },
      session.admin.email,
    );
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถลบคอลเลกชันได้" }, { status: 503 });
  }
}
