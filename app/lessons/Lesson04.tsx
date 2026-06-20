"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { ParamRecord } from "../../lib/lessonParams";

/**
 * Lesson 04 — Disney's principles, translated to interfaces.
 * ONE single object performs ONE action (launch across stage).
 * Four independent ON/OFF principle toggles layer onto that single object's motion.
 * One INTENSITY slider scales all enabled effects.
 */

type Principle = "anticipation" | "followThrough" | "slowInOut" | "squashStretch";

const PRINCIPLES: { id: Principle; label: string; description: string }[] = [
  { id: "anticipation", label: "ANTICIPATION", description: "Pre-move counter-motion before the action." },
  { id: "followThrough", label: "FOLLOW-THROUGH / OVERLAP", description: "Trailing settle/overshoot after arrival." },
  { id: "slowInOut", label: "SLOW-IN / SLOW-OUT", description: "Eased timing at both ends vs. linear." },
  { id: "squashStretch", label: "SQUASH & STRETCH", description: "Volume-preserving deform at launch/impact." },
];

const OBJ_SIZE = 36;
const TRAVEL = 200; // px, object moves rightward this distance

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface ObjState {
  x: number;
  scaleX: number;
  scaleY: number;
  phase: "idle" | "anticipation" | "main" | "followThrough" | "done";
}

const IDLE_STATE: ObjState = { x: 0, scaleX: 1, scaleY: 1, phase: "idle" };

interface Props {
  initialParams?: ParamRecord;
  onParamsChange?: (key: string, val: string | number | boolean) => void;
}

