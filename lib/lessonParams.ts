/**
 * URL param scheme for per-lesson tunable controls.
 *
 * Each lesson has a compact key-value set. Default values are NOT written
 * to the URL (keeps shared links clean). On load, params are parsed and
 * passed to the active lesson component as initialParams.
 *
 * URL format: /?<params>#lesson-NN
 * e.g. /?g=2&lat=100#lesson-01
 */

export type ParamRecord = Record<string, string | number | boolean>;

// Defaults per lesson — not written to URL when unchanged
export const LESSON_DEFAULTS: Record<number, ParamRecord> = {
  1: { g: 1, lat: 0 },
  2: { m: 1, k: 180, d: 20, dur: 400, p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1.0 },
  4: { intens: 0.5, ant: 1, ft: 1, sio: 1, ss: 1 },
  5: { fric: 4, rubber: 1, seam: 0 },
  6: { hz: 60, inject: 0, dropped: 1 },
  7: { delay: 0, td: 1, haptic: 0 },
  8: { cont: 1, slowmo: 0 },
};

// Encode only non-default params into a query string
export function encodeParams(lessonId: number, params: ParamRecord): string {
  const defaults = LESSON_DEFAULTS[lessonId] ?? {};
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    const def = defaults[key];
    // Stringify both for comparison (handles bool/number mixing)
    if (String(val) !== String(def)) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
  }
  return parts.length > 0 ? parts.join("&") : "";
}

// Parse query string params, returning merged-with-defaults for a given lesson
export function decodeParams(lessonId: number, search: string): ParamRecord {
  const defaults = LESSON_DEFAULTS[lessonId] ?? {};
  const result: ParamRecord = { ...defaults };
  if (!search) return result;

  const raw = search.startsWith("?") ? search.slice(1) : search;
  for (const part of raw.split("&")) {
    const [k, v] = part.split("=");
    const key = decodeURIComponent(k ?? "");
    const val = decodeURIComponent(v ?? "");
    if (key && key in defaults) {
      const def = defaults[key];
      if (typeof def === "number") {
        const num = parseFloat(val);
        if (!isNaN(num)) result[key] = num;
      } else if (typeof def === "boolean") {
        result[key] = val === "1" || val === "true";
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

// Build a full copyable URL for a lesson with its current params
export function buildShareUrl(
  baseUrl: string,
  lessonId: number,
  params: ParamRecord
): string {
  const queryStr = encodeParams(lessonId, params);
  const hash = `#lesson-${String(lessonId).padStart(2, "0")}`;
  const base = baseUrl.split("?")[0].split("#")[0];
  return queryStr ? `${base}?${queryStr}${hash}` : `${base}${hash}`;
}
