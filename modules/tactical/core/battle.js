// Battle state machine: turn order and activations, commands, reactions, shots, blasts, objectives.
// TAC-001, TAC-002, TAC-005..TAC-023, TAC-036..TAC-043, TAC-045, TAC-046, TAC-059..TAC-076, TAC-079,
// TAC-082..TAC-085, TAC-094, TAC-095. Pure: no DOM, no IO; all randomness from the battle's Rng.
import { Rng, hashSeed } from '../../../shared/rng.js';
import { T, item, items, ZONES, CARRIER_SLOTS, SLOTS, clamp } from './data.js';
import { fullZoneHp, hp, maxHp, maxStamina, activationAp, overCapacity, carriedWeight, carryCapacity, equipmentWeight,
  isSuppressed, addCondition, removeCondition, hasCond, isWounded, leaderOf, leadershipBonus, moraleAfterCasualty,
  fullAp } from './soldier.js';
import { stepCost, turnCost, stanceCost, vaultCost, climbCost, canSprint, canVault, canClimb, fireApCost, aimCost,
  reloadCost, swapCost, throwCost, throwRange, scatterRadius, clearJamCost, canUseMedical, medicalCost, cutLockCost,
  placeChargeCost, roundsForMode, actionCost } from './costs.js';
import { isNight, activeWeapon, hasLight, spotDistance, reactionChance, hearingRange, totalSpread, recoilPerRound,
  sampleOffset, jamChance, wearPerRound, damageAt, projectiles, penetrates, penetratesClass, bluntDamage, armourWearAmount,
  zoneArmour, aimHeight, zoneAlong, applyZoneDamage, hitEffects, painFrom, hpRestored, applyMedical, blastDamage,
  blastZoneSplit, materialHp, edgeBlastDamage } from './combat.js';
import { buildMap, getEdge, edgeKey, edgeCover, edgeBetween, inBounds, impassable, obscuring, terrainAt, lineTiles,
  dist, bearing, snapFacing, inCone, clearLine, coverAgainst, stepCheck, SIDES } from './map.js';
import { generateMap } from './mapgen.js';

const GROUPS = ['player', 'opponent', 'neutral'];
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const clone = (o) => (o === undefined ? undefined : structuredClone(o));


// ================================================================================================
// Creation
// ================================================================================================
export function createBattle(req, opts = {}) {
  const src = opts.map || generateMap(req);
  const map = buildMap(src);
  const b = {
    req, map, night: isNight(req.time?.hour ?? 12), rng: opts.rng || new Rng(req.seed), turn: 1, slot: 0,
    activeUnit: null, units: new Map(), sides: [], noises: {}, stall: 0, autoAdvance: false,
    activatedThisTurn: new Set(), heardThisTurn: false, rejections: 0, opened: new Set(), dropped: [], charges: [],
    bodies: [], seen: new Map(), ended: false, uid: 0, pendingEnd: false, ev: null, previewCount: 0,
    objectives: (req.objectives || []).map((o) => ({ id: o.id, type: o.type, targets: o.targets || [], met: false, metTurn: null })),
  };
  const placements = opts.placements || {};
  const deploy = { player: [...(src.deployment?.player || [])], opponent: [...(src.deployment?.enemy || [])], neutral: [...(src.deployment?.enemy || [])] };
  for (const sd of req.sides) {
    const group = sd.role === 'neutral' ? 'neutral' : sd.controller === 'player' || sd.role === 'ally' ? 'player' : 'opponent';
    b.sides.push({ faction: sd.faction, controller: sd.controller, role: sd.role, group, vehicle: sd.vehicle ?? null, hostile: false, hostileTo: new Set() });
    for (const raw of sd.units || []) {
      const p = placements[raw.id] || placeFrom(deploy[group]) || { x: 0, y: 0 };
      const u = {
        ...clone(raw), faction: sd.faction, x: p.x, y: p.y, level: p.level || 0, facing: p.facing ?? 0, stance: p.stance || raw.stance || 'upright',
        conditions: clone(raw.conditions) || [], equipment: clone(raw.equipment) || {}, perks: raw.perks || [],
        morale: raw.morale ?? sd.morale ?? 0, status: 'active', reaction: raw.reaction || 'fire', ap: 0,
        activeSlot: raw.activeSlot || 'weapon1', overwatch: false, alerted: false,
      };
      u.zoneHp = fullZoneHp(u);
      u.conditions = u.conditions.map((c) => (c.type === 'suppressed' ? { ...c, since: c.since ?? 0 } : c));
      u.stamina = Math.min(raw.stamina ?? maxStamina(u), maxStamina(u));
      b.units.set(u.id, u);
    }
  }
  updateLights(b);
  return b;
}
function placeFrom(list) {
  const t = list?.shift();
  return t ? { x: t[0], y: t[1] } : null;
}

// ================================================================================================
// Queries
// ================================================================================================
const sideOf = (b, faction) => b.sides.find((s) => s.faction === faction);
const groupOf = (b, u) => sideOf(b, u.faction)?.group;
const onMap = (u) => u.status === 'active';
const active = (b) => [...b.units.values()].filter(onMap);
const groupsInPlay = (b) => GROUPS.filter((g) => g !== 'neutral' || b.sides.some((s) => s.group === 'neutral' && s.hostile));
const activeGroup = (b) => groupsInPlay(b)[b.slot];

export function hostile(b, fa, fb) {
  if (fa === fb) return false;
  const sa = sideOf(b, fa); const sb = sideOf(b, fb);
  if (!sa || !sb) return false;
  if (sa.hostileTo.has(fb) || sb.hostileTo.has(fa)) return true;
  if (sa.group === 'neutral' || sb.group === 'neutral') return false;
  if (sa.group === sb.group) return false;
  return b.req.hostility?.[fa]?.[fb] ?? true;
}
const isPlayerVip = (b, u) => b.req.vipControl === 'player' && sideOf(b, u.faction)?.controller === 'player'
  && (u.controller === 'player' || b.req.vip?.id === u.id);
const leaderBonusFor = (b, u) => leadershipBonus(active(b).filter((x) => x.faction === u.faction));

function spottedU(b, s, t) {
  if (!onMap(s) || !onMap(t) || s.id === t.id) return false;
  if (!inCone(s, t) || !clearLine(b.map, s, t)) return false;
  if (b.night && hasLight(t)) return true;
  return dist(s, t) <= spotDistance(s, t, { night: b.night, obscuringTile: obscuring(b.map, t.x, t.y) }) + 1e-9;
}

