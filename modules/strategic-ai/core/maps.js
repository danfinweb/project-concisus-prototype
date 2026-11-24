// Tier 1 — situation maps (SAI-007): per known region, computed from the view on every call, never stored.
// Raw units: strengths as the view gives them, economic value in USD per day (POI income, STR-014),
// threat as known enemy strength discounted by tile distance, frontline as the number of hostile
// neighbours of an own tile, supply reach 1 on own ground falling with steps away (0 = unreachable).
import { buildContext, data } from './context.js';

export function situationMaps(view, ctx = buildContext(view)) {
  const enemies = ctx.knownSquads.filter((s) => ctx.isEnemy(s.faction));
  const ownTiles = ctx.regionList.filter((r) => r.controller === ctx.self).map((r) => r.id);
  const reach = ownTiles.length ? ctx.bfs(ownTiles).steps : new Map();
  const maps = {};
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
    maps[r.id] = {
      ownStrength,
      enemyStrength,
      economicValue: data.get('poi', r.poi)?.income ?? 0,
      threat,
      frontline,
      supplyReach: d === undefined ? 0 : 1 / (d + 1),
    };
  }
  return maps;
}
