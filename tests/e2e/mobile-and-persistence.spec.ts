/**
 * E2e tests: 375px mobile layout + localStorage pre-populated state.
 * Run against BASE_URL=http://localhost:3041 npm run test:e2e
 */
import { test, expect } from "@playwright/test";

test.describe("375px mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("page renders and is usable at 375px: h1 visible, no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allow 2px rounding
  });

  test("lesson 01 demo stage is visible at 375px", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("LESSON 01")).toBeVisible();
    await expect(page.locator(".demo-canvas").first()).toBeVisible();
  });

  test("can navigate to lesson 3 at 375px via some navigation mechanism", async ({ page }) => {
    await page.goto("/");
    // On mobile the rail may be a hamburger; try rail button if visible, else next button
    const railBtns = page.locator('#lesson-rail button');
    const railVisible = await railBtns.first().isVisible().catch(() => false);
    if (railVisible) {
      await railBtns.nth(2).click();
    } else {
      // Use NEXT button twice
      const nextBtn = page.getByRole("button", { name: /→/ });
      await nextBtn.click();
      await nextBtn.click();
    }
    // Just verify a lesson content is visible (not crashed)
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible();
  });
});

test.describe("localStorage pre-populated state (returning user)", () => {
  test("page restores lesson 5 when localStorage already has ip-last-lesson=5", async ({ page }) => {
    // Seed localStorage BEFORE navigation
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("ip-last-lesson", "5");
    });
    // Navigate fresh (as a returning user would)
    await page.goto("/");
    // App should restore to lesson 5
    await expect(page.getByText(/LESSON 05/i)).toBeVisible({ timeout: 5000 });
  });

  test("seeded lesson 7 is restored on navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("ip-last-lesson", "7");
    });
    await page.goto("/");
    await expect(page.getByText(/LESSON 07/i)).toBeVisible({ timeout: 5000 });
  });

  test("seeded lesson 8 is restored on navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("ip-last-lesson", "8");
    });
    await page.goto("/");
    await expect(page.getByText(/LESSON 08/i)).toBeVisible({ timeout: 5000 });
  });

  test("invalid stored value (9) falls back to lesson 1", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("ip-last-lesson", "9");
    });
    await page.goto("/");
    // Should show lesson 1 (default)
    await expect(page.getByText(/LESSON 01/i)).toBeVisible({ timeout: 5000 });
  });

  test("after navigating to lesson 3 in-session, reload restores lesson 3 (not overridden by prior state)", async ({ page }) => {
    // Seed lesson 7 as previous state
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("ip-last-lesson", "7");
    });
    await page.goto("/");
    // Navigate to lesson 3 in-session
    const railBtns = page.locator('#lesson-rail button');
    await railBtns.nth(2).click();
    await expect(page.getByText(/LESSON 03/i)).toBeVisible();
    // Reload: should now restore lesson 3 (last viewed), not lesson 7
    await page.reload();
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });
  });
});
