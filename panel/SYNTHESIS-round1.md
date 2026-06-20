# interaction-principles — Panel SYNTHESIS round 1

Run: 20260618-215329-daily · URL: http://localhost:3041 (local prod) · 10/10 testers returned

## Score table

| Name   | Role                          | Clarity | Value    | Advocacy | In-audience? |
|--------|-------------------------------|---------|----------|----------|--------------|
| Marcus | Frontend engineer             | Yes     | Yes      | 8        | YES (core)   |
| Aisha  | Product designer              | Yes     | Yes      | 8        | YES (core)   |
| Sam    | Product manager (design-curious) | Yes  | Marginal | 6        | YES (soft edge) |
| Priya  | Backend software engineer     | Yes     | No       | 5        | weak/fringe  |
| Rob    | Brand/visual designer         | Yes     | No       | 5        | borderline   |
| Dana   | Demand-gen marketer           | Yes     | No       | 4        | weak         |
| Jules  | Content/community marketer    | Yes     | No       | 4        | weak/curious |
| Elena  | Engineering manager           | Yes(barely) | No   | 4        | weak         |
| Wen    | Marketing data analyst        | Yes     | No       | 3        | NON-fit      |
| Tomás  | Operations analyst            | Yes     | No       | 2        | NON-fit      |

## Counts

- **Raw: 0/10** testers advocate ≥9 with Yes/Yes. (Top scores are 8, 8, 6.)
- **In-audience: 0/3.** The genuine design/front-end/design-curious-PM audience = Marcus, Aisha, Sam. Marcus 8, Aisha 8, Sam 6 — none at ≥9, but all three are close and every gap is a *fixable in-audience defect*, not a fundamental rejection. Clarity is universally Yes (10/10); the core trio all confirm the content is correct and the value real.

## Complaints grouped by cause

### Trust-breaking / functional (P0 — recurs across in-audience)
- **Deep links broken + mobile lesson nav dead (Sam):** `#03` stays on lesson 01; on mobile the lesson list is `display:none` and the "LESSONS" button is dead, so 8 lessons are prev/next-only. This kills the two things a PM would actually DO — deep-link a lesson to a designer, and browse on his phone. RECURS as a theme with the "no per-lesson link to forward" complaint from Elena and Priya ("forward Lesson 06"). This is the single highest-leverage cluster: it blocks sharing, the app's main growth vector, AND breaks mobile entirely.

### Value buried / missing affordance (recurs in-audience)
- **No "copy this config" affordance (Marcus, Sam):** Marcus would Slack it today but there's no way to copy a spring config he tuned; Sam wants a copy-link. The whole point for a front-end engineer is to lift the values into code.
- **No per-lesson deep link to forward (Sam, Elena, Priya, Marcus):** four personas independently wanted to send ONE lesson to someone. Same root as the P0 routing bug.

### Cosmetic / polish (single + light recurrence, in-audience)
- **L06 FPS meter idle state looks like a red error before START (Aisha).** Trust nit on the exact tool that teaches honesty.
- **L02 position readouts read as empty placeholders (Aisha); "60HZ" chip unexplained until lesson 6 (Aisha).** Craft nits costing Aisha the 9.
- **Small drag/flick hit targets; "feel the bad version" moment only strong in L01/L05 (Marcus).** A/B contrast is weak in the middle lessons.
- **Page leads with a lesson title, not a "who it's for" headline (Elena).** Minor clarity friction for skimmers.

### Out-of-audience (NOT actionable — do not chase)
- Wen (3), Tomás (2), Dana (4), Jules (4), Priya (5), Rob (5), Elena (4): all explicitly scored *fit, not craft*. Every one called the app polished, the controls real, no console errors — and said it has no place in their data/ops/marketing/management workflow. This is the expected, honest result of a deliberately narrow audience. Inflating the panel with these scores would be dishonest; they correctly bound the addressable market to design + front-end + design-curious PM.

## Recurring (real) vs single-persona quirks
- **REAL (recur):** broken deep links / no per-lesson forward link (4 personas); broken mobile nav (Sam, the mobile-heavy persona — definitionally P0 for mobile); no copy-config affordance (2 core personas).
- **Single-persona quirks (still worth a cheap fix since from core Aisha):** FPS idle-red, L02 empty readouts, 60HZ chip, hit-target size — all craft polish, batchable.

## Highest-leverage fix for round 2
**Make every lesson independently linkable AND fix mobile lesson navigation** (URL hash → correct lesson on load + working mobile lesson menu), then add a one-tap "copy lesson link" + "copy config" affordance. This single cluster converts Sam (6→9, he says so explicitly), unblocks the share-driven growth loop all four forwarders wanted, and removes the only outright functional defects. Aisha's and Marcus's remaining gaps are then cheap cosmetic batch-fixes to reach ≥9.

## P0 trust-breaking bug
YES — **deep links do not work (`#03` lands on lesson 01) and mobile lesson navigation is dead** (`display:none` list + non-functional LESSONS button). Functional, surfaced by the mobile/PM persona, blocks both sharing and mobile use.
