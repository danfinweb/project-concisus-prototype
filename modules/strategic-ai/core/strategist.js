// Tier 2 — strategist (SAI-008, SAI-012, SAI-013, SAI-015, SAI-016): enumerate candidate objectives over
// the situation maps and score each as ownGain + damageToRivals − cost − risk + commitmentBonus, with the
// SAI-006 vocabulary (names and input units):
//   cost: money spent now — 0 for objectives own squads work and offers it takes (offers it posts and
//         recruits are planner candidates, SAI-014); risk: threat layer at the target (0–1)
//   damageToRivals: larger of the economic value and enemy strength layers at a rival's target (0–1)
//   gain terms: capital (0/1), territory (tiles), plants (count), income (USD/day), contractPay (USD,
//   MGT-046), patronStanding (0/1), tradeRoutes (tiles), markets (count), avoidWar (0/1),
//   survival (1 − threat), harassment (economic value layer of a target the area's controller holds)
//   signOverlap (measures): share of typical signs in crisisSigns
// Personality (SAI-010; where it enters is SCOPE open question 4): damageToRivals × aggression ×
// hostility share; risk ÷ (1 + riskTolerance); contractUse in the planner's posting decision.
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
  const lookup = doctrineLookup(doctrine);
  const ownMarkets = ctx.regionList.filter((r) => r.krugMarket && r.controller === self).map((r) => r.id);

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
  const pursued = (goal, target) => ctx.ownSquads.some((s) => s.goal === goal && s.target === target);

  const candidates = [];
  function add(c) {
    const m = maps[c.region] ?? {};
    const threat = m.threat ?? 0;
    const inputs = { ...c.gain, survival: 1 - threat };
    const w = rivalWeight(c.owner);
    inputs.damageToRivals = w > 0 && (ATTACK_GOALS.has(c.goal) || c.kind === 'accept')
      ? aggression * w * Math.max(m.economicValue ?? 0, m.enemyStrength ?? 0) : 0;
    inputs.cost = 0;
    inputs.risk = threat / (1 + riskTolerance);
    if (c.committed) inputs.commitmentBonus = 1;
    const near = nearest(c.region);
    candidates.push({ ...c, ...score(c.label, inputs, lookup), squad: near.squad, reachable: Number.isFinite(near.steps) });
  }

  // Objectives on tiles: hold own POIs, take enemy-held or unheld ones, patrol threatened own ground,
  // the Krug's trade routes to market tiles (STR-018 goals).
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
      add({ kind: 'objective', goal, target: r.id, region: r.id, label: `${goal}:${r.id}`, owner: r.controller ?? null,
        committed: pursued(goal, r.id), gain: gainTerms(ctx, maps, goal, r, null, ownMarkets) });
    }
  }
  // Hunts on known enemy squads (the player's only while hostile, SAI-013).
  for (const s of ctx.knownSquads) {
    if (!s.id || !ctx.isEnemy(s.faction) || !ctx.regions.has(s.region)) continue;
    const r = ctx.regions.get(s.region);
    const gain = gainTerms(ctx, maps, 'hunt', r, null, ownMarkets);
    gain.harassment = r.controller === s.faction ? maps[r.id]?.economicValue ?? 0 : 0;
    add({ kind: 'objective', goal: 'hunt', target: s.id, region: s.region, label: `hunt:${s.id}`, owner: s.faction,
      committed: pursued('hunt', s.id), gain });
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
        gain: { ...gainTerms(ctx, maps, goal, ctx.regions.get(region), c, ownMarkets), contractPay: offerPay([m], c.payInputs) } });
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

// ownGain terms of one objective (SAI-006 vocabulary); the doctrine's gainTerms decide which count.
function gainTerms(ctx, maps, goal, region, contract, ownMarkets) {
  const id = region?.id;
  const takesOrHolds = POI_GOALS.has(goal);
  const enemyThere = (maps[id]?.enemyStrength ?? 0) > 0 || (region?.controller && ctx.isEnemy(region.controller));
  const g = {
    capital: takesOrHolds && id === ctx.capitalTile ? 1 : 0,
    territory: takesOrHolds ? 1 : 0,
    plants: takesOrHolds && data.get('poi', region?.poi)?.category === 'plant' ? 1 : 0,
    income: takesOrHolds ? data.get('poi', region?.poi)?.income ?? 0 : 0,
    patronStanding: contract && ctx.faction?.patron === contract.employer ? 1 : 0,
    markets: region?.krugMarket && (takesOrHolds || goal === 'patrol' || goal === 'tradeRoute') ? 1 : 0,
    avoidWar: ATTACK_GOALS.has(goal) || enemyThere ? 0 : 1,
    harassment: goal === 'attackPoi' && region?.controller && ctx.isEnemy(region.controller) ? maps[id]?.economicValue ?? 0 : 0,
    tradeRoutes: 0,
  };
  if (goal === 'tradeRoute') {
    // Route tiles secured: the path from the nearest own market (or the market itself) to this one.
    const from = ownMarkets.filter((m) => m !== id);
    const steps = from.length ? Math.min(...from.map((m) => ctx.stepsBetween(m, id))) : 0;
    g.tradeRoutes = Number.isFinite(steps) ? steps + 1 : 1;
  } else if (region?.krugMarket && (goal === 'holdPoi' || goal === 'patrol')) {
    g.tradeRoutes = 1;
  }
  return g;
}
