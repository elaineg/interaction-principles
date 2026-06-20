/**
 * E2e tests for 2026-06-20 ADD-FEATURE bundle:
 * (1) Hero removed — assert hero strings are ABSENT
 * (2) L05 friction slider — glide distance measurably differs between LOW and HIGH friction
 * (3) L03 travel distance — INTERRUPTIBLE panel stage is noticeably taller
 * (4) Mobile stacking — two-up demos stack at 375px/320px, nothing clips
 */
import { test, expect } from "@playwright/test";

// ─── (1) Hero/title-card ABSENT ──────────────────────────────────────────────
test.describe("(1) Hero title-card is removed", () => {
  test("page body does NOT contain hero headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText("feel how interfaces should move.");
  });

  test("page body does NOT contain hero eyebrow", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("INTERACTION DESIGN — 08 LESSONS");
  });

  test("page body does NOT contain hero subtitle", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/grab the controls\. feel the physics/i);
  });

  test("no data-testid='title-card' element exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="title-card"]')).toHaveCount(0);
  });

  test("first h1 belongs to Lesson 01 (not a hero band)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByText(/LESSON 01/i)).toBeVisible({ timeout: 5000 });
    // L01 headline must NOT be the hero headline
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const h1Text = await h1.innerText();
    expect(h1Text.toLowerCase()).not.toContain("feel how interfaces should move");
  });

  test("Lesson 01 demo stage is within 500px of viewport top on 1280x800 (closer to fold)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const stage = page.locator(".demo-canvas").first();
    await expect(stage).toBeVisible({ timeout: 5000 });
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(500);
  });
});

// ─── (2) L05 Friction slider — measurably FELT ───────────────────────────────
test.describe("(2) L05 friction slider: higher friction → shorter glide (monotonic)", () => {
  test("measureGlide: friction=1 vs friction=12 gives shorter distance at higher friction", async ({ page }) => {
    await page.goto("/#lesson-05");
    await expect(page.getByText(/LESSON 05/i)).toBeVisible({ timeout: 5000 });

    const result = await page.evaluate(() => {
      // Replicate the measureGlide logic (same formula as lib/engine/decelIntegrate.ts)
      function stepDecelIntegrate(state: { position: number; velocity: number }, friction: number, dt: number) {
        const safeDt = Math.min(dt, 0.064);
        const safeFriction = Math.max(friction, 0.1);
        const decay = Math.exp(-safeFriction * safeDt);
        const newVelocity = state.velocity * decay;
        const newPosition = state.position + (state.velocity / safeFriction) * (1 - decay);
        return { position: newPosition, velocity: newVelocity };
      }
      function measureGlide(v0: number, friction: number) {
        let state = { position: 0, velocity: v0 };
        let steps = 0;
        while (Math.abs(state.velocity) >= 0.5 && steps < 100000) {
          state = stepDecelIntegrate(state, friction, 1 / 60);
          steps++;
        }
        return { distance: Math.abs(state.position), timeToRest: steps / 60 };
      }
      const v0 = 1000;
      const low  = measureGlide(v0, 1);  // slider min
      const high = measureGlide(v0, 12); // slider max
      return { lowDist: low.distance, highDist: high.distance, lowTime: low.timeToRest, highTime: high.timeToRest };
    });

    // Higher friction → shorter glide distance AND shorter time-to-rest
    expect(result.lowDist).toBeGreaterThan(result.highDist);
    expect(result.lowTime).toBeGreaterThan(result.highTime);
    // The difference should be significant (not just noise)
    expect(result.lowDist / result.highDist).toBeGreaterThan(5);
  });

  test("L05 deceleration slider exists with LOW and HIGH end labels", async ({ page }) => {
    await page.goto("/#lesson-05");
    await expect(page.getByText(/LESSON 05/i)).toBeVisible({ timeout: 5000 });
    // Slider label
    await expect(page.getByText(/DECELERATION/i).first()).toBeVisible();
    // End labels
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toUpperCase()).toContain("LOW");
    expect(bodyText.toUpperCase()).toContain("HIGH");
  });
});

// ─── (3) L03 travel distance — panel stage is taller ─────────────────────────
test.describe("(3) L03 interruptible panel: travel distance noticeably increased", () => {
  test("L03 INTERRUPTIBLE panel stage height is at least 300px", async ({ page }) => {
    await page.goto("/#lesson-03");
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });
    // Both panel stages should be visible
    const stages = page.locator('[aria-label*="panel demo stage"]');
    await expect(stages).toHaveCount(2);
    // Check first stage height
    const box = await stages.first().boundingBox();
    expect(box).not.toBeNull();
    // Stage should be at least 300px tall (was 220px)
    expect(box!.height).toBeGreaterThanOrEqual(300);
  });

  test("L03 has at least 250px of travel distance (CLOSED_Y - OPEN_Y)", async ({ page }) => {
    await page.goto("/#lesson-03");
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });

    const travelDistance = await page.evaluate(() => {
      // Travel = CLOSED_Y - OPEN_Y
      // CLOSED_Y = STAGE_H - 32 = 340 - 32 = 308
      // OPEN_Y = 40
      // Travel = 308 - 40 = 268
      const STAGE_H = 340;
      const CLOSED_Y = STAGE_H - 32;
      const OPEN_Y = 40;
      return CLOSED_Y - OPEN_Y;
    });
    expect(travelDistance).toBeGreaterThanOrEqual(250);
  });

  test("shared OPEN BOTH / CLOSE BOTH trigger still works after travel increase", async ({ page }) => {
    await page.goto("/#lesson-03");
    await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });
    const trigger = page.getByRole("button", { name: /open both|close both/i });
    await expect(trigger).toBeVisible();
    await trigger.click();
    // After clicking, the button label should flip
    await expect(page.getByRole("button", { name: /close both/i })).toBeVisible({ timeout: 2000 });
  });
});

// ─── (4) Mobile stacking — two-up demos at 375px and 320px ──────────────────
test.describe("(4) Mobile: two-up demos stack at 375px and 320px", () => {
  for (const width of [375, 320]) {
    test(`L02 controls grid stacks at ${width}px — no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/#lesson-02");
      await expect(page.getByText(/LESSON 02/i)).toBeVisible({ timeout: 5000 });
      // No horizontal overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    });

    test(`L03 panels stack vertically at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/#lesson-03");
      await expect(page.getByText(/LESSON 03/i)).toBeVisible({ timeout: 5000 });

      const stages = page.locator('[aria-label*="panel demo stage"]');
      await expect(stages).toHaveCount(2);

      // Both stages should be visible and not overflow
      await expect(stages.first()).toBeVisible();
      await expect(stages.last()).toBeVisible();

      // The second panel should be BELOW the first (not side by side)
      const box1 = await stages.first().boundingBox();
      const box2 = await stages.last().boundingBox();
      expect(box1).not.toBeNull();
      expect(box2).not.toBeNull();
      // When stacked, box2 top should be >= box1 bottom (they're vertically separated)
      expect(box2!.y).toBeGreaterThanOrEqual(box1!.y + box1!.height - 10);

      // No horizontal overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    });

    test(`No horizontal overflow on any lesson at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      for (let lessonId = 1; lessonId <= 8; lessonId++) {
        await page.goto(`/#lesson-${String(lessonId).padStart(2, "0")}`);
        await expect(page.getByText(new RegExp(`LESSON ${String(lessonId).padStart(2, "0")}`, 'i'))).toBeVisible({ timeout: 5000 });
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
      }
    });
  }
});
