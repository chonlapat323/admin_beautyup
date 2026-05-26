import { NextRequest, NextResponse } from "next/server";
import { backendFetch, requireSession } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const brandId = searchParams.get("brandId");
  const categoryId = searchParams.get("categoryId");
  const collectionId = searchParams.get("collectionId");
  if (brandId) params.set("brandId", brandId);
  if (categoryId) params.set("categoryId", categoryId);
  if (collectionId) params.set("collectionId", collectionId);
  try {
    const res = await backendFetch(`/products/generate-sku?${params}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสร้างรหัสได้" }, { status: 503 });
  }
}