export function Lesson04({ initialParams = {}, onParamsChange }: Props) {
  const initIntensity = (initialParams.intens as number) ?? 0.5;
  const initEnabled: Record<Principle, boolean> = {
    anticipation: (initialParams.ant as number) !== 0,
    followThrough: (initialParams.ft as number) !== 0,
    slowInOut: (initialParams.sio as number) !== 0,
    squashStretch: (initialParams.ss as number) !== 0,
  };

  const [enabled, setEnabled] = useState<Record<Principle, boolean>>(initEnabled);
  const [intensity, setIntensity] = useState(initIntensity);
  const [objState, setObjState] = useState<ObjState>(IDLE_STATE);
  const rafRef = useRef<number>(0);
  const intensityRef = useRef(initIntensity);
  intensityRef.current = intensity;
  const enabledRef = useRef(initEnabled);
  enabledRef.current = enabled;

  const fire = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const intens = intensityRef.current;
    const en = enabledRef.current;

    const ANTICIPATE_DIST = en.anticipation ? -TRAVEL * 0.12 * intens : 0;
    const ANTICIPATE_DUR = en.anticipation ? 110 * intens : 0;
    const MAIN_DUR = 320;
    const FOLLOW_DUR = en.followThrough ? 220 * intens : 0;

    let startTime: number | null = null;
    // Phase sequencing
    type Phase = "anticipation" | "main" | "followThrough" | "done";
    let phase: Phase = (en.anticipation && ANTICIPATE_DUR > 0) ? "anticipation" : "main";
    let phaseStart = 0;

    function tick(now: number) {
      if (!startTime) { startTime = now; phaseStart = now; }
      const phaseElapsed = now - phaseStart;

      let next: ObjState;

      if (phase === "anticipation") {
        const t = Math.min(phaseElapsed / ANTICIPATE_DUR, 1);
        const x = lerp(0, ANTICIPATE_DIST, easeInOut(t));
        let scaleX = 1, scaleY = 1;
        if (en.squashStretch) {
          // Squash on anticipation (compress in direction of motion)
          const sq = 1 - 0.18 * intens * t;
          scaleX = sq;
          scaleY = 1 + 0.18 * intens * t;
        }
        next = { phase: "anticipation", x, scaleX, scaleY };
        if (t >= 1) { phase = "main"; phaseStart = now; }
      } else if (phase === "main") {
        const t = Math.min(phaseElapsed / MAIN_DUR, 1);
        const easeFn = en.slowInOut ? easeInOut : (x: number) => x;
        const progress = easeFn(t);
        const x = lerp(ANTICIPATE_DIST, TRAVEL, progress);

        let scaleX = 1, scaleY = 1;
        if (en.squashStretch) {
          // Stretch during travel, squash at impact
          const stretchT = Math.sin(progress * Math.PI);
          const stretch = 1 + 0.32 * intens * stretchT;
          scaleX = stretch;
          scaleY = 1 / stretch;
        }
        next = { phase: "main", x, scaleX, scaleY };
        if (t >= 1) {
          phase = (en.followThrough && FOLLOW_DUR > 0) ? "followThrough" : "done";
          phaseStart = now;
        }
      } else if (phase === "followThrough") {
        const t = Math.min(phaseElapsed / FOLLOW_DUR, 1);
        // Overshoot then settle back
        const bounce = Math.sin((1 - easeInOut(t)) * Math.PI) * 24 * intens;
        const x = TRAVEL + bounce;
        let scaleX = 1, scaleY = 1;
        if (en.squashStretch) {
          // Squash on settle
          const sq = 1 - 0.15 * intens * (1 - t);
          scaleX = sq;
          scaleY = 1 + 0.15 * intens * (1 - t);
        }
        next = { phase: "followThrough", x, scaleX, scaleY };
        if (t >= 1) { phase = "done"; }
      } else {
        next = { phase: "done", x: TRAVEL, scaleX: 1, scaleY: 1 };
      }

      setObjState(next);

      if (phase !== "done") {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setObjState(IDLE_STATE), 700);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const anyDisabled = Object.values(enabled).some(v => !v);

  function handleEnabledChange(principle: Principle, checked: boolean) {
    setEnabled(prev => {
      const next = { ...prev, [principle]: checked };
      onParamsChange?.(
        principle === "anticipation" ? "ant" :
        principle === "followThrough" ? "ft" :
        principle === "slowInOut" ? "sio" : "ss",
        checked ? 1 : 0
      );
      return next;
    });
  }

  function handleIntensityChange(v: number) {
    setIntensity(v);
    onParamsChange?.("intens", v);
  }

  return (
    <div>
      {/* DEMO STAGE — one object */}
      <div
        className="demo-canvas"
        data-testid="l04-stage"
        style={{ height: 100, marginBottom: "var(--sp-4)", display: "flex", alignItems: "center", paddingLeft: 24, overflow: "hidden" }}
        aria-label="Single object animation demo — press PLAY to fire"
      >
        <div
          data-testid="l04-object"
          style={{
            position: "relative",
            left: objState.x,
            width: OBJ_SIZE,
            height: OBJ_SIZE,
            background: "var(--ink)",
            transform: `scaleX(${objState.scaleX}) scaleY(${objState.scaleY})`,
            transformOrigin: "center center",
            willChange: "transform, left",
            flexShrink: 0,
          }}
        />
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        {/* Per-principle toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--sp-3)" }}>
          {PRINCIPLES.map(p => (
            <label
              key={p.id}
              data-testid={`toggle-${p.id}`}
              className="ds-toggle"
              htmlFor={`toggle-${p.id}`}
              style={{ alignItems: "flex-start", gap: "var(--sp-2)" }}
            >
              <input
                type="checkbox"
                id={`toggle-${p.id}`}
                checked={enabled[p.id]}
                onChange={e => handleEnabledChange(p.id, e.target.checked)}
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

        {/* Intensity */}
        <div className="control-group">
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>INTENSITY</span>
            <span className="readout">{Math.round(intensity * 100)}%</span>
          </label>
          <input
            type="range"
            className="ds-slider"
            data-testid="intensity-slider"
            min={0.1}
            max={1}
            step={0.05}
            value={intensity}
            onChange={e => handleIntensityChange(Number(e.target.value))}
            aria-label="Animation intensity — scales all enabled effects"
          />
          <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            In real UI, keep intensity low (20–40%). High values are for feeling the mechanism.
          </div>
        </div>

        {/* Play button */}
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
          <button
            className="ds-btn"
            data-testid="l04-play"
            onClick={fire}
            style={{ padding: "8px 20px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)" }}
            aria-label="Play animation"
          >
            PLAY
          </button>
        </div>

        {anyDisabled && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            Disabled principles omitted from the current animation
          </p>
        )}
      </div>
    </div>
  );
}
