// Count once per browser tab session per UTC day. Message bot checks are separate.
export function trackVisit(config) {
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;
  let session, recorded;
  const day = new Date().toISOString().slice(0, 10);
  try {
    session = sessionStorage.getItem("portfolio-session") || crypto.randomUUID();
    sessionStorage.setItem("portfolio-session", session);
    recorded = sessionStorage.getItem("portfolio-visit-day") === day;
  } catch {
    return;
  }
  if (recorded) return;
  fetch(config.endpoint.replace(/submit-message$/, "track-visit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
    signal: AbortSignal.timeout(20000),
  })
    .then((response) => {
      if (response.ok) sessionStorage.setItem("portfolio-visit-day", day);
    })
    .catch(() => {
      // Analytics must not interfere with reading or messaging.
    });
}
