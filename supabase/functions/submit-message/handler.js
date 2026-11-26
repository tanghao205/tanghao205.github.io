import { reportedIp, enrichNetwork } from "../_shared/network.js";

const MAX_BYTES = 24000;
const encoder = new TextEncoder();

export function createHandler(env, fetcher = fetch) {
  const origins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return async (request) => {
    const origin = request.headers.get("origin");
    const allowed = origins.includes(origin);
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    if (allowed)
      Object.assign(headers, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
    const reply = (status, message) =>
      new Response(JSON.stringify({ message }), { status, headers });
    if (!allowed) return reply(403, "This origin is not allowed.");
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, "Use POST to send a message.");
    if (
      !env.SUPABASE_URL ||
      !env.SUPABASE_SERVICE_ROLE_KEY ||
      !env.TURNSTILE_SECRET_KEY ||
      !env.RATE_LIMIT_SECRET
    )
      return reply(503, "Messaging is temporarily unavailable. Please use LinkedIn.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return reply(415, "Send JSON.");
    let input;
    try {
      let bytes = 0;
      const chunks = [];
      const reader = request.body?.getReader();
      if (!reader) return reply(400, "A message is required.");
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > MAX_BYTES) {
          await reader.cancel();
          return reply(413, "Message is too large.");
        }
        chunks.push(value);
      }
      const buffer = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }
      input = JSON.parse(new TextDecoder().decode(buffer));
    } catch {
      return reply(400, "Could not read your message.");
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      return reply(400, "Invalid message.");
    const { kind, name, email = "", message, token, website = "" } = input;
    if (website !== "") return reply(400, "Unable to accept this submission.");
    if (
      !["contact", "feedback"].includes(kind) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 80 ||
      typeof email !== "string" ||
      email.length > 254 ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      typeof message !== "string" ||
      message.trim().length < 20 ||
      message.trim().length > 4000 ||
      typeof token !== "string" ||
      !token ||
      token.length > 2048
    )
      return reply(400, "Check your name, email, message length, and verification.");
    if (kind === "contact" && !email)
      return reply(400, "Please include an email so I can reply.");
    try {
      const verified = await fetcher(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: token,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!verified.ok)
        return reply(503, "Verification is unavailable. Please try again.");
      const result = await verified.json();
      if (
        !result.success ||
        result.action !== "portfolio-message" ||
        result.hostname !== new URL(origin).hostname
      )
        return reply(400, "Please complete verification again.");
      // The gateway must overwrite the IP header; the global cap also limits abuse.
      const ip = (request.headers.get("x-forwarded-for") || "unknown")
        .split(",")
        .at(-1)
        .trim();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(env.RATE_LIMIT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const digest = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(email.trim().toLowerCase() || ip),
      );
      const rateKey = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const stored = await fetcher(
        `${env.SUPABASE_URL}/rest/v1/rpc/submit_visitor_message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            p_rate_key: rateKey,
            p_kind: kind,
            p_name: name.trim(),
            p_email: email.trim(),
            p_message: message.trim(),
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!stored.ok)
        return reply(503, "Your message could not be saved. Please try again later.");
      const id = await stored.json();
      if (id === null) return reply(429, "Too many messages. Please try again later.");
      if (typeof id !== "string")
        return reply(503, "Your message could not be confirmed.");
      await enrichNetwork(env, fetcher, "message", id, reportedIp(request));
      // Optional notification: stored messages remain available even if email fails.
      if (
        env.IMMEDIATE_NOTIFICATIONS === "true" &&
        env.RESEND_API_KEY &&
        env.NOTIFICATION_FROM &&
        env.NOTIFICATION_TO
      ) {
        try {
          await fetcher("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: env.NOTIFICATION_FROM,
              to: [env.NOTIFICATION_TO],
              subject: "New portfolio message",
              text: `A new ${kind} message (${id}) is waiting in your Supabase visitor_messages inbox.`,
            }),
            signal: AbortSignal.timeout(4000),
          });
        } catch {
          /* Notification is best effort; never report a saved message as failed. */
        }
      }
      return reply(201, "Message received. Thank you!");
    } catch {
      return reply(503, "Messaging is temporarily unavailable. Please use LinkedIn.");
    }
  };
}
