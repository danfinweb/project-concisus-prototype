// Pure combat rules: time of day, sight, hearing, reactions, spread, damage, armour, zones, medical,
// blasts. TAC-003, TAC-004, TAC-018, TAC-022, TAC-025, TAC-040, TAC-043..TAC-063, TAC-066, TAC-067,
// TAC-079, TAC-081, TAC-083, TAC-085, TAC-096.
import { T, item, ZONES, LIMBS, ARMS, clamp } from './data.js';
import { attr, hasCond, inPain, isSuppressed, fractured, limbState, worseArm, woundedLimbs, maxHp, hp,
  fullZoneHp, perkEffect, addCondition, removeCondition } from './soldier.js';

// --- Time (TAC-003) -----------------------------------------------------------------------------
export const isNight = (hour) => hour >= T('nightStartHour') || hour < T('dayStartHour');

// --- Weapons helpers ----------------------------------------------------------------------------
export const activeWeapon = (s) => s.equipment?.[s.activeSlot || 'weapon1'] || null;
const mods = (w) => (w?.mods || []).map(item).filter(Boolean);
export const hasLight = (s) => ['weapon1', 'weapon2', 'holster'].some((slot) => {
  const w = s.equipment?.[slot];
  return w?.light && mods(w).some((m) => m.module === 'flashlight');
});
const ammoOf = (w) => item(w.ammo);
const calibreOf = (w) => item(item(w.item)?.calibre);

// --- Sight (TAC-004, TAC-081, TAC-082, TAC-096) -------------------------------------------------
export function sightRange(s, { night = false } = {}) {
  const day = T('sightBase') + T('sightPerPerception') * attr(s, 'perception') + T('sightPerRecon') * attr(s, 'recon');
  return night && !hasLight(s) ? day * T('nightSightFactor') : day;
}
export function concealmentFactor(t, { obscuringTile = false } = {}) {
  const c = T('concealment');
  const base = 1 - (c.recon * attr(t, 'recon') + c.agility * attr(t, 'agility')) / 100;
  return base * c.stance[t.stance || 'upright'] * (obscuringTile ? T('foliageConcealmentFactor') : 1);
}
export function spotDistance(spotter, target, opts = {}) {
  const q = perkEffect(target, 'quietStep');
  return sightRange(spotter, opts) * concealmentFactor(target, opts) * (q?.noticeDistanceFactor ?? 1);
}
export function visionCone(s) {
  return item(s.equipment?.helmet?.item)?.visionConeDeg ?? T('visionConeDeg');
}

// --- Hearing (TAC-018) --------------------------------------------------------------------------
export function hearingRange(shot, listener) {
  const w = shot.weapon;
  const suppressed = mods(w).some((m) => m.suppressor);
  if (!suppressed) return Infinity;
  const r = ammoOf(w)?.subsonic ? T('hearSuppressedSubsonic') : T('hearSuppressed');
  return item(listener.equipment?.helmet?.item)?.hearingPenalty ? r * T('hearingPenaltyFactor') : r;
}

// --- Reactions (TAC-022, TAC-096) ---------------------------------------------------------------
export function reactionChance(r, m, { distance = 0, sprinting = false, inPlace = false, leaderBonus = 0 } = {}) {
  const mod = T('reactionModifiers');
  let v = T('reactionBase') + (attr(r, 'perception') - attr(m, 'agility')) / 2;
  const steps = Math.floor(Math.max(0, distance - mod.distanceFreeTiles) / mod.distanceStepTiles);
  v -= Math.min(mod.distanceMax, steps * mod.distancePerStep);
  if (m.stance === 'crouched') v += mod.crouched;
  if (m.stance === 'prone') v += mod.prone;
  if (sprinting && !inPlace) v += mod.sprint;
  v -= attr(m, 'recon') * mod.noisePerRecon;
  if (inPain(r)) v += mod.reactorPain;
  v += woundedLimbs(r) * mod.perWoundedLimb;
  v += leaderBonus;
  const ghost = perkEffect(m, 'ghost');
  if (ghost && (ghost.whileStance || []).includes(m.stance)) v += ghost.reactionChanceAgainst || 0;
  return clamp(v, T('reactionMin'), T('reactionMax'));
}

