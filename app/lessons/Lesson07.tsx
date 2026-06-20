"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ParamRecord } from "../../lib/lessonParams";

/**
 * Lesson 07 — Feedback timing & affordances / JND
 * Button with touch-down highlight, RESPONSE DELAY slider, haptic toggle.
 */

const JND_MS = 100; // just-noticeable difference threshold

interface Props {
  initialParams?: ParamRecord;
  onParamsChange?: (key: string, val: string | number | boolean) => void;
}

export function Lesson07({ initialParams = {}, onParamsChange }: Props) {
  const [responseDelay, setResponseDelay] = useState((initialParams.delay as number) ?? 0);
  const [touchDownOn, setTouchDownOn] = useState((initialParams.td as number) !== 0);
  const [hapticOn, setHapticOn] = useState((initialParams.haptic as number) === 1);
  const [hapticSupported, setHapticSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"idle" | "down" | "confirming" | "confirmed">("idle");
  const [pressCount, setPressCount] = useState(0);

  const delayRef = useRef(responseDelay);
  const touchDownRef = useRef(touchDownOn);
  const hapticRef = useRef(hapticOn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { delayRef.current = responseDelay; }, [responseDelay]);
  useEffect(() => { touchDownRef.current = touchDownOn; }, [touchDownOn]);
  useEffect(() => { hapticRef.current = hapticOn; }, [hapticOn]);

  // Check haptic support in effect (SSR-safe)
  useEffect(() => {
    setHapticSupported(typeof navigator !== "undefined" && "vibrate" in navigator);
  }, []);

  const onPointerDown = useCallback(() => {
    if (touchDownRef.current) {
      setPhase("down");
    }
  }, []);

  const onPointerUp = useCallback(() => {
    setPhase("confirming");
    const delay = delayRef.current;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setPhase("confirmed");
      setPressCount(c => c + 1);

      // Haptic
      if (hapticRef.current && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([10]);
      }

      // Reset after a moment
      timerRef.current = setTimeout(() => setPhase("idle"), 600);
    }, delay);
  }, []);

  const onPointerCancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isPressed = phase === "down";
  const isConfirmed = phase === "confirmed";

  // Color for JND zone
  const inJndZone = responseDelay >= JND_MS;

  function handleDelayChange(v: number) {
    setResponseDelay(v);
    onParamsChange?.("delay", v);
  }

  function handleTouchDownChange(checked: boolean) {
    setTouchDownOn(checked);
    onParamsChange?.("td", checked ? 1 : 0);
  }

  function handleHapticChange(checked: boolean) {
    setHapticOn(checked);
    onParamsChange?.("haptic", checked ? 1 : 0);
  }

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        className="demo-canvas"
        style={{ height: 180, marginBottom: "var(--sp-4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-8)" }}
        aria-label="Feedback timing demo stage"
      >
        {/* The button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
          <button
            style={{
              width: 120,
              height: 48,
              background: isPressed ? "var(--paper)" : isConfirmed ? "var(--ink)" : "var(--ink)",
              color: isPressed ? "var(--ink)" : "var(--paper)",
              border: isPressed ? "1px solid var(--ink)" : "1px solid var(--ink)",
              fontFamily: "var(--ds-font)",
              fontSize: "var(--fs-label)",
              fontWeight: 500,
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: isPressed && touchDownOn ? "background 0ms" : "background 120ms ease",
              outline: "none",
              borderRadius: 0,
            }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerCancel}
            aria-label="Demo button — press and hold"
          >
            {isConfirmed ? "CONFIRMED" : "PRESS"}
          </button>
          <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)", letterSpacing: "0.1em" }}>
            {pressCount > 0 ? `${pressCount} press${pressCount !== 1 ? "es" : ""}` : "press the button"}
          </span>
        </div>

        {/* Confirmation pulse / visual feedback */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", alignItems: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "1px solid var(--grey-200)",
            background: isConfirmed ? "var(--ink)" : "transparent",
            transition: "background 80ms ease",
          }} />
          <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            CONFIRM
          </span>
        </div>

        {/* Screen-edge haptic visual */}
        {hapticOn && isConfirmed && (
          <div style={{
            position: "absolute",
            inset: 0,
            border: "2px solid var(--ink)",
            pointerEvents: "none",
            animation: "none",
            opacity: 0.4,
          }} />
        )}
      </div>

      {/* Instruments */}
      <div className="instruments-row" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="instrument">
          <span className="instrument__label">RESPONSE DELAY</span>
          <span
            className="instrument__value"
            style={{ color: inJndZone ? "var(--red)" : "var(--ink)" }}
            role="status"
            aria-live="polite"
          >
            {responseDelay} ms
          </span>
        </div>
        <div className="instrument">
          <span className="instrument__label">JND STATUS</span>
          <span className="instrument__value" style={{ color: inJndZone ? "var(--red)" : "var(--ink)" }}>
            {inJndZone ? "feels laggy" : "feels instant"}
          </span>
        </div>
        <div className="instrument">
          <span className="instrument__label">TOUCH-DOWN</span>
          <span className="instrument__value">{touchDownOn ? "on" : "off"}</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">HAPTIC</span>
          <span className="instrument__value">
            {hapticSupported === null ? "—" : hapticSupported ? (hapticOn ? "on" : "off") : "unsupported"}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div className="control-group">
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>RESPONSE DELAY</span>
            <span className="readout" style={{ color: inJndZone ? "var(--red)" : "var(--ink)" }}>
              {responseDelay} ms
            </span>
          </label>
          <input
            type="range"
            className="ds-slider"
            min={0} max={300} step={10}
            value={responseDelay}
            onChange={e => handleDelayChange(Number(e.target.value))}
            aria-label="Response delay in milliseconds"
          />
          {/* JND marker overlay */}
          <div style={{ position: "relative", height: 12 }}>
            <div style={{ position: "absolute", left: `${(JND_MS / 300) * 100}%`, top: 0, bottom: 0, width: 1, background: "var(--red)" }} />
            <span style={{ position: "absolute", left: `${(JND_MS / 300) * 100}%`, top: 0, fontSize: "var(--fs-micro)", color: "var(--red)", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
              JND ~100ms
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            <span>0 ms (instant)</span>
            <span>300 ms (clearly laggy)</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap" }}>
          <label className="ds-toggle" htmlFor="touchdown-toggle">
            <input
              type="checkbox"
              id="touchdown-toggle"
              checked={touchDownOn}
              onChange={e => handleTouchDownChange(e.target.checked)}
              aria-label="Touch-down highlight toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)" }}>
              TOUCH-DOWN HIGHLIGHT
            </span>
          </label>

          <label className="ds-toggle" htmlFor="haptic-toggle">
            <input
              type="checkbox"
              id="haptic-toggle"
              checked={hapticOn}
              onChange={e => handleHapticChange(e.target.checked)}
              disabled={hapticSupported === false}
              aria-label="Haptic feedback toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: hapticSupported === false ? "var(--grey-400)" : "var(--grey-600)" }}>
              HAPTIC
              {hapticSupported === false && (
                <span style={{ color: "var(--grey-400)", marginLeft: 4 }}>(unavailable)</span>
              )}
            </span>
          </label>
        </div>

        {inJndZone && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            {responseDelay} ms &gt; JND threshold — response delay is perceptible
          </p>
        )}

        {hapticSupported === false && (
          <p role="status" style={{ fontSize: "var(--fs-label)", color: "var(--grey-400)", margin: 0 }}>
            navigator.vibrate not available in this browser — haptic channel unavailable on desktop.
          </p>
        )}
      </div>
    </div>
  );
}
