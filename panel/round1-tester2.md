# Marcus — Frontend engineer

Frontend eng, 2 yrs, desktop Chrome w/ devtools open. I ship UI animations and keep
pasting `stiffness: 180, damping: 20` into Framer Motion without really getting why. This
is the exact thing I've wanted to play with.

## Clarity — Yes
Within 5 seconds: header "INTERACTION PRINCIPLES / interactive lessons in how interfaces
feel", an 8-item numbered syllabus down the left, and Lesson 01 already open with a live
"DRAG ME" box. I'd tell a friend: "It's 8 hands-on lessons that teach how UI motion FEELS
— spring vs easing, interruptibility, flick physics — with live demos where you tweak the
actual params." The "60HZ" badge and "LESSON 01 — FEEL" eyebrow set the tone instantly.
Nothing confused me; the IA reads like a real course, not a landing page.

## Value — Yes
Today I copy spring configs from blog posts / Framer Motion docs and eyeball the result, or
poke at easings.net for beziers. Those are two disconnected tools and neither shows me
spring-vs-easing side by side. This does, in ONE screen (L02): SPRING arena vs EASING
arena, MASS/STIFFNESS/DAMPING sliders (defaults 1/180/20 — correct), a DURATION slider, an
EDITABLE cubic-bezier with drag handles, and "FIRE BOTH" to run them together. The copy is
technically right: "a spring integrator has no preset duration — runs until energy
dissipates." L05 nails the part I most wanted: "sample the last few pointer samples, not
just the last two" + live LIFT-OFF VELOCITY/VX/VY, a FRICTION (deceleration) slider, and a
SEAM DEBUG toggle showing the amateur teleport-restart vs captured velocity. L03
interruptibility is real too — I opened the sheet and saw SPRING VELOCITY -721 px/s /
PROGRESS 51% / STATE continuous updating live, with a NAÏVE RESTART A/B. Not hand-wavy.

## Advocacy — 8/10
I'd drop this in our team Slack today — it's the rare "learn by feel" tool that's actually
technically honest, zero console errors, no signup, fast. What holds it back from 9–10:
(1) the demos lean on the live readouts to prove they're real; the headline drag feels good
but I want a clearer "feel the bad version" moment baked into every lesson, not just L01/L05.
(2) the draggable targets are small (the L05 "FLICK" box, L01 square) — fine on desktop with
a mouse but I had to aim; a bigger hit area would make the flick feel more visceral. (3) no
"copy this config" affordance — once I dial in a spring I love, I want to grab the
`{mass, stiffness, damping}` to paste into Framer Motion. Add that and it's a 9 I'd evangelize.
The bones and the correctness are genuinely there.

```json
{"tester": 2, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["no 'copy this spring/bezier config' button to paste into Framer Motion", "small drag/flick hit targets require aiming on desktop", "bad-version 'feel it break' moment only strong in L01/L05, want it per-lesson"], "priorConcernsAddressed": "n/a"}
```
