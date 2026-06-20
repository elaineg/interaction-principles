"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LESSONS } from "../lib/lessons";
import { Lesson01 } from "./lessons/Lesson01";
import { Lesson02 } from "./lessons/Lesson02";
import { Lesson03 } from "./lessons/Lesson03";
import { Lesson04 } from "./lessons/Lesson04";
import { Lesson05 } from "./lessons/Lesson05";
import { Lesson06 } from "./lessons/Lesson06";
import { Lesson07 } from "./lessons/Lesson07";
import { Lesson08 } from "./lessons/Lesson08";
import type { ParamRecord } from "../lib/lessonParams";
import { decodeParams, buildShareUrl, LESSON_DEFAULTS } from "../lib/lessonParams";

const LS_KEY = "ip-last-lesson";

// Hash scheme: #lesson-03
function hashForLesson(id: number) {
  return `#lesson-${String(id).padStart(2, "0")}`;
}

function lessonFromHash(hash: string): number | null {
  const m = hash.match(/^#lesson-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n >= 1 && n <= 8) return n;
  return null;
}

function getLessonComponent(
  id: number,
  initialParams: ParamRecord,
  onParamsChange: (key: string, val: string | number | boolean) => void
) {
  switch (id) {
    case 1: return <Lesson01 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 2: return <Lesson02 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 3: return <Lesson03 />;
    case 4: return <Lesson04 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 5: return <Lesson05 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 6: return <Lesson06 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 7: return <Lesson07 initialParams={initialParams} onParamsChange={onParamsChange} />;
    case 8: return <Lesson08 initialParams={initialParams} onParamsChange={onParamsChange} />;
    default: return <Lesson01 initialParams={{}} onParamsChange={onParamsChange} />;
  }
}

function CopyButton({ getText, label, children }: {
  getText: () => string;
  label: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const text = getText();
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <button
      onClick={handleCopy}
      aria-label={label}
      data-copy-link
      title={label}
      style={{
        background: "none",
        border: "1px solid var(--grey-200)",
        cursor: "pointer",
        padding: "4px 10px",
        fontSize: "var(--fs-micro)",
        fontFamily: "var(--ds-font)",
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: copied ? "var(--ink)" : "var(--grey-600)",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
        minHeight: 32,
        minWidth: 88,
      }}
    >
      {/* sr-only confirmation so screen readers + sighted users both get feedback */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
      <span aria-hidden>{copied ? "COPIED ✓" : children}</span>
    </button>
  );
}

export default function AppShell() {
  // SSR-safe: init to 1, read hash/localStorage in effect
  const [activeLesson, setActiveLesson] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // Per-lesson param tracking. paramsRef is always fresh; paramsState triggers re-render.
  const paramsRef = useRef<ParamRecord>({ ...LESSON_DEFAULTS[1] });
  const [paramsState, setParamsState] = useState<ParamRecord>({ ...LESSON_DEFAULTS[1] });
  // Initial params decoded from URL (per lesson, reset when lesson switches)
  const [initialParams, setInitialParams] = useState<ParamRecord>({});

  const handleParamsChange = useCallback((key: string, val: string | number | boolean) => {
    paramsRef.current = { ...paramsRef.current, [key]: val };
    setParamsState(prev => ({ ...prev, [key]: val }));
  }, []);

  // Reset params when switching lessons
  const resetParamsForLesson = useCallback((id: number, urlSearch?: string) => {
    const decoded = urlSearch
      ? decodeParams(id, urlSearch)
      : { ...(LESSON_DEFAULTS[id] ?? {}) };
    paramsRef.current = { ...decoded };
    setParamsState({ ...decoded });
    setInitialParams({ ...decoded });
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Priority: hash > localStorage > default 1
    const hashLesson = lessonFromHash(window.location.hash);
    const urlSearch = window.location.search;
    if (hashLesson !== null) {
      setActiveLesson(hashLesson);
      resetParamsForLesson(hashLesson, urlSearch);
    } else {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 1 && n <= 8) {
          setActiveLesson(n);
          resetParamsForLesson(n, "");
        }
      } else {
        resetParamsForLesson(1, "");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for hashchange (e.g. browser back/forward)
  useEffect(() => {
    function onHashChange() {
      const hashLesson = lessonFromHash(window.location.hash);
      if (hashLesson !== null) {
        setActiveLesson(hashLesson);
        resetParamsForLesson(hashLesson, window.location.search);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [resetParamsForLesson]);

  // Update hash whenever activeLesson changes (after mount)
  // This effect only runs when switching via lesson load from URL — goToLesson handles
  // programmatic switches. We only need to set hash on initial mount resolution.
  useEffect(() => {
    if (!mounted) return;
    const newHash = hashForLesson(activeLesson);
    if (window.location.hash !== newHash) {
      // Preserve existing query params from a deep-link (they were already applied)
      const cleanUrl = window.location.pathname + window.location.search + newHash;
      window.history.replaceState(null, "", cleanUrl);
    }
  }, [activeLesson, mounted]);

  const goToLesson = useCallback((id: number) => {
    setActiveLesson(id);
    setMenuOpen(false);
    resetParamsForLesson(id, "");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, String(id));
      // Clear query params when navigating to a new lesson (use path + hash, no search)
      const cleanUrl = window.location.pathname + hashForLesson(id);
      window.history.replaceState(null, "", cleanUrl);
    }
  }, [resetParamsForLesson]);

  // Build share URL from current state (called lazily at copy time)
  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    const base = window.location.href;
    return buildShareUrl(base, activeLesson, paramsRef.current);
  }, [activeLesson]);

  const lesson = LESSONS[activeLesson - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      {/* TOP BAR */}
      <header
        style={{
          borderBottom: "1px solid var(--grey-200)",
          background: "var(--paper)",
          padding: "0 var(--sp-8)",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            className="ds-label"
            style={{ fontSize: "var(--fs-label)", letterSpacing: "0.18em", fontWeight: 500 }}
          >
            INTERACTION PRINCIPLES
          </span>
          <span
            style={{ fontSize: "var(--fs-micro)", color: "var(--grey-600)", letterSpacing: "0.06em" }}
          >
            interactive lessons in how interfaces feel.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
          <span className="ds-label ds-label--secondary" style={{ fontSize: "var(--fs-micro)" }} id="lessons-count-label">
            08 LESSONS
          </span>
          {/* Mobile menu toggle — always rendered, shown/hidden via CSS */}
          <button
            className="ds-btn--text"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "var(--fs-label)",
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              fontFamily: "var(--ds-font)",
              fontWeight: 500,
              minHeight: 40,
              minWidth: 72,
            }}
            aria-label={menuOpen ? "Close lesson menu" : "Open lesson menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-lesson-drawer"
            id="mobile-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? "CLOSE" : "LESSONS"}
          </button>
        </div>
        <style>{`
          @media (max-width: 768px) {
            #mobile-menu-btn { display: inline-flex !important; align-items: center; justify-content: center; }
            #lessons-count-label { display: none !important; }
          }
        `}</style>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* LEFT RAIL (desktop) */}
        <nav
          aria-label="Lesson navigation"
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid var(--grey-200)",
            overflowY: "auto",
            padding: "var(--sp-6) 0",
            background: "var(--paper)",
          }}
          id="lesson-rail"
        >
          {LESSONS.map((l) => {
            const isActive = l.id === activeLesson;
            return (
              <button
                key={l.id}
                onClick={() => goToLesson(l.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderLeft: isActive ? "2px solid var(--ink)" : "2px solid transparent",
                  padding: "var(--sp-4) var(--sp-6)",
                  cursor: "pointer",
                  transition: "border-color var(--motion-fast)",
                  minHeight: 56,
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  style={{
                    fontSize: "var(--fs-micro)",
                    fontWeight: 500,
                    letterSpacing: "var(--ls-micro)",
                    textTransform: "uppercase",
                    color: "var(--grey-600)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(l.id).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-sm)",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "var(--ink)" : "var(--grey-600)",
                    borderBottom: isActive ? "1px solid var(--ink)" : "1px solid transparent",
                    paddingBottom: 1,
                    lineHeight: 1.3,
                  }}
                >
                  {l.slug.replace(/-/g, " ")}
                </span>
                {/* subtitle — single source of truth from l.subtitle */}
                <span
                  style={{
                    fontSize: "var(--fs-micro)",
                    color: "var(--grey-400)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {l.subtitle}
                </span>
              </button>
            );
          })}
        </nav>

        {/* MOBILE LESSON DRAWER — slide-over, full-height */}
        {menuOpen && (
          <div
            id="mobile-lesson-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Lesson menu"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--paper)",
              zIndex: 20,
              overflowY: "auto",
              padding: "var(--sp-6) 0",
            }}
          >
            <div style={{ borderBottom: "1px solid var(--grey-200)", padding: "0 var(--sp-6) var(--sp-4)", marginBottom: "var(--sp-4)" }}>
              <span style={{ fontSize: "var(--fs-micro)", fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--grey-600)" }}>
                SELECT LESSON
              </span>
            </div>
            {LESSONS.map((l) => {
              const isActive = l.id === activeLesson;
              return (
                <button
                  key={l.id}
                  onClick={() => goToLesson(l.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderLeft: isActive ? "2px solid var(--ink)" : "2px solid transparent",
                    padding: "var(--sp-5) var(--sp-6)",
                    cursor: "pointer",
                    minHeight: 64,
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span style={{ fontSize: "var(--fs-micro)", fontWeight: 500, letterSpacing: "var(--ls-micro)", textTransform: "uppercase", color: "var(--grey-600)" }}>
                    {String(l.id).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "var(--fs-body)", fontWeight: isActive ? 500 : 400, color: isActive ? "var(--ink)" : "var(--grey-600)" }}>
                    {l.headline}
                  </span>
                  {/* subtitle — single source of truth from l.subtitle */}
                  <span style={{ fontSize: "var(--fs-micro)", color: "var(--grey-400)" }}>
                    {l.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0",
            minWidth: 0,
          }}
          id="main-content"
        >
            {/* Lesson content area */}
          <div style={{ padding: "var(--sp-8) var(--sp-8)" }}>
            {/* Eyebrow + copy actions row */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
              <span className="ds-eyebrow" style={{ flex: 1, minWidth: 0 }}>
                {lesson.eyebrow}
              </span>
              {/* Copy lesson link — encodes current control state */}
              <CopyButton
                getText={getShareUrl}
                label="Copy link to this lesson"
              >
                COPY LINK
              </CopyButton>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(1.5rem, 3vw, var(--fs-display))",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "var(--sp-3)",
                maxWidth: 680,
              }}
            >
              {lesson.headline}
            </h1>

            {/* Subtitle — single source of truth from lesson.subtitle */}
            <p
              data-testid="lesson-subtitle"
              style={{
                fontSize: "var(--fs-body)",
                color: "var(--grey-600)",
                marginBottom: "var(--sp-4)",
                maxWidth: 560,
              }}
            >
              {lesson.subtitle}
            </p>

            {/* Lede */}
            <p
              style={{
                fontSize: "var(--fs-body)",
                color: "var(--grey-800)",
                maxWidth: 560,
                lineHeight: "var(--lh-body)",
                marginBottom: "var(--sp-12)",
              }}
            >
              {lesson.lede}
            </p>

            {/* Lesson demo */}
            {mounted && getLessonComponent(activeLesson, initialParams, handleParamsChange)}

            {/* Prev / Next nav */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--sp-16)",
                borderTop: "1px solid var(--grey-200)",
                paddingTop: "var(--sp-6)",
              }}
            >
              {activeLesson > 1 ? (
                <button
                  className="ds-btn ds-btn--secondary ds-btn--text"
                  onClick={() => goToLesson(activeLesson - 1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--fs-label)",
                    letterSpacing: "var(--ls-label)",
                    textTransform: "uppercase",
                    fontFamily: "var(--ds-font)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    padding: "8px 0",
                    minHeight: 40,
                  }}
                >
                  ← LESSON {String(activeLesson - 1).padStart(2, "0")}
                </button>
              ) : (
                <span />
              )}
              {activeLesson < 8 ? (
                <button
                  className="ds-btn ds-btn--secondary ds-btn--text"
                  onClick={() => goToLesson(activeLesson + 1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--fs-label)",
                    letterSpacing: "var(--ls-label)",
                    textTransform: "uppercase",
                    fontFamily: "var(--ds-font)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    padding: "8px 0",
                    minHeight: 40,
                  }}
                >
                  LESSON {String(activeLesson + 1).padStart(2, "0")} →
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE RAIL: horizontal scroll strip */}
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 768px) {
          #lesson-rail { display: none !important; }
          #main-content {
            padding: 0 !important;
          }
          #main-content > div {
            padding: var(--sp-4) var(--sp-4) !important;
          }
        }
        @media (min-width: 769px) {
          #mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
