"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { stepSpring, makeSpringState, isAtRest, SpringState } from "../../lib/engine/spring";

/**
 * Lesson 03 — Interruptibility & state continuity
 * Side-by-side: INTERRUPTIBLE (correct) vs NON-INTERRUPTIBLE (bad, --red).
 * A shared trigger fires both simultaneously so the contrast is feelable.
 */

const PANEL_H = 140;
const STAGE_H = 220;
const CLOSED_Y = STAGE_H - 40;
const OPEN_Y = STAGE_H - PANEL_H;

// ── shared spring params ──────────────────────────────────────────────────────
const SPRING_PARAMS = { mass: 1, stiffness: 200, damping: 22 };

// ── usePanelSpring: one spring-driven panel with interruptible/non-interruptible modes ─
function usePanelSpring(interruptible: boolean) {
  const rafRef = useRef<number>(0);
  const springRef = useRef<SpringState>(makeSpringState(CLOSED_Y));
  const targetRef = useRef<number>(CLOSED_Y);
  const panelYRef = useRef<number>(CLOSED_Y);
  const isOpenRef = useRef(false);
  const animatingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartPanelRef = useRef(CLOSED_Y);

  const [panelY, setPanelY] = useState(CLOSED_Y);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const startAnimation = useCallback((to: number) => {
    cancelAnimationFrame(rafRef.current);
    targetRef.current = to;
    animatingRef.current = true;
    setAnimating(true);

    let lastTime = performance.now();

    function tick(now: number) {
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      springRef.current = stepSpring(
        springRef.current,
        SPRING_PARAMS,
        targetRef.current,
        dt
      );

      const y = springRef.current.position;
      panelYRef.current = y;
      setPanelY(y);

      if (isAtRest(springRef.current, targetRef.current, 0.5)) {
        panelYRef.current = targetRef.current;
        springRef.current = { position: targetRef.current, velocity: 0 };
        setPanelY(targetRef.current);
        animatingRef.current = false;
        setAnimating(false);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const toggle = useCallback(() => {
    const newOpen = !isOpenRef.current;
    isOpenRef.current = newOpen;
    setIsOpen(newOpen);
    startAnimation(newOpen ? OPEN_Y : CLOSED_Y);
  }, [startAnimation]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Non-interruptible: ignore input while animating
    if (!interruptible && animatingRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    cancelAnimationFrame(rafRef.current);
    dragStartYRef.current = e.clientY;
    dragStartPanelRef.current = panelYRef.current;
    // Preserve current velocity for handoff on interruptible
    if (!interruptible) {
      springRef.current = { position: panelYRef.current, velocity: 0 };
    }
  }, [interruptible]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - dragStartYRef.current;
    const newY = Math.max(OPEN_Y, Math.min(CLOSED_Y, dragStartPanelRef.current + dy));
    panelYRef.current = newY;
    springRef.current = { position: newY, velocity: springRef.current.velocity };
    setPanelY(newY);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const mid = (OPEN_Y + CLOSED_Y) / 2;
    const snapTo = panelYRef.current < mid ? OPEN_Y : CLOSED_Y;
    isOpenRef.current = snapTo === OPEN_Y;
    setIsOpen(snapTo === OPEN_Y);
    startAnimation(snapTo);
  }, [startAnimation]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    panelY, isDragging, isOpen, animating,
    toggle, onPointerDown, onPointerMove, onPointerUp,
    springVelocity: springRef.current.velocity,
  };
}

// ── single panel sub-component ─────────────────────────────────────────────
function Panel({
  label, bad, panelY, isDragging, animating,
  onPointerDown, onPointerMove, onPointerUp,
}: {
  label: string; bad?: boolean;
  panelY: number; isDragging: boolean; animating: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
      {/* Label above stage */}
      <span
        style={{
          fontSize: "var(--fs-micro)",
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: bad ? "var(--red)" : "var(--ink)",
        }}
      >
        {label}
      </span>
      {/* Stage */}
      <div
        className="demo-canvas"
        style={{ height: STAGE_H, position: "relative", overflow: "hidden" }}
        aria-label={`${label} panel demo stage`}
      >
        {/* Background copy */}
        <div style={{ padding: "var(--sp-4)", fontSize: "var(--fs-sm)", color: "var(--grey-400)" }}>
          <div style={{ fontSize: "var(--fs-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--grey-600)", marginBottom: 4 }}>
            PAGE CONTENT
          </div>
          {animating && !isDragging && (
            <div style={{ marginTop: 8, fontSize: "var(--fs-micro)", color: bad ? "var(--red)" : "var(--grey-600)", letterSpacing: "0.1em" }}>
              {bad ? "animating — input ignored" : "animating — grab to interrupt!"}
            </div>
          )}
        </div>

        {/* The panel */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: panelY,
            height: PANEL_H,
            background: "var(--paper)",
            borderTop: bad ? "1px solid var(--red)" : "1px solid var(--ink)",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--grey-200)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--fs-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: bad ? "var(--red)" : "var(--grey-600)" }}>
              {bad ? "LOCKED DURING ANIMATION" : "GRAB AT ANY POINT"}
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>↕</span>
          </div>
          <div style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-sm)", color: bad ? "var(--red)" : "var(--grey-600)" }}>
            {bad
              ? "input blocked until animation finishes"
              : "position + velocity handed off seamlessly"}
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Lesson03(_props?: { initialParams?: Record<string, unknown>; onParamsChange?: unknown }) {
  const good = usePanelSpring(true);
  const bad = usePanelSpring(false);

  // Shared trigger: fires both simultaneously
  function fireShared() {
    good.toggle();
    bad.toggle();
  }

  const goodProgress = Math.round((1 - (good.panelY - OPEN_Y) / (CLOSED_Y - OPEN_Y)) * 100);

  return (
    <div>
      {/* DEMO STAGE — side by side */}
      <div
        style={{
          display: "flex",
          gap: "var(--sp-4)",
          marginBottom: "var(--sp-4)",
          flexWrap: "wrap",
        }}
      >
        <Panel
          label="INTERRUPTIBLE"
          bad={false}
          panelY={good.panelY}
          isDragging={good.isDragging}
          animating={good.animating}
          onPointerDown={good.onPointerDown}
          onPointerMove={good.onPointerMove}
          onPointerUp={good.onPointerUp}
        />
        <Panel
          label="NON-INTERRUPTIBLE"
          bad
          panelY={bad.panelY}
          isDragging={bad.isDragging}
          animating={bad.animating}
          onPointerDown={bad.onPointerDown}
          onPointerMove={bad.onPointerMove}
          onPointerUp={bad.onPointerUp}
        />
      </div>

      {/* Instruments */}
      <div className="instruments-row" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="instrument">
          <span className="instrument__label">INTERRUPTIBLE Y</span>
          <span className="instrument__value">{Math.round(good.panelY)} px</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">VELOCITY (GOOD)</span>
          <span className="instrument__value">{Math.round(good.springVelocity)} px/s</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">PROGRESS</span>
          <span className="instrument__value">{goodProgress}%</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">NON-INTERRUPTIBLE</span>
          <span className="instrument__value" style={{ color: "var(--red)" }}>
            {bad.animating ? "locked" : "idle"}
          </span>
        </div>
      </div>

      {/* SHARED TRIGGER */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="ds-btn"
            onClick={fireShared}
            style={{ padding: "8px 20px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)" }}
            aria-label={good.isOpen ? "Close both panels" : "Open both panels"}
          >
            {good.isOpen ? "CLOSE BOTH" : "OPEN BOTH"}
          </button>
        </div>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--grey-600)", margin: 0 }}>
          Grab the left panel mid-flight — it redirects instantly. Grab the right panel mid-flight — it ignores you until the animation finishes.
        </p>
        {bad.animating && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            NON-INTERRUPTIBLE is animating — input is blocked until it settles
          </p>
        )}
      </div>
    </div>
  );
}
