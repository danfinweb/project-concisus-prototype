// Strategic AI test helpers: fixture loading, view builders, a seeded random-view generator and a
// command checker that encodes the SAI-004 / SAI-013 / SAI-014..SAI-017 rules the AI must respect.
// Test-only code: may import shared/, never other modules or tools/.
import { Rng } from '../../../shared/rng.js';
import { validate } from '../../../shared/schema.js';
import * as registry from '../../../shared/registry.js';

export const TABLES = ['ai/doctrines', 'factions', 'strategic-rules', 'strategic-terrain', 'economy-rules',
  'poi', 'events', 'missions'];

export const AI_FACTIONS = ['ssv', 'vdk', 'varyag', 'aegis', 'krug'];
export const ACTIONS = ['moveSquad', 'hold', 'scout', 'attack'];
export const GOALS = ['patrol', 'supplyRun', 'attackPoi', 'holdPoi', 'escort', 'tradeRoute', 'hunt'];
export const COSTLY = ['offerContract', 'recruit', 'hireEscort'];
// Sign of each strategist term in SAI-008: ownGain + damageToRivals − cost − risk + commitmentBonus;
// the overdraft consideration of SAI-014 lowers the score. Everything else adds.
export const NEGATIVE_TERMS = ['cost', 'risk', 'overdraft'];

export async function setup(ctx) {
  await ctx.loadFixtures(TABLES);
}

// Deep-merge a patch into a fixture table for a single scenario (setup() reloads the fixtures next time).
// patchTable('economy-rules', { fundsMode: 'scoreTerm' }); patchTable('ai/doctrines', { ssv: { logTopN: 50 } })
export async function patchTable(name, patch) {
  const res = await fetch(new URL(`./fixtures/${name}.json`, import.meta.url));
  if (!res.ok) throw new Error(`fixture ${name}: HTTP ${res.status}`);
  registry.setData(name, merge(await res.json(), patch));
}
export const patchDoctrine = (id, patch) => patchTable('ai/doctrines', { [id]: patch });
function merge(a, b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return b;
  const out = { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b)) out[k] = merge(out[k], v);
  return out;
}

export async function loadCore() {
  try { return await import('../core/index.js'); }
  catch (e) { throw new Error(`core/index.js not implemented yet (${e.message})`); }
}

const schemaCache = {};
export async function schema(name) {
  if (!schemaCache[name]) {
    const res = await fetch(new URL(`../../../spec/interfaces/${name}.schema.json`, import.meta.url));
    if (!res.ok) throw new Error(`schema ${name}: HTTP ${res.status}`);
    schemaCache[name] = await res.json();
  }
  return schemaCache[name];
}
export async function schemaErrors(name, value) {
  return validate(await schema(name), value).map((e) => `${e.path}: ${e.message}`);
}

export function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

// ---------- map and view builders ----------

export const rid = (x, y) => `r${x}_${y}`;

// A w × h square grid (STR-005). opts: { terrain: {id: t}, poi: {id: p}, controller: {id: f},
// krugMarket: [ids], loyalty: {id: {...}}, observed: {day, hour} }
export function grid(w, h, opts = {}) {
  const regions = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = rid(x, y);
      const r = { id, x, y, terrain: opts.terrain?.[id] ?? 'plain', road: null, controller: opts.controller?.[id] ?? null, flags: [] };
      if (opts.poi?.[id]) r.poi = opts.poi[id];
      if (opts.krugMarket?.includes(id)) r.krugMarket = true;
      if (opts.loyalty?.[id]) r.loyalty = opts.loyalty[id];
      r.observed = opts.observed ?? { day: 3, hour: 10 };
      regions.push(r);
    }
  }
  return regions;
}

