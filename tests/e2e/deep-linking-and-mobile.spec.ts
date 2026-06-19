/**
 * E2e tests: URL hash deep-linking + mobile lesson drawer.
 */
import { test, expect } from "@playwright/test";

test.describe("URL hash deep-linking", () => {
  test("navigating to /#lesson-03 loads lesson 3 on first paint", async ({ page }) => {
    await page.goto("/#lesson-03");
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });
  });

  test("navigating to /#lesson-06 loads lesson 6 on first paint", async ({ page }) => {
    await page.goto("/#lesson-06");
    await expect(page.getByText(/LESSON 06/i)).toBeVisible({ timeout: 5000 });
  });

  test("switching lessons via rail updates the URL hash", async ({ page }) => {
    await page.goto("/");
    // Click lesson 5
    const lesson5Btn = page.locator('#lesson-rail button').nth(4);
    await lesson5Btn.click();
    await expect(page).toHaveURL(/#lesson-05/);
  });

  test("copy link button is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
  });
});

test.describe("Mobile lesson drawer (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("LESSONS button is visible on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /open lesson menu/i })).toBeVisible();
  });

  test("tapping LESSONS opens the drawer", async ({ page }) => {
    await page.goto("/");
    const menuBtn = page.getByRole("button", { name: /open lesson menu/i });
    await menuBtn.click();
    // Drawer is open: dialog with lesson buttons visible
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
  });

  test("tapping lesson 5 in drawer shows lesson 5 and closes the drawer", async ({ page }) => {
    await page.goto("/");
    const menuBtn = page.getByRole("button", { name: /open lesson menu/i });
    await menuBtn.click();
    const drawer = page.getByRole("dialog", { name: /lesson menu/i });
    await expect(drawer).toBeVisible();
    // Click the 5th lesson button (index 4) inside the drawer
    const lessonBtns = drawer.locator("button");
    await lessonBtns.nth(4).click();
    // Lesson 5 content is shown
    await expect(page.getByText(/LESSON 05/i)).toBeVisible({ timeout: 5000 });
    // Drawer is closed
    await expect(drawer).not.toBeVisible();
  });

  test("mobile deep-link /#lesson-07 loads lesson 7 at 375px", async ({ page }) => {
    await page.goto("/#lesson-07");
    await expect(page.getByText(/LESSON 07/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Copy config on L01/L02/L06", () => {
  test("Lesson 01 has a copy config button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /copy these settings/i })).toBeVisible();
  });

  test("Lesson 02 has a copy config button", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByRole("button", { name: /copy these settings/i })).toBeVisible();
  });

  test("Lesson 06 has a copy config button", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("button", { name: /copy these settings/i })).toBeVisible();
  });
});
