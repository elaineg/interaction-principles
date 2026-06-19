# UX Brief — Interaction Principles

## 1. Problem statement
Interactive lessons in how interfaces *feel* — grab the controls and feel why good motion is good, free and no signup.
(Hero headline, lowercase: "interactive lessons in how interfaces feel.")

## 2. Primary user action
Grab and drag a live object, then move a slider/toggle and watch the motion (and its honest readout) change. The landing view lands ALREADY on lesson 01 with the ink square sitting under where the pointer will go, the GAIN/LATENCY controls visible without scrolling, and a `← drag me` hairline hint on the object. The user manipulates before reading. No submit, no start button, no intro screen.

## 3. Emotional tone
Serious editorial craft that happens to move — "a design publication you can grab." Type: neutral grotesque (Helvetica Neue → Archivo), restrained. Color temperature: pure monochrome ink/paper/grey, the single `--red` reserved for "wrong." Spacing: generous, loose vertical rhythm (48–96px), composed whitespace — calm chrome so the motion inside the canvas is the only thing that draws the eye.

## 4. Design decisions
- **Controls are always-visible instruments, never disclosed.** Every lesson's control panel + live readouts render directly under the demo stage in plain sight (sliders, segmented controls, toggles with uppercase labels + tabular-nums values). NEVER behind an accordion/"show controls"/settings gear. The demo invites manipulation cold: at least one control per lesson visibly moves the demo, and the readout updates on the same frame. (This is the app's reason to exist — burying it is the failure mode.)
- **The good-vs-bad A/B is felt, not described.** Each lesson has an explicit toggle/side-by-side; flipping to the naïve version makes the jank physically feelable, with the bad side + dropped-frame marks in `--red` (marks/text only, never fills). The contrast is the teaching.
- **Instruments are visibly live and honest.** Readouts (fps, velocity px/s, gain/latency delta, frame-budget bar) tick continuously and provably match the rendered motion — a designer/engineer can open devtools and the numbers hold. A lying instrument is a P0 bug. Where a capability is absent (haptics, 120Hz), the readout says so instead of faking it.

## 5. 5-second check (above the fold, desktop)
- **Headline:** "interactive lessons in how interfaces feel." (lowercase display)
- **Subtitle:** one line — "grab the controls. feel the physics. free, no signup."
- **Left rail:** the numbered index of all 8 lessons (number + title + one-line subtitle), lesson 01 active — proves it's a curriculum.
- **Primary action / pre-filled example:** lesson 01's bordered demo stage already showing the draggable ink square with a `drag me` hint, GAIN (0.5×/1×/2×) and LATENCY (0–200ms) controls + live px-delta readout visible — the outcome is on screen before any input.

## Per-lesson canonical anatomy (all 8 identical, so the curriculum feels consistent)
1. Eyebrow micro-label (`LESSON 0N — FEEL`). 2. Lowercase headline. 3. Lede (2–3 plain-English sentences). 4. Bordered DEMO STAGE (1px `--grey-200` frame) — the one place motion lives. 5. CONTROL PANEL: always-visible labeled controls, each with a tabular-nums value. 6. INSTRUMENTS row where relevant (live, honest). 7. A/B good-vs-bad toggle (bad side in `--red`). 8. "WHY IT MATTERS FOR YOUR PORTFOLIO" note (hairline above, 2–4 sentences). 9. Prev/Next. Last-viewed lesson + control settings restored from localStorage.

## Chrome vs. canvas division (the central rule)
- **CHROME = strict SSENSE, motionless.** Page frame, rail, headings, copy, control panels, sliders, buttons, readouts: monochrome ink/paper/grey, 1px hairlines, square corners, uppercase 11px tracked labels, no shadow/radius/gradient/color, hover = inversion, transitions = 120ms fades only. Honor `prefers-reduced-motion` for all chrome.
- **DEMO CANVAS = the "product photography."** Inside the bordered stage, demonstrated motion is allowed to overshoot/spring/stutter because that motion IS the content. Moving objects stay monochrome (ink shapes, grey ghosts, 1px trails). `--red` only on the bad side + dropped-frame marks. Reduced-motion shows an explicit "enable motion to view this lesson" affordance per canvas — never silently break.

## Mobile / 375px (build-#1 requirement)
Every control and demo must render and be usable at 375px from the first build — no affordance ships desktop-only. Rail collapses to a horizontal scrolling `01–08` lesson strip (or top selector); demo stages go full-width; controls stack vertically, full-width touch targets (≥44px), readouts stay visible beneath each control. All dragging via Pointer Events (`setPointerCapture`) so touch works identically to mouse. Demos that need absent hardware (120Hz refresh, haptics) degrade gracefully and SAY they're unavailable rather than appearing broken. Gutters 16px mobile / 32–48px desktop; content never touches edges.
