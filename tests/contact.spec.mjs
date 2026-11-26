import { test, expect } from "@playwright/test";

test("unconfigured form offers an honest LinkedIn fallback", async ({ page }) => {
  await page.route("**/contact-config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'export const contactConfig={endpoint:"",turnstileSiteKey:""};',
    }),
  );
  await page.goto("/");
  await expect(page.locator("#message-status")).toContainText("being set up");
  await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
});

async function configure(page, code) {
  await page.route("**/contact-config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'export const contactConfig={endpoint:"https://test.supabase.co/functions/v1/submit-message",turnstileSiteKey:"test-site-key"};',
    }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'window.turnstile={render:(selector,opts)=>{opts.callback("verified-test-token");return 1;},reset:()=>{}};window.portfolioTurnstileReady();',
    }),
  );
  let submissions = [];
  await page.route("https://test.supabase.co/**", (route) => {
    if (route.request().url().endsWith("/track-visit"))
      return route.fulfill({ status: 202, body: "" });
    submissions.push(route.request().postDataJSON());
    return route.fulfill({ status: code, contentType: "application/json", body: "{}" });
  });
  await page.goto("/");
  await page.getByLabel("Your name", { exact: true }).fill("A visitor");
  await page.getByLabel("Reply email").fill("visitor@example.com");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("I have a question about this portfolio and your work.");
  return submissions;
}

test("verified form sends only the submission fields and confirms acceptance", async ({
  page,
}) => {
  const submissions = await configure(page, 201);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#message-status")).toContainText("Message received");
  expect(submissions).toHaveLength(1);
  expect(submissions[0].token).toBe("verified-test-token");
  expect(submissions[0].email).toBe("visitor@example.com");
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue("");
});

test("rate limiting preserves the visitor text and never claims delivery", async ({
  page,
}) => {
  await configure(page, 429);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#message-status")).toContainText("Too many messages");
  await expect(page.getByLabel("Your message", { exact: true })).not.toHaveValue("");
});