// Base view for one faction. Overrides replace whole fields.
export function makeView(faction, o = {}) {
  const knownRegions = o.knownRegions ?? grid(5, 3, {
    poi: { r0_1: 'town', r2_1: 'capital', r4_1: 'oil', r1_0: 'gas' },
    controller: { r0_0: faction, r0_1: faction, r0_2: faction, r1_1: faction, r2_1: 'vdk', r3_1: 'vdk', r4_1: 'vdk' },
    krugMarket: ['r0_1'],
  });
  const ownRegions = knownRegions.filter((r) => r.controller === faction)
    .map((r) => ({ id: r.id, ...(r.poi ? { poi: r.poi } : {}), ...(r.krugMarket ? { krugMarket: true } : {}) }));
  const view = {
    faction,
    time: o.time ?? { day: 3, hour: 10 },
    mapShape: o.mapShape ?? 'square',
    recruitsAvailable: o.recruitsAvailable ?? 12,
    doctrine: o.doctrine === undefined ? faction : o.doctrine,
    ownRegions: o.ownRegions ?? ownRegions,
    ownSquads: o.ownSquads ?? [
      { id: `${faction}-s1`, region: 'r0_1', strength: 6, supplies: 10, fuel: 50, morale: 70, vehicle: null, transit: null },
      { id: `${faction}-s2`, region: 'r1_1', strength: 6, supplies: 10, fuel: 50, morale: 70, vehicle: null, transit: null },
    ],
    knownRegions,
    knownSquads: o.knownSquads ?? [
      { id: 'vdk-s9', faction: 'vdk', region: 'r3_1', estimatedStrength: 5, seen: { day: 3, hour: 9 } },
    ],
    capital: o.capital ?? { tile: 'r2_1', holder: 'vdk', occupant: 'vdk', contestedSince: null },
    vips: o.vips ?? [],
    relations: { ...(o.relations ?? { ssv: -80, vdk: -80, varyag: 20, aegis: 0, krug: 10 }) },
    reputationWithPlayer: o.reputationWithPlayer ?? { value: 0, standing: 'neutral' },
    funds: o.funds ?? 100000,
    contracts: o.contracts ?? [],
    contractOffers: o.contractOffers ?? [],
    events: o.events ?? [],
    crisisSigns: o.crisisSigns ?? [],
    availableMeasures: o.availableMeasures ?? [],
  };
  delete view.relations[faction];
  if (o.overdraft !== undefined) view.overdraft = o.overdraft;
  if (o.escortRequests !== undefined) view.escortRequests = o.escortRequests;
  if (o.doctrine === null) delete view.doctrine;
  return view;
}

// Seeded random view for property tests and sims. Valid against strategic_perception_view.
export function randomView(seed, o = {}) {
  const rng = new Rng(seed);
  const faction = o.faction ?? rng.pick(AI_FACTIONS);
  const w = o.w ?? rng.int(4, 7), h = o.h ?? rng.int(3, 6);
  const factions = ['ssv', 'vdk', 'varyag', 'aegis', 'krug', 'player', null];
  const terrain = {}, poi = {}, controller = {}, krugMarket = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const id = rid(x, y);
    terrain[id] = rng.roll(10) ? 'water' : rng.roll(25) ? 'forest' : 'plain';
    if (terrain[id] !== 'water' && rng.roll(30)) poi[id] = rng.pick(['town', 'oil', 'gas', 'town']);
    if (poi[id] === 'town' && rng.roll(40)) krugMarket.push(id);
    controller[id] = rng.pick(factions);
  }
  const cap = rid(Math.floor(w / 2), Math.floor(h / 2));
  terrain[cap] = 'plain'; poi[cap] = 'capital';
  // make sure the faction holds at least two passable tiles
  const own = [rid(0, 0), rid(0, 1)];
  for (const id of own) { terrain[id] = 'plain'; controller[id] = faction; }
  poi[rid(0, 1)] = 'town';
  const knownRegions = grid(w, h, { terrain, poi, controller, krugMarket });
  const passable = knownRegions.filter((r) => r.terrain !== 'water');
  const ownSquads = [];
  const n = o.squads ?? rng.int(0, 3);
  for (let i = 0; i < n; i++) {
    const at = rng.pick(passable);
    const s = { id: `${faction}-s${i + 1}`, region: at.id, strength: rng.int(2, 10), supplies: rng.int(0, 20),
      fuel: rng.int(0, 100), morale: rng.int(20, 100), vehicle: null, transit: null };
    if (rng.roll(40)) { s.goal = rng.pick(GOALS); s.target = rng.pick(passable).id; }
    if (rng.roll(15)) {
      const nb = passable.find((r) => Math.abs(r.x - at.x) + Math.abs(r.y - at.y) === 1);
      if (nb) s.transit = { toRegion: nb.id, hoursLeft: rng.int(1, 5) };
    }
    ownSquads.push(s);
  }
  const knownSquads = [];
  for (let i = 0, m = rng.int(0, 4); i < m; i++) {
    const f = rng.pick(['ssv', 'vdk', 'varyag', 'aegis', 'krug', 'player'].filter((x) => x !== faction));
    knownSquads.push({ id: `${f}-k${i + 1}`, faction: f, region: rng.pick(passable).id, estimatedStrength: rng.int(1, 10), seen: { day: 3, hour: rng.int(0, 10) } });
  }
  const standing = o.standing ?? rng.pick(['hostile', 'unfriendly', 'neutral', 'friendly', 'trusted']);
  const relations = {};
  for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug']) if (f !== faction) relations[f] = rng.int(-100, 100);
  const v = makeView(faction, {
    knownRegions, ownSquads, knownSquads, relations,
    capital: { tile: cap, holder: controller[cap], occupant: controller[cap], contestedSince: null },
    reputationWithPlayer: { value: { hostile: -70, unfriendly: -30, neutral: 0, friendly: 30, trusted: 70 }[standing], standing },
    funds: o.funds ?? rng.pick([0, 500, 5000, 50000]),
    recruitsAvailable: rng.pick([0, 3, 6, 12]),
    crisisSigns: ['ssv', 'vdk'].includes(faction) && rng.roll(50) ? ['troopLoss', 'littleTerritory'] : [],
  });
  if (['ssv', 'vdk'].includes(faction) && v.crisisSigns.length) v.availableMeasures = ['conscription', 'martialLaw'];
  if (['varyag', 'aegis'].includes(faction) && rng.roll(60)) {
    v.contractOffers = [offer(faction === 'varyag' ? 'ssv' : 'vdk', `off-${seed}`, rng.pick(passable).id)];
  }
  if (faction === 'krug' && rng.roll(60)) {
    v.escortRequests = [{ id: `esc-${seed}`, requester: rng.pick(['ssv', 'vdk', 'player']), convoy: 'conv-1',
      region: rid(0, 1), route: [rid(0, 1), rid(1, 1)], priceUsd: rng.pick([100, 300, 800]), relation: rng.int(-100, 100) }];
  }
  return v;
}

