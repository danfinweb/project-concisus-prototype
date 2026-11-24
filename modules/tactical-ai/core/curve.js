// Response curves (TAI-007, TAI-015). A curve maps a raw input to 0–1. Curves live in the doctrine
// (data/ai/doctrines.json `considerations.<name>.curve`); this file only evaluates them.
//
// Supported: { type: 'linear', points: [[x, y], …] } — piecewise linear through the points (sorted by x),
// clamped to the first and last point outside their range. The output is clamped to 0–1.

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function curve(c, x) {
  if (!c || c.type !== 'linear' || !Array.isArray(c.points) || c.points.length === 0) {
    throw new Error(`tactical-ai: unsupported curve ${JSON.stringify(c)}`);
  }
  const pts = c.points;
  if (x <= pts[0][0]) return clamp01(pts[0][1]);
  const last = pts[pts.length - 1];
  if (x >= last[0]) return clamp01(last[1]);
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const [x0, y0] = pts[i - 1];
      const t = x1 === x0 ? 1 : (x - x0) / (x1 - x0);
      return clamp01(y0 + t * (y1 - y0));
    }
  }
  return clamp01(last[1]);
}
