# UX Brief — Interaction Principles (ADD-FEATURE: batch of 8 fixes)

Refinement pass on the shipped 8-lesson curriculum. Chrome stays strict SSENSE
(`lib/design-system/ssense.css`): monochrome ink/paper/grey, 1px hairlines, square corners,
tiny uppercase tracked micro-labels, no shadows, generous whitespace. `--red #B00020` ONLY on the
bad/janky side of a comparison + dropped-frame markers. 100% client-side, no backend/auth/payments,
localStorage only, hand-rolled physics (no animation lib), Pointer Events + setPointerCapture,
`prefers-reduced-motion` respected. Do not regress any existing passing flow. Items 4 and 7 are
correctness P0s.

## 1. Problem statement
Feel how good interfaces move — grab a live object, flick it, tune the physics yourself; free, no signup.
(Hero/title-card headline, lowercase: "feel how interfaces should move.")

## 2. Primary user action
Grab and drag the live object, then move a control and watch the motion (and its honest readout)
change. The page still lands ALREADY on lesson 01 with the ink square sitting where the pointer will
go, GAIN/LATENCY controls visible, `← drag me` hint on the object — manipulate before reading. The
NEW title card sits above the lesson and MUST NOT push the L01 demo below the fold on a laptop nor
steal focus.

## 3. Emotional tone
Serious editorial calm that happens to move — "a design publication you can grab." Neutral grotesque
(Helvetica Neue → Archivo), restrained. Pure monochrome ink/paper/grey; the single `--red` reserved
for "wrong." Loose vertical rhythm (48–96px), composed whitespace — calm chrome so the motion inside
the canvas is the only thing that draws the eye. The title card whispers; the demos do the talking.

## 4. The 8 changes — concrete, buildable, verifier-checkable

