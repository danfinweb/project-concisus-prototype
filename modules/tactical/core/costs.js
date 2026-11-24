// Action costs: TAC-017, TAC-024, TAC-029..TAC-034, TAC-039..TAC-043, TAC-065, TAC-068, TAC-074, TAC-083.
import { T, item, terrain, LEGS, ARMS } from './data.js';
import { attr, limbState, fractured, inPain, hasPerk, perkEffect } from './soldier.js';

// TAC-024: base × factors, + additive terms, rounded down, at least 1 (free actions stay 0).
export function actionCost(base, { factors = [], add = [], free = false } = {}) {
  if (free) return 0;
  let v = base;
  for (const f of factors) v *= f;
  for (const a of add) v += a;
  return Math.max(1, Math.floor(v + 1e-9));
}

// --- Movement -----------------------------------------------------------------------------------
export function stepCost(s, { diagonal = false, terrain: tid = 'grass', sprint = false, door = false } = {}) {
  const tr = terrain(tid);
  const base = (diagonal ? T('diagonalWalkCost') : T('walkCost')) + (tr?.moveCost || 0);
  const factors = [];
  const states = LEGS.map((z) => limbState(s, z));
  if (states.includes('disabled')) factors.push(T('disabledLegMoveFactor'));
  if (fractured(s, LEGS)) factors.push(T('fractureMoveFactor'));
  const add = [T('legWoundMoveSurcharge') * states.filter((x) => x === 'wounded').length];
  if (s.stance === 'crouched') add.push(T('crouchSurcharge'));
  if (s.stance === 'prone') add.push(T('proneSurcharge'));
  if (sprint) add.push(-T('sprintDiscount'));
  if (s.carrying?.mode === 'carry') add.push(T('carryMoveSurcharge'));
  if (s.carrying?.mode === 'drag') add.push(T('dragMoveSurcharge'));
  if (door) add.push(T('openDoorSurcharge'));
  return actionCost(base, { factors, add });
}

export function turnCost(from, to) {
  let d = Math.abs((((to - from) % 360) + 360) % 360);
  if (d > 180) d = 360 - d;
  return Math.max(0, Math.ceil(d / 90 - 1e-9)) * T('turnCost');
}

export const stanceCost = (from, to) => (from === to ? 0 : T('stanceCost')[`${from}-${to}`]);
const agile = (s) => attr(s, 'agility') >= T('agileThreshold');
export const vaultCost = (s) => (agile(s) ? T('vaultCostAgile') : T('vaultCost'));
export const climbCost = (s, levels = 1) => (agile(s) ? T('climbCostAgile') : T('climbCost')) * levels;

export function canSprint(s) {
  if (s.stance !== 'upright') return false;
  if (fractured(s, LEGS)) return false;
  if (s.carrying?.mode === 'carry') return false;
  if (item(s.equipment?.backpack?.item)?.noSprint) return false;
  return true;
}
export const canVault = (s) => s.stance !== 'prone' && !s.carrying;
export const canClimb = (s) => s.stance !== 'prone' && s.carrying?.mode !== 'carry';

// --- Weapons ------------------------------------------------------------------------------------
export function ergonomics(w) {
  let e = item(w.item)?.ergonomics || 0;
  for (const m of w.mods || []) e += item(m)?.modifiers?.ergonomics || 0;
  return e;
}
function ergoAdd(w) {
  const e = ergonomics(w);
  if (e >= T('ergoHighThreshold')) return -T('ergoApDelta');
  if (e <= T('ergoLowThreshold')) return T('ergoApDelta');
  return 0;
}
export const roundsForMode = (w, mode) => (mode === 'auto' ? T('autoRounds') : mode);

export function fireApCost(s, w, mode) {
  const it = item(w.item);
  const base = it.fireApCost ?? T('fireApByWeaponType')[it.weaponType];
  const add = [ergoAdd(w)];
  if (mode === 'auto') add.push(T('autoApSurcharge'));
  else if (mode > 1) add.push(T('burstApSurcharge'));
  return actionCost(base, { add });
}

export function aimCost(s, steps) {
  if (!steps) return 0;
  const per = (attr(s, 'marksmanship') >= T('aimSkilledThreshold') ? T('aimStepCostSkilled') : T('aimStepCost'))
    + (inPain(s) ? T('aimPainSurcharge') : 0);
  return per * steps;
}

const backpackExtra = (s) => T('backpackSurcharge') + (item(s.equipment?.backpack?.item)?.extraAccessAp || 0);

export function reloadCost(s, w, { fromBackpack = false, shells = 1 } = {}) {
  const it = item(w.item);
  const per = T('reloadApByFeedType')[it.feedType];
  const base = it.feedType === 'tube' ? per * shells : per;
  const factors = fractured(s, ARMS) ? [T('armFractureReloadFactor')] : [];
  const add = [ergoAdd(w)];
  if (attr(s, 'marksmanship') >= T('reloadSkilledThreshold')) add.push(-T('reloadSkilledBonus'));
  if (fromBackpack) add.push(backpackExtra(s));
  return actionCost(base, { factors, add });
}

export function swapCost(s, fromSlot, toSlot) {
  const isPistol = (slot) => item(s.equipment?.[slot]?.item)?.weaponType === 'pistol';
  const base = isPistol(fromSlot) || isPistol(toSlot) ? T('swapCostPistol') : T('swapCost');
  return actionCost(base, { add: agile(s) ? [-T('swapAgileBonus')] : [] });
}

export const throwCost = (s, { fromBackpack = false } = {}) => actionCost(T('throwCost'), { add: fromBackpack ? [backpackExtra(s)] : [] });
export const throwRange = (s) => T('throwDistance').base + Math.floor(attr(s, 'strength') / T('throwDistance').strengthDivisor);

export function armScatterFactor(s) {
  const w = ARMS.map((z) => limbState(s, z));
  if (w.includes('disabled')) return T('disabledArmScatterFactor');
  if (w.includes('wounded')) return T('woundedArmScatterFactor');
  return 1;
}
export const scatterRadius = (s, distance) => (T('grenadeScatterBase') + distance / T('grenadeScatterPerTiles')) * armScatterFactor(s);

export function clearJamCost(s) {
  return attr(s, 'technical') >= T('clearJamSkilledThreshold') ? T('clearJamCostSkilled') : T('clearJamCost');
}

// --- Medical (TAC-064, TAC-065, TAC-068) --------------------------------------------------------
export function canUseMedical(s, itemId) {
  const req = item(itemId)?.requiresMedical;
  return !req || attr(s, 'medical') >= req;
}
export function medicalCost(s, itemId, { self = false, fromBackpack = false } = {}) {
  const it = item(itemId);
  let v = Math.max(1, it.apCost - Math.floor(attr(s, 'medical') / T('medicalApDivisor')));
  const fm = perkEffect(s, 'fieldMedic');
  if (fm) v = Math.max(fm.medicalApMin ?? 1, v - (fm.medicalApReduction || 0));
  if (self) v += T('selfTreatSurcharge');
  if (fromBackpack) v += backpackExtra(s);
  return v;
}

// --- Gear (TAC-071, TAC-072) --------------------------------------------------------------------
export function cutLockCost(s, cuttersItemId) {
  const sap = perkEffect(s, 'sapper');
  if (sap?.boltCutterAp) return sap.boltCutterAp;
  return item(cuttersItemId)?.apCost;
}
export const placeChargeCost = (s) => (attr(s, 'technical') >= T('placeChargeSkilledThreshold') ? T('placeChargeCostSkilled') : T('placeChargeCost'));
export { hasPerk };
