// Utility scoring (SAI-006): response curves, weighted sums, best pick with seeded tie-breaking,
// and decision-log entries (SAI-011).

// Considerations that lower a score (SAI-008: − cost − risk; SAI-014: overdraft; SAI-017: route danger).
export const NEGATIVE = new Set(['cost', 'risk', 'overdraft', 'routeDanger']);

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// curve { type, points: [[x, y], …] } (SAI-006, ai-doctrines $defs/curve), raw input → 0..1:
//   linear: piecewise-linear through the points; step: y of the last point whose x ≤ input.
// Both clamp outside the points (below the first x → first y, above the last → last y).
export function responseCurve(curve, x) {
  const pts = curve?.points;
  if (!Array.isArray(pts) || pts.length === 0) return clamp01(x);
  const type = curve.type ?? 'linear';
  const p = [...pts].sort((a, b) => a[0] - b[0]);
  if (type === 'step') {
    let y = p[0][1];
    for (const [px, py] of p) if (px <= x) y = py;
    return clamp01(y);
  }
  if (type !== 'linear') throw new Error(`responseCurve: unknown curve type "${type}"`);
  if (x <= p[0][0]) return clamp01(p[0][1]);
  for (let i = 1; i < p.length; i++) {
    const [x1, y1] = p[i];
    if (x <= x1) {
      const [x0, y0] = p[i - 1];
      return clamp01(x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
    }
  }
  return clamp01(p[p.length - 1][1]);
}

// Score one option: inputs { name: raw value } → { option, total, considerations }. Each input whose name
// the definition table knows goes through its curve and weight; unknown names are left out.
// lookup(name) → { weight, curve } | undefined
export function score(label, inputs, lookup) {
  let total = 0;
  const considerations = {};
  for (const [name, raw] of Object.entries(inputs)) {
    const def = lookup(name);
    if (!def) continue;
    const s = responseCurve(def.curve, raw);
    considerations[name] = s;
    total += (NEGATIVE.has(name) ? -1 : 1) * (def.weight ?? 0) * s;
  }
  return { option: label, total, considerations };
}

// Strategic doctrine lookup order: commitmentBonus, then gainTerms, then considerations.
export function doctrineLookup(doctrine) {
  return (name) => (name === 'commitmentBonus' ? doctrine.commitmentBonus
    : doctrine.gainTerms?.[name] ?? doctrine.considerations?.[name]);
}

// Highest total wins; equal totals are broken by rng (SAI-006).
export function pickBest(options, rng) {
  if (!options.length) return undefined;
  let best = -Infinity;
  for (const o of options) if (o.total > best) best = o.total;
  const top = options.filter((o) => o.total === best);
  return top.length === 1 ? top[0] : rng.pick(top);
}

// Decision-log entry (strategic_commands $defs/logEntry): options best first, chosen first among equals,
// at most topN.
export function logEntry(view, tier, decision, options, chosen, topN) {
  const sorted = [...options].sort((a, b) => b.total - a.total || (a === chosen ? -1 : b === chosen ? 1 : 0));
  const kept = sorted.slice(0, Math.max(1, topN ?? sorted.length));
  return {
    time: { day: view.time.day, hour: view.time.hour },
    faction: view.faction,
    tier,
    decision,
    chosen: chosen.option,
    options: kept.map((o) => ({ option: o.option, total: o.total, considerations: { ...o.considerations } })),
  };
}
