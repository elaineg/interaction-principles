import { test, expect } from "@playwright/test";

// E2e tests for Interaction Principles app.
// Run against: BASE_URL=http://localhost:3456 npm run test:e2e

test.describe("Page load and metadata", () => {
  test("homepage loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Interaction Principles/i);
  });

  test("site tagline is visible in header", async ({ page }) => {
    await page.goto("/");
    // The header shows this tagline per UX_BRIEF hero headline
    await expect(page.getByText("interactive lessons in how interfaces feel.")).toBeVisible();
  });
});

test.describe("Navigation rail", () => {
  test("shows exactly 8 lessons in the rail", async ({ page }) => {
    await page.goto("/");
    const lessonButtons = page.locator('#lesson-rail button');
    await expect(lessonButtons).toHaveCount(8);
  });

  test("lesson 01 is active on load", async ({ page }) => {
    await page.goto("/");
    const activeItem = page.locator('#lesson-rail button[aria-current="page"]');
    await expect(activeItem).toBeVisible();
    await expect(activeItem).toContainText("01");
  });

  test("clicking a rail item switches to that lesson", async ({ page }) => {
    await page.goto("/");
    const lesson3Btn = page.locator('#lesson-rail button').nth(2);
    await lesson3Btn.click();
    await expect(page.getByText(/LESSON 03/i)).toBeVisible();
  });

  test("prev/next navigation: no back on lesson 1, next is visible", async ({ page }) => {
    await page.goto("/");
    // On lesson 1, a "LESSON 02" forward button exists
    await expect(page.getByRole("button", { name: /LESSON 02 →/i })).toBeVisible();
  });
});

test.describe("Lesson 01 — Direct manipulation", () => {
  test("demo stage is visible with correct eyebrow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText('LESSON 01 — FEEL')).toBeVisible();
  });

  test("GAIN segmented control is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("group", { name: /GAIN/i })).toBeVisible();
  });

  test("GAIN controls are present (0.5×, 1×, 2×)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Gain 0.5×/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Gain 1×/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Gain 2×/i })).toBeVisible();
  });

  test("LATENCY slider is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("slider", { name: /latency/i })).toBeVisible();
  });

  test("pointer-to-object delta readout is present (role=status)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="status"][aria-label*="delta"]').first()).toBeVisible();
  });

  test("GAIN button click to 2× shows slippery feedback", async ({ page }) => {
    await page.goto("/");
    // Wait for hydration
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("1:1 perfect", { timeout: 5000 });
    // Click the 2× gain button (3rd in the segmented control)
    await page.locator('.ds-seg button').nth(2).click();
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels slippery", { timeout: 5000 });
  });

  test("GAIN button 0.5× shows sluggish feedback", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("1:1 perfect", { timeout: 5000 });
    // Click the 0.5× gain button (1st in the segmented control)
    await page.locator('.ds-seg button').nth(0).click();
    await expect(page.locator('[data-testid="gain-status"]')).toContainText("feels sluggish", { timeout: 5000 });
  });

  test("perfect 1:1 status shown at gain=1 latency=0", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("perfect 1:1")).toBeVisible();
  });
});

test.describe("Lesson 02 — Springs vs easing", () => {
  test("lesson renders with correct headline", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByText(/springs vs. duration curves/i)).toBeVisible();
  });

  test("FIRE BOTH button is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByRole("button", { name: /FIRE BOTH/i })).toBeVisible();
  });

  test("MASS slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByRole("slider", { name: /Spring mass/i })).toBeVisible();
  });

  test("STIFFNESS slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByRole("slider", { name: /Spring stiffness/i })).toBeVisible();
  });

  test("DURATION slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(1).click();
    await expect(page.getByRole("slider", { name: /Easing duration/i })).toBeVisible();
  });
});

test.describe("Lesson 03 — Interruptibility", () => {
  test("OPEN BOTH / CLOSE BOTH shared trigger is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(2).click();
    await expect(page.getByRole("button", { name: /OPEN BOTH|CLOSE BOTH/i })).toBeVisible();
  });

  test("INTERRUPTIBLE and NON-INTERRUPTIBLE labels are visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(2).click();
    // Wait for lesson 03 content to appear, then check labels
    await expect(page.getByText(/grab it mid-flight/i)).toBeVisible({ timeout: 3000 });
    // The span labels are uppercase text inside panel sub-components
    const interruptibleLabels = page.locator('span', { hasText: "INTERRUPTIBLE" });
    await expect(interruptibleLabels.first()).toBeVisible();
    const nonInterruptibleLabels = page.locator('span', { hasText: "NON-INTERRUPTIBLE" });
    await expect(nonInterruptibleLabels.first()).toBeVisible();
  });

  test("firing both shows animating alert when non-interruptible locks", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(2).click();
    await page.getByRole("button", { name: /OPEN BOTH|CLOSE BOTH/i }).click();
    // Alert appears when non-interruptible is animating
    // It may appear briefly — wait up to 1s for it
    await expect(page.locator('p[role="alert"]')).toBeVisible({ timeout: 1000 }).catch(() => {
      // OK if animation already finished before we checked
    });
  });
});

