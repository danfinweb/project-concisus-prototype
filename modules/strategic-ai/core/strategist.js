// Tier 2 — strategist (SAI-008, SAI-012, SAI-013, SAI-015, SAI-016): enumerate candidate objectives over
// the situation maps and score each as ownGain + damageToRivals − cost − risk + commitmentBonus.
// Consideration inputs in raw units (the doctrine's curves map them to 0..1):
//   capital, territory, tradeRoutes, patronStanding, harassment: 0 or 1
//   income: USD per day of the target POI; contractPay: USD (MGT-046 pay of the offer)
//   survival: 1 − risk share; damageToRivals: aggression × the target owner's hostility share
//   cost: steps to the target from the nearest own squad (or own ground); risk: enemy share of the
//   strength around the target, lowered by riskTolerance; overdraft: USD (scoreTerm only, costly options)
//   signOverlap: share of a measure's typical signs among the view's crisis signs
import { data } from './context.js';
import { score, doctrineLookup } from './scoring.js';

const POI_GOALS = new Set(['attackPoi', 'holdPoi']);
const ATTACK_GOALS = new Set(['attackPoi', 'hunt']);

// MGT-046: mission pay = round(low + (high − low) × (distance + danger + urgency) / 3); offer = sum.
export function offerPay(missions, payInputs) {
  const p = payInputs ?? {};
  const share = ((p.distance ?? 0) + (p.danger ?? 0) + (p.urgency ?? 0)) / 3;
  return (missions ?? []).reduce((sum, m) => {
    const band = data.get('missions', m.missionId)?.payBand;
    return band ? sum + Math.round(band[0] + (band[1] - band[0]) * share) : sum;
  }, 0);
}

