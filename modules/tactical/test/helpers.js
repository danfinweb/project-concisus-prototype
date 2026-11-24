// Shared builders for the tactical scenarios. The core API they target is test/CORE-API.md.
import { Rng } from '../../../shared/rng.js';

export const FIXTURES = ['tactical-rules', 'items', 'terrain', 'management-rules', 'prefabs',
  'strategic-terrain', 'mapgen/tactical', 'presets'];

// Loads the fixtures, then the core. The core is imported lazily so that each scenario fails on its own
// (with "core not built") instead of the whole file failing to load.
export async function setup(ctx) {
  await ctx.loadFixtures(FIXTURES);
  try {
    return await import('../core/index.js');
  } catch (e) {
    throw new Error(`core/index.js not importable yet: ${e.message}`);
  }
}

export const ATTR = { strength: 50, endurance: 50, agility: 50, perception: 50,
  marksmanship: 50, recon: 50, medical: 50, technical: 50 };

// A soldier as the request's unit plus runtime fields (stance, facing, x, y).
export function soldier(o = {}) {
  return {
    id: 's1', rank: 'regular', morale: 60, nerve: 0, perks: [], conditions: [], equipment: {},
    stance: 'upright', facing: 0, x: 0, y: 0, level: 0,
    ...o,
    attributes: { ...ATTR, ...(o.attributes || {}) },
  };
}

export const rifle = (o = {}) => ({ item: 'ak74m', condition: 100, rounds: 30, ammo: 'a545fmj', mods: [], ...o });
export const zoneHpAt = (o) => ({ ...o }); // partial zoneHp, other zones full

// Rng stub with a fixed draw: v = 0 makes every roll succeed, v ≈ 1 makes every roll fail.
export function fixedRng(v = 0) {
  const r = {
    next: () => v,
    int: (a, b) => a + Math.floor(v * (b - a + 1)),
    roll: (pct) => v * 100 < pct,
    pick: (arr) => arr[Math.min(arr.length - 1, Math.floor(v * arr.length))],
    shuffle: (arr) => arr,
    weightedPick: (w) => (Array.isArray(w) ? w : Object.entries(w))[0][0],
    normal: (mean = 0) => mean,
    fork: () => r,
  };
  return r;
}
export const ALWAYS = () => fixedRng(0);
export const NEVER = () => fixedRng(0.999999);
export const seeded = (s) => new Rng(s);

// An open test map: rows of '.', legend chars → terrain IDs of the fixture.
export function testMap(rows, extra = {}) {
  if (typeof rows === 'number') rows = Array.from({ length: rows }, () => '.'.repeat(rows));
  return {
    width: rows[0].length, height: rows.length, rows,
    legend: { '.': 'grass', '#': 'rock', 'b': 'brush', 't': 'trees', 'm': 'mud', 'r': 'road',
      '~': 'deepWater', 'w': 'shallowWater', 'f': 'floor', 's': 'stairs', 'u': 'rubble', ...(extra.legend || {}) },
    edges: extra.edges || [],
    ladders: extra.ladders || [],
    exits: extra.exits || [{ id: 'x1', tiles: [[0, rows.length - 1]], condition: 'none' }],
  };
}

export function side(faction, controller, units, o = {}) {
  return { faction, controller, role: o.role || (controller === 'player' ? 'attacker' : 'defender'),
    morale: o.morale ?? 60, vehicle: o.vehicle ?? null, units, ...o };
}

export function request(o = {}) {
  const sides = o.sides || [
    side('pmc', 'player', [soldier({ id: 'p1' })]),
    side('red', 'ai', [soldier({ id: 'e1' })]),
  ];
  const hostility = o.hostility || { pmc: { red: true }, red: { pmc: true } };
  return {
    encounterId: 'test', seed: o.seed ?? 1, rulesVersion: 'test', time: { day: 1, hour: o.hour ?? 12 },
    region: o.region || { id: 'r1', terrain: 'steppe', biome: 'steppe', roads: [], neighbours: {} },
    sides, hostility, objectives: o.objectives || [], exits: o.exits || [],
    battleGoal: o.battleGoal || {}, vipControl: o.vipControl || 'ai', vip: o.vip ?? null,
  };
}

// Strip runtime-only fields from builder soldiers before they go into a request.
export function asUnit(s) {
  const { stance, facing, x, y, level, ...u } = s;
  return u;
}

// Builds a battle: units given as soldier() objects carry their placement (x, y, facing, stance).
export function battle(core, o = {}) {
  const player = (o.player || [soldier({ id: 'p1', x: 2, y: 2 })]);
  const enemy = (o.enemy || [soldier({ id: 'e1', x: 2, y: 12, facing: 0 })]);
  const neutral = o.neutral || [];
  const sides = [
    side('pmc', 'player', player.map(asUnit), o.playerSide || {}),
    side('red', 'ai', enemy.map(asUnit), o.enemySide || {}),
  ];
  if (neutral.length) sides.push(side('civ', 'ai', neutral.map(asUnit), { role: 'neutral', ...(o.neutralSide || {}) }));
  const hostility = o.hostility || { pmc: { red: true, civ: false }, red: { pmc: true, civ: false }, civ: { pmc: false, red: false } };
  const placements = {};
  for (const s of [...player, ...enemy, ...neutral]) {
    placements[s.id] = { x: s.x, y: s.y, level: s.level || 0, facing: s.facing ?? 0, stance: s.stance || 'upright' };
  }
  const req = request({ ...o, sides, hostility });
  return core.createBattle(req, { map: o.map || testMap(20), placements, rng: o.rng || seeded(o.seed ?? 7) });
}

// Activates a unit and returns the act() result.
export const activate = (core, b, faction, unitId) => core.act(b, faction, { type: 'activate', unit: unitId });
export const pass = (core, b, faction) => core.act(b, faction, { type: 'pass' });
export const endAct = (core, b, faction) => core.act(b, faction, { type: 'endActivation' });

// Ends the current turn: both sides pass in order (player, then opponent).
export function passTurn(core, b) {
  pass(core, b, 'pmc');
  pass(core, b, 'red');
}

export const near = (assert, a, b, eps = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= eps, `${msg} expected ≈ ${b}, got ${a}`);
