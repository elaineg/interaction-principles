"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { stepSpring, makeSpringState, SpringState, SpringParams } from "../../lib/engine/spring";

/**
 * Lesson 02 — Physics spring vs easing curve
 * Side-by-side: hand-rolled spring integrator vs cubic-bézier easing.
 * Both animate together on one trigger. Both plot position-over-time.
 */

const STAGE_H = 200;
const OBJECT_SIZE = 40;
const TRAVEL = 160; // px from left edge to right edge within each half

function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // Newton's method to find t from x, then return y
  // Control points: (0,0), (p1x,p1y), (p2x,p2y), (1,1)
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t: number) { return ((ax * t + bx) * t + cx) * t; }
  function sampleCurveY(t: number) { return ((ay * t + by) * t + cy) * t; }
  function sampleCurveDerivX(t: number) { return (3 * ax * t + 2 * bx) * t + cx; }

  // Newton's method to solve for t given x=t(input)
  let guess = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleCurveX(guess) - t;
    if (Math.abs(x) < 1e-7) break;
    const d = sampleCurveDerivX(guess);
    if (Math.abs(d) < 1e-6) break;
    guess -= x / d;
  }
  return sampleCurveY(Math.max(0, Math.min(1, guess)));
}

type Direction = "left" | "right";

