import {
  reportedIp,
  enrichNetwork,
  networkHash,
  serverHeaders,
} from "../_shared/network.js";

export function createVisitHandler(env, fetcher = fetch) {
  const origins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  return async (request) => {
    const origin = request.headers.get("origin");
    const headers = { "Cache-Control": "no-store", Vary: "Origin" };
    if (!origins.includes(origin)) return new Response(null, { status: 403, headers });
    Object.assign(headers, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    const reply = (status) => new Response(null, { status, headers });
    if (request.method === "OPTIONS") return reply(204);
    if (request.method !== "POST") return reply(405);
    if (
      !env.TURNSTILE_SECRET_KEY ||
      !env.RATE_LIMIT_SECRET ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SERVICE_ROLE_KEY
    )
      return reply(503);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return reply(415);
    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400);
      let data = "",
        size = 0;
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 4096) {
          await reader.cancel();
          return reply(413);
        }
        data += decoder.decode(value, { stream: true });
      }
      data += decoder.decode();
      const input = JSON.parse(data);
      if (
        !input ||
        typeof input.token !== "string" ||
        !input.token ||
        input.token.length > 2048 ||
        typeof input.session !== "string" ||
        !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(input.session)
      )
        return reply(400);
      const verification = await fetcher(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: input.token,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      const result = verification.ok ? await verification.json() : null;
      if (
        !result?.success ||
        result.action !== "portfolio-visit" ||
        result.hostname !== new URL(origin).hostname
      )
        return reply(400);
      const ip = reportedIp(request);
      const hash = await networkHash(ip || "unknown", env.RATE_LIMIT_SECRET);
      const saved = await fetcher(
        `${env.SUPABASE_URL}/rest/v1/rpc/record_visitor_visit`,
        {
          method: "POST",
          headers: serverHeaders(env),
          body: JSON.stringify({ p_session: input.session, p_hash: hash }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!saved.ok) return reply(503);
      const id = await saved.json();
      if (typeof id === "string") await enrichNetwork(env, fetcher, "visit", id, ip);
      return reply(202);
    } catch {
      return reply(503);
    }
  };
}