export function unit(b, id) {
  const u = b.units.get(id);
  if (!u) return null;
  return { ...clone({ ...u, carriedBy: undefined }), maxStamina: maxStamina(u), suppressed: isSuppressed(u),
    effectiveMorale: u.morale + (onMap(u) ? leaderBonusFor(b, u) : 0) };
}
export function state(b) {
  const g = activeGroup(b);
  const af = b.sides.find((s) => s.group === g)?.faction ?? null;
  return {
    turn: b.turn, activeFaction: af, activeUnit: b.activeUnit, night: b.night, ended: b.ended, autoAdvance: b.autoAdvance,
    sides: b.sides.map((s) => ({ faction: s.faction, role: s.role, group: s.group, hostile: s.group === 'neutral' ? s.hostile : true,
      leader: leaderOf(active(b).filter((u) => u.faction === s.faction))?.id ?? null })),
  };
}
export function lineOfSight(b, aId, bId) {
  const a = b.units.get(aId); const t = b.units.get(bId);
  return !!a && !!t && inCone(a, t) && clearLine(b.map, a, t);
}
export const spotted = (b, sId, tId) => spottedU(b, b.units.get(sId), b.units.get(tId));
export function cover(b, x, y, side) {
  const e = getEdge(b.map, x, y, side);
  if (!e) return { cover: 'none' };
  return { ...e, cover: edgeCover(e), hp: e.hp ?? materialHp(e.material) };
}
export function isConcealed(b, sId, tId) {
  const s = b.units.get(sId); const t = b.units.get(tId);
  return concealedU(b, s, t);
}
function concealedU(b, s, t) {
  const pts = lineTiles(s.x, s.y, t.x, t.y);
  return pts.slice(1).some(([x, y]) => obscuring(b.map, x, y));
}
export function objectives(b) { return b.objectives.map((o) => ({ id: o.id, type: o.type, met: o.met, metTurn: o.metTurn })); }

// ================================================================================================
// Paths (TAC-037)
// ================================================================================================
const occupied = (b, x, y, except) => [...b.units.values()].some((u) => onMap(u) && !u.carriedBy && u.id !== except && u.x === x && u.y === y);

class Heap {
  constructor() { this.a = []; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].c <= a[i].c) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1; const r = l + 1; let m = i; if (l < a.length && a[l].c < a[m].c) m = l; if (r < a.length && a[r].c < a[m].c) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  }
  get size() { return this.a.length; }
}
function findPath(b, u, dest, { sprint = false } = {}) {
  const m = b.map; const W = m.width;
  const key = (x, y) => y * W + x;
  const best = new Map([[key(u.x, u.y), 0]]); const prev = new Map();
  const h = new Heap(); h.push({ x: u.x, y: u.y, c: 0 });
  while (h.size) {
    const n = h.pop();
    if (n.c > (best.get(key(n.x, n.y)) ?? Infinity)) continue;
    if (n.x === dest.x && n.y === dest.y) break;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const x = n.x + dx; const y = n.y + dy;
      const chk = stepCheck(m, n.x, n.y, x, y);
      if (!chk.ok || occupied(b, x, y, u.id)) continue;
      const c = n.c + stepCost(u, { diagonal: !!(dx && dy), terrain: m.tiles[y][x], sprint, door: !!chk.door });
      if (c < (best.get(key(x, y)) ?? Infinity)) { best.set(key(x, y), c); prev.set(key(x, y), [n.x, n.y]); h.push({ x, y, c }); }
    }
  }
  if (!best.has(key(dest.x, dest.y)) || (dest.x === u.x && dest.y === u.y)) return null;
  const path = []; let cur = [dest.x, dest.y];
  while (cur[0] !== u.x || cur[1] !== u.y) { path.unshift({ x: cur[0], y: cur[1] }); cur = prev.get(key(cur[0], cur[1])); }
  return { path, cost: best.get(key(dest.x, dest.y)) };
}
function pathCosts(b, u, path, sprint) {
  let px = u.x; let py = u.y; const out = [];
  for (const p of path) {
    const chk = stepCheck(b.map, px, py, p.x, p.y);
    if (!chk.ok) return { error: chk.reason };
    if (occupied(b, p.x, p.y, u.id)) return { error: 'tile occupied' };
    out.push({ cost: stepCost(u, { diagonal: p.x !== px && p.y !== py, terrain: b.map.tiles[p.y][p.x], sprint, door: !!chk.door }), door: chk.door, from: [px, py] });
    px = p.x; py = p.y;
  }
  return { steps: out, total: out.reduce((a, s) => a + s.cost, 0) };
}
export function previewPath(b, unitId, dest) {
  const u = b.units.get(unitId);
  const r = findPath(b, u, dest);
  if (!r) return { path: null, cost: Infinity, apRunsOutAt: null };
  const budget = b.activeUnit === unitId ? u.ap : activationAp(u);
  const pc = pathCosts(b, u, r.path, false);
  let cum = 0; let at = null;
  r.path.forEach((p, i) => { cum += pc.steps[i].cost; if (cum <= budget) at = { x: p.x, y: p.y }; });
  return { path: r.path, cost: r.cost, apRunsOutAt: at };
}

// ================================================================================================
// Commands
// ================================================================================================
export function act(b, faction, cmd) {
  b.ev = [];
  const r = dispatch(b, faction, cmd || {});
  if (r.ok) checkAfterAction(b);
  else {
    const side = sideOf(b, faction);
    if (b.activeUnit && side?.controller === 'ai' && side.group === activeGroup(b)) {
      b.rejections++;
      if (b.rejections > T('commandRetries')) endActivation(b, b.units.get(b.activeUnit), {});
    }
  }
  if (b.pendingEnd && b.activeUnit) { b.pendingEnd = false; endActivation(b, b.units.get(b.activeUnit), {}); }
  b.pendingEnd = false;
  const events = b.ev; b.ev = null;
  return r.ok ? { ok: true, events } : { ok: false, reason: r.reason, events };
}
const no = (reason) => ({ ok: false, reason });
const yes = { ok: true };
const emit = (b, e) => { if (b.ev) b.ev.push(e); };

function dispatch(b, faction, cmd) {
  if (b.ended) return no('battle ended');
  const side = sideOf(b, faction);
  if (!side) return no('unknown faction');
  if (side.group !== activeGroup(b)) return no('not this side\'s activation');
  if (cmd.type === 'pass') {
    if (b.activeUnit) return no('end the activation first');
    endSlot(b); return yes;
  }
  if (cmd.type === 'activate') {
    if (b.activeUnit) return no('a soldier is already active');
    const u = b.units.get(cmd.unit);
    if (!u || !onMap(u) || groupOf(b, u) !== side.group) return no('not a soldier of this side');
    if (u.stamina < T('activationCost')) return no('exhausted');
    if (u.restrained) return no('restrained');
    startActivation(b, u); return yes;
  }
  const u = b.units.get(b.activeUnit);
  if (!u) return no('no active soldier');
  if (groupOf(b, u) !== side.group) return no('not this side\'s soldier');
  const h = HANDLERS[cmd.type];
  if (!h) return no(`unknown command ${cmd.type}`);
  if (!onMap(u) && cmd.type !== 'endActivation') return no('soldier is off the map');
  return h(b, u, cmd);
}

function spend(u, cost) {
  if (cost > u.ap) return false;
  u.ap -= cost; return true;
}

