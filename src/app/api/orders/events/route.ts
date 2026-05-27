import { getBackendUrl, requireSession } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const backendRes = await fetch(`${getBackendUrl()}/orders/events`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "text/event-stream",
      },
      signal: request.signal,
    });

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response("data: {}\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