export function Lesson02() {
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Spring state
  const [springParams, setSpringParams] = useState<SpringParams>({ mass: 1, stiffness: 180, damping: 20 });
  // Easing
  const [duration, setDuration] = useState(400); // ms
  const [bezierP1, setBezierP1] = useState({ x: 0.25, y: 0.1 });
  const [bezierP2, setBezierP2] = useState({ x: 0.25, y: 1.0 });

  // Animation state
  const [springPos, setSpringPos] = useState(20); // x within left half
  const [easingPos, setEasingPos] = useState(20); // x within right half
  const [running, setRunning] = useState(false);
  const [direction, setDirection] = useState<Direction>("right");

  // Plot data
  const [springPlot, setSpringPlot] = useState<number[]>([]);
  const [easingPlot, setEasingPlot] = useState<number[]>([]);

  const springStateRef = useRef<SpringState>(makeSpringState(20));
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<number>(20);
  const targetRef = useRef<number>(TRAVEL);
  const dirRef = useRef<Direction>("right");
  const springPlotRef = useRef<number[]>([]);
  const easingPlotRef = useRef<number[]>([]);
  const durationRef = useRef(400);
  const bezierRef = useRef({ p1: { x: 0.25, y: 0.1 }, p2: { x: 0.25, y: 1.0 } });
  const springParamsRef = useRef<SpringParams>({ mass: 1, stiffness: 180, damping: 20 });

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { bezierRef.current = { p1: bezierP1, p2: bezierP2 }; }, [bezierP1, bezierP2]);
  useEffect(() => { springParamsRef.current = springParams; }, [springParams]);

  const fire = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const newDir: Direction = dirRef.current === "right" ? "left" : "right";
    dirRef.current = newDir;
    setDirection(newDir);

    const from = newDir === "right" ? 20 : TRAVEL;
    const to = newDir === "right" ? TRAVEL : 20;
    targetRef.current = to;
    startPosRef.current = from;

    springStateRef.current = makeSpringState(from);
    startTimeRef.current = performance.now();
    springPlotRef.current = [from];
    easingPlotRef.current = [from];
    setSpringPlot([from]);
    setEasingPlot([from]);
    setRunning(true);

    let lastTime = performance.now();

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Spring step
      springStateRef.current = stepSpring(
        springStateRef.current,
        springParamsRef.current,
        targetRef.current,
        dt
      );
      const sp = springStateRef.current.position;

      // Easing step
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / durationRef.current, 1);
      const { p1, p2 } = bezierRef.current;
      const eased = cubicBezier(t, p1.x, p1.y, p2.x, p2.y);
      const ep = startPosRef.current + (targetRef.current - startPosRef.current) * eased;

      // Plot (downsample)
      if (springPlotRef.current.length < 200) {
        springPlotRef.current.push(sp);
        easingPlotRef.current.push(ep);
      }

      setSpringPos(sp);
      setEasingPos(ep);

      // Continue until both settled
      const springDone = Math.abs(sp - targetRef.current) < 0.5 && Math.abs(springStateRef.current.velocity) < 0.5;
      const easingDone = t >= 1;

      if (!springDone || !easingDone) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        setSpringPlot([...springPlotRef.current]);
        setEasingPlot([...easingPlotRef.current]);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Draggable bezier control points on mini graph
  const graphSize = 80;
  const p1Dragging = useRef(false);
  const p2Dragging = useRef(false);
  const graphRef = useRef<SVGSVGElement>(null);

  function svgPtToParam(clientX: number, clientY: number) {
    const svg = graphRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)),
    };
  }

  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (p1Dragging.current) {
      const pt = svgPtToParam(e.clientX, e.clientY);
      setBezierP1(pt);
    } else if (p2Dragging.current) {
      const pt = svgPtToParam(e.clientX, e.clientY);
      setBezierP2(pt);
    }
  }

  function onSvgPointerUp() {
    p1Dragging.current = false;
    p2Dragging.current = false;
  }

  // Build bezier path for display
  const bezierPath = `M 0 ${graphSize} C ${bezierP1.x * graphSize} ${(1 - bezierP1.y) * graphSize} ${bezierP2.x * graphSize} ${(1 - bezierP2.y) * graphSize} ${graphSize} 0`;

  // Build plot sparklines
  function buildSparkline(data: number[], from: number, to: number, w: number, h: number): string {
    if (data.length < 2) return "";
    const range = Math.max(Math.abs(to - from) * 1.3, 1);
    const min = Math.min(from, to) - range * 0.15;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return "M " + pts.join(" L ");
  }

  const plotW = 200;
  const plotH = 60;

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={stageRef}
        className="demo-canvas"
        style={{ height: STAGE_H, marginBottom: "var(--sp-4)" }}
        aria-label="Spring vs easing comparison stage"
      >
        {/* Divider */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--grey-200)" }} />
        <span style={{ position: "absolute", left: "25%", top: 8, transform: "translateX(-50%)", fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase" }}>SPRING</span>
        <span style={{ position: "absolute", left: "75%", top: 8, transform: "translateX(-50%)", fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase" }}>EASING</span>

        {/* Spring object */}
        <div style={{
          position: "absolute",
          left: springPos,
          top: STAGE_H / 2 - OBJECT_SIZE / 2,
          width: OBJECT_SIZE,
          height: OBJECT_SIZE,
          background: "var(--ink)",
          willChange: "transform",
        }} />

        {/* Easing object */}
        <div style={{
          position: "absolute",
          left: "50%" ,
          marginLeft: easingPos,
          top: STAGE_H / 2 - OBJECT_SIZE / 2,
          width: OBJECT_SIZE,
          height: OBJECT_SIZE,
          background: "var(--ink)",
          willChange: "transform",
        }} />

        {/* Fire button */}
        <button
          className="ds-btn"
          onClick={fire}
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 16px",
            fontSize: "var(--fs-micro)",
            letterSpacing: "var(--ls-micro)",
          }}
          disabled={running}
          aria-label="Fire both animations"
        >
          {running ? "RUNNING" : "FIRE BOTH →"}
        </button>
      </div>

      {/* Position-over-time plots */}
      <div style={{ display: "flex", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>SPRING POSITION</div>
          <svg width={plotW} height={plotH} style={{ border: "1px solid var(--grey-200)", display: "block", width: "100%", maxWidth: plotW }}>
            <path d={buildSparkline(springPlot, 20, TRAVEL, plotW, plotH)} stroke="var(--ink)" strokeWidth={1} fill="none" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>EASING POSITION</div>
          <svg width={plotW} height={plotH} style={{ border: "1px solid var(--grey-200)", display: "block", width: "100%", maxWidth: plotW }}>
            <path d={buildSparkline(easingPlot, 20, TRAVEL, plotW, plotH)} stroke="var(--ink)" strokeWidth={1} fill="none" />
          </svg>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", borderTop: "1px solid var(--grey-200)", paddingTop: "var(--sp-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-8)" }}>
          {/* Spring params */}
          <div>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", marginBottom: "var(--sp-4)" }}>SPRING PARAMS</div>
            {(["mass", "stiffness", "damping"] as const).map((param) => {
              const ranges = { mass: [0.2, 3, 0.1], stiffness: [50, 500, 10], damping: [1, 60, 1] };
              const [min, max, step] = ranges[param];
              return (
                <div className="control-group" key={param} style={{ marginBottom: "var(--sp-4)" }}>
                  <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
                    <span>{param.toUpperCase()}</span>
                    <span className="readout">{springParams[param]}</span>
                  </label>
                  <input
                    type="range"
                    className="ds-slider"
                    min={min} max={max} step={step}
                    value={springParams[param]}
                    onChange={e => setSpringParams(p => ({ ...p, [param]: Number(e.target.value) }))}
                    aria-label={`Spring ${param}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Easing params */}
          <div>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", marginBottom: "var(--sp-4)" }}>EASING PARAMS</div>
            <div className="control-group" style={{ marginBottom: "var(--sp-4)" }}>
              <label style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)", display: "flex", justifyContent: "space-between" }}>
                <span>DURATION</span>
                <span className="readout">{duration} ms</span>
              </label>
              <input type="range" className="ds-slider" min={100} max={1200} step={50} value={duration} onChange={e => setDuration(Number(e.target.value))} aria-label="Easing duration in ms" />
            </div>
            {/* Bezier editor */}
            <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>CUBIC-BÉZIER (drag handles)</div>
            <svg
              ref={graphRef}
              width={graphSize}
              height={graphSize}
              style={{ border: "1px solid var(--grey-200)", display: "block", cursor: "crosshair", touchAction: "none" }}
              onPointerMove={onSvgPointerMove}
              onPointerUp={onSvgPointerUp}
              onPointerLeave={onSvgPointerUp}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(v => (
                <line key={v} x1={v * graphSize} y1={0} x2={v * graphSize} y2={graphSize} stroke="var(--grey-100)" strokeWidth={1} />
              ))}
              {[0.25, 0.5, 0.75].map(v => (
                <line key={v} x1={0} y1={v * graphSize} x2={graphSize} y2={v * graphSize} stroke="var(--grey-100)" strokeWidth={1} />
              ))}
              {/* Curve */}
              <path d={bezierPath} stroke="var(--ink)" strokeWidth={1.5} fill="none" />
              {/* P1 control */}
              <line x1={0} y1={graphSize} x2={bezierP1.x * graphSize} y2={(1 - bezierP1.y) * graphSize} stroke="var(--grey-400)" strokeWidth={1} strokeDasharray="2,2" />
              <circle
                cx={bezierP1.x * graphSize}
                cy={(1 - bezierP1.y) * graphSize}
                r={5}
                fill="var(--ink)"
                style={{ cursor: "move" }}
                onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); p1Dragging.current = true; }}
              />
              {/* P2 control */}
              <line x1={graphSize} y1={0} x2={bezierP2.x * graphSize} y2={(1 - bezierP2.y) * graphSize} stroke="var(--grey-400)" strokeWidth={1} strokeDasharray="2,2" />
              <circle
                cx={bezierP2.x * graphSize}
                cy={(1 - bezierP2.y) * graphSize}
                r={5}
                fill="var(--ink)"
                style={{ cursor: "move" }}
                onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); p2Dragging.current = true; }}
              />
            </svg>
            <div style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)", marginTop: 4 }}>
              cubic-bezier({bezierP1.x.toFixed(2)}, {bezierP1.y.toFixed(2)}, {bezierP2.x.toFixed(2)}, {bezierP2.y.toFixed(2)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