// --- Activation (TAC-005..TAC-012, TAC-019) -----------------------------------------------------
function startActivation(b, u) {
  b.activeUnit = u.id; b.rejections = 0; b.autoAdvance = false; b.stall = 0;
  b.activatedThisTurn.add(u.id);
  if (u.alerted && u.alertSource) { u.facing = snapFacing(bearing(u, u.alertSource)); }
  u.alerted = false; u.alertSource = null; u.overwatch = false; u.sprinted = false;
  u.ap = activationAp(u);
  u.stamina = Math.max(0, u.stamina - T('activationCost'));
  for (const r of active(b)) if (r.id !== u.id) b.seen.set(`${r.id}>${u.id}`, spottedU(b, r, u));
  emit(b, { type: 'activate', unit: u.id, ap: u.ap });
}
function endActivation(b, u, { facing }) {
  if (facing !== undefined && onMap(u)) u.facing = facing;
  if (u.sprinted || overCapacity(u)) u.stamina = Math.max(0, u.stamina - T('activationSurcharge'));
  u.conditions = u.conditions.filter((c) => c.type !== 'stunned' && c.type !== 'blinded');
  u.ap = 0; u.sprinted = false;
  for (const ch of b.charges.filter((c) => c.by === u.id)) detonate(b, ch);
  b.charges = b.charges.filter((c) => c.by !== u.id);
  b.activeUnit = null;
  emit(b, { type: 'endActivation', unit: u.id });
  endSlot(b);
}
function endSlot(b) {
  b.activeUnit = null;
  b.slot++;
  if (b.slot >= groupsInPlay(b).length) { endTurn(b); b.slot = 0; }
  checkEnd(b);
}
function endTurn(b) {
  for (const u of active(b)) {
    if (!b.activatedThisTurn.has(u.id)) u.stamina = Math.min(maxStamina(u), u.stamina + T('staminaRecovery'));
  }
  for (const u of active(b)) {
    for (const c of [...u.conditions]) {
      if (c.type === 'lightBleeding') dealDamage(b, u, c.zone, T('lightBleedHp'), { blunt: true, bleed: true });
      if (c.type === 'heavyBleeding') dealDamage(b, u, c.zone, T('heavyBleedHp'), { blunt: true, bleed: true });
      if (!onMap(u)) break;
    }
    u.conditions = u.conditions
      .map((c) => (c.type === 'painMasked' ? { ...c, turnsLeft: (c.turnsLeft ?? 1) - 1 } : c))
      .filter((c) => !(c.type === 'painMasked' && c.turnsLeft <= 0))
      .filter((c) => !(c.type === 'suppressed' && (c.since ?? 0) < b.turn));
    if (hasCond(u, 'pain') && !painFrom(u, {})) u.conditions = u.conditions.filter((c) => c.type !== 'pain');
    u.stamina = Math.min(u.stamina, maxStamina(u));
  }
  b.map.smoke = b.map.smoke.map((s) => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter((s) => s.turnsLeft > 0);
  let contact = b.heardThisTurn;
  const us = active(b);
  for (const a of us) for (const t of us) if (!contact && hostile(b, a.faction, t.faction) && spottedU(b, a, t)) contact = true;
  b.stall = b.activatedThisTurn.size === 0 && !contact ? b.stall + 1 : 0;
  b.autoAdvance = b.stall >= T('stallTurns');
  b.turn++; b.activatedThisTurn = new Set(); b.heardThisTurn = false;
  updateLights(b);
}
function checkEnd(b) {
  // TAC-038: the battle ends for the player side when none of its soldiers is left on the map.
  const players = [...b.units.values()].filter((u) => groupOf(b, u) === 'player' && onMap(u) && !u.carriedBy);
  if (!players.length) b.ended = true;
}
function checkAfterAction(b) {
  updateLights(b);
  for (const o of b.objectives) {
    if (o.met) continue;
    const t = o.targets.map((id) => b.units.get(id)).filter(Boolean);
    let met = false;
    if (o.type === 'killVip') met = t.some((u) => u.status === 'dead');
    if (o.type === 'captureVip') met = t.some((u) => u.status === 'leftMap' && u.restrained);
    if (o.type === 'destroyTarget') met = t.some((u) => u.status === 'dead') || o.targets.some((id) => [...b.map.edges.values()].some((e) => e.id === id && e.kind === 'rubble'));
    if (o.type === 'saveCargo') met = t.some((u) => u.status === 'leftMap');
    if (met) { o.met = true; o.metTurn = b.turn; emit(b, { type: 'objectiveMet', objective: o.id, turn: b.turn }); }
  }
  checkEnd(b);
}

// --- Lights (TAC-004) ---------------------------------------------------------------------------
function updateLights(b) {
  if (!b.night) return;
  for (const c of active(b)) {
    if (!hasLight(c)) continue;
    for (const e of active(b)) {
      if (!hostile(b, c.faction, e.faction)) continue;
      if (dist(c, e) <= T('blindRangeTiles') + 1e-9 && inCone(c, e) && clearLine(b.map, c, e) && !hasCond(e, 'blinded')) e.conditions.push({ type: 'blinded' });
    }
  }
}

// --- Reactions (TAC-020..TAC-023, TAC-075) ------------------------------------------------------
function reactionChecks(b, mover, { inPlace = false, sprinting = false } = {}) {
  for (const r of active(b)) {
    if (!onMap(mover)) return;
    if (r.id === mover.id || !hostile(b, r.faction, mover.faction)) continue;
    const key = `${r.id}>${mover.id}`;
    const sees = spottedU(b, r, mover);
    const was = b.seen.get(key) || false;
    b.seen.set(key, sees);
    if (!sees || (!inPlace && was)) continue;
    attemptReaction(b, r, mover, { inPlace, sprinting });
  }
}
function attemptReaction(b, r, m, { inPlace, sprinting }) {
  if (r.reaction === 'hold' || isSuppressed(r) || r.stamina <= 0 || r.stamina < T('reactionCost') || isPlayerVip(b, r) || r.restrained) return;
  r.stamina -= T('reactionCost');
  const chance = reactionChance(r, m, { distance: dist(r, m), sprinting, inPlace, leaderBonus: leaderBonusFor(b, r) });
  const success = b.rng.roll(chance);
  emit(b, { type: 'reactionAttempt', reactor: r.id, mover: m.id, chance, success });
  if (!success) return;
  if (r.reaction === 'fire') {
    const w = activeWeapon(r);
    if (!w || w.jammed || !(w.rounds > 0) || !item(w.item) || item(w.item).kind !== 'weapon') return;
    const ow = r.overwatch;
    const mode = ow ? selectedMode(w) : 1;
    const shot = fireShot(b, r, m, null, { mode, aimSteps: 0, snapShot: !ow });
    emit(b, { type: 'reactionFire', reactor: r.id, target: m.id, rounds: shot.rounds, snapShot: !ow });
    if (ow && (w.rounds ?? 0) < roundsForMode(w, mode)) r.overwatch = false;
  } else if (r.reaction === 'takeCover') {
    takeCover(b, r, m);
  }
}
function takeCover(b, r, from) {
  const range = T('takeCoverRangeTiles');
  const cands = [];
  for (let dx = -range; dx <= range; dx++) for (let dy = -range; dy <= range; dy++) {
    const x = r.x + dx; const y = r.y + dy;
    if (!inBounds(b.map, x, y) || impassable(b.map, x, y)) continue;
    if ((dx || dy) && (occupied(b, x, y, r.id) || !reachableStep(b, r, x, y))) continue;
    const c = coverAgainst(b.map, x, y, from);
    if (c === 'none') continue;
    cands.push({ x, y, d: Math.hypot(dx, dy), full: c === 'full' ? 0 : 1, far: -dist({ x, y }, from) });
  }
  if (!cands.length) {
    if (r.stance === 'upright') r.stance = 'crouched';
    emit(b, { type: 'reactionTakeCover', reactor: r.id, crouched: true });
    return;
  }
  cands.sort((a, c) => a.d - c.d || a.full - c.full || a.far - c.far);
  const ties = cands.filter((c) => c.d === cands[0].d && c.full === cands[0].full && c.far === cands[0].far);
  const pick = ties.length > 1 ? b.rng.pick(ties) : ties[0];
  r.x = pick.x; r.y = pick.y;
  emit(b, { type: 'reactionTakeCover', reactor: r.id, x: pick.x, y: pick.y });
}
function reachableStep(b, u, x, y) {
  if (cheb(u, { x, y }) > 1) return !!findPath(b, u, { x, y });
  return stepCheck(b.map, u.x, u.y, x, y).ok;
}

// --- Neutrals (TAC-001) -------------------------------------------------------------------------
function neutralReactions(b, attacker, target, impacts) {
  for (const n of active(b)) {
    const side = sideOf(b, n.faction);
    if (side.group !== 'neutral') continue;
    if (target && n.id === target.id && !side.hostileTo.has(attacker.faction)) {
      side.hostile = true; side.hostileTo.add(attacker.faction);
      emit(b, { type: 'neutralHostile', faction: n.faction, toward: attacker.faction });
      continue;
    }
    if (side.hostile) continue;
    const near = impacts.some((p) => cheb(p, n) <= T('neutralReactRadiusTiles'));
    if (!near) continue;
    if (activeWeapon(n)) { takeCover(b, n, attacker); emit(b, { type: 'neutralReaction', unit: n.id, reaction: 'takeCover' }); }
    else { emit(b, { type: 'neutralReaction', unit: n.id, reaction: 'flee' }); flee(b, n); }
  }
}
function flee(b, n) {
  let best = null;
  for (const e of b.map.exits) for (const [x, y] of e.tiles) {
    const p = findPath(b, n, { x, y });
    if (p && (!best || p.cost < best.p.cost)) best = { p, exit: e };
  }
  if (!best) return;
  let ap = fullAp(n);
  for (const step of best.p.path) {
    const c = stepCost(n, { terrain: b.map.tiles[step.y][step.x], diagonal: step.x !== n.x && step.y !== n.y });
    if (c > ap) return;
    ap -= c; n.x = step.x; n.y = step.y;
  }
  n.status = 'leftMap'; n.exitId = best.exit.id;
}

// --- Noise (TAC-018, TAC-019) -------------------------------------------------------------------
function noise(b, src, srcFaction, shot) {
  for (const u of active(b)) {
    if (u.faction === srcFaction) continue;
    const range = shot ? hearingRange(shot, u) : Infinity;
    if (dist(u, src) > range + 1e-9) continue;
    b.heardThisTurn = true;
    if (inCone(u, src) && clearLine(b.map, u, src)) continue;
    u.alerted = true; u.alertSource = { x: src.x, y: src.y };
    (b.noises[u.faction] ||= []).push({ x: src.x, y: src.y, turn: b.turn });
  }
}

// --- Damage, death, morale (TAC-059..TAC-063, TAC-095) ------------------------------------------
function suppress(b, u) {
  if (!onMap(u)) return;
  u.conditions = u.conditions.filter((c) => c.type !== 'suppressed');
  u.conditions.push({ type: 'suppressed', since: b.turn });
  u.overwatch = false;
}
function dealDamage(b, t, zone, dmg, { blunt = false, ammo = null, bleed = false, wounded = null } = {}) {
  if (!onMap(t) || dmg <= 0) return;
  const r = applyZoneDamage(t, zone, dmg);
  t.zoneHp = r.soldier.zoneHp;
  if (r.died) { kill(b, t); return; }
  if (!bleed) {
    const fx = hitEffects(t, zone, { damage: dmg, blunt, ammo, disables: r.disabled.includes(zone) }, b.rng);
    let s = t;
    if (fx.stunned) s = addCondition(s, { type: 'stunned' });
    if (fx.bleeding) s = addCondition(s, { type: fx.bleeding === 'heavy' ? 'heavyBleeding' : 'lightBleeding', zone });
    if (fx.fracture) s = addCondition(s, { type: 'fracture', zone });
    if (fx.pain) s = addCondition(s, { type: 'pain' });
    t.conditions = s.conditions;
    if (wounded) wounded.add(t.id);
  }
  t.stamina = Math.min(t.stamina, maxStamina(t));
}
function kill(b, t) {
  t.status = 'dead';
  if (t.carrying) { const body = b.units.get(t.carrying.body); if (body) body.carriedBy = null; t.carrying = null; }
  b.bodies.push({ id: t.id, unit: t.id, x: t.x, y: t.y });
  emit(b, { type: 'death', unit: t.id });
  casualtyMorale(b, t, true);
  if (b.activeUnit === t.id) b.pendingEnd = true;
}
function casualtyMorale(b, c, killed) {
  const cg = groupOf(b, c);
  for (const o of active(b)) {
    if (o.id === c.id) continue;
    const og = groupOf(b, o);
    if (og === 'neutral' && !sideOf(b, o.faction).hostile) continue;
    const ally = og === cg;
    if (!ally && !hostile(b, o.faction, c.faction)) continue;
    const sees = inCone(o, c) && clearLine(b.map, o, c);
    o.morale = moraleAfterCasualty(o, { killed, ally, sees, sameSquad: o.faction === c.faction });
  }
}

// --- Shots (TAC-039, TAC-044..TAC-051, TAC-082, TAC-083) ----------------------------------------
const selectedMode = (w) => w.fireMode ?? item(w.item).fireModes[0];
const modeAllowed = (w, mode) => item(w.item).fireModes.some((m) => m === mode);

// Traces one projectile with offset (mx, my) MoA. Pure given the inputs (no RNG).
function trace(b, s, t, tp, mx, my) {
  const d = Math.max(dist(s, tp), 0.5);
  const mpm = (T('moaSpreadPer50m') * d * T('tileSizeM')) / 50;
  const lat = mx * mpm;
  const z = (t ? aimHeight(t) : aimHeight({ stance: 'upright' })) + my * mpm;
  const pts = lineTiles(s.x, s.y, tp.x, tp.y);
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]; const [x, y] = pts[i];
    const last = i === pts.length - 1;
    const c = edgeCover(edgeBetween(b.map, px, py, x, y)?.edge);
    if (c === 'full') return { zone: null, impact: { x: px, y: py }, coverHit: last };
    if (c === 'half' && last && z < T('halfCoverHeightM')) return { zone: null, impact: { x: px, y: py }, coverHit: true };
    if (!last && impassable(b.map, x, y) && terrainAt(b.map, x, y)) return { zone: null, impact: { x, y }, coverHit: false };
  }
  const vx = s.x - tp.x; const vy = s.y - tp.y; const vl = Math.hypot(vx, vy) || 1;
  const v = { x: vx / vl, y: vy / vl };
  if (t) {
    const f = ((t.facing || 0) * Math.PI) / 180;
    const local = { x: v.x * Math.cos(f) + v.y * Math.sin(f), y: v.x * Math.sin(f) - v.y * Math.cos(f) };
    const zone = zoneAlong(t, local, lat, z);
    if (zone) return { zone, impact: { x: tp.x, y: tp.y }, coverHit: false };
  }
  const off = lat / T('tileSizeM');
  return { zone: null, impact: { x: Math.round(tp.x - v.y * off), y: Math.round(tp.y + v.x * off) }, coverHit: false };
}

