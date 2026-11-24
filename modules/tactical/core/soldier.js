// Soldier state rules: zones and limbs, AP, stamina, weight, perks, leadership, morale.
// TAC-006, TAC-009, TAC-027, TAC-057, TAC-058, TAC-094, TAC-095, TAC-096.
import { T, M, item, perk, ZONES, ARMS, LEGS, LIMBS, RANKS, SLOTS, clamp } from './data.js';

const attr = (s, a) => s.attributes?.[a] ?? 0;
export { attr };

// --- Conditions ---------------------------------------------------------------------------------
export const hasCond = (s, type, zone) => (s.conditions || []).some((c) => c.type === type && (zone === undefined || c.zone === zone));
export const isSuppressed = (s) => hasCond(s, 'suppressed') || s.suppressed === true;
export const painMasked = (s) => (s.conditions || []).some((c) => c.type === 'painMasked' && (c.turnsLeft ?? 1) > 0);
export const inPain = (s) => hasCond(s, 'pain') && !painMasked(s);
export const fractured = (s, zones) => zones.some((z) => hasCond(s, 'fracture', z));

// TAC-061: a zone has at most one bleeding condition; heavy replaces light. No duplicates.
export function addCondition(s, c) {
  let conds = [...(s.conditions || [])];
  if (c.type === 'heavyBleeding') conds = conds.filter((x) => !(x.type === 'lightBleeding' && x.zone === c.zone));
  if (c.type === 'lightBleeding' && conds.some((x) => x.type === 'heavyBleeding' && x.zone === c.zone)) return { ...s, conditions: conds };
  conds = conds.filter((x) => !(x.type === c.type && x.zone === c.zone));
  conds.push({ ...c });
  return { ...s, conditions: conds };
}
export const removeCondition = (s, type, zone) => ({ ...s, conditions: (s.conditions || []).filter((c) => !(c.type === type && (zone === undefined || c.zone === zone))) });

// --- Zones (TAC-057, TAC-058) -------------------------------------------------------------------
export function zoneMaxHp(zone, endurance) {
  const z = T('zones')[zone];
  return Math.floor(z.baseHp * (T('hpScaleBase') + (T('hpScaleEndurance') * endurance) / 100));
}
export const maxHp = (s, zone) => zoneMaxHp(zone, attr(s, 'endurance'));
export const hp = (s, zone) => s.zoneHp?.[zone] ?? maxHp(s, zone);
export function fullZoneHp(s) {
  const out = {};
  for (const z of ZONES) out[z] = hp(s, z);
  return out;
}
export function limbState(s, zone) {
  const h = hp(s, zone);
  if (h <= 0) return 'disabled';
  if (h < T('woundedThreshold') * maxHp(s, zone)) return 'wounded';
  return 'ok';
}
const ORDER = { ok: 0, wounded: 1, disabled: 2 };
export function worseArm(s) {
  return ARMS.map((z) => limbState(s, z)).reduce((a, b) => (ORDER[b] > ORDER[a] ? b : a), 'ok');
}
export const woundedLegs = (s) => LEGS.filter((z) => limbState(s, z) !== 'ok').length;
export const woundedLimbs = (s) => LIMBS.filter((z) => limbState(s, z) !== 'ok').length;
export const isWounded = (s) => ZONES.some((z) => hp(s, z) < maxHp(s, z));

// --- AP and stamina (TAC-006, TAC-009) ----------------------------------------------------------
export const fullAp = (s) => T('apBase') + Math.floor(attr(s, 'agility') / T('apAgilityDivisor'));

export function maxStamina(s) {
  const base = T('staminaBase') + Math.floor(attr(s, 'endurance') / T('staminaEnduranceDivisor'));
  return Math.max(0, base - T('staminaPerWoundedLeg') * woundedLegs(s));
}

// --- Weight (TAC-027) ---------------------------------------------------------------------------
export function instanceWeight(inst) {
  if (!inst) return 0;
  const it = item(inst.item);
  let w = (it?.weightKg || 0) * (inst.count ?? 1);
  for (const c of inst.contents || []) w += instanceWeight(c);
  return w;
}
export function equipmentWeight(equipment) {
  let w = 0;
  for (const slot of SLOTS) w += instanceWeight(equipment?.[slot]);
  return w;
}
export function carryCapacity(s) {
  const cc = M('carryCapacity');
  return cc.base + cc.strength * attr(s, 'strength') + cc.endurance * attr(s, 'endurance');
}
export const carriedWeight = (s) => equipmentWeight(s.equipment) + (s.carrying?.weightKg || 0);
export const overCapacity = (s) => carriedWeight(s) > carryCapacity(s);

export function encumbranceApPenalty(s) {
  const w = carriedWeight(s);
  const cap = carryCapacity(s);
  if (w <= cap) return 0;
  const base = w > T('heavyEncumbranceThreshold') * cap ? T('heavyEncumbranceApPenalty') : T('encumbranceApPenalty');
  return Math.floor(base * (1 - attr(s, 'strength') / T('encumbranceStrengthDivisor')));
}
export const armourApPenalty = (s) => item(s.equipment?.bodyArmour?.item)?.apPenalty || 0;

// TAC-006: full AP minus suppression, stun, pain and encumbrance/armour; wounds never reduce it.
export function activationAp(s) {
  let ap = fullAp(s);
  if (isSuppressed(s)) ap -= T('suppressionAp');
  if (hasCond(s, 'stunned')) ap -= T('stunApLoss');
  if (inPain(s)) ap -= T('painApLoss');
  ap -= encumbranceApPenalty(s) + armourApPenalty(s);
  return Math.max(0, ap);
}

// --- Perks (TAC-096) ----------------------------------------------------------------------------
export const hasPerk = (s, id) => (s.perks || []).includes(id);
export const perkEffect = (s, id) => (hasPerk(s, id) ? perk(id)?.effect || {} : null);

// --- Leadership (TAC-094) -----------------------------------------------------------------------
const avgAttr = (s) => {
  const v = Object.values(s.attributes || {});
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};
export function leaderOf(units) {
  let best = null; let bestIdx = -1;
  units.forEach((u, i) => {
    const r = RANKS.indexOf(u.rank);
    if (r < 0) return;
    if (!best) { best = u; bestIdx = i; return; }
    const br = RANKS.indexOf(best.rank);
    if (r > br || (r === br && avgAttr(u) > avgAttr(best))) { best = u; bestIdx = i; }
  });
  return bestIdx >= 0 ? best : null;
}
export function leadershipBonus(units) {
  const l = leaderOf(units);
  return l ? (M('leadershipBonus')?.[l.rank] || 0) : 0;
}

// --- Morale (TAC-095) ---------------------------------------------------------------------------
export function moraleAfterCasualty(observer, { killed, ally, sees, sameSquad }) {
  const mc = T('moraleCasualty');
  let m = observer.morale ?? 0;
  if (ally) {
    if (sees || sameSquad) m -= killed ? mc.allyKilled : mc.allyWounded;
  } else if (sees) {
    m += killed ? mc.enemyKilled : mc.enemyWounded;
  }
  return clamp(m, 0, 100);
}
