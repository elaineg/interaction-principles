# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.test.ts >> Lesson 08 — Spatial continuity >> grid tiles are visible (6 tiles)
- Location: tests/e2e/app.test.ts:302:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('button', { name: /Open tile/i })
Expected: 6
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByRole('button', { name: /Open tile/i })
    14 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: INTERACTION PRINCIPLES
    - generic [ref=e5]:
      - generic [ref=e6]: 08 LESSONS
      - button "Switch to 120Hz target" [ref=e7] [cursor=pointer]: 60HZ
  - generic [ref=e8]:
    - navigation "Lesson navigation" [ref=e9]:
      - button "01 direct manipulation 1:1 tracking, gain, and latency" [ref=e10] [cursor=pointer]:
        - generic [ref=e11]: "01"
        - generic [ref=e12]: direct manipulation
        - generic [ref=e13]: 1:1 tracking, gain, and latency
      - button "02 springs vs easing Physics-based motion vs easing curves" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: "02"
        - generic [ref=e16]: springs vs easing
        - generic [ref=e17]: Physics-based motion vs easing curves
      - button "03 interruptibility State continuity and velocity handoff" [ref=e18] [cursor=pointer]:
        - generic [ref=e19]: "03"
        - generic [ref=e20]: interruptibility
        - generic [ref=e21]: State continuity and velocity handoff
      - button "04 animation principles Anticipation, follow-through, slow-in/out, squash & stretch" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: "04"
        - generic [ref=e24]: animation principles
        - generic [ref=e25]: Anticipation, follow-through, slow-in/out, squash & stretch
      - button "05 velocity handoff Gesture → inertia with zero visual seam" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: "05"
        - generic [ref=e28]: velocity handoff
        - generic [ref=e29]: Gesture → inertia with zero visual seam
      - button "06 frame budget Frame budget, jank, and the honest FPS meter" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: "06"
        - generic [ref=e32]: frame budget
        - generic [ref=e33]: Frame budget, jank, and the honest FPS meter
      - button "07 feedback timing Feedback timing and just-noticeable difference" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: "07"
        - generic [ref=e36]: feedback timing
        - generic [ref=e37]: Feedback timing and just-noticeable difference
      - button "08 spatial continuity Spatial and navigational continuity" [active] [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: "08"
        - generic [ref=e40]: spatial continuity
        - generic [ref=e41]: Spatial and navigational continuity
    - main [ref=e42]:
      - generic [ref=e43]: LESSON 01 — FEEL
      - heading "content moves with your finger." [level=1] [ref=e44]
      - paragraph [ref=e45]: "The most important principle in interaction design: the object under your pointer must feel like an extension of your hand. Any gain ≠ 1 or latency > 0 breaks the illusion instantly. Everything else in this curriculum rests on this bedrock."
      - generic [ref=e46]:
        - generic "Drag the square. Adjust GAIN and LATENCY controls to feel the effect." [ref=e47]
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]: GAIN
            - group "GAIN control" [ref=e51]:
              - button "Gain 0.5×" [ref=e52] [cursor=pointer]: 0.5×
              - button "Gain 1×" [pressed] [ref=e53] [cursor=pointer]: 1×
              - button "Gain 2×" [ref=e54] [cursor=pointer]: 2×
            - generic [ref=e55]: 1:1 perfect
          - generic [ref=e56]:
            - generic [ref=e57]:
              - generic [ref=e58]: LATENCY (ADDED MS)
              - generic [ref=e59]: 0 ms
            - slider "Added latency in milliseconds" [ref=e60] [cursor=pointer]: "0"
            - generic [ref=e61]:
              - generic [ref=e62]: 0 ms
              - generic [ref=e63]: ~100ms JND
              - generic [ref=e64]: 200 ms
          - generic [ref=e65]:
            - generic [ref=e66]:
              - generic [ref=e67]: POINTER → OBJECT DELTA
              - 'status "Pointer to object delta: 0 px" [ref=e68]': 0 px
            - generic [ref=e69]:
              - generic [ref=e70]: ACTIVE GAIN
              - generic [ref=e71]: 1×
            - generic [ref=e72]:
              - generic [ref=e73]: ADDED LATENCY
              - generic [ref=e74]: 0 ms
            - generic [ref=e75]:
              - generic [ref=e76]: STATUS
              - generic [ref=e77]: perfect 1:1
      - generic [ref=e78]:
        - heading "Why it matters for your portfolio" [level=4] [ref=e79]
        - paragraph [ref=e80]: "If this isn't perfect, nothing else matters. Gain = 1 and latency → 0 is the bedrock. Showing a recruiter you obsess over the thing under the finger first — before visual polish — signals interaction craft at the architecture level. Try GAIN 0.5×: feels laggy. GAIN 2×: feels slippery. LATENCY 100ms: physically uncomfortable. That's the lesson."
      - button "LESSON 02 →" [ref=e82] [cursor=pointer]
```

# Test source

```ts
  205 |     await page.getByRole("checkbox", { name: /SEAM debug/i }).click();
  206 |     await expect(page.locator('p[role="alert"]')).toBeVisible();
  207 |     await expect(page.locator('p[role="alert"]')).toContainText(/SEAM active/i);
  208 |   });
  209 | 
  210 |   test("DECELERATION slider is visible", async ({ page }) => {
  211 |     await page.goto("/");
  212 |     await page.locator('#lesson-rail button').nth(4).click();
  213 |     await expect(page.getByRole("slider", { name: /deceleration/i })).toBeVisible();
  214 |   });
  215 | });
  216 | 
  217 | test.describe("Lesson 06 — Frame budget", () => {
  218 |   test("START button is visible", async ({ page }) => {
  219 |     await page.goto("/");
  220 |     await page.locator('#lesson-rail button').nth(5).click();
  221 |     await expect(page.getByRole("button", { name: /^START$/ })).toBeVisible();
  222 |   });
  223 | 
  224 |   test("INJECT WORK slider is visible", async ({ page }) => {
  225 |     await page.goto("/");
  226 |     await page.locator('#lesson-rail button').nth(5).click();
  227 |     await expect(page.getByRole("slider", { name: /injected work/i })).toBeVisible();
  228 |   });
  229 | 
  230 |   test("Hz switch is visible with 60HZ and 120HZ options", async ({ page }) => {
  231 |     await page.goto("/");
  232 |     await page.locator('#lesson-rail button').nth(5).click();
  233 |     await expect(page.getByRole("group", { name: /Hz target/i })).toBeVisible();
  234 |     await expect(page.getByRole("button", { name: "60HZ" }).nth(0)).toBeVisible();
  235 |     await expect(page.getByRole("button", { name: "120HZ" }).nth(0)).toBeVisible();
  236 |   });
  237 | 
  238 |   test("starting shows FPS readout with role=status", async ({ page }) => {
  239 |     await page.goto("/");
  240 |     await page.locator('#lesson-rail button').nth(5).click();
  241 |     await page.getByRole("button", { name: /^START$/ }).click();
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
> 305 |     await expect(page.getByRole("button", { name: /Open tile/i })).toHaveCount(6);
      |                                                                    ^ Error: expect(locator).toHaveCount(expected) failed
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
  342 |     await expect(page.getByText(/LESSON 05/i)).toBeVisible();
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