function fireShot(b, s, target, tile, { mode, aimSteps = 0, snapShot = false }) {
  const w = activeWeapon(s);
  const tp = target ? { x: target.x, y: target.y } : tile;
  const tgt = target || [...b.units.values()].find((u) => onMap(u) && u.x === tile.x && u.y === tile.y && u.id !== s.id) || null;
  const out = { rounds: 0, hits: 0 };
  if (b.rng.roll(jamChance(w.condition ?? 100) * 100)) {
    w.jammed = true; emit(b, { type: 'jam', unit: s.id }); return out;
  }
  const d = dist(s, tp);
  const n = Math.min(roundsForMode(w, mode), w.rounds ?? 0);
  let shift = { x: 0, y: 0 };
  if (tgt && concealedU(b, s, tgt)) {
    const a = b.rng.next() * 2 * Math.PI;
    shift = { x: Math.cos(a) * T('concealmentShiftMoA'), y: Math.sin(a) * T('concealmentShiftMoA') };
  }
  const impacts = []; const wounded = new Set(); let coverHit = false;
  const recoil = recoilPerRound(s, w);
  for (let i = 0; i < n; i++) {
    const spread = totalSpread(s, w, { distance: d, aimSteps, snapShot }) + i * recoil;
    emit(b, { type: 'round', unit: s.id, index: i, aimPoint: { ...shift } });
    w.rounds -= 1; out.rounds++;
    w.condition = Math.max(0, (w.condition ?? 100) - wearPerRound(s));
    for (let p = 0; p < projectiles(w); p++) {
      const o = sampleOffset(spread, b.rng);
      const res = trace(b, s, tgt, tp, o.x + shift.x, o.y + shift.y);
      emit(b, { type: 'projectile', unit: s.id, zone: res.zone, impact: res.impact });
      impacts.push(res.impact);
      if (res.coverHit) coverHit = true;
      if (res.zone && tgt && onMap(tgt)) { hit(b, s, tgt, res.zone, w, d, wounded); out.hits++; }
    }
  }
  for (const u of active(b)) {
    if (!hostile(b, s.faction, u.faction)) continue;
    if ((tgt && u.id === tgt.id && coverHit) || impacts.some((p) => cheb(p, u) <= T('suppressionRadiusTiles'))) suppress(b, u);
  }
  neutralReactions(b, s, tgt, impacts);
  noise(b, s, s.faction, { weapon: w });
  for (const id of wounded) { const u = b.units.get(id); if (onMap(u)) casualtyMorale(b, u, false); }
  if (s.overwatch && (w.rounds ?? 0) < roundsForMode(w, selectedMode(w))) s.overwatch = false;
  return out;
}
function hit(b, s, t, zone, w, d, wounded) {
  const armour = zoneArmour(t, zone);
  const dd = damageAt(w, d);
  const pen = penetrates(w.ammo, armour, b.rng);
  const dmg = Math.floor(pen ? dd : bluntDamage(dd));
  if (armour && (armour.durability ?? 1) > 0) armour.durability = Math.max(0, (armour.durability ?? item(armour.item).durability) - armourWearAmount(armour, dd, pen));
  emit(b, { type: 'hit', unit: s.id, target: t.id, zone, damage: dmg, penetrated: pen });
  suppress(b, t);
  dealDamage(b, t, zone, dmg, { blunt: !pen, ammo: w.ammo, wounded });
}

