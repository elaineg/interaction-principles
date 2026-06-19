"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { addSample, estimateVelocity, PointerSample } from "../../lib/engine/velocity";
import { stepDecel, rubberBand, isDecelDone, DecelState } from "../../lib/engine/decel";

/**
 * Lesson 05 — Velocity handoff / flick
 * Flick a card, capture lift-off velocity, decelerate with rubber-band at edges.
 * SEAM debug toggle shows the bad version (ignores lift-off velocity).
 */

const CARD_W = 80;
const CARD_H = 56;

export function Lesson05() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [cardX, setCardX] = useState(0);
  const [cardY, setCardY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [decelFriction, setDecelFriction] = useState(4);
  const [rubberBandOn, setRubberBandOn] = useState(true);
  const [seamDebug, setSeamDebug] = useState(false);
  const [liftoffVelocity, setLiftoffVelocity] = useState<{ vx: number; vy: number } | null>(null);
  const [showSeamMarker, setShowSeamMarker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const samplesRef = useRef<PointerSample[]>([]);
  const rafRef = useRef<number>(0);
  const decelStateRef = useRef<DecelState>({ position: 0, velocity: 0 });
  const decelStateYRef = useRef<DecelState>({ position: 0, velocity: 0 });
  const cardXRef = useRef(0);
  const cardYRef = useRef(0);
  const stageWRef = useRef(300);
  const stageHRef = useRef(200);
  const frictionRef = useRef(4);
  const rubberBandRef = useRef(true);
  const seamRef = useRef(false);

  useEffect(() => { frictionRef.current = decelFriction; }, [decelFriction]);
  useEffect(() => { rubberBandRef.current = rubberBandOn; }, [rubberBandOn]);
  useEffect(() => { seamRef.current = seamDebug; }, [seamDebug]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      stageWRef.current = r.width;
      stageHRef.current = r.height;
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    stageWRef.current = r.width;
    stageHRef.current = r.height;
    // Init card to center
    const cx = r.width / 2 - CARD_W / 2;
    const cy = r.height / 2 - CARD_H / 2;
    cardXRef.current = cx;
    cardYRef.current = cy;
    setCardX(cx);
    setCardY(cy);
    setInitialized(true);
    return () => ro.disconnect();
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(rafRef.current);
    samplesRef.current = [];
    setLiftoffVelocity(null);
    setShowSeamMarker(false);
    setIsDragging(true);

    const rect = stageRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left - CARD_W / 2;
    const sy = e.clientY - rect.top - CARD_H / 2;
    samplesRef.current = addSample([], sx, sy, e.timeStamp);
    cardXRef.current = sx;
    cardYRef.current = sy;
    setCardX(sx);
    setCardY(sy);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const rect = stageRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left - CARD_W / 2;
    const sy = e.clientY - rect.top - CARD_H / 2;
    samplesRef.current = addSample(samplesRef.current, sx, sy, e.timeStamp);
    cardXRef.current = sx;
    cardYRef.current = sy;
    setCardX(sx);
    setCardY(sy);
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const { vx, vy } = estimateVelocity(samplesRef.current); // px/ms
    // Convert to px/s
    const vxps = vx * 1000;
    const vyps = vy * 1000;

    if (seamRef.current) {
      // Seam version: ignore velocity, start from zero
      setLiftoffVelocity({ vx: 0, vy: 0 });
      setShowSeamMarker(true);
      decelStateRef.current = { position: cardXRef.current, velocity: 0 };
      decelStateYRef.current = { position: cardYRef.current, velocity: 0 };
    } else {
      setLiftoffVelocity({ vx: vxps, vy: vyps });
      decelStateRef.current = { position: cardXRef.current, velocity: vxps };
      decelStateYRef.current = { position: cardYRef.current, velocity: vyps };
    }

    let lastTime = performance.now();

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const friction = frictionRef.current;
      const useRubber = rubberBandRef.current;

      decelStateRef.current = stepDecel(decelStateRef.current, friction, dt);
      decelStateYRef.current = stepDecel(decelStateYRef.current, friction, dt);

      let nx = decelStateRef.current.position;
      let ny = decelStateYRef.current.position;

      const maxX = stageWRef.current - CARD_W;
      const maxY = stageHRef.current - CARD_H;

      if (useRubber) {
        nx = rubberBand(nx, 0, maxX);
        ny = rubberBand(ny, 0, maxY);
      } else {
        // Hard clamp + kill velocity on wall
        if (nx < 0) { nx = 0; decelStateRef.current.velocity = 0; }
        if (nx > maxX) { nx = maxX; decelStateRef.current.velocity = 0; }
        if (ny < 0) { ny = 0; decelStateYRef.current.velocity = 0; }
        if (ny > maxY) { ny = maxY; decelStateYRef.current.velocity = 0; }
      }

      cardXRef.current = nx;
      cardYRef.current = ny;
      setCardX(nx);
      setCardY(ny);

      const doneX = isDecelDone(decelStateRef.current);
      const doneY = isDecelDone(decelStateYRef.current);

      if (!doneX || !doneY) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [isDragging]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const velMag = liftoffVelocity
    ? Math.round(Math.sqrt(liftoffVelocity.vx ** 2 + liftoffVelocity.vy ** 2))
    : 0;

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={stageRef}
        className="demo-canvas"
        style={{ height: 200, marginBottom: "var(--sp-4)", touchAction: "none", userSelect: "none" }}
        aria-label="Flick the card. Release to see velocity handoff and deceleration."
      >
        {initialized && (
          <>
            {/* Card */}
            <div
              style={{
                position: "absolute",
                left: cardX,
                top: cardY,
                width: CARD_W,
                height: CARD_H,
                background: "var(--ink)",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                willChange: "transform",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span style={{ color: "var(--paper)", fontSize: "var(--fs-micro)", letterSpacing: "0.1em" }}>FLICK</span>
            </div>

            {/* Velocity vector arrow at liftoff point */}
            {liftoffVelocity && !isDragging && velMag > 5 && (
              <svg
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                overflow="visible"
              >
                <line
                  x1={cardX + CARD_W / 2}
                  y1={cardY + CARD_H / 2}
                  x2={cardX + CARD_W / 2 + (liftoffVelocity.vx / velMag) * Math.min(velMag / 8, 60)}
                  y2={cardY + CARD_H / 2 + (liftoffVelocity.vy / velMag) * Math.min(velMag / 8, 60)}
                  stroke={seamDebug ? "var(--red)" : "var(--grey-600)"}
                  strokeWidth={1}
                />
                <circle
                  cx={cardX + CARD_W / 2 + (liftoffVelocity.vx / velMag) * Math.min(velMag / 8, 60)}
                  cy={cardY + CARD_H / 2 + (liftoffVelocity.vy / velMag) * Math.min(velMag / 8, 60)}
                  r={3}
                  fill={seamDebug ? "var(--red)" : "var(--grey-600)"}
                />
              </svg>
            )}

            {/* SEAM marker */}
            {showSeamMarker && seamDebug && (
              <div style={{
                position: "absolute",
                left: cardX + CARD_W / 2 - 4,
                top: cardY + CARD_H / 2 - 4,
                width: 8,
                height: 8,
                border: "2px solid var(--red)",
                pointerEvents: "none",
              }} />
            )}

            {/* Drag hint */}
            {!isDragging && velMag === 0 && (
              <span style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: "var(--fs-micro)",
                color: "var(--grey-400)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                pointerEvents: "none",
              }}>
                flick the card ↗
              </span>
            )}
          </>
        )}
      </div>

      {/* Instruments */}
      <div className="instruments-row" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="instrument">
          <span className="instrument__label">LIFT-OFF VELOCITY</span>
          <span
            className="instrument__value"
            style={{ color: seamDebug ? "var(--red)" : "var(--ink)" }}
            role="status"
            aria-live="polite"
          >
            {seamDebug ? "0 (SEAM)" : `${velMag} px/s`}
          </span>
        </div>
        <div className="instrument">
          <span className="instrument__label">VX</span>
          <span className="instrument__value">{liftoffVelocity ? Math.round(liftoffVelocity.vx) : 0} px/s</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">VY</span>
          <span className="instrument__value">{liftoffVelocity ? Math.round(liftoffVelocity.vy) : 0} px/s</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">FRICTION</span>
          <span className="instrument__value">{decelFriction}</span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div className="control-group">
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>DECELERATION (FRICTION)</span>
            <span className="readout">{decelFriction}</span>
          </label>
          <input
            type="range"
            className="ds-slider"
            min={1} max={12} step={0.5}
            value={decelFriction}
            onChange={e => setDecelFriction(Number(e.target.value))}
            aria-label="Deceleration friction coefficient"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            <span>1 (long glide)</span>
            <span>12 (quick stop)</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap" }}>
          <label className="ds-toggle" htmlFor="rubber-toggle">
            <input
              type="checkbox"
              id="rubber-toggle"
              checked={rubberBandOn}
              onChange={e => setRubberBandOn(e.target.checked)}
              aria-label="Rubber-band at bounds toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)" }}>
              RUBBER-BAND AT BOUNDS
            </span>
          </label>

          <label className="ds-toggle" htmlFor="seam-toggle">
            <input
              type="checkbox"
              id="seam-toggle"
              checked={seamDebug}
              onChange={e => setSeamDebug(e.target.checked)}
              aria-label="SEAM debug toggle — ignores lift-off velocity"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: seamDebug ? "var(--red)" : "var(--grey-600)" }}>
              SEAM DEBUG
            </span>
          </label>
        </div>

        {seamDebug && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            SEAM active — lift-off velocity ignored, card restarts from zero (feel the jerk)
          </p>
        )}
      </div>
    </div>
  );
}
