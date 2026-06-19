"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { stepSpring, makeSpringState, isAtRest, SpringState } from "../../lib/engine/spring";

/**
 * Lesson 03 — Interruptibility & state continuity
 * A panel that animates open↔closed. Grab mid-flight to redirect.
 * NAÏVE RESTART toggle shows the amateur version.
 */

const PANEL_H = 160;
const STAGE_H = 240;
const CLOSED_Y = STAGE_H - 40;    // top of panel when closed (most is hidden)
const OPEN_Y = STAGE_H - PANEL_H; // top of panel when open

export function Lesson03() {
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [naiveRestart, setNaiveRestart] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [panelY, setPanelY] = useState(CLOSED_Y);
  const [isDragging, setIsDragging] = useState(false);
  const [running, setRunning] = useState(false);

  const springStateRef = useRef<SpringState>(makeSpringState(CLOSED_Y));
  const targetRef = useRef<number>(CLOSED_Y);
  const panelYRef = useRef<number>(CLOSED_Y);
  const naiveRef = useRef(false);
  const isOpenRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartPanelRef = useRef(CLOSED_Y);

  useEffect(() => { naiveRef.current = naiveRestart; }, [naiveRestart]);

  const startAnimation = useCallback((to: number) => {
    cancelAnimationFrame(rafRef.current);
    targetRef.current = to;

    if (naiveRef.current) {
      // Naive: restart from the target start position, no velocity
      const fromPos = to === OPEN_Y ? CLOSED_Y : OPEN_Y;
      springStateRef.current = makeSpringState(fromPos);
    }
    // Otherwise: spring continues from current position + velocity (already in springStateRef)

    setRunning(true);
    let lastTime = performance.now();

    function tick(now: number) {
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      springStateRef.current = stepSpring(
        springStateRef.current,
        { mass: 1, stiffness: 200, damping: 22 },
        targetRef.current,
        dt
      );

      const y = springStateRef.current.position;
      panelYRef.current = y;
      setPanelY(y);

      if (isAtRest(springStateRef.current, targetRef.current, 0.5)) {
        setPanelY(targetRef.current);
        panelYRef.current = targetRef.current;
        springStateRef.current = { position: targetRef.current, velocity: 0 };
        setRunning(false);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  function toggle() {
    const newOpen = !isOpenRef.current;
    isOpenRef.current = newOpen;
    setIsOpen(newOpen);
    startAnimation(newOpen ? OPEN_Y : CLOSED_Y);
  }

  // Pointer handling for mid-flight grab
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    cancelAnimationFrame(rafRef.current);
    // Preserve current velocity in spring state for handoff
    dragStartYRef.current = e.clientY;
    dragStartPanelRef.current = panelYRef.current;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - dragStartYRef.current;
    const newY = Math.max(OPEN_Y, Math.min(CLOSED_Y, dragStartPanelRef.current + dy));
    panelYRef.current = newY;
    // Update spring position to follow pointer exactly, keep velocity zero during drag
    springStateRef.current = { position: newY, velocity: 0 };
    setPanelY(newY);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Determine target based on position: past midpoint → open, else → closed
    const mid = (OPEN_Y + CLOSED_Y) / 2;
    const snapTo = panelYRef.current < mid ? OPEN_Y : CLOSED_Y;
    isOpenRef.current = snapTo === OPEN_Y;
    setIsOpen(snapTo === OPEN_Y);
    startAnimation(snapTo);
  }, [startAnimation]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const panelProgress = 1 - (panelY - OPEN_Y) / (CLOSED_Y - OPEN_Y); // 0=closed, 1=open

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={stageRef}
        className="demo-canvas"
        style={{ height: STAGE_H, position: "relative", overflow: "hidden", marginBottom: "var(--sp-4)" }}
        aria-label="Interruptible panel animation stage"
      >
        {/* Background page */}
        <div style={{ padding: "var(--sp-4)", fontSize: "var(--fs-sm)", color: "var(--grey-400)" }}>
          <div style={{ fontSize: "var(--fs-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--grey-600)", marginBottom: 4 }}>
            PAGE CONTENT
          </div>
          {running && !isDragging && (
            <div style={{ marginTop: 8, fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.1em" }}>
              Animating… grab the panel mid-flight!
            </div>
          )}
        </div>

        {/* The panel — draggable */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: panelY,
            height: PANEL_H,
            background: "var(--paper)",
            borderTop: "1px solid var(--ink)",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div style={{ padding: "var(--sp-4)", borderBottom: "1px solid var(--grey-200)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--fs-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--grey-600)" }}>SHEET — DRAG TO REPOSITION</span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>↕</span>
          </div>
          <div style={{ padding: "var(--sp-4)", fontSize: "var(--fs-sm)", color: "var(--grey-600)" }}>
            {naiveRestart ? (
              <span className="bad-marker">NAÏVE RESTART: will snap on interrupt</span>
            ) : (
              "Grab at any point — continuity maintained"
            )}
          </div>
        </div>
      </div>

      {/* Instruments */}
      <div className="instruments-row" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="instrument">
          <span className="instrument__label">PANEL POSITION</span>
          <span className="instrument__value">{Math.round(panelY)} px</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">SPRING VELOCITY</span>
          <span className="instrument__value">{Math.round(springStateRef.current.velocity)} px/s</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">PROGRESS</span>
          <span className="instrument__value">{Math.round(panelProgress * 100)}%</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">STATE</span>
          <span className="instrument__value" style={{ color: naiveRestart ? "var(--red)" : "var(--ink)" }}>
            {naiveRestart ? "naïve" : "continuous"}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="ds-btn"
            onClick={toggle}
            style={{ padding: "8px 20px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)" }}
            aria-label={isOpen ? "Close sheet" : "Open sheet"}
          >
            {isOpen ? "CLOSE SHEET" : "OPEN SHEET"}
          </button>

          <label className="ds-toggle" htmlFor="naive-toggle">
            <input
              type="checkbox"
              id="naive-toggle"
              checked={naiveRestart}
              onChange={e => setNaiveRestart(e.target.checked)}
              aria-label="Naïve restart toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: naiveRestart ? "var(--red)" : "var(--grey-600)" }}>
              NAÏVE RESTART
            </span>
          </label>
        </div>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--grey-600)", margin: 0 }}>
          {naiveRestart
            ? "Bad version: the animation restarts from the beginning on interrupt — feel the snap."
            : "Good version: grab the sheet mid-flight and release it. Position and velocity hand off seamlessly."}
        </p>
        {naiveRestart && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0, letterSpacing: "0.05em" }}>
            NAÏVE RESTART active — mid-flight interrupt will snap to start position
          </p>
        )}
      </div>
    </div>
  );
}