// --- Grenades and charges (TAC-043, TAC-079, TAC-085, TAC-036) ----------------------------------
function blastCover(b, from, to) {
  const pts = lineTiles(from.x, from.y, to.x, to.y);
  let c = 'none';
  for (let i = 1; i < pts.length; i++) {
    const e = edgeCover(edgeBetween(b.map, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])?.edge);
    if (e === 'full') return 'full';
    if (e === 'half') c = 'half';
  }
  return c;
}
function destroyEdge(b, e) {
  e.cover = 'none'; e.kind = 'rubble'; e.hp = 0; e.open = true; e.locked = false;
  emit(b, { type: 'edgeDestroyed', id: e.id ?? null });
}
function edgeCentre(key) {
  const [x, y, s] = key.split(','); const xi = +x; const yi = +y;
  return s === 'n' ? { x: xi, y: yi - 0.5, a: { x: xi, y: yi }, b: { x: xi, y: yi - 1 } } : { x: xi - 0.5, y: yi, a: { x: xi, y: yi }, b: { x: xi - 1, y: yi } };
}
function blast(b, by, gid, at) {
  const g = item(gid);
  if (g.effect === 'smoke') {
    b.map.smoke.push({ x: at.x, y: at.y, radius: g.radiusTiles, turnsLeft: g.durationTurns });
    return;
  }
  const wounded = new Set();
  for (const u of active(b)) {
    const d = dist(u, at);
    if (d > g.radiusTiles) continue;
    const dmg = blastDamage(gid, d, blastCover(b, at, u));
    if (dmg <= 0) continue;
    suppress(b, u);
    for (const [zone, part] of Object.entries(blastZoneSplit(dmg))) {
      if (!onMap(u) || part <= 0) continue;
      const armour = zoneArmour(u, zone);
      const pen = penetratesClass(g.penetrationClass ?? 0, armour, b.rng);
      dealDamage(b, u, zone, Math.floor(pen ? part : bluntDamage(part)), { blunt: !pen, wounded });
    }
  }
  for (const [key, e] of b.map.edges) {
    if (edgeCover(e) === 'none' && e.kind !== 'door') continue;
    const c = edgeCentre(key);
    const d = Math.hypot(c.x - at.x, c.y - at.y);
    if (d > g.radiusTiles) continue;
    const near = dist(c.a, at) <= dist(c.b, at) ? c.a : c.b;
    if (blastCover(b, at, near) === 'full') continue;
    e.hp = (e.hp ?? materialHp(e.material)) - edgeBlastDamage(blastDamage(gid, d, 'none'));
    if (e.hp <= 0) destroyEdge(b, e);
  }
  for (const id of wounded) { const u = b.units.get(id); if (onMap(u)) casualtyMorale(b, u, false); }
  neutralReactions(b, by, null, [at]);
  if (g.loud) noise(b, at, by.faction, null);
}
function detonate(b, ch) {
  const e = b.map.edges.get(ch.key);
  if (e) destroyEdge(b, e);
  noise(b, edgeCentre(ch.key), b.units.get(ch.by)?.faction ?? null, null);
  const mover = b.units.get(b.activeUnit);
  if (mover) reactionChecks(b, mover, {});
}

