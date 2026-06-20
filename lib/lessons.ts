export interface LessonMeta {
  id: number;
  slug: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  lede: string;
}

export const LESSONS: LessonMeta[] = [
  {
    id: 1,
    slug: "direct-manipulation",
    eyebrow: "LESSON 01 — FEEL",
    headline: "content moves with your finger.",
    subtitle: "1:1 tracking, gain, and latency",
    lede:
      "The most important principle in interaction design: the object under your pointer must feel like an extension of your hand. Any gain ≠ 1 or latency > 0 breaks the illusion instantly. Everything else in this curriculum rests on this bedrock.",
  },
  {
    id: 2,
    slug: "springs-vs-easing",
    eyebrow: "LESSON 02 — MOTION",
    headline: "springs vs. duration curves — and knowing when each wins.",
    subtitle: "Physics-based motion vs easing curves",
    lede:
      "A spring integrator has no preset duration — it runs until energy dissipates. An easing curve guarantees a finish time. Both have a place. The pro move is knowing when a checkbox should use a 150ms curve and when a dragged sheet should use a spring.",
  },
  {
    id: 3,
    slug: "interruptibility",
    eyebrow: "LESSON 03 — CONTINUITY",
    headline: "grab it mid-flight; it continues from where it is.",
    subtitle: "State continuity and velocity handoff",
    lede:
      "Amateur animations fire-and-forget: start, play, done. Professional animations are interruptible at any point, handing off current position and velocity to the gesture — never snapping or restarting. This single interaction separates amateur from pro portfolios.",
  },
  {
    id: 4,
    slug: "animation-principles",
    eyebrow: "LESSON 04 — LIFE",
    headline: "disney's principles, translated to interfaces.",
    subtitle: "Anticipation, follow-through, slow-in/out, squash & stretch",
    lede:
      "Disney's 12 animation principles weren't invented for cartoons — they describe how physical objects actually behave. Restrained applications of anticipation, follow-through, slow-in/slow-out, and squash-and-stretch are why good UI reads as alive. Toggle each on and off to feel the difference.",
  },
  {
    id: 5,
    slug: "velocity-handoff",
    eyebrow: "LESSON 05 — MOMENTUM",
    headline: "capture lift-off velocity; feed it into deceleration.",
    subtitle: "Gesture → inertia with zero visual seam",
    lede:
      "When a user flicks a card, the gesture's lift-off velocity must feed directly into a deceleration model — no seam, no stutter, no restart. Sampling velocity correctly (last few pointer samples, not just last two) is a concrete, demonstrable engineering skill.",
  },
  {
    id: 6,
    slug: "frame-budget",
    eyebrow: "LESSON 06 — PERFORMANCE",
    headline: "16.6ms to draw a frame — here is what drops it.",
    subtitle: "Frame budget, jank, and the honest FPS meter",
    lede:
      "Every frame has a budget: 16.6ms at 60Hz, 8.3ms at 120Hz. Blow it and the browser drops the frame — the animation stutters. The INJECT WORK slider adds real CPU work to each rAF callback so you can watch the FPS meter drop and feel the jank in real time. These are honest numbers from real timestamps.",
  },
  {
    id: 7,
    slug: "feedback-timing",
    eyebrow: "LESSON 07 — RESPONSE",
    headline: "touch-down highlight, the jnd, and haptic confirmation.",
    subtitle: "Feedback timing and just-noticeable difference",
    lede:
      "Immediate touch-down visual feedback (inversion on press) is the first affordance. The just-noticeable difference for response latency is roughly 100ms — below that it feels instant, above it feels laggy. Haptics are a third confirmation channel alongside visual and audio.",
  },
  {
    id: 8,
    slug: "spatial-continuity",
    eyebrow: "LESSON 08 — SPACE",
    headline: "shared-element transitions: the mental map never breaks.",
    subtitle: "Spatial and navigational continuity",
    lede:
      "When a tile expands into a detail view and collapses back, it must return to exactly where it came from. The CONTINUITY toggle shows a naïve cross-fade — feel how it destroys the user's sense of where things are. The shared-element version preserves the mental map completely.",
  },
];
