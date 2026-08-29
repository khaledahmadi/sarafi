/**
 * Same-origin API proxy (edustaff pattern).
 * Must preserve every Set-Cookie header — the Fetch Headers map collapses them
 * unless we pass an array of header tuples to `new Response`.
 */
import { createFileRoute } from "@tanstack/react-router";

function backendBase(): string {
  return (process.env["API_URL"] || "http://localhost:8003").replace(/\/$/, "");
}

async function proxyRequest({ request }: { request: Request }): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${backendBase()}${incoming.pathname}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "content-length" ||
      lower === "transfer-encoding"
    ) {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json(
      { detail: "Backend is not reachable." },
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const out: [string, string][] = [];
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "content-encoding") return;
    if (lower.startsWith("access-control-")) return;
    if (lower === "set-cookie") return;
    out.push([key, value]);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      out.push(["set-cookie", cookie]);
    }
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) out.push(["set-cookie", single]);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

export { proxyRequest };

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxyRequest,
      POST: proxyRequest,
      PUT: proxyRequest,
      PATCH: proxyRequest,
      DELETE: proxyRequest,
      OPTIONS: proxyRequest,
    },
  },
});
