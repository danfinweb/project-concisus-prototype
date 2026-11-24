// Soldiers, hiring, callsigns, attributes, perks and rank (MGT-001..MGT-031, MGT-074, MGT-075).
import { ATTRIBUTES, SKILLS, rules, recruitment, callsignData, tiers, tier, rankIndex, allEvents, krugFaction } from './data.js';
import { clone, findSoldier, clampMorale } from './state.js';
import { debit } from './money.js';

// ── Derived values (never stored, MGT-001) ──
export function averageAttribute(attributes) {
  return ATTRIBUTES.reduce((a, k) => a + attributes[k], 0) / ATTRIBUTES.length;
}
// MGT-029
export function carryCapacity(attributes) {
  const c = rules('carryCapacity');
  return c.base + c.strength * attributes.strength + c.endurance * attributes.endurance;
}
// MGT-005: rank fee × (1 − feeDiscount), whole dollars.
export function feePerOp(s) { return Math.round(tier(s.rank).feePerOpUsd * (1 - (s.feeDiscount ?? 0))); }
// MGT-008: squad morale = rounded average of its soldiers' morale.
export function squadMorale(st, ids) {
  const list = ids.map((id) => findSoldier(st, id)).filter(Boolean);
  return list.length ? Math.round(list.reduce((a, s) => a + s.morale, 0) / list.length) : 0;
}
// MGT-075: highest rank, then higher average attribute, then first listed.
export function squadLeader(soldiers) {
  let best = null;
  for (const s of soldiers) {
    if (!best) { best = s; continue; }
    const dr = rankIndex(s.rank) - rankIndex(best.rank);
    if (dr > 0 || (dr === 0 && averageAttribute(s.attributes) > averageAttribute(best.attributes))) best = s;
  }
  return best?.id;
}
export const leadershipBonus = (rank) => rules('leadershipBonus')[rank];

// ── Candidates and hiring (MGT-002, MGT-003, MGT-022) ──
// MGT-003: price follows the average attribute within the tier. The scaling is not designed
// (recruitment.priceFormula.spread: share of the tier price added at the top of the range and taken off
// at the bottom); without it the price is flat.
export function hirePrice(tierId, attributes, { krug = false } = {}) {
  const t = tier(tierId);
  const spread = recruitment('priceFormula')?.spread ?? 0;
  const { min, max } = t.attributeRange;
  const mid = (min + max) / 2, half = (max - min) / 2;
  let price = t.hirePriceUsd * (1 + (half > 0 ? spread * (averageAttribute(attributes) - mid) / half : 0));
  if (krug) price *= 1 + (krugFaction()?.resentment?.priceMarkup ?? 0);
  return Math.round(Math.max(0, price));
}

const refugeeDiscount = () => allEvents().find((e) => e.params?.recruitFeeDiscount != null)?.params.recruitFeeDiscount ?? 0;

// MGT-022: uniform integers in the tier range (the distribution is not designed; spec default).
function rollAttributes(tierId, rng) {
  const { min, max } = tier(tierId).attributeRange;
  const a = {};
  for (const k of ATTRIBUTES) a[k] = rng.int(min, max);
  return a;
}
export function generateCandidate({ tier: tierId, pool, krug = false, refugee = false }, rng) {
  const attributes = rollAttributes(tierId, rng);
  return { tier: tierId, pool, attributes, hirePriceUsd: hirePrice(tierId, attributes, { krug }), feeDiscount: refugee ? refugeeDiscount() : 0 };
}

// MGT-002: the pool's candidate count from its tiers; at least one must be affordable. If none is,
// the cheapest-tier candidate is re-rolled; as a last resort it gets the bottom of the tier range.
const AFFORDABLE_REROLLS = 20; // search bound, not a balancing value
export function candidates(st, { fobId, pool: poolId }, rng) {
  const pool = recruitment('pools').find((p) => p.id === poolId);
  const poolTiers = pool.tiers?.length ? pool.tiers : tiers().map((t) => t.id);
  const list = [];
  for (let i = 0; i < (pool.candidates ?? 1); i++) list.push(generateCandidate({ tier: rng.pick(poolTiers), pool: poolId }, rng));
  const budget = st.economy.balanceUsd;
  if (!list.some((c) => c.hirePriceUsd <= budget)) {
    const cheapest = [...poolTiers].sort((a, b) => rankIndex(a) - rankIndex(b))[0];
    let c = null;
    for (let i = 0; i < AFFORDABLE_REROLLS && !(c && c.hirePriceUsd <= budget); i++) c = generateCandidate({ tier: cheapest, pool: poolId }, rng);
    if (c.hirePriceUsd > budget) {
      const attributes = Object.fromEntries(ATTRIBUTES.map((k) => [k, tier(cheapest).attributeRange.min]));
      c = { ...c, attributes, hirePriceUsd: hirePrice(cheapest, attributes) };
    }
    list[list.length - 1] = c;
  }
  return list;
}

export function hire(state, candidate, { fobId, time, rng }) {
  const st = clone(state);
  if (!debit(st, candidate.hirePriceUsd, 'hire', time)) return { state, ok: false };
  const s = createSoldier(st, { rank: candidate.tier, attributes: candidate.attributes, fobId, time, rng, feeDiscount: candidate.feeDiscount ?? 0 });
  return { state: st, ok: true, soldier: structuredClone(s) };
}

