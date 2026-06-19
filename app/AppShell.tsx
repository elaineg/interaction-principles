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

function getLessonComponent(id: number) {
  switch (id) {
    case 1: return <Lesson01 />;
    case 2: return <Lesson02 />;
    case 3: return <Lesson03 />;
    case 4: return <Lesson04 />;
    case 5: return <Lesson05 />;
    case 6: return <Lesson06 />;
    case 7: return <Lesson07 />;
    case 8: return <Lesson08 />;
    default: return <Lesson01 />;
  }
}

function CopyButton({ text, label, children }: { text: string; label: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
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
      {copied ? "COPIED ✓" : children}
    </button>
  );
}

export default function AppShell() {
  // SSR-safe: init to 1, read hash/localStorage in effect
  const [activeLesson, setActiveLesson] = useState(1);
  const [hz, setHz] = useState<60 | 120>(60);
  const [menuOpen, setMenuOpen] = useState(false);
  // Track current full URL for deep-link copying
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Priority: hash > localStorage > default 1
    const hashLesson = lessonFromHash(window.location.hash);
    if (hashLesson !== null) {
      setActiveLesson(hashLesson);
    } else {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 1 && n <= 8) setActiveLesson(n);
      }
    }
    // Set initial URL
    setCurrentUrl(window.location.href.split("#")[0] + hashForLesson(
      lessonFromHash(window.location.hash) ??
      (window.localStorage.getItem(LS_KEY) ? parseInt(window.localStorage.getItem(LS_KEY)!, 10) : 1)
    ));
  }, []);

  // Listen for hashchange (e.g. browser back/forward)
  useEffect(() => {
    function onHashChange() {
      const hashLesson = lessonFromHash(window.location.hash);
      if (hashLesson !== null) {
        setActiveLesson(hashLesson);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Update hash whenever activeLesson changes (after mount)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const newHash = hashForLesson(activeLesson);
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
    setCurrentUrl(window.location.href.split("#")[0] + newHash);
  }, [activeLesson, mounted]);

  const goToLesson = useCallback((id: number) => {
    setActiveLesson(id);
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, String(id));
    }
  }, []);

  const lesson = LESSONS[activeLesson - 1];

  // Build a "copy config" link for lessons with interesting param state (L01, L02, L06)
  // We pass down a setter to collect the current params text from child lessons
  // For simplicity, we just show the deep link for all lessons;
  // and for L01/L02/L06 we additionally surface a text summary via a portal approach.
  // Per spec: "copy a short text summary of the current parameters" is fine.

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
          <span className="ds-label ds-label--secondary" style={{ fontSize: "var(--fs-micro)" }}>
            08 LESSONS
          </span>
          {/* Hz switch with tooltip */}
          <button
            className="ds-seg__btn"
            style={{
              background: "transparent",
              border: "1px solid var(--grey-200)",
              padding: "4px 8px",
              fontSize: "var(--fs-micro)",
              fontFamily: "var(--ds-font)",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              color: "var(--grey-600)",
              minHeight: 32,
            }}
            onClick={() => setHz(hz === 60 ? 120 : 60)}
            aria-label={`Refresh-rate target: currently ${hz}Hz — click to switch to ${hz === 60 ? "120" : "60"}Hz`}
            title={`Refresh-rate target (${hz}Hz). Click to toggle 60 ↔ 120Hz.`}
          >
            {hz}HZ
          </button>
          {/* Mobile menu toggle */}
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
            padding: "var(--sp-12) var(--sp-8)",
            minWidth: 0,
          }}
          id="main-content"
        >
          {/* Eyebrow + copy actions row */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
            <span className="ds-eyebrow" style={{ flex: 1, minWidth: 0 }}>
              {lesson.eyebrow}
            </span>
            {/* Copy lesson link */}
            <CopyButton
              text={currentUrl}
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
              marginBottom: "var(--sp-6)",
              maxWidth: 680,
            }}
          >
            {lesson.headline}
          </h1>

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
          {getLessonComponent(activeLesson)}

          {/* Why it matters */}
          <div className="why-block" style={{ maxWidth: 600, marginTop: "var(--sp-12)" }}>
            <h4>Why it matters for your portfolio</h4>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--grey-800)", lineHeight: "var(--lh-body)" }}>
              {lesson.whyItMatters}
            </p>
          </div>

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
        </main>
      </div>

      {/* MOBILE RAIL: horizontal scroll strip */}
      <style>{`
        @media (max-width: 768px) {
          #lesson-rail { display: none !important; }
          #main-content {
            padding: var(--sp-6) var(--sp-4) !important;
          }
        }
        @media (min-width: 769px) {
          #mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