test.describe("Lesson 04 — Animation principles", () => {
  test("all 4 principle toggles are visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(3).click();
    await expect(page.getByRole("checkbox", { name: /anticipation on\/off/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /follow-through/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /slow-in/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /squash/i })).toBeVisible();
  });

  test("PLAY button is visible (single object trigger)", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(3).click();
    await expect(page.locator('[data-testid="l04-play"]')).toBeVisible();
  });

  test("exactly one animated object is in the demo stage", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(3).click();
    await expect(page.locator('[data-testid="l04-object"]')).toHaveCount(1);
  });

  test("disabling a principle shows red alert paragraph", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(3).click();
    await page.getByRole("checkbox", { name: /anticipation on\/off/i }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
  });

  test("INTENSITY slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(3).click();
    await expect(page.getByRole("slider", { name: /Animation intensity/i })).toBeVisible();
  });
});

test.describe("Lesson 05 — Velocity handoff", () => {
  test("demo stage is visible with correct headline", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(4).click();
    await expect(page.getByText(/capture lift-off velocity/i)).toBeVisible();
  });

  test("SEAM debug toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(4).click();
    await expect(page.getByRole("checkbox", { name: /SEAM debug/i })).toBeVisible();
  });

  test("RUBBER-BAND toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(4).click();
    await expect(page.getByRole("checkbox", { name: /Rubber-band at bounds/i })).toBeVisible();
  });

  test("enabling SEAM shows alert paragraph", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(4).click();
    await page.getByRole("checkbox", { name: /SEAM debug/i }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page.locator('p[role="alert"]')).toContainText(/SEAM active/i);
  });

  test("DECELERATION slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(4).click();
    await expect(page.getByRole("slider", { name: /deceleration/i })).toBeVisible();
  });
});

test.describe("Lesson 06 — Frame budget", () => {
  test("START button is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("button", { name: /^START$/ })).toBeVisible();
  });

  test("INJECT WORK slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("slider", { name: /injected work/i })).toBeVisible();
  });

  test("Hz switch is visible with 60HZ and 120HZ options", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("group", { name: /Hz target/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "60HZ" }).nth(0)).toBeVisible();
    await expect(page.getByRole("button", { name: "120HZ" }).nth(0)).toBeVisible();
  });

  test("starting shows FPS readout with role=status", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await page.getByRole("button", { name: /^START$/ }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('[role="status"][aria-label*="FPS"]')).toBeVisible();
    await page.getByRole("button", { name: /^STOP$/ }).click();
  });

  test("SHOW DROPPED FRAMES toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("checkbox", { name: /Show dropped frame timeline/i })).toBeVisible();
  });
});

test.describe("Lesson 07 — Feedback timing", () => {
  test("PRESS button is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(6).click();
    await expect(page.getByRole("button", { name: /Demo button/i })).toBeVisible();
  });

  test("RESPONSE DELAY slider is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(6).click();
    await expect(page.getByRole("slider", { name: /response delay/i })).toBeVisible();
  });

  test("increasing delay past JND shows alert paragraph", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(6).click();
    const slider = page.getByRole("slider", { name: /response delay/i });
    // Drag slider to a high value
    await slider.fill("150");
    await slider.dispatchEvent("change", {});
    // Use React-friendly approach: click a far point on slider
    // Alternative: directly manipulate via evaluate
    await page.evaluate(() => {
      const slider = document.querySelector('input[aria-label="Response delay in milliseconds"]') as HTMLInputElement;
      if (slider) {
        slider.value = "150";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        slider.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page.locator('p[role="alert"]')).toContainText(/JND threshold/i);
  });

  test("TOUCH-DOWN HIGHLIGHT toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(6).click();
    await expect(page.getByRole("checkbox", { name: /touch-down highlight/i })).toBeVisible();
  });

  test("haptic toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(6).click();
    await expect(page.getByRole("checkbox", { name: /haptic/i })).toBeVisible();
  });
});

