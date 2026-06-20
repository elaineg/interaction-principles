"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { recordFrame, budgetRatio, isFrameDropped, burnMs, makeFpsState, FpsState } from "../../lib/engine/fps";
import { CopyConfigBtn } from "./CopyConfigBtn";
import type { ParamRecord } from "../../lib/lessonParams";

/**
 * Lesson 06 — Latency, frame budget & jank
 * Live FPS meter from real rAF timestamps.
 * INJECT WORK slider burns real CPU. 60/120Hz target switch.
 * Dropped frames shown with --red marks on a scrolling timeline.
 */

const BALL_R = 20;
const STAGE_H = 180;
const TIMELINE_H = 24;
const MAX_TIMELINE = 60; // frames to show

interface Props {
  initialParams?: ParamRecord;
  onParamsChange?: (key: string, val: string | number | boolean) => void;
}

export function Lesson06({ initialParams = {}, onParamsChange }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [hz, setHz] = useState<60 | 120>(((initialParams.hz as number) ?? 60) as 60 | 120);
  const [injectWork, setInjectWork] = useState((initialParams.inject as number) ?? 0);
  const [showDropped, setShowDropped] = useState((initialParams.dropped as number) !== 0);
  const [running, setRunning] = useState(false);
  const [fpsDisplay, setFpsDisplay] = useState(0);
  const [lastDeltaMs, setLastDeltaMs] = useState(16.67);
  const [droppedCount, setDroppedCount] = useState(0);
  const [timeline, setTimeline] = useState<{ delta: number; dropped: boolean }[]>([]);

  const rafRef = useRef<number>(0);
  const fpsStateRef = useRef<FpsState>(makeFpsState());
  const ballXRef = useRef(0);
  const ballDirRef = useRef(1);
  const stageWRef = useRef(300);
  const hzRef = useRef<60 | 120>(hz);
  const injectRef = useRef(injectWork);
  const timelineRef = useRef<{ delta: number; dropped: boolean }[]>([]);

  useEffect(() => { hzRef.current = hz; }, [hz]);
  useEffect(() => { injectRef.current = injectWork; }, [injectWork]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      stageWRef.current = el.getBoundingClientRect().width;
    });
    ro.observe(el);
    stageWRef.current = el.getBoundingClientRect().width;
    ballXRef.current = stageWRef.current / 2;
    return () => ro.disconnect();
  }, []);

  const start = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    fpsStateRef.current = makeFpsState();
    timelineRef.current = [];
    setTimeline([]);
    setDroppedCount(0);
    setRunning(true);

    const SPEED = 200; // px/s
    let lastTime = performance.now();

    function tick(now: number) {
      // Burn synthetic work BEFORE frame accounting
      burnMs(injectRef.current);

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      fpsStateRef.current = recordFrame(fpsStateRef.current, now, hzRef.current);
      const { fps, lastDeltaMs, droppedFrames } = fpsStateRef.current;

      // Move ball
      const W = stageWRef.current - BALL_R * 2;
      ballXRef.current += SPEED * ballDirRef.current * Math.min(dt, 0.1);
      if (ballXRef.current >= W) { ballXRef.current = W; ballDirRef.current = -1; }
      if (ballXRef.current <= 0) { ballXRef.current = 0; ballDirRef.current = 1; }

      // Update timeline
      const dropped = isFrameDropped(lastDeltaMs, hzRef.current);
      timelineRef.current = [
        ...timelineRef.current.slice(-MAX_TIMELINE + 1),
        { delta: lastDeltaMs, dropped },
      ];

      setFpsDisplay(Math.round(fps));
      setLastDeltaMs(lastDeltaMs);
      setDroppedCount(droppedFrames);
      setTimeline([...timelineRef.current]);

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const targetMs = 1000 / hz;
  // Only show red / ratio when running — cold state shows 0 (neutral)
  const ratio = running ? budgetRatio(lastDeltaMs, hz) : 0;
  const isOver = running && ratio > 1;

  // Inline ball position for smooth DOM update
  const [ballX, setBallX] = useState(0);
  // Update ball X from ref in state during animation
  const ballXState = running ? ballXRef.current : ballX;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setBallX(ballXRef.current);
    }, 16);
    return () => clearInterval(id);
  }, [running]);

  function handleHzChange(h: 60 | 120) {
    setHz(h);
    onParamsChange?.("hz", h);
  }

  function handleInjectChange(v: number) {
    setInjectWork(v);
    onParamsChange?.("inject", v);
  }

  function handleDroppedChange(checked: boolean) {
    setShowDropped(checked);
    onParamsChange?.("dropped", checked ? 1 : 0);
  }

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={stageRef}
        className="demo-canvas"
        style={{ height: STAGE_H, marginBottom: "var(--sp-2)" }}
        aria-label="FPS and frame budget demo stage"
      >
        {/* Moving ball */}
        <div style={{
          position: "absolute",
          left: (running ? ballXRef.current : ballX) + BALL_R,
          top: STAGE_H / 2 - BALL_R,
          width: BALL_R * 2,
          height: BALL_R * 2,
          background: "var(--ink)",
          borderRadius: "50%",
          willChange: "left",
        }} />

        {/* FPS overlay */}
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: "var(--fs-label)", fontWeight: 500, fontVariantNumeric: "tabular-nums", color: isOver ? "var(--red)" : "var(--ink)", letterSpacing: "var(--ls-label)" }}>
          {running ? `${fpsDisplay} FPS` : "— FPS"}
        </div>
      </div>

      {/* Frame budget bar */}
      <div style={{ marginBottom: "var(--sp-2)" }}>
        <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
          <span>FRAME BUDGET ({targetMs.toFixed(1)} ms target)</span>
          <span style={{ color: isOver ? "var(--red)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {running ? `${lastDeltaMs.toFixed(1)} ms${isOver ? " OVER" : ""}` : "— ms"}
          </span>
        </div>
        <div style={{ height: 8, background: "var(--grey-100)", border: "1px solid var(--grey-200)", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: running ? `${Math.min(ratio * 100, 200)}%` : "0%",
            background: isOver ? "var(--red)" : "var(--ink)",
            transition: "width 0.05s linear",
          }} />
          {/* Budget line at 100% */}
          <div style={{ position: "absolute", left: "100%", top: -2, bottom: -2, width: 1, background: "var(--ink)" }} />
        </div>
        {!running && (
          <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)", marginTop: 4 }}>
            Press START to measure real frame deltas.
          </div>
        )}
      </div>

      {/* Timeline */}
      {showDropped && (
        <div style={{ height: TIMELINE_H, marginBottom: "var(--sp-4)", display: "flex", gap: 1, alignItems: "flex-end" }}>
          {timeline.map((f, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: Math.min((f.delta / targetMs) * TIMELINE_H, TIMELINE_H),
                background: f.dropped ? "var(--red)" : "var(--ink)",
                opacity: f.dropped ? 1 : 0.5,
                minWidth: 1,
              }}
              title={`${f.delta.toFixed(1)} ms${f.dropped ? " — DROPPED" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Instruments */}
      <div className="instruments-row" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="instrument">
          <span className="instrument__label">MEASURED FPS</span>
          <span className="instrument__value" style={{ color: fpsDisplay < hz * 0.9 && running ? "var(--red)" : "var(--ink)" }}
            role="status" aria-live="polite" aria-label={`Measured FPS: ${running ? fpsDisplay : "—"}`}>
            {running ? fpsDisplay : "—"}
          </span>
        </div>
        <div className="instrument">
          <span className="instrument__label">LAST FRAME</span>
          <span className="instrument__value" style={{ color: isOver ? "var(--red)" : "var(--ink)" }}>
            {running ? `${lastDeltaMs.toFixed(1)} ms` : "—"}
          </span>
        </div>
        <div className="instrument">
          <span className="instrument__label">TARGET</span>
          <span className="instrument__value">{hz} Hz / {targetMs.toFixed(1)} ms</span>
        </div>
        <div className="instrument">
          <span className="instrument__label">DROPPED</span>
          <span className="instrument__value" style={{ color: droppedCount > 0 && running ? "var(--red)" : "var(--ink)" }}>
            {running ? droppedCount : "—"}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="ds-btn"
            onClick={running ? stop : start}
            style={{ padding: "8px 20px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)" }}
          >
            {running ? "STOP" : "START"}
          </button>

          {/* Hz switch */}
          <div className="ds-seg" role="group" aria-label="Hz target">
            {([60, 120] as const).map(h => (
              <button
                key={h}
                className={`ds-seg__btn${hz === h ? " ds-seg__btn--active" : ""}`}
                onClick={() => handleHzChange(h)}
                aria-pressed={hz === h}
              >
                {h}HZ
              </button>
            ))}
          </div>

          <label className="ds-toggle" htmlFor="dropped-toggle">
            <input
              type="checkbox"
              id="dropped-toggle"
              checked={showDropped}
              onChange={e => handleDroppedChange(e.target.checked)}
              aria-label="Show dropped frame timeline"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)" }}>
              SHOW DROPPED FRAMES
            </span>
          </label>
        </div>

        <div className="control-group">
          <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
            <span>INJECT WORK (ms/frame)</span>
            <span className="readout" style={{ color: injectWork > targetMs ? "var(--red)" : "var(--ink)" }}>
              {injectWork} ms
            </span>
          </label>
          <input
            type="range"
            className="ds-slider"
            min={0} max={50} step={1}
            value={injectWork}
            onChange={e => handleInjectChange(Number(e.target.value))}
            aria-label="Injected work in milliseconds per frame"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
            <span>0 ms (clean)</span>
            <span style={{ color: "var(--red)" }}>{">"} {targetMs.toFixed(0)} ms = dropped frames</span>
            <span>50 ms</span>
          </div>
        </div>

        {injectWork > targetMs && running && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            Frame budget blown — {injectWork.toFixed(0)} ms work &gt; {targetMs.toFixed(1)} ms budget. Frames dropping.
          </p>
        )}

        {/* Copy config */}
        <div style={{ paddingTop: "var(--sp-2)" }}>
          <CopyConfigBtn config={`target=${hz}Hz (${targetMs.toFixed(1)}ms budget) inject-work=${injectWork}ms`} />
        </div>
      </div>
    </div>
  );
}
