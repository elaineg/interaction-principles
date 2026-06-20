import { describe, it, expect } from "vitest";
import { encodeParams, decodeParams, buildShareUrl, LESSON_DEFAULTS } from "../../lib/lessonParams";

// ============================================================
// lessonParams: encode / decode round-trips
// ============================================================

describe("encodeParams — defaults produce empty string", () => {
  it("L01 defaults → empty query string", () => {
    expect(encodeParams(1, { g: 1, lat: 0 })).toBe("");
  });

  it("L02 defaults → empty query string", () => {
    expect(encodeParams(2, { m: 1, k: 180, d: 20, dur: 400, p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1.0 })).toBe("");
  });

  it("L05 defaults → empty query string", () => {
    expect(encodeParams(5, { fric: 4, rubber: 1, seam: 0 })).toBe("");
  });
});

describe("encodeParams — non-default values appear in query string", () => {
  it("L01 gain=2 latency=100 encodes correctly", () => {
    const qs = encodeParams(1, { g: 2, lat: 100 });
    expect(qs).toContain("g=2");
    expect(qs).toContain("lat=100");
  });

  it("L01 only non-default values written (lat=0 omitted)", () => {
    const qs = encodeParams(1, { g: 2, lat: 0 });
    expect(qs).toContain("g=2");
    expect(qs).not.toContain("lat");
  });

  it("L05 seam=1 encodes (default is 0)", () => {
    const qs = encodeParams(5, { fric: 4, rubber: 1, seam: 1 });
    expect(qs).toContain("seam=1");
    expect(qs).not.toContain("fric");
    expect(qs).not.toContain("rubber");
  });

  it("L06 hz=120 encodes (default is 60)", () => {
    const qs = encodeParams(6, { hz: 120, inject: 0, dropped: 1 });
    expect(qs).toContain("hz=120");
    expect(qs).not.toContain("inject");
    expect(qs).not.toContain("dropped");
  });
});

describe("decodeParams — round-trips correctly", () => {
  it("L01: encode → decode recovers gain=2 lat=100", () => {
    const params = { g: 2, lat: 100 };
    const qs = "?" + encodeParams(1, params);
    const decoded = decodeParams(1, qs);
    expect(decoded.g).toBe(2);
    expect(decoded.lat).toBe(100);
  });

  it("L01: empty search returns defaults", () => {
    const decoded = decodeParams(1, "");
    expect(decoded.g).toBe(1);
    expect(decoded.lat).toBe(0);
  });

  it("L02: mass=2.5 stiffness=300 round-trips", () => {
    const params = { m: 2.5, k: 300, d: 20, dur: 400, p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1.0 };
    const qs = "?" + encodeParams(2, params);
    const decoded = decodeParams(2, qs);
    expect(decoded.m).toBeCloseTo(2.5);
    expect(decoded.k).toBe(300);
  });

  it("L05: friction=8 seam=1 round-trips", () => {
    const params = { fric: 8, rubber: 0, seam: 1 };
    const qs = "?" + encodeParams(5, params);
    const decoded = decodeParams(5, qs);
    expect(decoded.fric).toBe(8);
    expect(decoded.rubber).toBe(0);
    expect(decoded.seam).toBe(1);
  });

  it("L07: delay=150 td=0 round-trips", () => {
    const params = { delay: 150, td: 0, haptic: 0 };
    const qs = "?" + encodeParams(7, params);
    const decoded = decodeParams(7, qs);
    expect(decoded.delay).toBe(150);
    expect(decoded.td).toBe(0);
  });

  it("unknown keys in URL are ignored (no crash)", () => {
    const decoded = decodeParams(1, "?g=2&unknown=abc&lat=50");
    expect(decoded.g).toBe(2);
    expect(decoded.lat).toBe(50);
    expect(decoded.unknown).toBeUndefined();
  });

  it("malformed values fall back to defaults", () => {
    const decoded = decodeParams(1, "?g=notanumber&lat=100");
    // g is malformed (NaN), should fall back to default 1
    expect(decoded.g).toBe(1);
    expect(decoded.lat).toBe(100);
  });
});

describe("buildShareUrl", () => {
  it("default params → clean hash-only URL", () => {
    const url = buildShareUrl("https://example.com/", 1, { g: 1, lat: 0 });
    expect(url).toBe("https://example.com/#lesson-01");
    expect(url).not.toContain("?");
  });

  it("non-default params → includes query string before hash", () => {
    const url = buildShareUrl("https://example.com/", 1, { g: 2, lat: 100 });
    expect(url).toContain("?");
    expect(url).toContain("g=2");
    expect(url).toContain("lat=100");
    expect(url).toMatch(/#lesson-01$/);
  });

  it("lesson 5 seam=1 → encodes seam in URL", () => {
    const url = buildShareUrl("https://example.com/", 5, { fric: 4, rubber: 1, seam: 1 });
    expect(url).toContain("seam=1");
    expect(url).toMatch(/#lesson-05$/);
  });

  it("strips existing query + hash from base URL before building", () => {
    const url = buildShareUrl("https://example.com/?old=1#lesson-02", 3, LESSON_DEFAULTS[3] ?? {});
    // L03 has no defaults — should produce clean URL
    expect(url).not.toContain("old=1");
    expect(url).toMatch(/#lesson-03$/);
  });

  it("lesson 8 slowmo=1 → encodes slowmo in URL", () => {
    const url = buildShareUrl("https://example.com/", 8, { cont: 1, slowmo: 1 });
    expect(url).toContain("slowmo=1");
    expect(url).not.toContain("cont=");
    expect(url).toMatch(/#lesson-08$/);
  });
});
