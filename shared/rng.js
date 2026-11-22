// Seeded random generator (mulberry32). All randomness in game
// rules and map generation goes through here; Math.random() is never used there.
export class Rng {
  constructor(seed = 1) {
    this.state = (seed >>> 0) || 1;
  }

  // Uniform float in [0, 1).
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer in [a, b] inclusive.
  int(a, b) {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  // True with probability pct percent (0-100).
  roll(pct) {
    return this.next() * 100 < pct;
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // weights: { key: weight } or [[key, weight], ...]
  weightedPick(weights) {
    const entries = Array.isArray(weights) ? weights : Object.entries(weights);
    const total = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
    if (total <= 0) return entries[0]?.[0];
    let r = this.next() * total;
    for (const [k, w] of entries) {
      r -= Math.max(0, w);
      if (r < 0) return k;
    }
    return entries[entries.length - 1][0];
  }

  // Normal(mean, sigma) via Box-Muller.
  normal(mean = 0, sigma = 1) {
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // A new independent stream derived from this one (or from a fixed seed).
  fork(salt = 0) {
    return new Rng((this.int(1, 0x7fffffff) ^ salt) >>> 0);
  }
}

// Stable string hash → seed, for deriving seeds from ids ("seed 4812, turn 6").
export function hashSeed(...parts) {
  let h = 2166136261;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
