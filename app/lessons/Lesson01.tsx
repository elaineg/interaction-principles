"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { CopyConfigBtn } from "./CopyConfigBtn";
import type { ParamRecord } from "../../lib/lessonParams";

/**
 * Lesson 01 — Direct manipulation & 1:1 tracking
 * Draggable ink square with GAIN (0.5×/1×/2×) and LATENCY (0–200ms) controls.
 * Live px-delta readout between pointer and object.
 */

const SQUARE_SIZE = 48;

interface Props {
  initialParams?: ParamRecord;
  onParamsChange?: (key: string, val: string | number | boolean) => void;
}

export function Lesson01({ initialParams = {}, onParamsChange }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Position of the square (center of the square)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // True pointer position within the stage
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Restore from initialParams or defaults
  const initGain = (initialParams.g as 0.5 | 1 | 2) ?? 1;
  const initLatency = (initialParams.lat as number) ?? 0;

  const [gain, setGain] = useState<0.5 | 1 | 2>(initGain);
  const [latency, setLatency] = useState(initLatency);
  const [initialized, setInitialized] = useState(false);

  // Pending move queue for latency simulation
  const pendingRef = useRef<Array<{ x: number; y: number; at: number }>>([]);
  const rafRef = useRef<number>(0);
  // Drag anchor: object pos + pointer pos at pointerdown
  const anchorObjRef = useRef({ x: 0, y: 0 });
  const anchorPtrRef = useRef({ x: 0, y: 0 });
  // Pointer position during drag (raw stage coords)
  const rawPointer = useRef({ x: 0, y: 0 });

  // Stage dimensions
  const stageW = useRef(300);
  const stageH = useRef(200);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      stageW.current = rect.width;
      stageH.current = rect.height;
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    stageW.current = rect.width;
    stageH.current = rect.height;
    // Initialize square to center
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setPos({ x: cx, y: cy });
    setPointerPos({ x: cx, y: cy });
    setInitialized(true);
    return () => ro.disconnect();
  }, []);

  // Flush pending moves with latency
  const flushPending = useCallback(() => {
    const now = Date.now();
    const pending = pendingRef.current;
    const ready = pending.filter(p => p.at <= now);
    if (ready.length > 0) {
      // Apply the latest ready move
      const latest = ready[ready.length - 1];
      pendingRef.current = pending.filter(p => p.at > now);
      setPos({ x: latest.x, y: latest.y });
    }
    if (pendingRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(flushPending);
    }
  }, []);

  const applyMoveAnchored = useCallback(
    (currentPtrX: number, currentPtrY: number) => {
      // Correct gain semantics:
      // objectPos = anchorObj + gain × (currentPointer − anchorPtr)
      // At gain=1: object moves exactly pointer distance (1:1)
      // At gain=0.5: object moves half pointer distance
      // At gain=2: object moves twice pointer distance
      const dxPtr = currentPtrX - anchorPtrRef.current.x;
      const dyPtr = currentPtrY - anchorPtrRef.current.y;
      let nx = anchorObjRef.current.x + gain * dxPtr;
      let ny = anchorObjRef.current.y + gain * dyPtr;

      // Clamp to stage bounds
      const half = SQUARE_SIZE / 2;
      nx = Math.max(half, Math.min(stageW.current - half, nx));
      ny = Math.max(half, Math.min(stageH.current - half, ny));

      if (latency === 0) {
        setPos({ x: nx, y: ny });
      } else {
        pendingRef.current.push({ x: nx, y: ny, at: Date.now() + latency });
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(flushPending);
      }
    },
    [gain, latency, flushPending]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = stageRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // Capture anchor: object position + pointer position at grab time
      anchorObjRef.current = { x: pos.x, y: pos.y };
      anchorPtrRef.current = { x: sx, y: sy };
      rawPointer.current = { x: sx, y: sy };
      setPointerPos({ x: sx, y: sy });
      setIsDragging(true);
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const rect = stageRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      rawPointer.current = { x: sx, y: sy };
      setPointerPos({ x: sx, y: sy });
      applyMoveAnchored(sx, sy);
    },
    [isDragging, applyMoveAnchored]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    pendingRef.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  // Compute delta
  const deltaX = Math.round(pointerPos.x - pos.x);
  const deltaY = Math.round(pointerPos.y - pos.y);
  const delta = Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY));

  function handleGainChange(g: 0.5 | 1 | 2) {
    setGain(g);
    onParamsChange?.("g", g);
  }

  function handleLatencyChange(v: number) {
    setLatency(v);
    onParamsChange?.("lat", v);
  }

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={stageRef}
        className="demo-canvas"
        style={{ height: 220, cursor: isDragging ? "grabbing" : "default", marginBottom: "var(--sp-6)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Drag the square. Adjust GAIN and LATENCY controls to feel the effect."
      >
        {initialized && (
          <>
            {/* Drag hint */}
            {!isDragging && (
              <span
                style={{
                  position: "absolute",
                  left: pos.x + SQUARE_SIZE / 2 + 8,
                  top: pos.y - 8,
                  fontSize: "var(--fs-micro)",
                  color: "var(--grey-400)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  pointerEvents: "none",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                ← drag me
              </span>
            )}
            {/* Pointer ghost (immediate) */}
            {isDragging && (
              <div
                style={{
                  position: "absolute",
                  left: pointerPos.x - 3,
                  top: pointerPos.y - 3,
                  width: 6,
                  height: 6,
                  border: "1px solid var(--grey-400)",
                  background: "transparent",
                  pointerEvents: "none",
                  transform: "translate(0, 0)",
                }}
              />
            )}
            {/* The ink square */}
            <div
              style={{
                position: "absolute",
                left: pos.x - SQUARE_SIZE / 2,
                top: pos.y - SQUARE_SIZE / 2,
                width: SQUARE_SIZE,
                height: SQUARE_SIZE,
                background: "var(--ink)",
                cursor: "grab",
                touchAction: "none",
                willChange: "transform",
              }}
            />
          </>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        {/* GAIN segmented */}
        <div className="control-group" style={{ flexDirection: "row", alignItems: "center", gap: "var(--sp-4)", flexWrap: "wrap" }}>
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", minWidth: 80 }}>
            GAIN
          </label>
          <div className="ds-seg" role="group" aria-label="GAIN control">
            {([0.5, 1, 2] as const).map((g) => (
              <button
                key={g}
                className={`ds-seg__btn${gain === g ? " ds-seg__btn--active" : ""}`}
                onClick={() => handleGainChange(g)}
                aria-pressed={gain === g}
                aria-label={`Gain ${g}×`}
              >
                {g}×
              </button>
            ))}
          </div>
          <span
            className="readout"
            data-testid="gain-status"
            style={{ fontSize: "var(--fs-label)", fontVariantNumeric: "tabular-nums", color: "var(--grey-600)" }}
          >
            {gain === 1 ? "1:1 perfect" : gain < 1 ? "feels sluggish" : "feels slippery"}
          </span>
        </div>

        {/* LATENCY slider */}
        <div className="control-group" style={{ flexDirection: "column", gap: "var(--sp-2)" }}>
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>LATENCY (ADDED MS)</span>
            <span className="readout">{latency} ms</span>
          </label>
          <input
            type="range"
            className="ds-slider"
            min={0}
            max={200}
            step={5}
            value={latency}
            onChange={e => handleLatencyChange(Number(e.target.value))}
            aria-label="Added latency in milliseconds"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            <span>0 ms</span>
            <span style={{ color: latency > 80 ? "var(--red)" : "inherit" }}>~100ms JND</span>
            <span>200 ms</span>
          </div>
        </div>

        {/* INSTRUMENTS */}
        <div className="instruments-row">
          <div className="instrument">
            <span className="instrument__label">POINTER → OBJECT DELTA</span>
            <span
              className="instrument__value"
              style={{ color: delta > 2 ? "var(--red)" : "var(--ink)" }}
              role="status"
              aria-live="polite"
              aria-label={`Pointer to object delta: ${delta} px`}
            >
              {delta} px
            </span>
          </div>
          <div className="instrument">
            <span className="instrument__label">ACTIVE GAIN</span>
            <span className="instrument__value">{gain}×</span>
          </div>
          <div className="instrument">
            <span className="instrument__label">ADDED LATENCY</span>
            <span className="instrument__value" style={{ color: latency > 80 ? "var(--red)" : "inherit" }}>
              {latency} ms
            </span>
          </div>
          <div className="instrument">
            <span className="instrument__label">STATUS</span>
            <span className="instrument__value">
              {gain === 1 && latency === 0 ? "perfect 1:1" : "degraded"}
            </span>
          </div>
        </div>

        {/* Copy config */}
        <div style={{ paddingTop: "var(--sp-2)" }}>
          <CopyConfigBtn config={`gain=${gain}× latency=${latency}ms`} />
        </div>
      </div>
    </div>
  );
}
