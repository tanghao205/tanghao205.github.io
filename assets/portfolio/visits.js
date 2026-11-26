// Count once per browser tab session per UTC day, after bot verification.
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
  const container = document.querySelector("#visit-verification");
  let widget,
    skipped = false;
  const stop = () => {
    skipped = true;
    queueMicrotask(() => {
      if (widget !== undefined) {
        const id = widget;
        widget = undefined;
        window.turnstile.remove(id);
      }
    });
  };
  widget = window.turnstile.render(container, {
    sitekey: config.turnstileSiteKey,
    action: "portfolio-visit",
    appearance: "interaction-only",
    // Counting a visit must never ask the reader to solve an extra challenge.
    "before-interactive-callback": stop,
    "error-callback": stop,
    "timeout-callback": stop,
    callback: async (token) => {
      if (skipped) return;
      try {
        const response = await fetch(
          config.endpoint.replace(/submit-message$/, "track-visit"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session, token }),
            signal: AbortSignal.timeout(20000),
          },
        );
        if (response.ok) sessionStorage.setItem("portfolio-visit-day", day);
      } catch {
        /* Analytics must not interfere with reading or messaging. */
      }
    },
  });
}