export function offer(employer, id, location, o = {}) {
  return {
    id, employer, targetFaction: o.targetFaction ?? null, sourceGoal: o.sourceGoal ?? 'attackPoi',
    missions: o.missions ?? [{ key: 'm1', missionId: 'assault_poi', targets: [location], location }],
    deadline: o.deadline ?? { day: 5, hour: 12 },
    payInputs: o.payInputs ?? { distance: 2, danger: 1, urgency: 1 },
    intelLevel: 'exact', deniable: false, reputationGate: { better: false, sensitive: false },
    boardLocation: 'r0_1', counterContractOf: null,
  };
}

// ---------- rule checker ----------

const regionMap = (v) => Object.fromEntries(v.knownRegions.map((r) => [r.id, r]));
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function playerTargets(v) {
  const ids = new Set((v.knownSquads ?? []).filter((s) => s.faction === 'player' && s.id).map((s) => s.id));
  ids.add('player');
  for (const r of v.knownRegions) if (r.controller === 'player') ids.add(r.id);
  return ids;
}

// SAI-013: (1) standing hostile, (2) a mission targeting the player, (3) unfriendly-or-worse plus a player
// squad whose knownGoal and knownTarget equal an own squad's goal and target.
export function hostileToPlayer(v) {
  const st = v.reputationWithPlayer?.standing;
  if (st === 'hostile') return true;
  const missionOnPlayer = (v.contracts ?? []).some((c) => c.role === 'employer' && ['open', 'accepted'].includes(c.status)
    && (c.missions ?? []).some((m) => m.status === 'open' && (m.targets ?? []).some((t) => playerTargets(v).has(t))));
  if (missionOnPlayer) return true;
  if (st === 'unfriendly') {
    return (v.knownSquads ?? []).some((k) => k.faction === 'player' && k.knownGoal
      && (v.ownSquads ?? []).some((s) => s.goal === k.knownGoal && (s.target ?? null) === (k.knownTarget ?? null)));
  }
  return false;
}

export function targetsPlayer(v, c) {
  const p = playerTargets(v);
  if (c.type === 'setGoal') return ['hunt', 'attackPoi'].includes(c.goal) && p.has(c.target);
  if (c.type === 'attack') return p.has(c.target);
  return false;
}

