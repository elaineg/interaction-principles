"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { stepSpring, makeSpringState, isAtRest, SpringState } from "../../lib/engine/spring";
import type { ParamRecord } from "../../lib/lessonParams";

/**
 * Lesson 08 — Spatial / navigational continuity
 * Grid tiles → expand one in place (shared-element / zoom transition).
 * CONTINUITY toggle switches to naïve cross-fade.
 *
 * SLOW-MO (0.25×) is a GLOBAL time-scale: it applies to BOTH the continuous spring
 * morph AND the naïve cut/cross-fade path, independent of the CONTINUITY toggle.
 *
 * Non-continuous path uses a CSS-transition cross-fade whose duration is driven by
 * the slow-mo factor so the user can study the naïve cut at the same temporal
 * resolution as the continuous morph.
 */

interface Tile {
  id: number;
  label: string;
}

const TILES: Tile[] = [
  { id: 1, label: "A" },
  { id: 2, label: "B" },
  { id: 3, label: "C" },
  { id: 4, label: "D" },
  { id: 5, label: "E" },
  { id: 6, label: "F" },
];

interface TileRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  initialParams?: ParamRecord;
  onParamsChange?: (key: string, val: string | number | boolean) => void;
}

export function Lesson08({ initialParams = {}, onParamsChange }: Props) {
  const [continuity, setContinuity] = useState((initialParams.cont as number) !== 0);
  const [slowMo, setSlowMo] = useState((initialParams.slowmo as number) === 1);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  // Non-continuous cross-fade animation state
  // "crossfading" = we show both grid (fading out) and detail (fading in) simultaneously
  const [crossfadePhase, setCrossfadePhase] = useState<"idle" | "opening" | "open" | "closing">("idle");
  const [crossfadeTile, setCrossfadeTile] = useState<Tile | null>(null);

  // Shared-element animation state
  const [overlay, setOverlay] = useState<{
    tile: Tile;
    from: TileRect;
    spring: { x: SpringState; y: SpringState; w: SpringState; h: SpringState };
  } | null>(null);

  const [overlayRect, setOverlayRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const rafRef = useRef<number>(0);
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const slowMoRef = useRef(slowMo);
  const continuityRef = useRef(continuity);

  useEffect(() => { slowMoRef.current = slowMo; }, [slowMo]);
  useEffect(() => { continuityRef.current = continuity; }, [continuity]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
    };
  }, []);

  function getTileRect(id: number): TileRect | null {
    const el = tileRefs.current.get(id);
    const grid = gridRef.current;
    if (!el || !grid) return null;
    const elR = el.getBoundingClientRect();
    const gridR = grid.getBoundingClientRect();
    return {
      left: elR.left - gridR.left,
      top: elR.top - gridR.top,
      width: elR.width,
      height: elR.height,
    };
  }

  function getTargetRect(): TileRect {
    const grid = gridRef.current;
    if (!grid) return { left: 0, top: 0, width: 300, height: 200 };
    return {
      left: 0,
      top: 0,
      width: grid.getBoundingClientRect().width,
      height: grid.getBoundingClientRect().height,
    };
  }

  // Base cross-fade duration (non-slow-mo). Slow-mo multiplies by 4 (= 0.25× speed).
  const BASE_CROSSFADE_MS = 200;

  const getCrossfadeDuration = useCallback(() => {
    return slowMoRef.current ? BASE_CROSSFADE_MS * 4 : BASE_CROSSFADE_MS;
  }, []);

  const openTile = useCallback((tile: Tile) => {
    if (animating) return;

    if (!continuityRef.current) {
      // Non-continuous naïve cross-fade — slowed by SLOW-MO when on
      if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
      setCrossfadeTile(tile);
      setCrossfadePhase("opening");
      setAnimating(true);

      const dur = getCrossfadeDuration();
      crossfadeTimerRef.current = setTimeout(() => {
        setSelected(tile.id);
        setCrossfadePhase("open");
        setAnimating(false);
      }, dur);
      return;
    }

    // Continuous: spring-based shared-element expansion
    const from = getTileRect(tile.id);
    if (!from) return;
    const to = getTargetRect();

    setAnimating(true);
    const speed = slowMoRef.current ? 0.25 : 1;
    // Spring params are UNSCALED — slow-mo is applied purely via dt scaling below.
    const params = { mass: 1, stiffness: 200, damping: 22 };

    const spring = {
      x: makeSpringState(from.left),
      y: makeSpringState(from.top),
      w: makeSpringState(from.width),
      h: makeSpringState(from.height),
    };

    setOverlay({ tile, from, spring });
    setOverlayRect({ x: from.left, y: from.top, w: from.width, h: from.height });

    let lastTime = performance.now();

    function tick(now: number) {
      // Single factor of speed: dt_seconds = elapsed_ms * speed / 1000
      const dt = (now - lastTime) * speed / 1000;
      lastTime = now;

      spring.x = stepSpring(spring.x, params, to.left, dt);
      spring.y = stepSpring(spring.y, params, to.top, dt);
      spring.w = stepSpring(spring.w, params, to.width, dt);
      spring.h = stepSpring(spring.h, params, to.height, dt);

      setOverlayRect({
        x: spring.x.position,
        y: spring.y.position,
        w: spring.w.position,
        h: spring.h.position,
      });

      const done =
        isAtRest(spring.x, to.left) &&
        isAtRest(spring.y, to.top) &&
        isAtRest(spring.w, to.width) &&
        isAtRest(spring.h, to.height);

      if (!done) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlay(null);
        setOverlayRect(null);
        setSelected(tile.id);
        setAnimating(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [animating, getCrossfadeDuration]);

  const closeTile = useCallback(() => {
    if (animating) return;
    const id = selected;
    if (!id) return;

    if (!continuityRef.current) {
      // Non-continuous naïve cross-fade — slowed by SLOW-MO when on
      if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
      const tile = TILES.find(t => t.id === id)!;
      setCrossfadeTile(tile);
      setCrossfadePhase("closing");
      setAnimating(true);

      const dur = getCrossfadeDuration();
      crossfadeTimerRef.current = setTimeout(() => {
        setSelected(null);
        setCrossfadePhase("idle");
        setCrossfadeTile(null);
        setAnimating(false);
      }, dur);
      return;
    }

    // Continuous: spring-based shared-element collapse
    const toMaybe = getTileRect(id);
    if (!toMaybe) { setSelected(null); return; }
    const to: TileRect = toMaybe;
    const from = getTargetRect();

    setAnimating(true);
    setSelected(null);
    const tile = TILES.find(t => t.id === id)!;
    const speed = slowMoRef.current ? 0.25 : 1;
    // Spring params are UNSCALED — slow-mo is applied purely via dt scaling below.
    const params = { mass: 1, stiffness: 200, damping: 22 };

    const spring = {
      x: makeSpringState(from.left),
      y: makeSpringState(from.top),
      w: makeSpringState(from.width),
      h: makeSpringState(from.height),
    };
    setOverlay({ tile, from, spring });
    setOverlayRect({ x: from.left, y: from.top, w: from.width, h: from.height });

    let lastTime = performance.now();

    function tick(now: number) {
      // Single factor of speed: dt_seconds = elapsed_ms * speed / 1000
      const dt = (now - lastTime) * speed / 1000;
      lastTime = now;

      spring.x = stepSpring(spring.x, params, to.left, dt);
      spring.y = stepSpring(spring.y, params, to.top, dt);
      spring.w = stepSpring(spring.w, params, to.width, dt);
      spring.h = stepSpring(spring.h, params, to.height, dt);

      setOverlayRect({
        x: spring.x.position,
        y: spring.y.position,
        w: spring.w.position,
        h: spring.h.position,
      });

      const done =
        isAtRest(spring.x, to.left) &&
        isAtRest(spring.y, to.top) &&
        isAtRest(spring.w, to.width) &&
        isAtRest(spring.h, to.height);

      if (!done) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlay(null);
        setOverlayRect(null);
        setAnimating(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [animating, selected, getCrossfadeDuration]);

  function handleContinuityChange(checked: boolean) {
    // Cancel any in-progress animation when switching modes
    cancelAnimationFrame(rafRef.current);
    if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
    setContinuity(checked);
    setSelected(null);
    setOverlay(null);
    setOverlayRect(null);
    setCrossfadePhase("idle");
    setCrossfadeTile(null);
    setAnimating(false);
    onParamsChange?.("cont", checked ? 1 : 0);
  }

  function handleSlowMoChange(checked: boolean) {
    setSlowMo(checked);
    onParamsChange?.("slowmo", checked ? 1 : 0);
  }

  // Cross-fade transition duration for CSS
  const crossfadeDur = slowMo ? BASE_CROSSFADE_MS * 4 : BASE_CROSSFADE_MS;

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={gridRef}
        className="demo-canvas"
        style={{ height: 240, marginBottom: "var(--sp-4)", position: "relative" }}
        aria-label="Spatial continuity demo — tap a tile to expand it"
      >
        {/* Grid of tiles — hidden when animating non-continuous open, or when detail is open */}
        {selected === null && crossfadePhase === "idle" && !animating && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            height: "100%",
          }}>
            {TILES.map(tile => (
              <div
                key={tile.id}
                ref={el => { if (el) tileRefs.current.set(tile.id, el); else tileRefs.current.delete(tile.id); }}
                onClick={() => openTile(tile)}
                style={{
                  background: "var(--grey-50)",
                  border: "1px solid var(--grey-200)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "var(--fs-h2)",
                  color: "var(--ink)",
                  fontWeight: 400,
                  transition: "background var(--motion-fast)",
                  userSelect: "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--grey-100)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--grey-50)")}
                role="button"
                aria-label={`Open tile ${tile.label}`}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && openTile(tile)}
              >
                {tile.label}
              </div>
            ))}
          </div>
        )}

        {/* Non-continuous cross-fade: opening phase — grid fading out, detail fading in */}
        {crossfadePhase === "opening" && crossfadeTile && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              animation: `none`,
            }}
          >
            {/* Detail panel fading in */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--paper)",
                border: "1px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "var(--sp-4)",
                opacity: 0,
                transition: `opacity ${crossfadeDur}ms linear`,
                // Trigger the animation on next paint via a requestAnimationFrame trick:
                // We use animationDelay 0 and start from opacity 0 → 1
              }}
              ref={el => {
                if (el) {
                  // Force reflow then set opacity to trigger transition
                  void el.offsetHeight;
                  el.style.opacity = "1";
                }
              }}
            >
              <span style={{ fontSize: "var(--fs-display)", fontWeight: 400 }}>
                {crossfadeTile.label}
              </span>
              <span style={{ fontSize: "var(--fs-micro)", color: "var(--red)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                NAÏVE CUT — no spatial origin preserved
              </span>
            </div>
          </div>
        )}

        {/* Non-continuous: fully open detail view */}
        {crossfadePhase === "open" && selected !== null && !continuity && (
          <div
            onClick={closeTile}
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "var(--sp-4)",
              cursor: "pointer",
            }}
            role="button"
            aria-label="Close detail view"
          >
            <span style={{ fontSize: "var(--fs-display)", fontWeight: 400 }}>
              {TILES.find(t => t.id === selected)?.label}
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--red)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              NAÏVE CUT — no spatial origin preserved
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.1em" }}>tap to close</span>
          </div>
        )}

        {/* Non-continuous: closing phase — detail fading out */}
        {crossfadePhase === "closing" && crossfadeTile && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "var(--sp-4)",
              opacity: 1,
              transition: `opacity ${crossfadeDur}ms linear`,
            }}
            ref={el => {
              if (el) {
                void el.offsetHeight;
                el.style.opacity = "0";
              }
            }}
          >
            <span style={{ fontSize: "var(--fs-display)", fontWeight: 400 }}>
              {crossfadeTile.label}
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--red)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              NAÏVE CUT — no spatial origin preserved
            </span>
          </div>
        )}

        {/* Continuity: selected tile (after spring settles) */}
        {selected !== null && continuity && (
          <div
            onClick={closeTile}
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "var(--sp-4)",
              cursor: "pointer",
            }}
            role="button"
            aria-label="Close detail view"
          >
            <span style={{ fontSize: "var(--fs-display)", fontWeight: 400 }}>
              {TILES.find(t => t.id === selected)?.label}
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              tap to return to origin tile
            </span>
          </div>
        )}

        {/* Shared-element overlay during continuous animation */}
        {overlay && overlayRect && (
          <div
            style={{
              position: "absolute",
              left: overlayRect.x,
              top: overlayRect.y,
              width: overlayRect.w,
              height: overlayRect.h,
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              willChange: "left, top, width, height",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: "var(--fs-h1)", fontWeight: 400, color: "var(--ink)" }}>
              {overlay.tile.label}
            </span>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap" }}>
          <label className="ds-toggle" htmlFor="continuity-toggle">
            <input
              type="checkbox"
              id="continuity-toggle"
              checked={continuity}
              onChange={e => handleContinuityChange(e.target.checked)}
              aria-label="Continuity toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: continuity ? "var(--ink)" : "var(--red)" }}>
              CONTINUITY
            </span>
          </label>

          <label className="ds-toggle" htmlFor="slowmo-toggle">
            <input
              type="checkbox"
              id="slowmo-toggle"
              checked={slowMo}
              onChange={e => handleSlowMoChange(e.target.checked)}
              aria-label="Slow motion toggle"
            />
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 500, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--grey-600)" }}>
              SLOW-MO (0.25×)
            </span>
          </label>
        </div>

        <p style={{ fontSize: "var(--fs-sm)", color: "var(--grey-600)", margin: 0 }}>
          {continuity
            ? "Shared-element zoom: the tile expands from its origin and returns to it. The mental map is preserved."
            : "Naïve cut/cross-fade: the detail appears without spatial context. Where did it come from?"}
        </p>

        {!continuity && (
          <p role="alert" style={{ fontSize: "var(--fs-label)", color: "var(--red)", margin: 0 }}>
            CONTINUITY OFF — naïve cut destroys spatial orientation
          </p>
        )}
      </div>
    </div>
  );
}