// --- Inventory helpers --------------------------------------------------------------------------
function findInst(u, id, slotHint) {
  const slots = slotHint ? [slotHint, ...CARRIER_SLOTS.filter((s) => s !== slotHint)] : CARRIER_SLOTS;
  for (const slot of slots) {
    const list = u.equipment?.[slot]?.contents || [];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) return { slot, inst: list[i], list, index: i };
  }
  return null;
}
function findByEffect(u, type) {
  for (const slot of CARRIER_SLOTS) for (const x of u.equipment?.[slot]?.contents || []) if (item(x.item)?.opEffect?.type === type) return x;
  return null;
}
const takeOut = (f) => f.list.splice(f.index, 1)[0];
function cmdEdge(u, e) {
  if (!e?.tile) return null;
  const k = edgeKey(e.tile.x, e.tile.y, e.side);
  for (const s of Object.keys(SIDES)) if (edgeKey(u.x, u.y, s) === k) return k;
  return null;
}
const defaultMagazine = (wid) => {
  const fits = items().filter((x) => x.kind === 'magazine' && (x.fits || []).includes(wid));
  return (fits.find((x) => x.capacity === item(wid).magazineSize) || fits[0])?.id ?? null;
};

// --- Handlers -----------------------------------------------------------------------------------
const HANDLERS = {
  endActivation(b, u, c) { endActivation(b, u, c); return yes; },

  move(b, u, c) {
    const path = c.path || [];
    if (!path.length) return no('empty path');
    if (c.sprint && !canSprint(u)) return no('cannot sprint');
    const pc = pathCosts(b, u, path, !!c.sprint);
    if (pc.error) return no(pc.error);
    if (pc.total > u.ap) return no('not enough AP');
    for (let i = 0; i < path.length; i++) {
      if (!onMap(u)) break;
      const st = pc.steps[i];
      if (occupied(b, path[i].x, path[i].y, u.id)) break;
      u.ap -= st.cost;
      if (st.door) st.door.open = true;
      u.facing = snapFacing(bearing(u, path[i]));
      u.x = path[i].x; u.y = path[i].y;
      if (c.sprint) u.sprinted = true;
      if (u.carrying) { const body = b.units.get(u.carrying.body); if (body) { body.x = u.x; body.y = u.y; } }
      emit(b, { type: 'step', unit: u.id, x: u.x, y: u.y });
      reactionChecks(b, u, { sprinting: !!c.sprint });
    }
    return yes;
  },

  turn(b, u, c) {
    if (!spend(u, turnCost(u.facing, c.facing))) return no('not enough AP');
    u.facing = c.facing; reactionChecks(b, u, { inPlace: true }); return yes;
  },

  changeStance(b, u, c) {
    if (!c.stance || c.stance === u.stance) return no('same stance');
    if (c.stance === 'prone' && u.carrying) return no('cannot go prone with a body');
    if (!spend(u, stanceCost(u.stance, c.stance))) return no('not enough AP');
    u.stance = c.stance; reactionChecks(b, u, { inPlace: true }); return yes;
  },

  vault(b, u, c) {
    const t = c.tile;
    if (!t || cheb(u, t) !== 1 || (t.x !== u.x && t.y !== u.y)) return no('vault to an orthogonal neighbour');
    if (!canVault(u)) return no('cannot vault now');
    const e = edgeBetween(b.map, u.x, u.y, t.x, t.y)?.edge;
    if (edgeCover(e) !== 'half' || e.kind === 'door') return no('no half-cover edge to vault');
    if (impassable(b.map, t.x, t.y) || occupied(b, t.x, t.y, u.id)) return no('blocked');
    if (!spend(u, vaultCost(u))) return no('not enough AP');
    u.facing = snapFacing(bearing(u, t)); u.x = t.x; u.y = t.y;
    reactionChecks(b, u, {}); return yes;
  },

  climb(b, u) {
    const l = b.map.ladders.find((x) => x.x === u.x && x.y === u.y);
    if (!l) return no('no ladder');
    if (!canClimb(u)) return no('cannot climb now');
    if (!spend(u, climbCost(u, 1))) return no('not enough AP');
    u.level = u.level === l.toLevel ? 0 : l.toLevel; return yes;
  },

  shoot(b, u, c) {
    const w = activeWeapon(u);
    if (!w || item(w.item)?.kind !== 'weapon') return no('no weapon');
    if (w.jammed) return no('weapon jammed');
    const mode = c.fireMode ?? selectedMode(w);
    if (!modeAllowed(w, mode)) return no('fire mode not on this weapon');
    if (!(w.rounds > 0)) return no('magazine empty');
    const aim = c.aimSteps || 0;
    if (aim > T('maxAimSteps')) return no('too many aim steps');
    const target = c.target ? b.units.get(c.target) : null;
    if (c.target && (!target || !onMap(target))) return no('no such target');
    if (!target && !c.tile) return no('no target');
    if (!spend(u, fireApCost(u, w, mode) + aimCost(u, aim))) return no('not enough AP');
    fireShot(b, u, target, c.tile, { mode, aimSteps: aim });
    reactionChecks(b, u, { inPlace: true });
    return yes;
  },

  reload(b, u, c) {
    const w = activeWeapon(u);
    if (!w) return no('no weapon');
    const it = item(w.item);
    if (it.feedType === 'tube') {
      const n = c.shells || 1;
      if ((w.rounds ?? 0) + n > it.magazineSize) return no('tube full');
      let src = null;
      for (const slot of CARRIER_SLOTS) for (const x of u.equipment?.[slot]?.contents || []) if (!src && item(x.item)?.kind === 'ammo' && item(x.item).calibre === it.calibre && (x.count ?? 0) >= n) src = { slot, x };
      if (!src) return no('no shells');
      if (!spend(u, reloadCost(u, w, { shells: n, fromBackpack: src.slot === 'backpack' }))) return no('not enough AP');
      src.x.count -= n; w.rounds = (w.rounds ?? 0) + n; w.ammo = src.x.item;
      reactionChecks(b, u, { inPlace: true }); return yes;
    }
    const f = findInst(u, c.magazine, c.sourceSlot);
    if (!f || item(f.inst.item)?.kind !== 'magazine') return no('no such magazine');
    if (!(item(f.inst.item).fits || []).includes(w.item)) return no('magazine does not fit');
    if (!spend(u, reloadCost(u, w, { fromBackpack: f.slot === 'backpack' }))) return no('not enough AP');
    const mag = takeOut(f);
    if (w.rounds !== undefined && w.rounds !== null) {
      f.list.push({ id: w.magazineId || `mag${++b.uid}`, item: w.magazine || defaultMagazine(w.item), rounds: w.rounds, ammo: w.ammo });
    }
    w.rounds = mag.rounds; w.ammo = mag.ammo; w.magazine = mag.item; w.magazineId = mag.id;
    reactionChecks(b, u, { inPlace: true }); return yes;
  },

  swapWeapon(b, u, c) {
    const to = c.slot;
    if (!to || to === u.activeSlot || !u.equipment?.[to]) return no('nothing to swap to');
    if (!spend(u, swapCost(u, u.activeSlot, to))) return no('not enough AP');
    u.activeSlot = to; reactionChecks(b, u, { inPlace: true }); return yes;
  },

  throwGrenade(b, u, c) {
    const f = findInst(u, c.item, c.sourceSlot);
    if (!f || item(f.inst.item)?.kind !== 'grenade') return no('no such grenade');
    const t = c.tile;
    if (!t || !inBounds(b.map, t.x, t.y)) return no('no target tile');
    const d = dist(u, t);
    if (d > throwRange(u) + 1e-9) return no('out of throwing range');
    if (!spend(u, throwCost(u, { fromBackpack: f.slot === 'backpack' }))) return no('not enough AP');
    const g = takeOut(f);
    const r = scatterRadius(u, d); const a = b.rng.next() * 2 * Math.PI; const rr = b.rng.next() * r;
    const at = { x: clamp(Math.round(t.x + rr * Math.sin(a)), 0, b.map.width - 1), y: clamp(Math.round(t.y - rr * Math.cos(a)), 0, b.map.height - 1) };
    emit(b, { type: 'grenade', unit: u.id, item: g.item, x: at.x, y: at.y });
    blast(b, u, g.item, at);
    reactionChecks(b, u, { inPlace: true });
    const mover = b.units.get(b.activeUnit); if (mover && mover !== u) reactionChecks(b, mover, {});
    return yes;
  },

  setReaction(b, u, c) {
    if (!['fire', 'takeCover', 'hold'].includes(c.reaction)) return no('unknown reaction');
    if (!spend(u, T('setReactionCost'))) return no('not enough AP');
    u.reaction = c.reaction; return yes;
  },

  holdOverwatch(b, u) {
    const w = activeWeapon(u);
    if (!w || (w.rounds ?? 0) < roundsForMode(w, selectedMode(w))) return no('not enough rounds for the fire mode');
    if (!spend(u, T('overwatchCost'))) return no('not enough AP');
    u.overwatch = true; return yes;
  },

  useItem(b, u, c) {
    const f = findInst(u, c.item, c.sourceSlot);
    if (!f) return no('no such item');
    const it = item(f.inst.item);
    if (it?.kind !== 'medical') return no('not usable');
    const t = c.unit ? b.units.get(c.unit) : u;
    if (!t || !onMap(t)) return no('no such soldier');
    if (t.id !== u.id && (cheb(u, t) > 1 || (t.level || 0) !== (u.level || 0))) return no('target not adjacent');
    if (!canUseMedical(u, it.id)) return no('needs more Medical');
    const cost = medicalCost(u, it.id, { self: t.id === u.id, fromBackpack: f.slot === 'backpack' });
    if (cost > u.ap) return no('not enough AP');
    let after;
    try { after = applyMedical(t, it.id, c.zone); } catch (e) { return no(e.message); }
    u.ap -= cost;
    t.conditions = after.conditions; t.zoneHp = after.zoneHp || t.zoneHp;
    if (it.treats.includes('hp') && c.zone) {
      const pool = f.inst.hpPool ?? it.hpPool;
      const got = hpRestored(u, it.id, { poolLeft: pool, missing: maxHp(t, c.zone) - hp(t, c.zone) });
      t.zoneHp = { ...fullZoneHp(t), [c.zone]: hp(t, c.zone) + got };
      f.inst.hpPool = pool - got;
      if (f.inst.hpPool <= 0) takeOut(f);
    }
    if (it.uses !== null && it.uses !== undefined) {
      f.inst.uses = (f.inst.uses ?? it.uses) - 1;
      if (f.inst.uses <= 0) { const i = f.list.indexOf(f.inst); if (i >= 0) f.list.splice(i, 1); }
    }
    if (hasCond(t, 'pain') && !painFrom(t, {})) t.conditions = t.conditions.filter((x) => x.type !== 'pain');
    reactionChecks(b, u, { inPlace: true }); return yes;
  },

  dropBackpack(b, u) {
    const bp = u.equipment?.backpack;
    if (!bp) return no('no backpack');
    if (!spend(u, T('dropBackpackCost'))) return no('not enough AP');
    b.dropped.push({ id: bp.id || `bp${++b.uid}`, x: u.x, y: u.y, inst: bp });
    delete u.equipment.backpack; return yes;
  },

  pickUpBackpack(b, u, c) {
    if (u.equipment?.backpack) return no('backpack slot full');
    const i = b.dropped.findIndex((d) => d.id === c.target && d.x === u.x && d.y === u.y);
    if (i < 0) return no('no backpack here');
    if (!spend(u, T('pickUpBackpackCost'))) return no('not enough AP');
    u.equipment.backpack = b.dropped.splice(i, 1)[0].inst; return yes;
  },

  search(b, u, c) {
    const box = lootable(b, c.target);
    if (!box || cheb(u, box) > 1) return no('nothing to search here');
    const k = `${u.faction}:${c.target}`;
    if (!b.opened.has(k)) { if (!spend(u, T('openContainerCost'))) return no('not enough AP'); b.opened.add(k); }
    reactionChecks(b, u, { inPlace: true }); return yes;
  },

  pickUp(b, u, c) {
    const box = lootable(b, c.target);
    if (!box || cheb(u, box) > 1) return no('nothing to loot here');
    const k = `${u.faction}:${c.target}`;
    const cost = T('lootCost') + (b.opened.has(k) ? 0 : T('openContainerCost'));
    const i = box.contents.findIndex((x) => x.id === c.item);
    if (i < 0) return no('no such item');
    const dest = CARRIER_SLOTS.find((s) => u.equipment?.[s]);
    if (!dest) return no('nowhere to put it');
    if (!spend(u, cost)) return no('not enough AP');
    b.opened.add(k);
    const [x] = box.contents.splice(i, 1);
    if (box.fromBody) box.fromBody(x);
    (u.equipment[dest].contents ||= []).push({ ...x, looted: true });
    reactionChecks(b, u, { inPlace: true }); return yes;
  },

  cutLock(b, u, c) {
    const k = cmdEdge(u, c.edge);
    const e = k && b.map.edges.get(k);
    if (!e || !e.locked) return no('no locked door here');
    const cutters = findByEffect(u, 'cutLock');
    if (!cutters) return no('needs bolt cutters');
    if (!spend(u, cutLockCost(u, cutters.item))) return no('not enough AP');
    e.locked = false; return yes;
  },

  closeDoor(b, u, c) {
    const k = cmdEdge(u, c.edge);
    const e = k && b.map.edges.get(k);
    if (!e || e.kind !== 'door' || !e.open) return no('no open door here');
    if (!spend(u, T('closeDoorCost'))) return no('not enough AP');
    e.open = false; return yes;
  },

  clearJam(b, u) {
    const w = activeWeapon(u);
    if (!w?.jammed) return no('not jammed');
    if (!spend(u, clearJamCost(u))) return no('not enough AP');
    w.jammed = false; return yes;
  },

  placeCharge(b, u, c) {
    const f = findInst(u, c.item, c.sourceSlot);
    if (!f || item(f.inst.item)?.opEffect?.type !== 'demolition') return no('no demolition charge');
    const k = cmdEdge(u, c.edge);
    if (!k || !b.map.edges.get(k)) return no('target not adjacent');
    if (!spend(u, placeChargeCost(u))) return no('not enough AP');
    takeOut(f); b.charges.push({ by: u.id, key: k });
    reactionChecks(b, u, { inPlace: true }); return yes;
  },

  restrainVip(b, u, c) {
    const v = b.units.get(c.unit);
    if (!v || !onMap(v) || cheb(u, v) > 1) return no('VIP not adjacent');
    if (!b.objectives.some((o) => o.type === 'captureVip' && o.targets.includes(v.id))) return no('not a capture mission');
    if (!v.surrendered && !isWounded(v)) return no('VIP has not surrendered and is not wounded');
    if (!spend(u, T('restrainCost'))) return no('not enough AP');
    v.restrained = true; return yes;
  },

  liftBody(b, u, c) {
    if (u.carrying) return no('already carrying');
    const t = b.units.get(c.target);
    if (!t || t.id === u.id || cheb(u, t) > 1 || t.carriedBy) return no('no body here');
    const ok = t.status === 'dead' || hostile(b, u.faction, t.faction) || t.restrained || (t.faction === u.faction && isWounded(t));
    if (!ok) return no('cannot be lifted');
    const mode = c.mode === 'carry' ? 'carry' : 'drag';
    if (u.stance === 'prone' || (mode === 'carry' && u.stance !== 'upright')) return no('wrong stance');
    const w = equipmentWeight(t.equipment);
    if (mode === 'carry' && carriedWeight(u) + w > carryCapacity(u)) return no('too heavy to carry');
    if (!spend(u, T('liftCost'))) return no('not enough AP');
    u.carrying = { body: t.id, mode, weightKg: w }; t.carriedBy = u.id; t.x = u.x; t.y = u.y;
    return yes;
  },

  putDownBody(b, u) {
    if (!u.carrying) return no('not carrying');
    if (!spend(u, T('putDownCost'))) return no('not enough AP');
    const t = b.units.get(u.carrying.body); if (t) { t.carriedBy = null; t.x = u.x; t.y = u.y; }
    u.carrying = null; return yes;
  },

  leaveMap(b, u, c) {
    const e = b.map.exits.find((x) => x.id === c.exit);
    if (!e || !e.tiles.some(([x, y]) => x === u.x && y === u.y)) return no('not on that exit');
    if (!exitOpen(b, u, e)) return no('exit condition not met');
    if (!spend(u, T('exitCost'))) return no('not enough AP');
    u.status = 'leftMap'; u.exitId = e.id;
    if (u.carrying) { const t = b.units.get(u.carrying.body); if (t) { t.status = t.status === 'dead' ? 'dead' : 'leftMap'; t.exitId = e.id; t.carriedOff = true; } }
    emit(b, { type: 'leftMap', unit: u.id, exit: e.id });
    return yes;
  },
};