// Test and setup helper: a soldier without price or candidate.
export function addSoldier(state, opts) {
  const st = clone(state);
  const s = createSoldier(st, opts);
  return { state: st, soldier: structuredClone(s) };
}

function createSoldier(st, { rank, attributes, fobId, time, rng, feeDiscount = 0, nerve, equipment = {}, callsign }) {
  const attrs = { ...attributes };
  const s = {
    id: `s${st.roster.nextId++}`,
    serviceNumber: st.roster.nextServiceNumber++,
    callsign: callsign ?? generationCallsign(attrs, livingCallsigns(st), rng),
    callsignSource: callsign ? 'player' : 'generated',
    callsignPrestige: 0,
    attributes: attrs,
    nerve: nerve ?? rules('nerve').start,
    morale: rules('moraleStart'),
    wounds: { zoneHp: {}, conditions: [] },
    equipment: structuredClone(equipment),
    perks: [],
    skillXp: Object.fromEntries(SKILLS.map((k) => [k, 0])),
    skillIdleDays: Object.fromEntries(SKILLS.map((k) => [k, 0])),
    rank,
    feeDiscount,
    deeds: [],
    status: 'active',
    hiredSkills: Object.fromEntries(SKILLS.map((k) => [k, attrs[k]])),
    serviceRecord: [],
    kitMarks: {},
    fobId,
    hiredAt: time,
  };
  // MGT-009: a skill already at a threshold when hired counts as reached (spec reading, SCOPE open question 6).
  for (const k of SKILLS) unlockPerks(s, k);
  st.roster.soldiers.push(s);
  return s;
}

// ── Callsigns (MGT-013..MGT-016) ──
const livingCallsigns = (st) => new Set(st.roster.soldiers.filter((s) => s.status !== 'dead').map((s) => s.callsign));

function bandList(attr, value) {
  const rows = callsignData('generation')[attr] ?? {};
  for (const [band, names] of Object.entries(rows)) {
    const [lo, hi] = band.split('-').map(Number);
    if (value >= lo && value <= hi) return names;
  }
  return [];
}
export function generationCallsign(attributes, taken, rng) {
  const top = Math.max(...ATTRIBUTES.map((k) => attributes[k]));
  let list;
  if (top < callsignData('minValue')) list = callsignData('generic');
  else {
    const picks = ATTRIBUTES.filter((k) => attributes[k] >= top - callsignData('tieMargin'));
    const attr = rng.pick(picks);
    list = bandList(attr, attributes[attr]);
  }
  const free = list.filter((n) => !taken.has(n));
  if (free.length) return rng.pick(free);
  const base = rng.pick(list); // MGT-015: base name + lowest free -N (N ≥ 2)
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// MGT-004
export function setCallsign(state, id, callsign) {
  const st = clone(state);
  const s = findSoldier(st, id);
  if (s) Object.assign(s, { callsign, callsignSource: 'player' });
  return st;
}
export function setKitMarks(state, id, marks) {
  const st = clone(state);
  const s = findSoldier(st, id);
  if (s) s.kitMarks = structuredClone(marks);
  return st;
}

// ── Growth, perks, rank (MGT-009, MGT-023, MGT-074) ──
function xpCost(value) {
  const g = rules('skillGrowth');
  if (value < g.fastBelow) return g.xpPerPoint.fast;
  if (value <= g.slowAbove) return g.xpPerPoint.medium;
  return g.xpPerPoint.slow;
}
function unlockPerks(s, skill) {
  for (const p of rules('perks') ?? []) {
    if (p.attribute === skill && s.attributes[skill] >= p.threshold && !s.perks.includes(p.id)) s.perks.push(p.id);
  }
}
// MGT-074: rise while the average is above the current rank's range top; never drop.
export function checkPromotion(s, time) {
  const order = tiers();
  let i = rankIndex(s.rank);
  while (i < order.length - 1 && averageAttribute(s.attributes) > order[i].attributeRange.max) {
    i++;
    s.rank = order[i].id;
    s.serviceRecord.push({ kind: 'promotion', time, rank: s.rank });
  }
}
export function growSkill(s, skill, uses, time) {
  const g = rules('skillGrowth');
  s.skillXp[skill] = (s.skillXp[skill] ?? 0) + uses * g.xpPerUse;
  s.skillIdleDays[skill] = 0;
  let changed = false;
  while (s.attributes[skill] < rules('attributeMax') && s.skillXp[skill] >= xpCost(s.attributes[skill])) {
    s.skillXp[skill] -= xpCost(s.attributes[skill]);
    s.attributes[skill] += 1;
    changed = true;
  }
  if (changed) { unlockPerks(s, skill); checkPromotion(s, time); }
}
export function addSkillUses(state, id, skill, uses, time) {
  const st = clone(state);
  const s = findSoldier(st, id);
  if (s && SKILLS.includes(skill)) growSkill(s, skill, uses, time);
  return st;
}

// MGT-031: nerve growth, capped.
export function addNerve(s, amount) {
  const n = rules('nerve');
  s.nerve = Math.max(n.min, Math.min(n.max, s.nerve + amount));
}
export function setMorale(s, value) { s.morale = clampMorale(value); }