// --- Spread (TAC-040, TAC-044, TAC-047, TAC-049) ------------------------------------------------
export function armConeFactor(s) {
  const w = worseArm(s);
  if (w === 'disabled') return T('disabledArmConeFactor');
  if (w === 'wounded') return T('woundedArmConeFactor');
  return 1;
}
export function shooterSpread(s, { distance = 0, aimSteps = 0, snapShot = false, weaponInst = null } = {}) {
  const ss = T('shooterSpread');
  const skill = ss.skillMax - (ss.skillRange * attr(s, 'marksmanship')) / 100;
  let range = ((100 - attr(s, 'perception')) / 100) * ss.rangePerTile * Math.max(0, distance - ss.rangeFreeTiles);
  for (const m of mods(weaponInst)) if (m.modifiers?.shooterSpreadAtRange) range *= m.modifiers.shooterSpreadAtRange;
  let v = (skill + range) * ss.stance[s.stance || 'upright'] * T('aimSpreadFactor') ** aimSteps;
  const steady = perkEffect(s, 'steadyAim');
  if (steady && aimSteps >= (steady.minAimSteps ?? 1)) v *= steady.shooterSpreadFactor;
  if (snapShot) for (const m of mods(weaponInst)) if (m.modifiers?.snapShotSpread) v *= m.modifiers.snapShotSpread;
  if (isSuppressed(s)) v += T('suppressionSpread');
  if (inPain(s)) v += T('painSpread');
  if (fractured(s, ARMS)) v += T('fracture').armSpread;
  if (snapShot) v += perkEffect(s, 'snapShooter')?.snapShotPenaltyMoa ?? T('snapShotSpread');
  if (hasCond(s, 'blinded')) v += T('blindSpread');
  return v;
}
export const conditionFactor = (cond) => 1 + (T('conditionSpreadCurve').maxExtra * (100 - (cond ?? 100))) / 100;
export function totalSpread(s, w, opts = {}) {
  const base = item(w.item).baseMoa * (ammoOf(w)?.spreadModifier ?? 1) * conditionFactor(w.condition);
  return (base + shooterSpread(s, { ...opts, weaponInst: w })) * armConeFactor(s);
}
export function effectiveRecoil(w) {
  let r = item(w.item).recoil * (calibreOf(w)?.recoilModifier ?? 1);
  for (const m of mods(w)) if (m.modifiers?.recoil) r *= m.modifiers.recoil;
  return r;
}
export function recoilPerRound(s, w) {
  const rc = T('recoilControl');
  const control = (rc.marksmanship * attr(s, 'marksmanship')) / 100 + (rc.strength * attr(s, 'strength')) / 100;
  return T('recoilSpreadPerRound') * effectiveRecoil(w) * (1 - control) * (ammoOf(w)?.recoilSpreadModifier ?? 1);
}
// TAC-045: cone half-width at coneSigmaFraction standard deviations; offsets in MoA.
export function sampleOffset(spread, rng) {
  const sigma = spread / 2 / T('coneSigmaFraction');
  return { x: rng.normal(0, sigma), y: rng.normal(0, sigma) };
}

// --- Jams and wear (TAC-083) --------------------------------------------------------------------
export const jamChance = (cond) => T('jamChanceCurve').max * ((100 - cond) / 100) ** T('jamChanceCurve').exponent;
export const wearPerRound = (s) => T('weaponWearPerShot') * (perkEffect(s, 'armourer')?.weaponWearFactor ?? 1);

// --- Damage (TAC-048..TAC-051) ------------------------------------------------------------------
export function muzzleDamage(w) {
  const a = ammoOf(w);
  return (a?.damageOverride ?? calibreOf(w).damage) * (a?.damageModifier ?? 1) * item(w.item).barrelMultiplier;
}
export function damageAt(w, d) {
  const a = ammoOf(w);
  const m = muzzleDamage(w);
  return Math.max(T('falloffFloor') * m, m * (1 - (a.falloff * d) / a.falloffRangeTiles));
}
export const projectiles = (w) => ammoOf(w)?.projectilesOverride ?? calibreOf(w)?.projectiles ?? 1;

