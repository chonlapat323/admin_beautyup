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

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { message: `พยายาม login เกินกำหนด กรุณารอ ${Math.ceil(retryAfterSec / 60)} นาที` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const body = (await request.json()) as LoginRequestBody;

  if (!body.email || !body.password) {
    return NextResponse.json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: response.status });
    }

    // Reset attempts on successful login
    attempts.delete(ip);

    const result = (await response.json()) as LoginResponse;
    const nextResponse = NextResponse.json({ message: result.message, admin: result.admin });

    nextResponse.cookies.set(ADMIN_SESSION_COOKIE, encodeAdminSession(result), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.SECURE_COOKIE !== "false",
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
