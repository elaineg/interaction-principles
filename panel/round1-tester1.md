# Priya — Senior backend software engineer

Cold open: landed on a clean, fast page. Header "INTERACTION PRINCIPLES / interactive
lessons in how interfaces feel", "08 LESSONS", "60HZ". Lesson 01 "content moves with your
finger." with a DRAG ME box. No signup, no network calls to anything sketchy — checked, it's
client-side. That alone keeps me from bouncing.

## Clarity — Yes
Within 5 seconds I know exactly what it is: an interactive course on interaction/animation
design. "interactive lessons in how interfaces feel" + the 8-lesson sidebar (direct
manipulation, springs vs easing, frame budget, etc.) make it unambiguous. No confusion.

## Value — No (for me personally)
What I do today: nothing. I'm backend. I'd land here from an HN "why interfaces feel laggy"
thread purely for the systems-performance angle, and Lesson 06 "frame budget" is the one
that's actually for me. I tested it honestly: pressed START, the FPS meter reads real
measured frame times (16.6ms clean), and dialing INJECT WORK to 30ms pushed LAST FRAME to
18.6ms — so these ARE real timestamps, not scripted numbers. Good. (In headless it still
reported 60fps/0 dropped — rAF is virtualized in my test env; on a real monitor it'd
clearly jank. Not a bug.) Lesson 01's pointer→object delta readout updates live too — it's
genuinely interactive, well-engineered.
But one good lesson isn't a tool I'll use. Everything is framed for designers — every lesson
closes with "WHY IT MATTERS FOR YOUR PORTFOLIO," which is a tell that I'm not the audience.
It explains rAF cost and the 16.7ms budget at a level I already operate below daily. There's
nothing here I'd reach for more than once. Recurrence for me: zero.

## Advocacy — 5/10
The craft is real: no signup, fast, honest measured numbers, polished. If a frontend or
design-leaning teammate asked "how do springs/jank/latency actually work," I'd send them the
frame-budget and direct-manipulation lessons specifically — that's why it's not lower. But I
would never bring it up unprompted to my backend peers; it's not our problem space, and the
"portfolio" framing would make a systems person dismiss it. The single thing holding it back
for my crowd: it's pitched as design education, not a performance-debugging tool. Reframe
Lesson 06 as a standalone "honest jank meter" and I'd actually share that.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "No", "advocacy": 5,
 "topComplaints": ["Framed as design/portfolio education — explicitly not for backend engineers (every lesson ends in 'WHY IT MATTERS FOR YOUR PORTFOLIO')", "Only the frame-budget lesson fits a systems-perf reader; nothing here earns repeat use for me", "Headless FPS meter shows 0 dropped even with 30ms inject — fine in my test env but the demo's 'feel the jank' payoff is muted unless on a real display"],
 "priorConcernsAddressed": "n/a"}
```