export function strategize(ctx, maps, doctrine) {
  const { view, self } = ctx;
  const personality = doctrine.personality ?? {};
  const aggression = personality.aggression ?? 1;
  const riskTolerance = personality.riskTolerance ?? 0;
  const hostility = personality.hostility ?? {};
  const maxHostility = Math.max(0, ...Object.values(hostility));
  const patron = ctx.faction?.patron;
  const freeSquads = ctx.ownSquads.filter((s) => !s.transit);
  const ownTiles = ctx.regionList.filter((r) => r.controller === self).map((r) => r.id);
  const lookup = doctrineLookup(doctrine);

  const rivalWeight = (f) => {
    if (!f || f === self) return 0;
    if (f === 'player') return ctx.playerHostile ? 1 : 0;
    if (hostility[f] !== undefined && maxHostility > 0) return hostility[f] / maxHostility;
    return ctx.factionHostile(f) ? 1 : 0;
  };
  const nearest = (region) => {
    let best = { squad: null, steps: Infinity };
    for (const s of freeSquads) {
      const st = ctx.stepsBetween(s.region, region);
      if (st < best.steps) best = { squad: s, steps: st };
    }
    return best;
  };
  const fromOwnGround = (region) => (ownTiles.length ? ctx.bfs(ownTiles).steps.get(region) ?? Infinity : Infinity);
  const riskAt = (region, own) => {
    const t = maps[region]?.threat ?? 0;
    return t + own > 0 ? t / (t + own) : 0;
  };
  const pursued = (goal, target) => ctx.ownSquads.some((s) => s.goal === goal && s.target === target);

  const candidates = [];
  function add(c) {
    const region = c.region;
    const near = nearest(region);
    const steps = Number.isFinite(near.steps) ? near.steps : fromOwnGround(region);
    const cost = Number.isFinite(steps) ? steps : 0;
    const riskShare = riskAt(region, near.squad?.strength ?? 0);
    const inputs = { ...c.gain };
    if (c.owner !== undefined) inputs.damageToRivals = ATTACK_GOALS.has(c.goal) || c.kind === 'accept' ? aggression * rivalWeight(c.owner) : 0;
    if (c.kind !== 'measure') {
      inputs.cost = cost;
      inputs.risk = riskShare / (1 + riskTolerance);
      if (inputs.survival !== undefined) inputs.survival = 1 - riskShare;
      if (cost > 0 && typeof view.overdraft === 'number') inputs.overdraft = view.overdraft;
    }
    if (c.committed) inputs.commitmentBonus = 1;
    const scored = score(c.label, inputs, lookup);
    candidates.push({ ...c, ...scored, squad: near.squad, reachable: Number.isFinite(near.steps) });
  }

  // Objectives on tiles: hold own POIs, take enemy or unheld ones, patrol threatened own ground,
  // the Krug's trade routes on market tiles (STR-018 goals).
  const isTrader = ctx.faction?.kind === 'trader';
  for (const r of ctx.regionList) {
    if (!ctx.passable(r.id)) continue;
    const isPoi = !!r.poi || r.id === ctx.capitalTile;
    const own = r.controller === self;
    const enemyHeld = !own && (r.controller === null || r.controller === undefined || ctx.isEnemy(r.controller));
    const goals = [];
    if (isPoi && own) goals.push('holdPoi');
    if (isPoi && enemyHeld) goals.push('attackPoi');
    if (own && ((maps[r.id]?.frontline ?? 0) > 0 || (maps[r.id]?.enemyStrength ?? 0) > 0)) goals.push('patrol');
    if (isTrader && r.krugMarket) goals.push('tradeRoute');
    for (const goal of goals) {
      add({
        kind: 'objective', goal, target: r.id, region: r.id, label: `${goal}:${r.id}`, owner: r.controller ?? null,
        committed: pursued(goal, r.id), gain: gainTerms(ctx, maps, goal, r, null),
      });
    }
  }
  // Hunts on known enemy squads (the player's only while hostile, SAI-013).
  for (const s of ctx.knownSquads) {
    if (!s.id || !ctx.isEnemy(s.faction) || !ctx.regions.has(s.region)) continue;
    add({ kind: 'objective', goal: 'hunt', target: s.id, region: s.region, label: `hunt:${s.id}`, owner: s.faction,
      committed: pursued('hunt', s.id), gain: gainTerms(ctx, maps, 'hunt', ctx.regions.get(s.region), null) });
  }
  // Contracts this faction took (role contractor, SAI-015): their open missions are objectives it pursues.
  for (const c of view.contracts ?? []) {
    if (c.role !== 'contractor' || c.status !== 'accepted') continue;
    for (const m of c.missions ?? []) {
      const region = ctx.regionOf(m.location ?? m.targets?.[0]);
      if (m.status !== 'open' || !region) continue;
      const goal = c.sourceGoal ?? 'attackPoi';
      add({ kind: 'objective', goal, target: m.location ?? region, region, label: `contract:${c.id}:${m.key}:${goal}:${region}`,
        owner: c.targetFaction ?? ctx.regions.get(region)?.controller ?? null, committed: true,
        gain: { ...gainTerms(ctx, maps, goal, ctx.regions.get(region), c), contractPay: offerPay([m], c.payInputs) } });
    }
  }
  // Offers from the own side (SAI-015): rival PMCs only.
  if (ctx.faction?.kind === 'rivalPmc') {
    for (const o of view.contractOffers ?? []) {
      if (patron && o.employer !== patron) continue;
      const loc = o.missions?.[0]?.location ?? o.missions?.[0]?.targets?.[0];
      const region = ctx.regionOf(loc);
      if (!region) continue;
      add({ kind: 'accept', offer: o, goal: o.sourceGoal, target: loc, region, label: `accept:${o.id}`,
        owner: o.targetFaction ?? ctx.regions.get(region)?.controller ?? null, committed: false,
        gain: { contractPay: offerPay(o.missions, o.payInputs), patronStanding: patron && o.employer === patron ? 1 : 0 } });
    }
  }
  // Desperate measures (SAI-016).
  const signs = new Set(view.crisisSigns ?? []);
  for (const m of view.availableMeasures ?? []) {
    const typical = data.get('events', m)?.typicalSigns ?? [];
    const overlap = typical.length ? typical.filter((s) => signs.has(s)).length / typical.length : 0;
    candidates.push({ kind: 'measure', measure: m, label: `measure:${m}`, ...score(`measure:${m}`, { signOverlap: overlap }, lookup) });
  }
  return candidates;
}

// ownGain terms per goal, rated against the faction's ultimate goal (SAI-008); the doctrine's gainTerms
// decide which of them count and how much.
function gainTerms(ctx, maps, goal, region, contract) {
  const g = {};
  const own = region?.controller === ctx.self;
  g.capital = POI_GOALS.has(goal) && region?.id === ctx.capitalTile ? 1 : 0;
  g.territory = goal === 'attackPoi' && !own ? 1 : 0;
  g.income = POI_GOALS.has(goal) ? maps[region?.id]?.economicValue ?? 0 : 0;
  g.tradeRoutes = goal === 'tradeRoute' || (region?.krugMarket && (goal === 'holdPoi' || goal === 'patrol')) ? 1 : 0;
  g.harassment = goal === 'hunt' || (goal === 'attackPoi' && region?.controller && ctx.isEnemy(region.controller)) ? 1 : 0;
  g.patronStanding = contract && ctx.faction?.patron === contract.employer ? 1 : 0;
  if (goal === 'patrol' || goal === 'holdPoi') g.survival = 0; // filled in from the risk share
  return g;
}
