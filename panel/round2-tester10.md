# Sam — Product manager (round 2)

Mobile (375px) between meetings. Tech medium, won't debug. I came back to check the two
things that killed it for me last round: deep links and a working mobile lesson menu.

## Prior concerns — both addressed (verified live, not on faith)
1. **Deep links: FIXED.** Loaded `/#lesson-03` and it lands on Lesson 03 ("grab it
   mid-flight; it continues from where it is."), hash and all. `/#03` and `/#lesson-3` also
   resolve to Lesson 03. Last round `#03` stayed stuck on Lesson 01 — that's gone.
2. **Mobile LESSONS menu: FIXED.** Tapping "LESSONS" now opens a full "SELECT LESSON"
   slide-over listing all 8 lessons with plain-English titles + subtitles and a CLOSE. I
   tapped "03 grab it mid-flight" and it navigated straight there (hash -> #lesson-03). Last
   round this button was dead and the list was display:none. The dead button is the thing
   that hurt most last time, and it's genuinely working now.
3. **Bonus I asked for:** "COPY LINK" exists and copies the *per-lesson* URL
   (`http://localhost:3041/#lesson-01` from L1; label flips to "COPIED ✓"). There's also a
   "COPY CONFIG". That's the share affordance I said I needed.

## Clarity — Yes
Unchanged and still strong: "interactive lessons in how interfaces feel" + Lesson 01
"content moves with your finger" + DRAG ME with gain/latency tells me cold what this is and
who it's for. The drawer's titles ("springs vs. duration curves," "16.6ms to draw a frame")
double as a table of contents I'd skim.

## Value — Yes (up from Marginal)
The content was always the thing I wanted — language I can paste into a spec ("feels
slippery / degraded," "spring for a dragged sheet, 150ms curve for a checkbox"). What was
missing was the ability to fold it into my actual workflow, and that's now there: I can send
my designer `…/#lesson-03` and it opens on the right lesson, and on my phone I can jump to
the relevant one in two taps instead of spamming Next. That beats a static Notion doc
because the lessons are interactive. This is now something I'd link in a review, not just a
toy I enjoyed alone.

## Advocacy — 9/10
Last round I said "fix shareable per-lesson links + a working mobile lesson menu and this
jumps to a 9." Both are fixed, verified live, so I'm holding myself to it: 9. I'd bring this
up unprompted to any PM/designer who struggles to articulate motion. Not a 10 only because
I'd want to confirm the copied link works pasted into Slack on a real phone (test env
blocks clipboard read) and the drawer feels slightly twitchy under fast taps — minor. The
substance is there.

```json
{"tester": 10, "round": 2, "clarity": "Yes", "value": "Yes", "advocacy": 9, "topComplaints": ["Drawer closes fast under rapid re-query/tap — minor twitchiness, no functional break", "Want to confirm copied per-lesson link survives a real Slack paste (clipboard read blocked in test env)"], "priorConcernsAddressed": "all"}
```
