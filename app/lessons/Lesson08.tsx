"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { stepSpring, makeSpringState, isAtRest, SpringState } from "../../lib/engine/spring";

/**
 * Lesson 08 — Spatial / navigational continuity
 * Grid tiles → expand one in place (shared-element / zoom transition).
 * CONTINUITY toggle switches to naïve cross-fade.
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

export function Lesson08() {
  const [continuity, setContinuity] = useState(true);
  const [slowMo, setSlowMo] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  // Shared-element animation state
  const [overlay, setOverlay] = useState<{
    tile: Tile;
    from: TileRect;
    spring: { x: SpringState; y: SpringState; w: SpringState; h: SpringState };
  } | null>(null);

  const [overlayRect, setOverlayRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const rafRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const slowMoRef = useRef(false);
  const continuityRef = useRef(true);

  useEffect(() => { slowMoRef.current = slowMo; }, [slowMo]);
  useEffect(() => { continuityRef.current = continuity; }, [continuity]);

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

  const openTile = useCallback((tile: Tile) => {
    if (animating) return;
    const from = getTileRect(tile.id);
    if (!from) return;
    const to = getTargetRect();

    if (!continuityRef.current) {
      // Naïve: just show the detail, no transition
      setSelected(tile.id);
      return;
    }

    // Spring-based shared-element expansion
    setAnimating(true);
    const speed = slowMoRef.current ? 0.25 : 1;
    const params = { mass: 1, stiffness: 200 * speed * speed, damping: 22 * speed };

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
      const dt = (now - lastTime) / (1000 / speed);
      lastTime = now;

      spring.x = stepSpring(spring.x, params, to.left, dt * speed);
      spring.y = stepSpring(spring.y, params, to.top, dt * speed);
      spring.w = stepSpring(spring.w, params, to.width, dt * speed);
      spring.h = stepSpring(spring.h, params, to.height, dt * speed);

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
  }, [animating]);

  const closeTile = useCallback(() => {
    if (animating) return;
    const id = selected;
    if (!id) return;

    if (!continuityRef.current) {
      setSelected(null);
      return;
    }

    const toMaybe = getTileRect(id);
    if (!toMaybe) { setSelected(null); return; }
    const to: TileRect = toMaybe;
    const from = getTargetRect();

    setAnimating(true);
    setSelected(null);
    const tile = TILES.find(t => t.id === id)!;
    const speed = slowMoRef.current ? 0.25 : 1;
    const params = { mass: 1, stiffness: 200 * speed * speed, damping: 22 * speed };

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
      const dt = (now - lastTime) / (1000 / speed);
      lastTime = now;

      spring.x = stepSpring(spring.x, params, to.left, dt * speed);
      spring.y = stepSpring(spring.y, params, to.top, dt * speed);
      spring.w = stepSpring(spring.w, params, to.width, dt * speed);
      spring.h = stepSpring(spring.h, params, to.height, dt * speed);

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
  }, [animating, selected]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div>
      {/* DEMO STAGE */}
      <div
        ref={gridRef}
        className="demo-canvas"
        style={{ height: 240, marginBottom: "var(--sp-4)", position: "relative" }}
        aria-label="Spatial continuity demo — tap a tile to expand it"
      >
        {/* Grid of tiles */}
        {selected === null && !animating && (
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

        {/* Naïve cross-fade: just show detail if continuity is off */}
        {selected !== null && !continuity && (
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

        {/* Shared-element overlay during animation */}
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
              onChange={e => { setContinuity(e.target.checked); setSelected(null); setOverlay(null); }}
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
              onChange={e => setSlowMo(e.target.checked)}
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
