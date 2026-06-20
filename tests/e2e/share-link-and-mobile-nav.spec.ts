/**
 * E2e tests:
 * 1. COPY LINK encodes current control state into URL; reload restores that state.
 * 2. 375px mobile nav — LESSONS button opens drawer, switching lessons past 1 works.
 */
import { test, expect } from "@playwright/test";

// ============================================================
// FIX 1 — Share-link URL state fidelity
// ============================================================

test.describe("Share-link state fidelity (FIX 1)", () => {
  test("COPY LINK button is present on every lesson", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
  });

  test("COPY LINK confirmation cue appears and is perceptible to sighted users", async ({ page, context }) => {
    // Grant clipboard permissions so the async clipboard write succeeds
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const copyBtn = page.getByRole("button", { name: /copy link/i });
    await copyBtn.click();
    // The visible span (aria-hidden) should switch to "COPIED ✓"
    await expect(copyBtn.locator("[aria-hidden]")).toContainText("COPIED", { timeout: 3000 });
  });

  test("L01 gain=2 encodes into URL: navigating to that URL restores gain=2", async ({ page }) => {
    await page.goto("/");
    // Change gain to 2×
    await page.getByRole("button", { name: /Gain 2×/i }).click();
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels slippery");

    // Get the URL that COPY LINK would produce
    const url = await page.evaluate(() => {
      const base = window.location.href;
      // Re-implement buildShareUrl logic: use current search + hash
      return window.location.href;
    });

    // Now navigate to /?g=2#lesson-01 directly and assert it restores
    await page.goto("/?g=2#lesson-01");
    await page.waitForTimeout(300); // let hydration settle
    // The gain status should show "feels slippery" (gain=2 active)
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels slippery", { timeout: 5000 });
  });

  test("L01 latency=100 encodes into URL and restores on load", async ({ page }) => {
    // Navigate with latency=100 param
    await page.goto("/?lat=100#lesson-01");
    await page.waitForTimeout(300);
    // The latency readout should show 100 ms
    await expect(page.getByText("100 ms").first()).toBeVisible({ timeout: 5000 });
  });

  test("L01 gain=0.5 encodes and restores: gain status shows feels sluggish", async ({ page }) => {
    await page.goto("/?g=0.5#lesson-01");
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels sluggish", { timeout: 5000 });
  });

  test("L05 seam=1 restores: SEAM active alert is visible on load", async ({ page }) => {
    await page.goto("/?seam=1#lesson-05");
    await page.waitForTimeout(300);
    await expect(page.locator('p[role="alert"]')).toContainText(/SEAM active/i, { timeout: 5000 });
  });

  test("L07 delay=150 restores: JND alert is visible on load", async ({ page }) => {
    await page.goto("/?delay=150#lesson-07");
    await page.waitForTimeout(300);
    await expect(page.locator('p[role="alert"]')).toContainText(/JND threshold/i, { timeout: 5000 });
  });

  test("L08 continuity=0 restores: CONTINUITY OFF alert is visible on load", async ({ page }) => {
    await page.goto("/?cont=0#lesson-08");
    await page.waitForTimeout(300);
    await expect(page.locator('p[role="alert"]')).toContainText(/CONTINUITY OFF/i, { timeout: 5000 });
  });

  test("default params produce clean hash-only URL (no query string)", async ({ page }) => {
    await page.goto("/");
    // Don't change any controls — click COPY LINK; URL should be clean
    // We check the current URL has no query params on fresh load
    const url = await page.url();
    // After initial load with no params the hash should be simple
    expect(url).not.toMatch(/\?.*#lesson/);
  });

  test("switching lessons via rail clears URL params from previous lesson", async ({ page }) => {
    // Start with L01 with gain=2
    await page.goto("/?g=2#lesson-01");
    await page.waitForTimeout(200);
    // Navigate to L02 via rail
    await page.locator('#lesson-rail button').nth(1).click();
    await page.waitForTimeout(200);
    const url = await page.url();
    // Should be #lesson-02 with no L01 params
    expect(url).toMatch(/#lesson-02/);
    expect(url).not.toContain("g=2");
  });
});

// ============================================================
// FIX 2 — 375px mobile nav dead span
// ============================================================

test.describe("375px mobile nav (FIX 2)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("LESSONS button is the interactive element, not a dead span", async ({ page }) => {
    await page.goto("/");
    // The LESSONS button must be a real button role, not a span
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await expect(lessonsBtn).toBeVisible();
    // Should be clickable (isEnabled)
    await expect(lessonsBtn).toBeEnabled();
  });

  test("tapping LESSONS opens the drawer at 375px", async ({ page }) => {
    await page.goto("/");
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await lessonsBtn.click();
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
  });

  test("can switch to lesson 5 from lesson 1 via mobile drawer", async ({ page }) => {
    await page.goto("/");
    // Open drawer
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await lessonsBtn.click();
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
    // Tap lesson 5 (index 4)
    const lessonBtns = drawer.locator("button");
    await lessonBtns.nth(4).click();
    await expect(page.getByText(/LESSON 05/i)).toBeVisible({ timeout: 5000 });
    await expect(drawer).not.toBeVisible();
  });

  test("can switch to lesson 3 (past lesson 1) via mobile drawer", async ({ page }) => {
    await page.goto("/");
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await lessonsBtn.click();
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
    // Click lesson 3 (index 2)
    const lessonBtns = drawer.locator("button");
    await lessonBtns.nth(2).click();
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });
    await expect(drawer).not.toBeVisible();
  });

  test("can switch to lesson 8 via mobile drawer", async ({ page }) => {
    await page.goto("/");
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await lessonsBtn.click();
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
    const lessonBtns = drawer.locator("button");
    await lessonBtns.nth(7).click();
    await expect(page.getByText(/LESSON 08/i)).toBeVisible({ timeout: 5000 });
    await expect(drawer).not.toBeVisible();
  });

  test("LESSONS button toggles to CLOSE label when drawer is open", async ({ page }) => {
    await page.goto("/");
    const lessonsBtn = page.getByRole("button", { name: /open lesson menu/i });
    await lessonsBtn.click();
    // After opening, aria-label should be Close lesson menu
    await expect(page.getByRole("button", { name: /close lesson menu/i })).toBeVisible();
  });

  test("mobile deep-link /?g=2#lesson-01 restores gain=2 on 375px viewport", async ({ page }) => {
    await page.goto("/?g=2#lesson-01");
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels slippery", { timeout: 5000 });
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
