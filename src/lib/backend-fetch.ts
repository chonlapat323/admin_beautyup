import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-session.server";

export function getBackendUrl(): string {
  return process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
}

type SessionResult =
  | { session: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>; unauthorized: null }
  | { session: null; unauthorized: NextResponse };

export async function requireSession(): Promise<SessionResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      unauthorized: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, unauthorized: null };
}

export function authHeaders(
  token: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function backendFetch(
  path: string,
  options: RequestInit = {},
  processedBy?: string,
): Promise<Response> {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) throw new Error("Unauthorized");

  const headers: Record<string, string> = authHeaders(session.accessToken, {
    ...(processedBy ? { "x-processed-by": processedBy } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  });

  return fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}
