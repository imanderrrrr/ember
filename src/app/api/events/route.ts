import { auth } from "@/auth";
import { getAuthHeaders } from "@/lib/server-token";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export async function GET(req: Request) {
  const session = await auth();
  const headers = session ? await getAuthHeaders(session) : {};

  const backendUrl = `${API_URL}/events`;

  try {
    const upstream = await fetch(backendUrl, {
      headers: {
        ...headers,
        Accept: "text/event-stream",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Failed to connect to event stream", {
        status: upstream.status,
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[events proxy] error connecting to SSE:", err);
    return new Response("SSE upstream unavailable", { status: 502 });
  }
}