function exitOpen(b, u, e) {
  const side = sideOf(b, u.faction);
  switch (e.condition || 'none') {
    case 'fuel': return !!side.vehicle && (side.vehicle.fuel ?? 0) > 0;
    case 'boatAtTurn': return b.turn >= (e.params?.turn ?? 0);
    default: return true;
  }
}

function lootable(b, id) {
  const c = b.map.containers.find((x) => x.id === id);
  if (c) return c;
  const d = b.units.get(id);
  if (d && d.status === 'dead') {
    const contents = [];
    for (const slot of SLOTS) {
      const inst = d.equipment?.[slot];
      if (!inst) continue;
      contents.push({ ...inst, id: inst.id || `${d.id}:${slot}`, _slot: slot });
      for (const x of inst.contents || []) contents.push({ ...x, _from: slot });
    }
    return { x: d.x, y: d.y, contents, fromBody: (x) => {
      if (x._slot) delete d.equipment[x._slot];
      else if (x._from) d.equipment[x._from].contents = d.equipment[x._from].contents.filter((y) => y.id !== x.id);
      delete x._slot; delete x._from;
    } };
  }
  return null;
}

// ================================================================================================
// Shot preview (TAC-046): own RNG stream, never touches the battle RNG.
// ================================================================================================
export function previewShot(b, sId, tId, { fireMode, aimSteps = 0 } = {}) {
  const s = b.units.get(sId); const t = b.units.get(tId);
  const w = activeWeapon(s);
  const prng = new Rng(hashSeed(b.req.seed, 'preview', b.turn, sId, tId, b.previewCount++));
  const n = T('previewSamples');
  const d = dist(s, t);
  const spread = totalSpread(s, w, { distance: d, aimSteps });
  const zones = {}; let hits = 0;
  for (let i = 0; i < n; i++) {
    const o = sampleOffset(spread, prng);
    const r = trace(b, s, t, { x: t.x, y: t.y }, o.x, o.y);
    if (r.zone) { hits++; zones[r.zone] = (zones[r.zone] || 0) + 1; }
  }
  for (const z of Object.keys(zones)) zones[z] /= hits;
  const likelyZone = Object.entries(zones).sort((a, c) => c[1] - a[1])[0]?.[0] ?? 'thorax';
  if (!hits) zones[likelyZone] = 1;
  const armour = zoneArmour(t, likelyZone);
  const pen = !armour || (armour.durability ?? 1) <= 0 || item(w.ammo).penetrationClass >= item(armour.item).armourClass;
  return { hitPct: (hits / n) * 100, zones, likelyZone, penetrates: pen, concealed: concealedU(b, s, t), fireMode: fireMode ?? selectedMode(w) };
}