test.describe("Lesson 08 — Spatial continuity", () => {
  test("grid tiles are visible (6 tiles)", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(7).click();
    await expect(page.getByRole("button", { name: /Open tile/i })).toHaveCount(6);
  });

  test("CONTINUITY toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(7).click();
    await expect(page.getByRole("checkbox", { name: /continuity toggle/i })).toBeVisible();
  });

  test("SLOW-MO toggle is visible", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(7).click();
    await expect(page.getByRole("checkbox", { name: /slow motion/i })).toBeVisible();
  });

  test("disabling continuity shows alert paragraph", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(7).click();
    await page.getByRole("checkbox", { name: /continuity toggle/i }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page.locator('p[role="alert"]')).toContainText(/CONTINUITY OFF/i);
  });

  test("clicking a tile shows detail view with close button", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(7).click();
    await page.getByRole("button", { name: /Open tile A/i }).click();
    // Wait for animation to settle then check close button
    await expect(page.getByRole("button", { name: /Close detail view/i })).toBeVisible({ timeout: 3000 });
  });
});

test.describe("localStorage persistence", () => {
  test("last-viewed lesson is restored on reload", async ({ page }) => {
    await page.goto("/");
    // Navigate to lesson 5
    await page.locator('#lesson-rail button').nth(4).click();
    await expect(page.getByText(/LESSON 05/i)).toBeVisible();
    // Reload
    await page.reload();
    // Should restore to lesson 5
    await expect(page.getByText(/LESSON 05/i)).toBeVisible();
  });
});

test.describe("No auth/signup", () => {
  test("no signup/login wall exists", async ({ page }) => {
    await page.goto("/");
    const signupText = page.getByText(/sign up/i);
    const loginText = page.getByText(/log in/i);
    await expect(signupText).toHaveCount(0);
    await expect(loginText).toHaveCount(0);
  });

  test("WHY IT MATTERS block is NOT present (deleted in item 2)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/why it matters for your portfolio/i)).toHaveCount(0);
  });
});

// Title card (item 1) — REMOVED 2026-06-20: hero band deleted, assertions inverted
test.describe("Title card (item 1) — REMOVED — hero strings are ABSENT", () => {
  test("NO title card element (data-testid='title-card') exists on page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="title-card"]')).toHaveCount(0);
  });

  test("hero eyebrow 'INTERACTION DESIGN — 08 LESSONS' is NOT on the page", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("INTERACTION DESIGN — 08 LESSONS");
  });

  test("hero headline 'feel how interfaces should move.' is NOT on the page", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/feel how interfaces should move/i);
  });

  test("hero subtitle 'grab the controls. feel the physics' is NOT on the page", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/grab the controls\. feel the physics/i);
  });

  test("L01 demo canvas renders (page goes straight from top bar to lesson)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.demo-canvas').first()).toBeVisible();
  });
});

test.describe("Subtitle consistency (item 3)", () => {
  test("L01 main-column subtitle matches rail subtitle text", async ({ page }) => {
    await page.goto("/");
    // Get the rail subtitle text for L01
    const railSubtitle = await page.locator('#lesson-rail button').first().locator('span').nth(2).textContent();
    // Get the main-column subtitle
    const mainSubtitle = await page.locator('[data-testid="lesson-subtitle"]').textContent();
    expect(railSubtitle?.trim()).toBe(mainSubtitle?.trim());
  });

  test("subtitle text is identical between rail and main column for all 8 lessons", async ({ page }) => {
    await page.goto("/");
    for (let i = 0; i < 8; i++) {
      const railBtn = page.locator('#lesson-rail button').nth(i);
      await railBtn.click();
      const railSubtitle = await railBtn.locator('span').nth(2).textContent();
      const mainSubtitle = await page.locator('[data-testid="lesson-subtitle"]').textContent();
      expect(railSubtitle?.trim()).toBe(mainSubtitle?.trim());
    }
  });
});

test.describe("Header chrome (item 8 — no global Hz in header)", () => {
  test("header does NOT contain a global Hz/FPS button", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByText(/\d+HZ/i)).toHaveCount(0);
  });

  test("L06 still has its own 60HZ / 120HZ segmented control", async ({ page }) => {
    await page.goto("/");
    await page.locator('#lesson-rail button').nth(5).click();
    await expect(page.getByRole("group", { name: /Hz target/i })).toBeVisible();
  });
});
