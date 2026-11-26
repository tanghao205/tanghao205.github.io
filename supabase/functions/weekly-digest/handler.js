import { serverHeaders } from "../_shared/network.js";

export function previousWeek(now) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
  return {
    start: new Date(end.getTime() - 7 * 86400000).toISOString(),
    end: end.toISOString(),
  };
}

export function digestText(data, projectUrl) {
  const clean = (value) =>
    String(value ?? "").replace(/[\r\n\t\u0000-\u001f\u007f]/g, " ");
  return [
    `Portfolio weekly digest: ${data.start.slice(0, 10)} to ${data.end.slice(0, 10)} (UTC, end exclusive)`,
    "",
    `${data.messages} new messages: ${data.contact} contact, ${data.feedback} feedback.`,
    `${data.unread} messages currently unread across the inbox.`,
    `${data.updated_existing} older messages edited during this week (latest edit time, not an audit log).`,
    `${data.visits} recorded browser sessions; ${data.networks} distinct reported network hashes.`,
    "Visits are deduplicated per browser session per UTC day, not a count of people. VPNs and shared networks affect these estimates.",
    "",
    "Approximate visit countries:",
    ...(data.locations.length
      ? data.locations.map((x) => `${clean(x.country)}: ${x.visits}`)
      : ["No location data."]),
    "",
    "Message excerpts (up to 20, newest first; visitor text follows):",
    ...data.excerpts.map(
      (x) =>
        `[${clean(x.kind)} / ${clean(x.status)}] ${clean(x.name)}: ${clean(x.excerpt)}`,
    ),
    "",
    `Private inbox: ${projectUrl.replace(".supabase.co", "").replace("https://", "https://supabase.com/dashboard/project/")}/editor`,
    "Raw IP addresses and reply emails are omitted from this digest.",
  ].join("\n");
}

export function createDigestHandler(env, fetcher = fetch, clock = () => new Date()) {
  return async (request) => {
    const reply = (status, message) =>
      Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
    if (request.method !== "POST") return reply(405, "Use POST.");
    if (
      !env.DIGEST_JOB_SECRET ||
      request.headers.get("authorization") !== `Bearer ${env.DIGEST_JOB_SECRET}`
    )
      return reply(401, "Unauthorized.");
    if (
      !env.RESEND_API_KEY ||
      !env.NOTIFICATION_FROM ||
      !env.NOTIFICATION_TO ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SERVICE_ROLE_KEY
    )
      return reply(503, "Email delivery is not configured.");
    const { start, end } = previousWeek(clock());
    const rpc = async (name, body) => {
      const r = await fetcher(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: serverHeaders(env),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error("Database operation failed");
      const text = await r.text();
      return text ? JSON.parse(text) : null;
    };
    try {
      const run = await rpc("prepare_weekly_digest", { p_start: start, p_end: end });
      if (run.status === "sent") return reply(200, "Already sent.");
      if (run.status !== "ready")
        return reply(
          409,
          run.status === "busy"
            ? "Delivery is in progress."
            : "Manual delivery review required.",
        );
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `portfolio-weekly/${start}`,
        },
        body: JSON.stringify({
          from: env.NOTIFICATION_FROM,
          to: [env.NOTIFICATION_TO],
          subject: `Portfolio weekly digest — ${start.slice(0, 10)}`,
          text: digestText(run.snapshot, env.SUPABASE_URL),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return reply(
          502,
          "Email provider did not accept the digest. Check provider configuration; retry after five minutes.",
        );
      const result = await response.json();
      if (typeof result.id !== "string") throw new Error("Missing email reference");
      await rpc("finish_weekly_digest", { p_start: start, p_provider_id: result.id });
      return reply(200, "Digest accepted by email provider.");
    } catch {
      return reply(
        503,
        "Delivery could not be confirmed. Retry after five minutes; review provider records before retrying after 23 hours.",
      );
    }
  };
}
