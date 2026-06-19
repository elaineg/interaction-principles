# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.test.ts >> localStorage persistence >> last-viewed lesson is restored on reload
- Location: tests/e2e/app.test.ts:338:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/LESSON 05/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/LESSON 05/i)

```

```yaml
- banner:
  - text: INTERACTION PRINCIPLES 08 LESSONS
  - button "Switch to 120Hz target": 60HZ
- navigation "Lesson navigation":
  - button "01 direct manipulation 1:1 tracking, gain, and latency"
  - button "02 springs vs easing Physics-based motion vs easing curves"
  - button "03 interruptibility State continuity and velocity handoff"
  - button "04 animation principles Anticipation, follow-through, slow-in/out, squash & stretch"
  - button "05 velocity handoff Gesture → inertia with zero visual seam"
  - button "06 frame budget Frame budget, jank, and the honest FPS meter"
  - button "07 feedback timing Feedback timing and just-noticeable difference"
  - button "08 spatial continuity Spatial and navigational continuity"
- main:
  - text: LESSON 01 — FEEL
  - heading "content moves with your finger." [level=1]
  - paragraph: "The most important principle in interaction design: the object under your pointer must feel like an extension of your hand. Any gain ≠ 1 or latency > 0 breaks the illusion instantly. Everything else in this curriculum rests on this bedrock."
  - text: GAIN
  - group "GAIN control":
    - button "Gain 0.5×": 0.5×
    - button "Gain 1×" [pressed]: 1×
    - button "Gain 2×": 2×
  - text: 1:1 perfect LATENCY (ADDED MS) 0 ms
  - slider "Added latency in milliseconds": "0"
  - text: 0 ms ~100ms JND 200 ms POINTER → OBJECT DELTA
  - 'status "Pointer to object delta: 0 px"': 0 px
  - text: ACTIVE GAIN 1× ADDED LATENCY 0 ms STATUS perfect 1:1
  - heading "Why it matters for your portfolio" [level=4]
  - paragraph: "If this isn't perfect, nothing else matters. Gain = 1 and latency → 0 is the bedrock. Showing a recruiter you obsess over the thing under the finger first — before visual polish — signals interaction craft at the architecture level. Try GAIN 0.5×: feels laggy. GAIN 2×: feels slippery. LATENCY 100ms: physically uncomfortable. That's the lesson."
  - button "LESSON 02 →"
