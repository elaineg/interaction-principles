"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Inline "COPY CONFIG" button. Copies `config` string to clipboard.
 * Shows "COPIED ✓" for 1.8s then reverts.
 */
export function CopyConfigBtn({ config }: { config: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(config).then(() => {
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
      aria-label="Copy these settings to clipboard"
      title={`Copy config: ${config}`}
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
      }}
    >
      {copied ? "COPIED ✓" : "COPY CONFIG"}
    </button>
  );
}
