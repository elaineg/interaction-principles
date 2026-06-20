# Sam — Product manager

Device: mobile (375px) between meetings. Tech: medium, won't debug. Today I write specs for
motion features and can't tell my designer what "feels off" — I came here for shared language
I could paste into a review or send to my designer.

## Clarity — Yes
Within 5 seconds the header ("interactive lessons in how interfaces feel") + Lesson 01
"content moves with your finger" + a box that says "← DRAG ME" with GAIN/LATENCY sliders told
me exactly what this is: a hands-on course on how interfaces FEEL, for designers/engineers and
design-curious people like me. The plain-English intro ("the object under your pointer must
feel like an extension of your hand") is the kind of sentence I'd actually quote in a review.
No jargon-wall before payoff. Good.

## Value — Marginal (leaning No for MY workflow)
The CONTENT is genuinely the thing I want. Dragging the box at 2× gain and watching it read
"feels slippery / STATUS: degraded" gave me language instantly. Lesson 02 (spring vs easing,
"FIRE BOTH", mass/stiffness/damping vs duration/cubic-bezier) is exactly the "use a spring for
a dragged sheet, a 150ms curve for a checkbox" framing I'd put in a spec. That's real.
BUT two things gut its value for me specifically:
1. I can't SHARE it. No share / copy-link button, and deep links don't work — I loaded
   `#03` and it stayed on Lesson 01. My entire job is sending my designer "look at lesson 2."
   I'd have to say "open the site and tap Next twice," which I won't do. A static Notion doc
   I can link beats this for me today.
2. On my phone the lesson list is hidden (`display:none`) and the top-right "LESSONS" button
   does nothing when I tap it — no menu opens. The ONLY way between 8 lessons is the
   prev/next buttons at the bottom of each lesson. Linear-only on mobile is a slog and made
   me feel lost ("is that all? how many are there?").

## Advocacy — 6/10
The demos are the best explainer of interaction feel I've seen, and I'd genuinely enjoy it on
my laptop. But I won't bring it up unprompted because the two things I'd do with it — send a
deep link to my designer, and jump to the relevant lesson on my phone — both don't work. Fix
shareable per-lesson links + a working mobile lesson menu and this jumps to a 9 for me. As
shipped it's a great toy I can't fold into a review.

Quotes that helped: "the object under your pointer must feel like an extension of your hand";
"feels slippery"; "WHY IT MATTERS FOR YOUR PORTFOLIO". Quote that hurt: tapping "LESSONS" and
nothing happening.

```json
{"tester": 10, "round": 1, "clarity": "Yes", "value": "Marginal", "advocacy": 6, "topComplaints": ["No share/copy-link and deep links broken (#03 stays on lesson 01) — I can't send a teammate a specific lesson", "On mobile the lesson list is display:none and the 'LESSONS' button opens nothing; only prev/next nav, so 8 lessons are linear-only"], "priorConcernsAddressed": "n/a"}
```
