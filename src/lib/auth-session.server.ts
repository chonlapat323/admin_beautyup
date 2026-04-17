import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/auth-session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return decodeAdminSession(rawValue);
}
