import { test, expect } from "@playwright/test";

async function setup(page, privacy = false) {
  if (privacy)
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", { value: true }),
    );
  await page.route("**/contact-config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'export const contactConfig={endpoint:"https://test.supabase.co/functions/v1/submit-message",turnstileSiteKey:"test"};',
    }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'window.turnstile={render:(selector,options)=>{options.callback("verified-"+options.action);return 1;},reset:()=>{}};window.portfolioTurnstileReady();',
    }),
  );
  const visits = [];
  await page.route("https://test.supabase.co/**", (route) => {
    visits.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, body: "" });
  });
  return visits;
}

test("visits record once per tab/day and never include message fields", async ({
  page,
}) => {
  const visits = await setup(page);
  await page.goto("/");
  await expect.poll(() => visits.length).toBe(1);
  expect(Object.keys(visits[0])).toEqual(["session"]);
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("portfolio-visit-day")))
    .not.toBeNull();
  await page.reload();
  await expect(page.locator("#message-status")).toContainText("Ready to send");
  expect(visits).toHaveLength(1);
});

test("Global Privacy Control prevents visit storage and network calls", async ({
  page,
}) => {
  const visits = await setup(page, true);
  await page.goto("/");
  await expect(page.locator("#message-status")).toContainText("Ready to send");
  expect(visits).toHaveLength(0);
  expect(
    await page.evaluate(() => sessionStorage.getItem("portfolio-session")),
  ).toBeNull();
});

test("visits record even when the message CAPTCHA cannot load", async ({ page }) => {
  const visits = await setup(page);
  await page.route("https://challenges.cloudflare.com/**", (route) => route.abort());
  await page.goto("/");
  await expect.poll(() => visits.length).toBe(1);
  await expect(page.locator("#message-status")).toContainText(
    "Verification could not load",
  );
  await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
});
