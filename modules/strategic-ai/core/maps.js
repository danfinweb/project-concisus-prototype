// Tier 1 — situation maps (SAI-007): per known region, computed from the view on every call, never stored.
// Each layer is on a 0–1 scale (SAI-006). Raw values first: strengths as the view gives them, economic
// value = POI income (USD per day, STR-014), threat = known enemy strength discounted by tile distance,
// frontline = hostile neighbours of an own tile; then each layer is divided by its largest value on the
// known map (the spec leaves the normalisation to doctrine data but has no field for it: SCOPE open
// question 3). Supply reach is 1 on own ground and falls with steps away (0 = unreachable).
import { buildContext, data } from './context.js';

const LAYERS = ['ownStrength', 'enemyStrength', 'economicValue', 'threat', 'frontline'];

export function situationMaps(view, ctx = buildContext(view)) {
  const enemies = ctx.knownSquads.filter((s) => ctx.isEnemy(s.faction));
  const ownTiles = ctx.regionList.filter((r) => r.controller === ctx.self).map((r) => r.id);
  const reach = ownTiles.length ? ctx.bfs(ownTiles).steps : new Map();
  const raw = {};
  for (const r of ctx.regionList) {
    let ownStrength = 0, enemyStrength = 0, threat = 0;
    for (const s of ctx.ownSquads) if (s.region === r.id) ownStrength += s.strength ?? 0;
    for (const s of enemies) {
      const st = s.estimatedStrength ?? 0;
      if (s.region === r.id) enemyStrength += st;
      const d = ctx.manhattan(s.region, r.id);
      if (Number.isFinite(d)) threat += st / (d + 1);
    }
    const frontline = r.controller === ctx.self
      ? ctx.neighbours(r.id).filter((n) => ctx.isEnemy(ctx.regions.get(n).controller)).length : 0;
    const d = reach.get(r.id);
    raw[r.id] = {
      ownStrength, enemyStrength, economicValue: data.get('poi', r.poi)?.income ?? 0, threat, frontline,
      supplyReach: d === undefined ? 0 : 1 / (d + 1),
    };
  }
  const max = Object.fromEntries(LAYERS.map((k) => [k, Math.max(0, ...Object.values(raw).map((l) => l[k]))]));
  const maps = {};
  for (const [id, l] of Object.entries(raw)) {
    maps[id] = { ...l };
    for (const k of LAYERS) maps[id][k] = max[k] > 0 ? l[k] / max[k] : 0;
  }
  return maps;
}
