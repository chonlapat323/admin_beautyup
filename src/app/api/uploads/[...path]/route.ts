import { NextResponse } from "next/server";

function getBackendBase(): string {
  const apiUrl = process.env.ADMIN_API_URL || "http://localhost:3001/api";
  return apiUrl.replace(/\/api$/, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${getBackendBase()}/uploads/${path.join("/")}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
