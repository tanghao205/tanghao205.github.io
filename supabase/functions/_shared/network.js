import { isIP } from "node:net";

export function reportedIp(request) {
  // Rightmost proxy hop is a best-effort report, not a verified identity.
  const value = (request.headers.get("x-forwarded-for") || "").split(",").at(-1).trim();
  return isIP(value) ? value : null;
}

export function publicIp(ip) {
  if (isIP(ip || "") === 6) return /^[23]/i.test(ip) && !/^2001:(db8|0):/i.test(ip);
  if (isIP(ip || "") !== 4) return false;
  const [a, b, c] = ip.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

export async function networkHash(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function enrichNetwork(env, fetcher, kind, id, ip) {
  if (!ip) return;
  let location = null;
  if (publicIp(ip) && env.GEO_LOOKUP_ENABLED === "true") {
    try {
      const response = await fetcher(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        signal: AbortSignal.timeout(2500),
      });
      const data = response.ok ? await response.json() : null;
      if (data?.success === true) {
        const clean = (value) =>
          typeof value === "string" ? value.slice(0, 120) : null;
        location = {
          city: clean(data.city),
          region: clean(data.region),
          country: clean(data.country),
          country_code: clean(data.country_code),
          isp: clean(data.connection?.isp),
          source: "ipwho.is",
          approximate: true,
        };
      }
    } catch {
      /* Location failure must not undo an accepted record. */
    }
  }
  try {
    await fetcher(`${env.SUPABASE_URL}/rest/v1/rpc/record_network_details`, {
      method: "POST",
      headers: serverHeaders(env),
      body: JSON.stringify({ p_kind: kind, p_id: id, p_ip: ip, p_location: location }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* Network metadata is best effort. */
  }
}

export function serverHeaders(env) {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}
