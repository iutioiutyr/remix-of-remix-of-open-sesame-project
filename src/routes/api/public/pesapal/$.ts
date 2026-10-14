import { createFileRoute } from "@tanstack/react-router";

// Server-side proxy to PesaPal (replaces the original api/pesapal-proxy.js).
// Consumer key/secret are injected only into the token request, never exposed.
const ALLOWED = [
  "api/auth/requesttoken",
  "api/urlsetup/registeripn",
  "api/transactions/submitorderrequest",
  "api/transactions/gettransactionstatus",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

async function proxy(request: Request, splat: string) {
  const path = splat.replace(/^\/+/, "");
  const normalized = path.toLowerCase();
  if (!ALLOWED.includes(normalized)) {
    return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  }
  const url = new URL(request.url);
  const target = `https://pay.pesapal.com/v3/${path}${url.search}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  let body: string | undefined =
    request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined;

  if (request.method === "POST" && normalized === "api/auth/requesttoken") {
    const key = process.env.PESAPAL_CONSUMER_KEY;
    const secret = process.env.PESAPAL_CONSUMER_SECRET;
    if (!key || !secret) {
      return Response.json(
        { error: "Payment service credentials are not configured." },
        { status: 500, headers: cors },
      );
    }
    body = JSON.stringify({ consumer_key: key, consumer_secret: secret });
  }

  try {
    const upstream = await fetch(target, { method: request.method, headers, body });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json({ error: "Proxy request failed" }, { status: 502, headers: cors });
  }
}

export const Route = createFileRoute("/api/public/pesapal/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request, params }) => proxy(request, params._splat ?? ""),
      POST: async ({ request, params }) => proxy(request, params._splat ?? ""),
    },
  },
});
