import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, encodeAdminSession } from "@/lib/auth-session";
import type { LoginResponse } from "@/lib/admin-api";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.ADMIN_API_URL ||
    "http://localhost:3000/api"
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequestBody;

  if (!body.email || !body.password) {
    return NextResponse.json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: response.status });
    }

    const result = (await response.json()) as LoginResponse;
    const nextResponse = NextResponse.json({
      message: result.message,
      admin: result.admin,
    });

    nextResponse.cookies.set(ADMIN_SESSION_COOKIE, encodeAdminSession(result), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ API ของระบบหลังบ้านได้ในขณะนี้" },
      { status: 503 },
    );
  }
}