```

# Test source

```ts
  242 |     await page.waitForTimeout(200);
  243 |     await expect(page.locator('[role="status"][aria-label*="FPS"]')).toBeVisible();
  244 |     await page.getByRole("button", { name: /^STOP$/ }).click();
  245 |   });
  246 | 
  247 |   test("SHOW DROPPED FRAMES toggle is visible", async ({ page }) => {
  248 |     await page.goto("/");
  249 |     await page.locator('#lesson-rail button').nth(5).click();
  250 |     await expect(page.getByRole("checkbox", { name: /Show dropped frame timeline/i })).toBeVisible();
  251 |   });
  252 | });
  253 | 
  254 | test.describe("Lesson 07 — Feedback timing", () => {
  255 |   test("PRESS button is visible", async ({ page }) => {
  256 |     await page.goto("/");
  257 |     await page.locator('#lesson-rail button').nth(6).click();
  258 |     await expect(page.getByRole("button", { name: /Demo button/i })).toBeVisible();
  259 |   });
  260 | 
  261 |   test("RESPONSE DELAY slider is visible", async ({ page }) => {
  262 |     await page.goto("/");
  263 |     await page.locator('#lesson-rail button').nth(6).click();
  264 |     await expect(page.getByRole("slider", { name: /response delay/i })).toBeVisible();
  265 |   });
  266 | 
  267 |   test("increasing delay past JND shows alert paragraph", async ({ page }) => {
  268 |     await page.goto("/");
  269 |     await page.locator('#lesson-rail button').nth(6).click();
  270 |     const slider = page.getByRole("slider", { name: /response delay/i });
  271 |     // Drag slider to a high value
  272 |     await slider.fill("150");
  273 |     await slider.dispatchEvent("change", {});
  274 |     // Use React-friendly approach: click a far point on slider
  275 |     // Alternative: directly manipulate via evaluate
  276 |     await page.evaluate(() => {
  277 |       const slider = document.querySelector('input[aria-label="Response delay in milliseconds"]') as HTMLInputElement;
  278 |       if (slider) {
  279 |         slider.value = "150";
  280 |         slider.dispatchEvent(new Event("input", { bubbles: true }));
  281 |         slider.dispatchEvent(new Event("change", { bubbles: true }));
  282 |       }
  283 |     });
  284 |     await expect(page.locator('p[role="alert"]')).toBeVisible();
  285 |     await expect(page.locator('p[role="alert"]')).toContainText(/JND threshold/i);
  286 |   });
  287 | 
  288 |   test("TOUCH-DOWN HIGHLIGHT toggle is visible", async ({ page }) => {
  289 |     await page.goto("/");
  290 |     await page.locator('#lesson-rail button').nth(6).click();
  291 |     await expect(page.getByRole("checkbox", { name: /touch-down highlight/i })).toBeVisible();
  292 |   });
  293 | 
  294 |   test("haptic toggle is visible", async ({ page }) => {
  295 |     await page.goto("/");
  296 |     await page.locator('#lesson-rail button').nth(6).click();
  297 |     await expect(page.getByRole("checkbox", { name: /haptic/i })).toBeVisible();
  298 |   });
  299 | });
  300 | 
  301 | test.describe("Lesson 08 — Spatial continuity", () => {
  302 |   test("grid tiles are visible (6 tiles)", async ({ page }) => {
  303 |     await page.goto("/");
  304 |     await page.locator('#lesson-rail button').nth(7).click();
  305 |     await expect(page.getByRole("button", { name: /Open tile/i })).toHaveCount(6);
  306 |   });
  307 | 
  308 |   test("CONTINUITY toggle is visible", async ({ page }) => {
  309 |     await page.goto("/");
  310 |     await page.locator('#lesson-rail button').nth(7).click();
  311 |     await expect(page.getByRole("checkbox", { name: /continuity toggle/i })).toBeVisible();
  312 |   });
  313 | 
  314 |   test("SLOW-MO toggle is visible", async ({ page }) => {
  315 |     await page.goto("/");
  316 |     await page.locator('#lesson-rail button').nth(7).click();
  317 |     await expect(page.getByRole("checkbox", { name: /slow motion/i })).toBeVisible();
  318 |   });
  319 | 
  320 |   test("disabling continuity shows alert paragraph", async ({ page }) => {
  321 |     await page.goto("/");
  322 |     await page.locator('#lesson-rail button').nth(7).click();
  323 |     await page.getByRole("checkbox", { name: /continuity toggle/i }).click();
  324 |     await expect(page.locator('p[role="alert"]')).toBeVisible();
  325 |     await expect(page.locator('p[role="alert"]')).toContainText(/CONTINUITY OFF/i);
  326 |   });
  327 | 
  328 |   test("clicking a tile shows detail view with close button", async ({ page }) => {
  329 |     await page.goto("/");
  330 |     await page.locator('#lesson-rail button').nth(7).click();
  331 |     await page.getByRole("button", { name: /Open tile A/i }).click();
  332 |     // Wait for animation to settle then check close button
  333 |     await expect(page.getByRole("button", { name: /Close detail view/i })).toBeVisible({ timeout: 3000 });
  334 |   });
  335 | });
  336 | 
  337 | test.describe("localStorage persistence", () => {
  338 |   test("last-viewed lesson is restored on reload", async ({ page }) => {
  339 |     await page.goto("/");
  340 |     // Navigate to lesson 5
  341 |     await page.locator('#lesson-rail button').nth(4).click();
> 342 |     await expect(page.getByText(/LESSON 05/i)).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  343 |     // Reload
  344 |     await page.reload();
  345 |     // Should restore to lesson 5
  346 |     await expect(page.getByText(/LESSON 05/i)).toBeVisible();
  347 |   });
  348 | });
  349 | 
  350 | test.describe("No auth/signup", () => {
  351 |   test("no signup/login wall exists", async ({ page }) => {
  352 |     await page.goto("/");
  353 |     const signupText = page.getByText(/sign up/i);
  354 |     const loginText = page.getByText(/log in/i);
  355 |     await expect(signupText).toHaveCount(0);
  356 |     await expect(loginText).toHaveCount(0);
  357 |   });
  358 | 
  359 |   test("WHY IT MATTERS section visible on lesson 1", async ({ page }) => {
  360 |     await page.goto("/");
  361 |     await expect(page.getByText(/why it matters for your portfolio/i)).toBeVisible();
  362 |   });
  363 | 
  364 |   test("WHY IT MATTERS visible on all 8 lessons", async ({ page }) => {
  365 |     await page.goto("/");
  366 |     for (let i = 0; i < 8; i++) {
  367 |       if (i > 0) await page.locator('#lesson-rail button').nth(i).click();
  368 |       await expect(page.getByText(/why it matters for your portfolio/i)).toBeVisible();
  369 |     }
  370 |   });
  371 | });
  372 | 
```