// Returns a list of rule violations of one command set (empty = legal as far as the AI can know).
export function violations(v, result) {
  const out = [];
  const regions = regionMap(v);
  const own = Object.fromEntries((v.ownSquads ?? []).map((s) => [s.id, s]));
  const acted = new Set(), assigned = new Set();
  const terrain = (id) => registry.get('strategic-terrain', regions[id]?.terrain);
  const hard = (registry.get('economy-rules', 'fundsMode') ?? 'hardLimit') === 'hardLimit';
  const rules = { raiseSquad: registry.get('strategic-rules', 'raiseSquad'), krugEscortPrice: registry.get('strategic-rules', 'krugEscortPrice') };
  let spend = 0, measures = 0;
  const hostile = hostileToPlayer(v);
  const answered = new Set();
  if (!Array.isArray(result?.commands)) return ['commands is not an array'];
  for (const [i, c] of result.commands.entries()) {
    const at = `#${i} ${c.type}`;
    if (ACTIONS.includes(c.type) || c.type === 'setGoal') {
      const s = own[c.squad];
      if (!s) { out.push(`${at}: squad ${c.squad} is not own`); continue; }
      if (ACTIONS.includes(c.type)) {
        if (acted.has(c.squad)) out.push(`${at}: second action for ${c.squad}`);
        acted.add(c.squad);
      } else {
        if (assigned.has(c.squad)) out.push(`${at}: second assignment for ${c.squad}`);
        assigned.add(c.squad);
        if (!GOALS.includes(c.goal)) out.push(`${at}: goal ${c.goal} not in STR-018`);
      }
    }
    if (c.type === 'moveSquad') {
      const from = regions[own[c.squad]?.region], to = regions[c.toRegion];
      if (!to) out.push(`${at}: toRegion ${c.toRegion} unknown`);
      else if (from && dist(from, to) !== 1) out.push(`${at}: ${c.toRegion} not adjacent`);
      else if (terrain(c.toRegion)?.passable === false) out.push(`${at}: ${c.toRegion} impassable`);
    }
    if (c.type === 'attack') {
      const s = own[c.squad];
      const sq = (v.knownSquads ?? []).find((k) => k.id === c.target);
      const onTile = sq ? sq.region === s?.region : c.target === s?.region;
      if (!onTile) out.push(`${at}: target ${c.target} not on the squad's tile`);
    }
    if (!hostile && targetsPlayer(v, c)) out.push(`${at}: targets the player while not hostile (SAI-013)`);
    if (c.type === 'pickMeasure') {
      measures++;
      if (!(v.availableMeasures ?? []).includes(c.measure)) out.push(`${at}: ${c.measure} not available`);
    }
    if (c.type === 'acceptContract') {
      if (!['varyag', 'aegis'].includes(v.faction)) out.push(`${at}: ${v.faction} may not take contracts (SAI-015)`);
      if (!(v.contractOffers ?? []).some((o) => o.id === c.contractId)) out.push(`${at}: ${c.contractId} not offered`);
      for (const sq of c.squads ?? []) {
        if (!own[sq]) out.push(`${at}: squad ${sq} is not own`);
        if (assigned.has(sq)) out.push(`${at}: squad ${sq} already assigned`);
        assigned.add(sq);
      }
    }
    if (c.type === 'answerEscort') {
      if (v.faction !== 'krug') out.push(`${at}: only the Krug answers escorts`);
      if (!(v.escortRequests ?? []).some((r) => r.id === c.requestId)) out.push(`${at}: unknown request ${c.requestId}`);
      if (answered.has(c.requestId)) out.push(`${at}: request ${c.requestId} answered twice`);
      answered.add(c.requestId);
      if (c.accept) {
        if (!own[c.squad]) out.push(`${at}: accepted without an own squad`);
        else if (assigned.has(c.squad)) out.push(`${at}: squad ${c.squad} already assigned`);
        assigned.add(c.squad);
      }
    }
    if (c.type === 'offerContract') {
      if (c.contract?.employer !== v.faction) out.push(`${at}: employer is not ${v.faction}`);
      const minPay = (c.contract?.missions ?? []).reduce((a, m) => a + (registry.get('missions', m.missionId)?.payBand?.[0] ?? 0), 0);
      spend += minPay;
    }
    if (c.type === 'recruit') {
      const t = registry.get('factions', v.faction)?.squadTemplate?.size ?? 1;
      spend += (rules.raiseSquad?.costPerSoldierUsd ?? 0) * t;
      if ((v.recruitsAvailable ?? 0) < t) out.push(`${at}: needs ${t} recruits, ${v.recruitsAvailable ?? 0} available (STR-096)`);
      const r = (v.ownRegions ?? []).find((x) => x.id === c.target);
      const cat = r?.poi && registry.get('poi', r.poi)?.category;
      if (!['town', 'smallCity', 'largeCity'].includes(cat)) out.push(`${at}: ${c.target} is not an own town or city`);
    }
    if (c.type === 'hireEscort') spend += rules.krugEscortPrice?.baseUsd ?? 0;
  }
  if (measures > 1) out.push(`${measures} pickMeasure commands (max 1)`);
  if (hard && spend > (v.funds ?? 0)) out.push(`spends at least ${spend} with funds ${v.funds} under hardLimit`);
  return out;
}

export const strategistEntries = (res) => (res.log ?? []).filter((e) => e.tier === 'strategist');
export const allOptions = (res) => (res.log ?? []).flatMap((e) => e.options ?? []);
export const optionsNaming = (res, id) => allOptions(res).filter((o) => String(o.option).includes(id));

// Weighted sum of one logged option per SAI-008 (sign per NEGATIVE_TERMS; weight 0 if not in the doctrine).
export function expectedTotal(doctrine, considerations) {
  let t = 0;
  for (const [name, s] of Object.entries(considerations ?? {})) {
    const w = name === 'commitmentBonus' ? doctrine.commitmentBonus?.weight
      : doctrine.gainTerms?.[name]?.weight ?? doctrine.considerations?.[name]?.weight;
    t += (NEGATIVE_TERMS.includes(name) ? -1 : 1) * (w ?? 0) * s;
  }
  return t;
}

export { Rng, registry };