// ================================================================================================
// Views and result
// ================================================================================================
export function perceptionView(b, faction) {
  const squad = active(b).filter((u) => u.faction === faction);
  const enemies = active(b).filter((u) => hostile(b, faction, u.faction) && squad.some((s) => spottedU(b, s, u)));
  return {
    faction, turn: b.turn,
    squad: squad.map((u) => unit(b, u.id)),
    enemies: enemies.map((u) => ({ id: u.id, x: u.x, y: u.y, stance: u.stance, facing: u.facing, level: u.level })),
    noises: [...(b.noises[faction] || [])],
    bodies: b.bodies.map((x) => ({ ...x })),
    containers: b.map.containers.map((c) => ({ id: c.id, x: c.x, y: c.y, contents: b.opened.has(`${faction}:${c.id}`) ? clone(c.contents) : null })),
    smoke: b.map.smoke.map((s) => ({ ...s })),
    squadMorale: squad.length ? squad.reduce((a, u) => a + u.morale, 0) / squad.length : 0,
  };
}

export function battleResult(b) {
  const players = [...b.units.values()].filter((u) => groupOf(b, u) === 'player');
  const alive = players.filter((u) => u.status !== 'dead');
  const loot = [];
  for (const u of players.filter((x) => x.status === 'leftMap')) {
    for (const slot of CARRIER_SLOTS) for (const x of u.equipment?.[slot]?.contents || []) {
      if (x.looted) loot.push({ item: x.item, count: x.count ?? 1, condition: x.condition, carrier: u.id });
    }
  }
  const oppAlive = [...b.units.values()].some((u) => groupOf(b, u) === 'opponent' && onMap(u));
  return {
    encounterId: b.req.encounterId,
    outcome: { winnerFaction: !oppAlive && alive.length ? b.sides.find((s) => s.group === 'player')?.faction : !alive.length ? b.sides.find((s) => s.group === 'opponent')?.faction : null },
    gameTimeHours: T('battleDurationHours'),
    turns: b.turn,
    objectives: objectives(b),
    soldiers: players.map((u) => ({ id: u.id, status: u.status, exitId: u.exitId ?? null, zoneHp: { ...u.zoneHp }, conditions: clone(u.conditions),
      stamina: u.stamina, equipment: clone(u.equipment), morale: u.morale })),
    squadMorale: alive.length ? alive.reduce((a, u) => a + u.morale, 0) / alive.length : 0,
    loot,
  };
}
