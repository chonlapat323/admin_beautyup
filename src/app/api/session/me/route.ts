import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/auth-session";

export async function GET() {
  const cookieStore = await cookies();
  const session = decodeAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.admin.id,
    email: session.admin.email,
    role: session.admin.role,
  });
}
