import { NextResponse } from "next/server";

function getBackendApiBaseUrl() {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${getBackendApiBaseUrl()}/uploads/temp`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "ไม่สามารถอัปโหลดไฟล์ได้" }, { status: 503 });
  }
}