**(1) TITLE CARD (new, quiet hero).** Add ONE tone-setting band at the very top of the page (full-bleed
above the two-column body, or top of the main column — builder's call), reading as page furniture, not
a splash. SSENSE: a single 1px `--grey-200` hairline beneath it, square corners, no fill/shadow/CTA.
Content top→bottom: tiny UPPERCASE tracked eyebrow (`INTERACTION DESIGN — 08 LESSONS`); a LOWERCASE
display headline (`--fs-display`, weight 400) = the problem statement, "feel how interfaces should
move."; one grey-600 sentence-case subtitle line ("grab the controls. feel the physics. free, no
signup."). Generous whitespace; NO buttons/marketing copy. Applies *added-feature-buried*: legible and
clearly part of the page but QUIETER than the active lesson headline (sets tone, doesn't compete), and
the L01 demo must stay reachable without excessive scroll on a laptop. Verifier: a title-card element
exists above the lesson region with a lowercase display headline + uppercase eyebrow; the L01 demo
canvas still renders and is interactive.

**(2) REMOVE "why it matters for your portfolio" — DELETE, don't hide (all 8 lessons).** Applies
*delete-feature-entirely*: remove the whole block, not just its text. Remove the `whyItMatters` field
from `LessonMeta` and from all 8 entries in `lib/lessons.ts`; remove the `<div className="why-block">`
+ its `<h4>Why it matters for your portfolio</h4>` from `AppShell.tsx`; remove the now-orphaned
`.why-block` (+ `.why-block h4`) CSS. Let the lede + demo stand. Verifier: the strings "why it matters"
/ "portfolio" appear nowhere in rendered output or the lessons data; no orphaned `.why-block` selector
remains.

**(3) SUBTITLE CONSISTENCY — single source of truth.** The main-column subtitle for a lesson must be
the SAME words as that lesson's subtitle in the left rail. Today the rail renders `l.subtitle`, the
main column shows `l.eyebrow`, and the mobile drawer shows `l.headline` — three different strings that
drift. Fix: derive the descriptive subtitle line in the rail item, the desktop main-column subtitle
region, and the mobile drawer secondary line all from the SAME `lib/lessons.ts` `subtitle` field. (The
`LESSON 0N — KEYWORD` eyebrow kicker may remain as a separate small label, but the descriptive subtitle
text is one shared field.) Verifier: for each lesson, the rail subtitle text === the main column
subtitle text, character-for-character.

**(4) P0 — Lesson 01 GAIN math.** Broken today: `onPointerMove` calls
`applyMove(targetX, targetY, targetX, targetY)`, so `(raw − center) = 0` and gain never applies — the
object tracks 1:1 regardless of GAIN. Correct semantics (builder + verifier must agree): gain scales
OBJECT displacement relative to POINTER displacement measured FROM THE DRAG ANCHOR (object + pointer
positions captured at pointerdown).
- `anchorObj` = object pos at grab; `anchorPtr` = pointer pos at grab.
- During drag: `pointerDelta = currentPointer − anchorPtr` (per axis).
- `objectPos = anchorObj + gain × pointerDelta`, then clamp to stage bounds.
- GAIN 1× ⇒ object moves exactly the pointer distance (1:1, delta ≈ 0). 0.5× ⇒ half the pointer
  distance (object lags, delta grows). 2× ⇒ twice (object outruns the pointer).
- LATENCY still delays application of the computed objectPos.
- The POINTER → OBJECT DELTA instrument must reflect this (≈0 at 1×, growing at 0.5×/2×).
Verifier (unit-level): anchorObj=(100,100), anchorPtr=(100,100), pointer → (200,100): gain 0.5 ⇒
objectPos.x ≈ 150; gain 1 ⇒ ≈ 200; gain 2 ⇒ ≈ 300 (pre-clamp). Object displacement = gain × pointer
displacement.

**(5) Lesson 03 — interruptible VS non-interruptible (supersedes NAÏVE RESTART).** Remove the
`NAÏVE RESTART` ghost toggle entirely. Replace with an explicit, labeled contrast of TWO panels
animating the SAME open↔closed action — preferred layout: side-by-side (stack on mobile), each in its
own 1px-framed sub-stage with an UPPERCASE label above:
- LEFT — `INTERRUPTIBLE` (correct): grab mid-flight → hands off current position + velocity →
  re-targets on release. Monochrome ink.
- RIGHT — `NON-INTERRUPTIBLE` (bad): input IGNORED while animating; a grab attempt does nothing until
  the animation finishes. Label + "ignored" affordance in `--red`.
A single shared Open/Close (or "fire both") trigger drives both simultaneously so the user feels one is
grabbable mid-flight and the other isn't. (A single stage that toggles between the two modes is
acceptable IF the contrast stays obvious and labeled, but side-by-side is preferred.) Verifier: two
labeled regions (`INTERRUPTIBLE` / `NON-INTERRUPTIBLE`); pointerdown on the interruptible panel
mid-animation redirects it; the same on the non-interruptible panel does NOT change its trajectory
until it settles.

**(6) Lesson 04 — ONE object, layered toggleable principles (was a 4-demo gallery).** Replace the four
separate per-principle micro-demos with ONE single monochrome object performing ONE action (e.g. a
launch/move across the stage, or press-and-settle). Each principle — ANTICIPATION,
FOLLOW-THROUGH/OVERLAP, SLOW-IN/SLOW-OUT, SQUASH-&-STRETCH — is an independent ON/OFF toggle that LAYERS
its contribution onto that same object's single animation, so several on at once compose the combined
effect on one motion. Keep the per-principle ON/OFF toggles AND a single INTENSITY slider scaling all
enabled effects; a single play/trigger replays the action. Layering: anticipation = pre-move
counter-motion; follow-through = trailing settle/overshoot after arrival; slow-in/out = eased vs linear
timing; squash&stretch = volume-preserving deform at launch/impact. Verifier: exactly ONE animated
object in the demo; four principle toggles + one intensity slider; toggling a principle visibly changes
that one object's motion; multiple-on compose.

**(7) P0 — Lesson 05 stays IN BOUNDS and BOUNCES.** Today a hard flick can leave the card outside the
stage (`rubberBand` softens position but velocity isn't reflected, so on a hard flick the decel target
overshoots far past the wall). Correct semantics: the card's bounding box stays WITHIN the stage's
bounding box and velocity REFLECTS elastically off each edge, decelerating to rest INSIDE the box.
- Bounds per axis: x ∈ [0, stageW − CARD_W], y ∈ [0, stageH − CARD_H].
- Per decel step, if the new position crosses a bound: clamp position back to the bound AND reflect
  velocity `v ← −v × restitution` (restitution ≈ 0.5–0.7, < 1 so bounces decay). Keep decelerating;
  exponential friction settles it inside.
- This is the BASELINE behavior — there must be NO setting that lets the card escape. The
  `RUBBER-BAND AT BOUNDS` control may stay only as a softness modifier on top of bounce.
- Keep the lift-off velocity vector arrow + px/s readout (handoff is still the lesson); SEAM debug stays
  (`--red`).
Verifier (independent): seed a hard flick (large lift-off velocity toward an edge); run the decel loop
to rest; assert at EVERY step and at rest `0 ≤ x ≤ stageW − CARD_W` and `0 ≤ y ≤ stageH − CARD_H`; assert
velocity sign flips at least once at a bound on a hard flick.

**(8) REMOVE the global top-right FPS/Hz readout; KEEP Lesson 06's instruments.** Remove the global
frame-rate/Hz indicator from the top bar (the `{hz}HZ` button + `hz` state in `AppShell.tsx`). Do NOT
touch Lesson 06's own FPS meter, frame-budget bar, dropped-frame markers, or its 60/120Hz switch —
those are L06 content and stay. If the top-bar 60/120Hz switch is the source of L06's target, MOVE it
INTO Lesson 06 (own the hz state locally) rather than deleting it. Applies *move-X-into-Y*: builder must
verify DOM containment — the 60/120Hz control is a descendant of the Lesson 06 demo region and NO
frame-rate/Hz control remains in `<header>`. Verifier: `<header>` contains no Hz/FPS control; L06 still
has a working 60/120Hz switch + honest FPS meter; the top bar keeps only the wordmark + `08 LESSONS` +
REDUCED MOTION (and the mobile menu button).

## 5. 5-second check (above the fold, cold visitor)
- **Title card:** uppercase eyebrow `INTERACTION DESIGN — 08 LESSONS`; lowercase display headline "feel
  how interfaces should move."; one grey subtitle line "grab the controls. feel the physics. free, no
  signup." Quiet, hairline-ruled, no CTA.
- **Immediately below:** Lesson 01 already live — the ink square in its 1px-framed demo stage with the
  `← drag me` hint and visible GAIN (0.5×/1×/2×) + LATENCY (0–200ms) controls + live px-delta readout;
  grabbing it tracks the pointer (with gain that now actually works). No signup, no top-right clutter.

## Per-lesson canonical anatomy (all 8 identical — keeps the curriculum consistent)
1. Eyebrow micro-label (`LESSON 0N — KEYWORD`). 2. Lowercase headline. 3. Subtitle (SAME field as the
rail, item 3). 4. Lede (2–3 plain-English sentences). 5. Bordered DEMO STAGE (1px `--grey-200` frame) —
the one place motion lives. 6. CONTROL PANEL: always-visible labeled controls, each with a tabular-nums
value (never behind an accordion/gear). 7. INSTRUMENTS row where relevant (live, honest). 8. A/B
good-vs-bad where relevant (bad side in `--red`). 9. Prev/Next. NO "why it matters" block (removed,
item 2). Last-viewed lesson + control settings restored from localStorage.

## Chrome vs. canvas division (unchanged central rule)
- **CHROME = strict SSENSE, motionless.** Frame, rail, title card, headings, copy, control panels,
  sliders, buttons, readouts: monochrome, 1px hairlines, square corners, uppercase 11px tracked labels,
  no shadow/radius/gradient/color, hover = inversion, transitions = ~120ms fades only. Honor
  `prefers-reduced-motion` for all chrome.
- **DEMO CANVAS = the "product photography."** Inside the bordered stage, demonstrated motion may
  overshoot/spring/stutter because that motion IS the content. Moving objects stay monochrome (ink
  shapes, grey ghosts, 1px trails). `--red` only on the bad side + dropped-frame marks. Reduced-motion
  shows an explicit "enable motion to view this lesson" affordance per canvas — never silently break.

## Mobile / 375px (build-#1 requirement)
Every control and demo renders and is usable at 375px from the first build. Title card stacks and stays
quiet. Rail collapses to the existing mobile lesson menu/drawer; L03's two panels stack vertically; L04's
single object + toggles stack; demo stages go full-width; controls stack with ≥44px touch targets;
readouts stay visible. All dragging via Pointer Events (`setPointerCapture`). Absent hardware (120Hz,
haptics) degrades gracefully and SAYS so. Gutters 16px mobile / 32–48px desktop; content never touches
edges.