export function armourCondition(inst) {
  const max = item(inst.item)?.durability || 1;
  return ((inst.durability ?? max) / max) * 100;
}
function penetratesClass(pen, inst, rng) {
  if (!inst || (inst.durability ?? 1) <= 0) return true;
  const cls = item(inst.item).armourClass;
  if (pen >= cls) return true;
  const cond = armourCondition(inst);
  const thr = T('degradedArmourThreshold');
  if (cond < thr && pen === cls - 1) return rng.roll(thr - cond);
  return false;
}
export const penetrates = (ammoId, inst, rng) => penetratesClass(item(ammoId).penetrationClass, inst, rng);
export { penetratesClass };
export const bluntDamage = (d) => T('bluntShare') * d;
export function armourWearAmount(inst, damage, penetrated) {
  const w = T('armourWear');
  const base = Math.max(w.min, Math.ceil(damage * (penetrated ? w.penetrating : w.blocked) - 1e-9));
  return base * (item(inst.item)?.durabilityLossModifier ?? 1);
}
export const zoneArmour = (s, zone) => (zone === 'head' ? s.equipment?.helmet : zone === 'thorax' ? s.equipment?.bodyArmour : null) || null;

// --- Hit boxes (TAC-052..TAC-056) ---------------------------------------------------------------
export function boxes(s) {
  const stance = s.stance || 'upright';
  const out = {};
  for (const z of ZONES) {
    const hb = T('zones')[z].hitboxes;
    out[z] = (s.aiming && hb.aiming) || hb[stance];
  }
  return out;
}
const inside = (b, p) => p.x >= b.min[0] && p.x <= b.max[0] && p.y >= b.min[1] && p.y <= b.max[1] && p.z >= b.min[2] && p.z <= b.max[2];
export function hitZoneAt(s, p) {
  for (const [z, b] of Object.entries(boxes(s))) if (inside(b, p)) return z;
  return null;
}
export const bodyHeight = (s) => Math.max(...Object.values(boxes(s)).map((b) => b.max[2]));
export const aimHeight = (s) => { const b = boxes(s).thorax; return (b.min[2] + b.max[2]) / 2; };
const UP = { prone: 'crouched', crouched: 'upright', upright: 'upright' };
export function exposedZones(s, { cover = 'none', firing = false } = {}) {
  if (cover === 'none') return [...ZONES];
  if (cover === 'full' && !firing) return [];
  const pose = firing && cover === 'half' ? { ...s, stance: UP[s.stance || 'upright'] } : s;
  const h = T('halfCoverHeightM');
  return Object.entries(boxes(pose)).filter(([, b]) => b.max[2] > h).map(([z]) => z);
}
// Zone hit by a round arriving from direction `from` (unit vector in the target's local xy frame,
// pointing toward the shooter) at lateral offset `lat` (m) and height z (m). The nearest box wins.
export function zoneAlong(s, from, lat, z) {
  const u = { x: from.y, y: -from.x };
  let best = null; let bestDepth = -Infinity;
  for (const [zone, b] of Object.entries(boxes(s))) {
    if (z < b.min[2] || z > b.max[2]) continue;
    const xs = [b.min[0], b.max[0]]; const ys = [b.min[1], b.max[1]];
    let pMin = Infinity; let pMax = -Infinity; let depth = -Infinity;
    for (const x of xs) for (const y of ys) {
      const p = x * u.x + y * u.y;
      pMin = Math.min(pMin, p); pMax = Math.max(pMax, p);
      depth = Math.max(depth, x * from.x + y * from.y);
    }
    if (lat >= pMin && lat <= pMax && depth > bestDepth) { best = zone; bestDepth = depth; }
  }
  return best;
}

// --- Zone damage (TAC-057, TAC-059) -------------------------------------------------------------
export function applyZoneDamage(s, zone, damage) {
  const zh = fullZoneHp(s);
  const disabled = [];
  let spread = 0;
  const limb = LIMBS.includes(zone);
  if (limb && zh[zone] <= 0) spread = damage;
  else {
    const left = zh[zone] - damage;
    zh[zone] = Math.max(0, left);
    if (limb && left <= 0) { disabled.push(zone); spread = -left; }
  }
  if (spread > 0) {
    const targets = ZONES.filter((z) => zh[z] > 0);
    const share = targets.length ? Math.floor(spread / targets.length) : 0;
    for (const z of targets) {
      zh[z] = Math.max(0, zh[z] - share);
      if (zh[z] === 0 && LIMBS.includes(z)) disabled.push(z);
    }
  }
  const died = zh.head <= 0 || zh.thorax <= 0;
  return { soldier: { ...s, zoneHp: zh }, died, disabled };
}

