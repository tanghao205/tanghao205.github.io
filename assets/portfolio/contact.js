import { contactConfig } from "./contact-config.js";
import { trackVisit } from "./visits.js";

const form = document.querySelector("#message-form");
const status = document.querySelector("#message-status");
const submit = form.querySelector('button[type="submit"]');
let token = "";
let widget;
let busy = false;
const configured =
  /^https:\/\//.test(contactConfig.endpoint) && Boolean(contactConfig.turnstileSiteKey);

function resetVerification() {
  token = "";
  submit.disabled = true;
  if (widget !== undefined) window.turnstile?.reset(widget);
}

if (configured) {
  status.textContent = "Checking spam protection…";
  window.portfolioTurnstileReady = () => {
    try {
      trackVisit(contactConfig);
    } catch {
      // Visit analytics must never block message verification.
    }
    widget = window.turnstile.render("#message-verification", {
      sitekey: contactConfig.turnstileSiteKey,
      action: "portfolio-message",
      appearance: "interaction-only",
      callback: (value) => {
        token = value;
        submit.disabled = busy;
        if (status.textContent === "Checking spam protection…")
          status.textContent = "Ready to send. Your message stays private.";
      },
      "expired-callback": resetVerification,
      "error-callback": () => {
        token = "";
        submit.disabled = true;
        status.textContent =
          "Verification could not load. Please try again or use LinkedIn.";
      },
    });
  };
  const script = document.createElement("script");
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=portfolioTurnstileReady&render=explicit";
  script.async = true;
  script.onerror = () => {
    status.textContent = "Verification could not load. Please use LinkedIn.";
  };
  document.head.append(script);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!configured || busy || !token || !form.reportValidity()) return;
  const values = new FormData(form);
  if (values.get("kind") === "contact" && !values.get("email")) {
    status.textContent = "Please include your email so I can reply.";
    form.elements.email.focus();
    return;
  }
  busy = true;
  submit.textContent = "Sending…";
  submit.disabled = true;
  form.setAttribute("aria-busy", "true");
  status.textContent = "Sending your message…";
  try {
    const response = await fetch(contactConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: values.get("kind"),
        name: values.get("name"),
        email: values.get("email"),
        message: values.get("message"),
        website: values.get("website"),
        token,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (response.status === 201) {
      form.reset();
      status.textContent = "Message received. Thank you!";
    } else if (response.status === 429) {
      status.textContent = "Too many messages. Please try again later or use LinkedIn.";
    } else {
      status.textContent =
        "Your message was not accepted. Check the fields and verification, or use LinkedIn.";
    }
  } catch {
    status.textContent =
      "Delivery could not be confirmed. Your text is still here; please try again later or use LinkedIn.";
  } finally {
    busy = false;
    submit.textContent = "Send message";
    form.removeAttribute("aria-busy");
    resetVerification();
  }
});
