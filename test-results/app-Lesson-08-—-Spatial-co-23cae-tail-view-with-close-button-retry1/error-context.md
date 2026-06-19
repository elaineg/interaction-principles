# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.test.ts >> Lesson 08 — Spatial continuity >> clicking a tile shows detail view with close button
- Location: tests/e2e/app.test.ts:468:18

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Open tile A/i })

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
      |        ^ Error: locator.click: Test timeout of 30000ms exceeded.
```