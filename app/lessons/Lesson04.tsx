"use client";

import { useRef, useState, useCallback } from "react";

/**
 * Lesson 04 — 12 animation principles in UI
 * Anticipation, follow-through/overlap, slow-in/slow-out, squash & stretch.
 * Each A/B toggleable with an INTENSITY slider.
 */

type Principle = "anticipation" | "followThrough" | "slowInOut" | "squashStretch";

const PRINCIPLES: { id: Principle; label: string; description: string }[] = [
  { id: "anticipation", label: "ANTICIPATION", description: "Pre-move counter-motion before the action." },
  { id: "followThrough", label: "FOLLOW-THROUGH", description: "Trailing elements settle after the lead." },
  { id: "slowInOut", label: "SLOW-IN / SLOW-OUT", description: "Ease at both ends vs. linear." },
  { id: "squashStretch", label: "SQUASH & STRETCH", description: "Volume-preserving deformation on impact/launch." },
];

interface AnimState {
  phase: "idle" | "anticipation" | "main" | "followThrough" | "done";
  t: number;        // 0→1 within phase
  x: number;        // current x position
  scaleX: number;
  scaleY: number;
}

const IDLE: AnimState = { phase: "idle", t: 0, x: 0, scaleX: 1, scaleY: 1 };

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function Lesson04() {
  const [enabled, setEnabled] = useState<Record<Principle, boolean>>({
    anticipation: true,
    followThrough: true,
    slowInOut: true,
    squashStretch: true,
  });
  const [intensity, setIntensity] = useState(0.5);
  const [animStates, setAnimStates] = useState<Record<Principle, AnimState>>(
    Object.fromEntries(PRINCIPLES.map(p => [p.id, IDLE])) as Record<Principle, AnimState>
  );

  const rafRefs = useRef<Record<Principle, number>>(
    Object.fromEntries(PRINCIPLES.map(p => [p.id, 0])) as Record<Principle, number>
  );
  const intensityRef = useRef(0.5);
  intensityRef.current = intensity;

  const fire = useCallback((id: Principle) => {
    cancelAnimationFrame(rafRefs.current[id]);

    const currentEnabled = enabled[id];
    const intens = intensityRef.current;

    const TRAVEL = 160;
    const ANTICIPATE_DIST = currentEnabled ? -TRAVEL * 0.15 * intens : 0;
    const ANTICIPATE_DUR = currentEnabled ? 120 * intens : 0;
    const MAIN_DUR = 300;
    const FOLLOW_DUR = currentEnabled ? 200 * intens : 0;

    let startTime: number | null = null;
    let phase: AnimState["phase"] = currentEnabled && id === "anticipation" ? "anticipation" : "main";
    let phaseStart = 0;

    function tick(now: number) {
      if (!startTime) { startTime = now; phaseStart = now; }
      const phaseElapsed = now - phaseStart;

      let nextState: AnimState;

      if (phase === "anticipation") {
        const t = Math.min(phaseElapsed / ANTICIPATE_DUR, 1);
        const x = lerp(0, ANTICIPATE_DIST, easeInOut(t));
        nextState = { phase: "anticipation", t, x, scaleX: 1, scaleY: 1 };
        if (t >= 1) { phase = "main"; phaseStart = now; }
      } else if (phase === "main") {
        const t = Math.min(phaseElapsed / MAIN_DUR, 1);
        const easeFn = (currentEnabled && id === "slowInOut") ? easeInOut : (x: number) => x;
        const progress = easeFn(t);
        const x = lerp(ANTICIPATE_DIST, TRAVEL, progress);

        let scaleX = 1, scaleY = 1;
        if (currentEnabled && id === "squashStretch") {
          const squashT = Math.sin(progress * Math.PI); // peaks at mid-travel
          const stretch = 1 + 0.3 * intens * squashT;
          const squash = 1 / stretch;
          scaleX = stretch;
          scaleY = squash;
        }
        nextState = { phase: "main", t, x, scaleX, scaleY };
        if (t >= 1) {
          phase = currentEnabled && id === "followThrough" ? "followThrough" : "done";
          phaseStart = now;
        }
      } else if (phase === "followThrough") {
        const t = Math.min(phaseElapsed / FOLLOW_DUR, 1);
        const overshoot = 1 - easeInOut(t);
        const x = TRAVEL + Math.sin(overshoot * Math.PI * 2) * 20 * intens;
        nextState = { phase: "followThrough", t, x, scaleX: 1, scaleY: 1 };
        if (t >= 1) { phase = "done"; }
      } else {
        nextState = { phase: "done", t: 1, x: TRAVEL, scaleX: 1, scaleY: 1 };
      }

      setAnimStates(prev => ({ ...prev, [id]: nextState }));

      if (phase !== "done") {
        rafRefs.current[id] = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setAnimStates(prev => ({ ...prev, [id]: IDLE }));
        }, 600);
      }
    }

    rafRefs.current[id] = requestAnimationFrame(tick);
  }, [enabled]);

  function fireAll() {
    PRINCIPLES.forEach(p => fire(p.id));
  }

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        className="demo-canvas"
        style={{ height: 280, marginBottom: "var(--sp-4)", padding: "var(--sp-4)" }}
        aria-label="Animation principles demo stage"
      >
        {PRINCIPLES.map((p, i) => {
          const s = animStates[p.id];
          const isActive = enabled[p.id];
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-4)",
                height: 52,
                borderBottom: i < PRINCIPLES.length - 1 ? "1px solid var(--grey-100)" : "none",
              }}
            >
              <span style={{ fontSize: "var(--fs-micro)", letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? "var(--ink)" : "var(--red)", width: 120, flexShrink: 0 }}>
                {p.label}
              </span>
              <div style={{ flex: 1, position: "relative", height: 40, overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: s.x,
                    width: 32,
                    height: 32,
                    background: isActive ? "var(--ink)" : "transparent",
                    border: isActive ? "none" : "1px solid var(--red)",
                    transform: `translate(0, -50%) scaleX(${s.scaleX}) scaleY(${s.scaleY})`,
                    transformOrigin: "center center",
                    willChange: "transform, left",
                    transition: s.phase === "idle" ? "left 0.3s ease" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        {/* Per-principle toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--sp-4)" }}>
          {PRINCIPLES.map(p => (
            <label key={p.id} className="ds-toggle" htmlFor={`toggle-${p.id}`} style={{ alignItems: "flex-start", gap: "var(--sp-2)" }}>
              <input
                type="checkbox"
                id={`toggle-${p.id}`}
                checked={enabled[p.id]}
                onChange={e => setEnabled(prev => ({ ...prev, [p.id]: e.target.checked }))}
                aria-label={`${p.label} on/off`}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: enabled[p.id] ? "var(--ink)" : "var(--red)" }}>
                  {p.label}
                </div>
                <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)" }}>{p.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Intensity + Fire */}
        <div className="control-group">
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>INTENSITY</span>
            <span className="readout">{Math.round(intensity * 100)}%</span>
          </label>
          <input
            type="range"
            className="ds-slider"
            min={0.1}
            max={1}
            step={0.05}
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            aria-label="Animation intensity"
          />
          <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            In real UI, keep intensity low (20–40%). High values are for learning the mechanism.
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
          <button
            className="ds-btn"
            onClick={fireAll}
            style={{ padding: "8px 20px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)" }}
            aria-label="Fire all animations"
          >
            FIRE ALL
          </button>
          {PRINCIPLES.map(p => (
            <button
              key={p.id}
              className="ds-btn ds-btn--secondary"
              onClick={() => fire(p.id)}
              style={{ padding: "8px 12px", fontSize: "var(--fs-micro)", letterSpacing: "var(--ls-micro)", background: "transparent", color: "var(--ink)", border: "1px solid var(--ink)" }}
              aria-label={`Fire ${p.label} animation`}
            >
              {p.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {Object.values(enabled).some(v => !v) && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            Disabled principles shown with --red outline (the bad/naïve version)
          </p>
        )}
      </div>
    </div>
  );
}