// --- Hit effects (TAC-025, TAC-060..TAC-063) ----------------------------------------------------
export const isHardHit = (s, zone, damage) => damage >= T('hardHitShare') * maxHp(s, zone);
export function bleedChance(kind, zone, ammoId, endurance) {
  const z = T('zones')[zone];
  const base = kind === 'heavy' ? z.heavyBleedChance : z.lightBleedChance;
  return base * (item(ammoId)?.bleedChanceModifier ?? 1) * (1 - endurance / T('bleedEnduranceDivisor'));
}
export function fractureChance(s, zone, damage, { disables = false } = {}) {
  if (!LIMBS.includes(zone)) return 0;
  const f = T('fracture');
  if (disables) return f.disableChance;
  return damage >= f.damageThreshold * maxHp(s, zone) ? f.chance : 0;
}
export function painFrom(s, { hitZone, hitDamage } = {}) {
  const p = T('painThresholds');
  if (hitZone && hitDamage >= p.hitShare * maxHp(s, hitZone)) return true;
  if (ZONES.some((z) => hp(s, z) < p.zoneBelowShare * maxHp(s, z))) return true;
  return hasCond(s, 'tourniquet');
}
// Rolls the effects of one damaging hit (the caller has applied the damage already, or not).
export function hitEffects(s, zone, { damage, blunt = false, ammo = null, disables = false } = {}, rng) {
  const out = { stunned: false, bleeding: null, fracture: false, pain: false };
  if (zone === 'head') out.stunned = rng.roll(T('stunChance') * 100);
  if (!blunt && damage > 0) {
    const e = attr(s, 'endurance');
    if (isHardHit(s, zone, damage) && rng.roll(bleedChance('heavy', zone, ammo, e) * 100)) out.bleeding = 'heavy';
    else if (rng.roll(bleedChance('light', zone, ammo, e) * 100)) out.bleeding = 'light';
  }
  const fc = fractureChance(s, zone, damage, { disables });
  if (fc > 0) out.fracture = rng.roll(fc * 100);
  out.pain = painFrom(s, { hitZone: zone, hitDamage: damage });
  return out;
}

// --- Medical (TAC-063, TAC-066, TAC-067, TAC-096) -----------------------------------------------
export function hpRestored(s, itemId, { poolLeft, missing }) {
  const it = item(itemId);
  if (!it?.hpPerUse) return 0;
  const ts = perkEffect(s, 'traumaSurgeon');
  const f = ts && (ts.items || []).includes(itemId) ? ts.hpRestoreFactor : 1;
  const v = Math.floor(it.hpPerUse * (T('healScaleBase') + attr(s, 'medical') / T('healScaleDivisor')) * f + 1e-9);
  return Math.max(0, Math.min(v, poolLeft, missing));
}
// Applies the condition effects of one use (HP restoring is done by the caller with hpRestored).
export function applyMedical(target, itemId, zone) {
  const it = item(itemId);
  if (!it || it.kind !== 'medical') throw new Error(`not a medical item: ${itemId}`);
  if (zone && it.zones && !it.zones.includes(zone)) throw new Error(`${itemId} cannot be used on ${zone}`);
  let s = { ...target, conditions: [...(target.conditions || [])] };
  const t = it.treats;
  if (t.includes('lightBleeding')) s = removeCondition(s, 'lightBleeding', zone);
  if (t.includes('heavyBleeding')) s = removeCondition(s, 'heavyBleeding', zone);
  if (t.includes('fracture')) s = removeCondition(s, 'fracture', zone);
  if (t.includes('pain')) s = addCondition(s, { type: 'painMasked', turnsLeft: it.durationTurns });
  if (t.includes('limbAtZeroHp') && zone && hp(s, zone) <= 0) s = { ...s, zoneHp: { ...fullZoneHp(s), [zone]: it.restoresToHp } };
  if (it.causesPain) { s = addCondition(s, { type: 'tourniquet', zone }); s = addCondition(s, { type: 'pain' }); }
  return s;
}

// --- Blasts and edges (TAC-079, TAC-085) --------------------------------------------------------
export function blastDamage(grenadeId, d, cover = 'none') {
  const g = item(grenadeId);
  if (T('blastBlockingCover').includes(cover)) return 0;
  const v = (g.damage || 0) * Math.max(0, 1 - d / g.radiusTiles);
  return cover === 'half' ? v * T('blastHalfCoverFactor') : v;
}
export function blastZoneSplit(damage) {
  const out = {};
  for (const [z, share] of Object.entries(T('blastZoneShares'))) out[z] = Math.floor(damage * share + 1e-9);
  return out;
}
export const materialHp = (m) => T('materialHp')[m] ?? Infinity;
export const edgeBlastDamage = (d) => d * T('edgeBlastFactor');
export { limbState, worseArm };
