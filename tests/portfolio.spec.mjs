import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Layout/navigation checks must not depend on a live anti-bot challenge or
// write visit records. Verification and submission states have their own tests.
test.beforeEach(async ({ page }) => {
  await page.route("**/contact-config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'export const contactConfig={endpoint:"",turnstileSiteKey:""};',
    }),
  );
});

test.describe("university labels on touch screens", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("tap reveals names, switching and outside taps dismiss them", async ({
    page,
  }) => {
    await page.goto("/");
    for (const name of ["illinois", "florida", "sysu"]) {
      await page.locator(`[popovertarget="university-${name}"]`).tap();
      const label = page.locator(`#university-${name}`);
      await expect(label).toBeVisible();
      await expect(page.locator(".university-tooltip:popover-open")).toHaveCount(1);
      const bounds = await label.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    }
    await page.locator("h1").tap();
    await expect(page.locator(".university-tooltip:popover-open")).toHaveCount(0);
    const trigger = page.locator('[popovertarget="university-illinois"]');
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#university-illinois")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#university-illinois")).toBeHidden();
  });
});

test("current identity, working assets, and accessible desktop content", async ({
  page,
}) => {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".hero-description")).toContainText("PROS");
  await expect(page.locator(".hero-description")).toContainText(
    "real-time airline pricing",
  );
  await expect(page.locator(".hero-engineering")).toContainText("Databricks");
  await expect(page.locator("#current-focus")).toContainText("Databricks");
  await page.locator(".harness-heading img").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".harness-heading img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  await expect(page.locator(".harness-section")).toContainText("code review");
  await expect(page.locator(".focus-photo img")).toHaveJSProperty("complete", true);
  await expect(page.locator(".harness-levels li")).toHaveCount(3);
  await expect(page.locator(".harness-levels")).toContainText(
    "Human choice: select one point",
  );
  await expect(page.locator(".harness-section")).toContainText(
    "expected and observed behavior",
  );
  await page.locator(".pros-details summary").click();
  await expect(page.locator(".pros-details")).toContainText("request-specific pricing");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('400 16px "DM Sans"'))).toBe(
    true,
  );
  for (const selector of [
    "h1",
    "h1 em",
    "#work-title",
    "#work-title em",
    "#about-title",
  ]) {
    expect(
      await page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element).fontFamily),
    ).toContain("DM Sans");
  }
  await page.locator("#explorations").scrollIntoViewIfNeeded();
  for (const image of await page.locator(".project-image img").all())
    await expect
      .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(failures).toEqual([]);
});

test("reading levels, expandable stories, and project dialog work with keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".harness-list")).toHaveCount(0);
  const level = page.locator(".level-example").first();
  await level.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(level).toHaveAttribute("open", "");
  await expect(level).toContainText("under 30 words");
  const story = page.locator(".battle-card summary");
  await story.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".battle-card details")).toHaveAttribute("open", "");
  await expect(page.locator(".battle-card details")).toContainText("DocuSign");
  for (const project of ["vision", "storms", "visualization"]) {
    const trigger = page.locator(`[data-project="${project}"]`);
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Close project" })).toBeFocused();
    await expect
      .poll(() =>
        page
          .locator("#dialog-image")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test("mobile navigation, reduced motion, dialog access, and layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Selected work" })
    .click();
  await expect(page).toHaveURL(/#work$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-project="storms"]').click();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Close project" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).scrollBehavior),
  ).toBe("auto");
});

test("private references and source files cannot be served; legacy links resolve", async ({
  page,
  request,
}) => {
  for (const path of [
    "/private/Hao_Tang%20Resume.docx",
    "/Hao_Tang%20Resume.docx",
    "/.git/config",
    "/AGENTS.md",
    "/docs/portfolio-brief.md",
    "/package.json",
    "/scripts/build.mjs",
    "/private/supabase-runtime.env",
    "/supabase/config.toml",
    "/supabase/functions/submit-message/handler.js",
    "/supabase/migrations/202611090001_visitor_messages.sql",
    "/%2e%2e%2fprivate/Hao_Tang%20Resume.docx",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  for (const [path, target] of [
    ["/about/", "#about"],
    ["/ML/", "#explorations"],
    ["/CC/", "#explorations"],
    ["/DV/", "#explorations"],
    ["/coding/", "#work"],
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${target}$`));
  }
  const response = await page.goto("/a-page-that-does-not-exist");
  expect(response.status()).toBe(404);
  await expect(
    page.getByRole("link", { name: "Back to the portfolio" }),
  ).toHaveAttribute("href", "/");
});
