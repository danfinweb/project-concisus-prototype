// What one call knows: the view plus /data lookups, the grid (STR-005), relations (STR-051) and
// hostility toward the player (SAI-013). Built fresh for every call, never stored (SAI-001, SAI-007).
import * as registry from '../../../shared/registry.js';

const get = (table, id) => {
  try { return id === undefined || id === null ? undefined : registry.get(table, id); } catch { return undefined; }
};
const all = (table) => { try { return registry.all(table); } catch { return []; } };
export const data = { get, all };

// STR-005 adjacency by the view's mapShape: square = 4 edge neighbours; hex = 6 neighbours, with x, y read
// as axial coordinates (the spec does not fix the hex convention; SCOPE open question 5).
const NEIGHBOURS = {
  square: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  hex: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]],
};
const DISTANCE = {
  square: (dx, dy) => Math.abs(dx) + Math.abs(dy),
  hex: (dx, dy) => (Math.abs(dx) + Math.abs(dy) + Math.abs(dx + dy)) / 2,
};

export function buildContext(view) {
  const self = view.faction;
  const shape = NEIGHBOURS[view.mapShape] ? view.mapShape : 'square';
  const regionList = view.knownRegions ?? [];
  const regions = new Map(regionList.map((r) => [r.id, r]));
  const byXY = new Map();
  for (const r of regionList) if (Number.isInteger(r.x) && Number.isInteger(r.y)) byXY.set(`${r.x},${r.y}`, r);
  const ownSquads = view.ownSquads ?? [];
  const knownSquads = view.knownSquads ?? [];
  const hostileAt = get('strategic-rules', 'hostileAt');
  const faction = get('factions', self);

  const rel = (f) => view.relations?.[f];
  const factionHostile = (f) => !!f && f !== self && f !== 'player' && typeof rel(f) === 'number'
    && typeof hostileAt === 'number' && rel(f) <= hostileAt;

  // SAI-013: player targets are the player itself, its known squads and the tiles it controls.
  const playerIds = new Set(['player']);
  for (const s of knownSquads) if (s.faction === 'player' && s.id) playerIds.add(s.id);
  for (const r of regionList) if (r.controller === 'player') playerIds.add(r.id);
  const playerHostile = isHostileToPlayer(view, playerIds);
  const isEnemy = (f) => (f === 'player' ? playerHostile : factionHostile(f));

  const terrain = (id) => get('strategic-terrain', regions.get(id)?.terrain);
  const passable = (id) => regions.has(id) && terrain(id)?.passable !== false;
  // Tiles the AI does not path through: impassable ones, and player ground while not hostile (SAI-013).
  const avoid = (id) => !passable(id) || (!playerHostile && regions.get(id)?.controller === 'player');

  function neighbours(id) {
    const r = regions.get(id);
    if (!r || !Number.isInteger(r.x)) return [];
    const out = [];
    for (const [dx, dy] of NEIGHBOURS[shape]) {
      const n = byXY.get(`${r.x + dx},${r.y + dy}`);
      if (n) out.push(n.id);
    }
    return out;
  }
  const manhattan = (a, b) => {
    const ra = regions.get(a), rb = regions.get(b);
    if (a === b) return 0;
    if (!ra || !rb || !Number.isInteger(ra.x) || !Number.isInteger(rb.x)) return Infinity;
    return DISTANCE[shape](ra.x - rb.x, ra.y - rb.y);
  };

  // Breadth-first search from one or more tiles over passable known tiles. Cached per source set.
  const bfsCache = new Map();
  function bfs(sources) {
    const key = [...sources].sort().join('|');
    if (bfsCache.has(key)) return bfsCache.get(key);
    const steps = new Map(), prev = new Map();
    const queue = [];
    for (const s of sources) if (regions.has(s) && !steps.has(s)) { steps.set(s, 0); queue.push(s); }
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      for (const n of neighbours(cur)) {
        if (steps.has(n) || avoid(n)) continue;
        steps.set(n, steps.get(cur) + 1);
        prev.set(n, cur);
        queue.push(n);
      }
    }
    const res = { steps, prev };
    bfsCache.set(key, res);
    return res;
  }
  const stepsBetween = (a, b) => bfs([a]).steps.get(b) ?? Infinity;
  function path(a, b) {
    const { steps, prev } = bfs([a]);
    if (!steps.has(b)) return null;
    const out = [b];
    while (out[0] !== a) out.unshift(prev.get(out[0]));
    return out;
  }
  // Travel hours along a path (STR-006): a step along a road (roadTo of the tile left) costs
  // roadMoveHours.vehicle, any other step the entered tile's terrain moveHours.
  const roadHours = get('strategic-rules', 'roadMoveHours')?.vehicle;
  const pathHours = (p) => (p ?? []).slice(1).reduce((h, id, i) => {
    const onRoad = typeof roadHours === 'number' && (regions.get(p[i])?.roadTo ?? []).includes(id);
    return h + (onRoad ? roadHours : terrain(id)?.moveHours ?? 0);
  }, 0);

  // Where a target sits: a region ID, a known squad's region, or an own squad's region.
  function regionOf(target) {
    if (regions.has(target)) return target;
    const k = knownSquads.find((s) => s.id === target) ?? ownSquads.find((s) => s.id === target);
    return k?.region;
  }

  return {
    view, self, faction, regions, regionList, ownSquads, knownSquads, rel, isEnemy, factionHostile,
    playerHostile, playerIds, terrain, passable, neighbours, manhattan, bfs, stepsBetween, path, pathHours,
    regionOf, capitalTile: view.capital?.tile,
  };
}

// SAI-013: hostile toward the player while (1) standing is hostile, (2) it has a mission targeting the
// player, or (3) standing is unfriendly or worse and it and the player pursue the same objective: a player
// squad's knownGoal and knownTarget equal one own squad's goal and target.
export function isHostileToPlayer(view, playerIds) {
  const standing = view.reputationWithPlayer?.standing;
  if (standing === 'hostile') return true;
  const missionOnPlayer = (view.contracts ?? []).some((c) => c.role === 'employer'
    && (c.status === 'open' || c.status === 'accepted')
    && (c.missions ?? []).some((m) => m.status === 'open' && (m.targets ?? []).some((t) => playerIds.has(t))));
  if (missionOnPlayer) return true;
  if (standing === 'unfriendly') {
    return (view.knownSquads ?? []).some((k) => k.faction === 'player' && k.knownGoal
      && (view.ownSquads ?? []).some((s) => s.goal === k.knownGoal && (s.target ?? null) === (k.knownTarget ?? null)));
  }
  return false;
}

// SAI-010: the view's doctrine, else the faction record's (data/factions.json is the only link).
export function resolveDoctrine(view) {
  const id = view.doctrine ?? get('factions', view.faction)?.doctrine;
  const d = get('ai/doctrines', id);
  if (!d || d.layer !== 'strategic') throw new Error(`strategic-ai: no strategic doctrine "${id}" for faction ${view.faction}`);
  return d;
}
