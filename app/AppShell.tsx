"use client";

import { useState, useEffect } from "react";
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

export default function AppShell() {
  // SSR-safe: init to 1, read localStorage in effect
  const [activeLesson, setActiveLesson] = useState(1);
  const [hz, setHz] = useState<60 | 120>(60);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Read from localStorage after hydration
    const stored = window.localStorage.getItem(LS_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (n >= 1 && n <= 8) setActiveLesson(n);
    }
  }, []);

  function goToLesson(id: number) {
    setActiveLesson(id);
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, String(id));
    }
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-6)" }}>
          <span className="ds-label ds-label--secondary" style={{ display: "none" }} aria-hidden>
            08 LESSONS
          </span>
          <span className="ds-label ds-label--secondary" style={{ fontSize: "var(--fs-micro)" }}>
            08 LESSONS
          </span>
          {/* Hz switch */}
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
            }}
            onClick={() => setHz(hz === 60 ? 120 : 60)}
            aria-label={`Switch to ${hz === 60 ? "120" : "60"}Hz target`}
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
              padding: 0,
              fontSize: "var(--fs-label)",
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              fontFamily: "var(--ds-font)",
              fontWeight: 500,
            }}
            aria-label="Open lesson menu"
            id="mobile-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? "CLOSE" : "LESSONS"}
          </button>
        </div>
        <style>{`
          @media (max-width: 768px) {
            #mobile-menu-btn { display: inline-flex !important; }
          }
        `}</style>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* LEFT RAIL */}
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

        {/* MOBILE OVERLAY MENU */}
        {menuOpen && (
          <div
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
                  }}
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
          {/* Eyebrow */}
          <span
            className="ds-eyebrow"
            style={{ marginBottom: "var(--sp-4)", display: "block" }}
          >
            {lesson.eyebrow}
          </span>

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
                  padding: 0,
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
                  padding: 0,
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
