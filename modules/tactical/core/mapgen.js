// Tactical map generation from the tactical map request alone: TAC-080, TAC-086..TAC-093.
// Every share, size and threshold is read from data/mapgen/tactical.json; one stream per stage.
import { Rng, hashSeed } from '../../../shared/rng.js';
import { G, T, terrain, terrains, strategicTerrain, strategicTerrains } from './data.js';

export const STAGES = ['zones', 'water', 'roads', 'structures', 'parcels', 'groundFill', 'details', 'exits', 'checks'];
const EDGES = ['n', 'e', 's', 'w'];
const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };

// TAC-093: one independent stream per stage, derived from the map seed.
export function stageStreams(seed) {
  const out = {};
  for (const s of STAGES) out[s] = new Rng(hashSeed(seed, 'tactical-mapgen', s));
  return out;
}

// TAC-086: plant, then crossing, then settlement, then the tile's terrain. Terrain → type is the
// spec's mapping (steppe and farmland → open); unknown terrains fall back to open.
const TERRAIN_TYPES = { steppe: 'open', farmland: 'open', woods: 'woods', marsh: 'marsh', hills: 'hills', mountain: 'mountain', shore: 'shore' };
export function mapType(region) {
  if (region.poi?.type === 'plant') return 'plant';
  if (region.crossing) return 'crossing';
  if (region.settlement === 'town') return 'town';
  if (region.settlement) return 'city';
  return TERRAIN_TYPES[region.terrain] || 'open';
}
function mapSize(region, type) {
  const t = G('mapTypes')[type];
  return type === 'city' && region.settlement === 'smallCity' && t.smallCitySize ? t.smallCitySize : t.size;
}
function terrainTable(region) {
  const st = strategicTerrain(region.terrain) || strategicTerrains().find((x) => x.biome === region.biome);
  return st?.tacticalTerrainTable || region.biome;
}
const allowedSet = (table) => new Set(terrains().filter((t) => (t.tables || []).includes(table)).map((t) => t.id));

// ------------------------------------------------------------------------------------------------
export function generateMap(req) {
  const attempts = G('validate')?.attempts ?? 1;
  let last = null;
  for (let a = 0; a < attempts; a++) {
    const m = generateOnce(req, (req.seed + a) >>> 0);
    m.attempts = a + 1;
    last = m;
    if (m.checks.required.ok) break;
  }
  return last;
}

function generateOnce(req, seed) {
  const region = req.region || {};
  const type = mapType(region);
  const size = mapSize(region, type);
  const table = terrainTable(region);
  const allowed = allowedSet(table);
  const gf = G('groundFill') || {};
  const base = gf.baseByTable?.[table] && allowed.has(gf.baseByTable[table]) ? gf.baseByTable[table]
    : (gf.classes || []).find((c) => allowed.has(c)) || [...allowed][0];
  const rs = stageStreams(seed);
  const tiles = Array.from({ length: size }, () => Array(size).fill(base));
  const fixed = Array.from({ length: size }, () => Array(size).fill(false)); // not to be filled later
  const edges = new Map();
  const ek = (x, y, s) => (s === 'e' ? `${x + 1},${y},w` : s === 's' ? `${x},${y + 1},n` : `${x},${y},${s}`);
  const setEdge = (x, y, side, e) => edges.set(ek(x, y, side), { x, y, side, ...e });
  const inB = (x, y) => x >= 0 && y >= 0 && x < size && y < size;
  const ctx = { size, tiles, fixed, edges, setEdge, ek, inB, allowed, base, type, region };

  stageZones(ctx, rs.zones);
  stageWater(ctx, rs.water);
  stageRoads(ctx, rs.roads);
  const buildings = stageStructures(ctx, rs.structures);
  stageGroundFill(ctx, rs.groundFill);
  stageDetails(ctx, rs.details);
  const exits = stageExits(ctx, rs.exits, req.exits || []);
  const deployment = stageDeployment(ctx);
  const map = {
    type, size, width: size, height: size, tiles, buildings, exits, deployment, containers: [], stages: [...STAGES],
    edges: [...edges.values()].map(({ x, y, side, ...e }) => ({ x, y, side, ...e })), seed,
  };
  map.checks = checkMap(map);
  return map;
}

// --- Stage 1: zones (neighbour blend band; recorded for the ground fill) ------------------------
function stageZones(ctx, rng) {
  const depth = Math.round((G('zones')?.blendShare ?? 0) * ctx.size);
  ctx.zone = Array.from({ length: ctx.size }, () => Array(ctx.size).fill(null));
  for (const e of EDGES) {
    const n = ctx.region.neighbours?.[e];
    if (!n || n === ctx.region.terrain) continue;
    const st = strategicTerrain(n);
    ctx.bands = ctx.bands || {};
    ctx.bands[e] = { terrain: n, depth: depth + rng.int(-1, 1), water: st ? st.passable === false : false };
  }
  for (const [e, band] of Object.entries(ctx.bands || {})) {
    for (let i = 0; i < ctx.size; i++) for (let d = 0; d < band.depth; d++) {
      const [x, y] = along(ctx.size, e, i, d);
      ctx.zone[y][x] = band.terrain;
    }
  }
}
// Tile at position i along edge e, d tiles in from that edge.
function along(size, e, i, d) {
  if (e === 'n') return [i, d];
  if (e === 's') return [i, size - 1 - d];
  if (e === 'w') return [d, i];
  return [size - 1 - d, i];
}

// --- Stage 2: water (shores from sea and lake neighbours) ---------------------------------------
function stageWater(ctx, rng) {
  const deep = G('water')?.deepFromShoreTiles ?? 0;
  if (!ctx.allowed.has('deepWater') && !ctx.allowed.has('shallowWater')) return;
  for (const [e, band] of Object.entries(ctx.bands || {})) {
    if (!band.water) continue;
    for (let i = 0; i < ctx.size; i++) {
      const depth = band.depth + rng.int(-1, 1);
      for (let d = 0; d < depth; d++) {
        const [x, y] = along(ctx.size, e, i, d);
        const fromShore = depth - 1 - d;
        ctx.tiles[y][x] = fromShore >= deep && ctx.allowed.has('deepWater') ? 'deepWater' : 'shallowWater';
        ctx.fixed[y][x] = true;
      }
    }
  }
}

// --- Stage 3: roads (enter at their edges, run to a hub near the centre) ------------------------
function stageRoads(ctx) {
  if (!ctx.allowed.has('road')) return;
  const widths = G('roads')?.widths || {};
  const mid = Math.floor(ctx.size / 2);
  ctx.roadTiles = new Set();
  for (const road of ctx.region.roads || []) {
    const w = widths[road.kind] || 1;
    const lo = mid - Math.floor(w / 2);
    for (const e of road.edges || []) {
      for (let d = 0; d <= mid; d++) for (let k = 0; k < w; k++) {
        const [x, y] = along(ctx.size, e, lo + k, d);
        if (ctx.tiles[y][x] === 'deepWater') {
          // A bridge with railings (half-cover edges) along its sides.
          if (k === 0) ctx.setEdge(x, y, e === 'n' || e === 's' ? 'w' : 'n', { cover: 'half', material: 'metal', kind: 'fence' });
          if (k === w - 1) ctx.setEdge(x, y, e === 'n' || e === 's' ? 'e' : 's', { cover: 'half', material: 'metal', kind: 'fence' });
        }
        ctx.tiles[y][x] = 'road'; ctx.fixed[y][x] = true; ctx.roadTiles.add(`${x},${y}`);
      }
    }
  }
}

// --- Stage 4: structures (buildings from floor-plan rules, TAC-088) -----------------------------
function stageStructures(ctx, rng) {
  const r = ctx.region;
  const out = [];
  const hasSite = (r.roads || []).length || r.settlement || r.poi?.type === 'plant' || r.crossing;
  const rules = G('buildings') || {};
  const kinds = rules.byMapType?.[ctx.type] || [];
  if (!hasSite || !kinds.length || !ctx.allowed.has('floor')) return out;
  const land = ctx.tiles.flat().filter((t) => !terrain(t)?.impassable).length;
  const target = (G('mapTypes')[ctx.type].builtShare || 0) * land;
  const large = new Set(G('largeBuildingKinds') || []);
  const locked = G('lockedDoorShare') || {};
  const gap = rules.spacingTiles ?? 1;
  let built = 0;
  const taken = Array.from({ length: ctx.size }, () => Array(ctx.size).fill(false));
  for (let i = 0; i < (rules.placementAttempts ?? 0) && built < target; i++) {
    const kind = rng.pick(kinds);
    const k = rules.kinds?.[kind];
    if (!k) continue;
    const w = rng.int(k.w[0], k.w[1]); const h = rng.int(k.h[0], k.h[1]);
    const x0 = rng.int(1 + gap, ctx.size - w - 1 - gap); const y0 = rng.int(1 + gap, ctx.size - h - 1 - gap);
    if (x0 < 1 || y0 < 1) continue;
    let ok = true;
    for (let y = y0 - gap; y < y0 + h + gap && ok; y++) for (let x = x0 - gap; x < x0 + w + gap && ok; x++) {
      if (!ctx.inB(x, y) || taken[y][x] || ctx.fixed[y][x]) ok = false;
    }
    if (!ok) continue;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { ctx.tiles[y][x] = 'floor'; ctx.fixed[y][x] = true; taken[y][x] = true; }
    const wall = { cover: 'full', material: rules.wallMaterial, kind: 'wall' };
    const win = { cover: 'half', material: rules.windowMaterial, kind: 'window' };
    const every = rules.windowEvery || 0;
    for (let x = x0; x < x0 + w; x++) {
      ctx.setEdge(x, y0, 'n', every && (x - x0) % every === 1 ? win : wall);
      ctx.setEdge(x, y0 + h - 1, 's', every && (x - x0) % every === 1 ? win : wall);
    }
    for (let y = y0; y < y0 + h; y++) {
      ctx.setEdge(x0, y, 'w', every && (y - y0) % every === 1 ? win : wall);
      ctx.setEdge(x0 + w - 1, y, 'e', every && (y - y0) % every === 1 ? win : wall);
    }
    // Outer door on the side facing the map centre.
    const c = ctx.size / 2;
    const side = Math.abs(x0 + w / 2 - c) > Math.abs(y0 + h / 2 - c) ? (x0 + w / 2 > c ? 'w' : 'e') : (y0 + h / 2 > c ? 'n' : 's');
    const dx = side === 'w' ? x0 : side === 'e' ? x0 + w - 1 : x0 + Math.floor(w / 2);
    const dy = side === 'n' ? y0 : side === 's' ? y0 + h - 1 : y0 + Math.floor(h / 2);
    const share = locked[k.lockClass === 'poi' || r.poi ? 'poi' : 'house'] ?? 0;
    ctx.setEdge(dx, dy, side, { cover: 'full', material: rules.doorMaterial, kind: 'door', open: false, locked: rng.next() < share, interior: false });
    // One interior wall with a door (never locked).
    if (k.interiorDoor && w >= 6) {
      const ix = x0 + Math.floor(w / 2) - 1;
      for (let y = y0; y < y0 + h; y++) ctx.setEdge(ix, y, 'e', { ...wall, interior: true });
      ctx.setEdge(ix, y0 + Math.floor(h / 2), 'e', { cover: 'full', material: rules.doorMaterial, kind: 'door', open: false, locked: false, interior: true });
    }
    const levels = ['ground'];
    if (large.has(kind)) levels.push('roof');
    out.push({ id: `b${out.length + 1}`, kind, x: x0, y: y0, w, h, levels, door: { x: dx, y: dy, side } });
    built += w * h;
  }
  return out;
}

// --- Stage 6: ground fill (seeded, with adjacency rules) ----------------------------------------
function stageGroundFill(ctx, rng) {
  const gf = G('groundFill') || {};
  const okc = (c) => ctx.allowed.has(c);
  const foliage = (gf.foliage || []).filter(okc);
  const share = G('mapTypes')[ctx.type].foliageShare || 0;
  for (let y = 0; y < ctx.size; y++) for (let x = 0; x < ctx.size; x++) {
    if (ctx.fixed[y][x]) continue;
    const zoneType = ctx.zone[y][x] ? TERRAIN_TYPES[ctx.zone[y][x]] : null;
    const fs = zoneType && G('mapTypes')[zoneType] ? G('mapTypes')[zoneType].foliageShare : share;
    const r = rng.next();
    if (foliage.length && r < fs) ctx.tiles[y][x] = rng.pick(foliage);
    else if (okc('rock') && r < fs + (gf.rockShare || 0)) ctx.tiles[y][x] = 'rock';
    else if (okc('mud') && r < fs + (gf.rockShare || 0) + (gf.mudShare || 0)) ctx.tiles[y][x] = 'mud';
  }
  const nb = new Set(gf.rockNeighbours || []);
  for (let y = 0; y < ctx.size; y++) for (let x = 0; x < ctx.size; x++) {
    if (ctx.tiles[y][x] !== 'rock') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = ctx.inB(x + dx, y + dy) ? ctx.tiles[y + dy][x + dx] : 'rock';
      if (nb.size && !nb.has(t)) { ctx.tiles[y][x] = ctx.base; break; }
    }
  }
}

// --- Stage 7: details (connect every walkable pocket to the main area) --------------------------
function stageDetails(ctx) {
  if (!G('details')?.connectPockets) return;
  const walk = (x, y) => !terrain(ctx.tiles[y][x])?.impassable;
  for (let guard = 0; guard < ctx.size; guard++) {
    const seen = flood(ctx.size, (x, y) => walk(x, y), [[Math.floor(ctx.size / 2), Math.floor(ctx.size / 2)]], () => true);
    let changed = false;
    for (let y = 0; y < ctx.size; y++) for (let x = 0; x < ctx.size; x++) {
      if (!walk(x, y) || seen.has(y * ctx.size + x)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx; const ny = y + dy;
        if (ctx.inB(nx, ny) && ctx.tiles[ny][nx] === 'rock') { ctx.tiles[ny][nx] = ctx.base; changed = true; }
      }
    }
    if (!changed) break;
  }
}

// --- Stage 8: exits and deployment --------------------------------------------------------------
function stageExits(ctx, rng, requested) {
  const ec = G('exitCount'); const spacing = G('exitSpacingTiles') ?? 0; const width = G('footExitWidth') ?? 1;
  const tpl = G('exits') || [];
  const tplOf = (cond) => tpl.find((t) => t.condition === cond) || { id: cond, condition: cond };
  const walk = (x, y) => !terrain(ctx.tiles[y][x])?.impassable;
  const out = [];
  const centre = (tiles) => tiles.reduce(([a, b], [x, y]) => [a + x / tiles.length, b + y / tiles.length], [0, 0]);
  const farEnough = (tiles) => out.every((e) => {
    const [ax, ay] = centre(e.tiles); const [bx, by] = centre(tiles);
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) >= spacing;
  });
  const span = (e, i, w) => Array.from({ length: w }, (_, k) => along(ctx.size, e, i + k, 0));
  const place = (w) => {
    for (let t = 0; t < 200; t++) {
      const e = rng.pick(EDGES); const i = rng.int(0, ctx.size - w);
      const tiles = span(e, i, w);
      if (tiles.every(([x, y]) => walk(x, y)) && farEnough(tiles)) return tiles;
    }
    return null;
  };
  const max = ec?.max ?? 4; const min = ec?.min ?? 2;
  const count = Math.max(min, Math.min(max, Math.max(requested.length, rng.int(min, max))));
  for (const r of requested) {
    const tiles = place(width);
    if (tiles) out.push({ id: r.id, condition: r.condition || 'none', params: r.params || {}, tiles });
  }
  const widths = G('roads')?.widths || {};
  const mid = Math.floor(ctx.size / 2);
  for (const road of ctx.region.roads || []) {
    for (const e of road.edges || []) {
      if (out.length >= Math.max(count, min)) break;
      const w = widths[road.kind] || 1;
      const tiles = span(e, mid - Math.floor(w / 2), w);
      if (!farEnough(tiles)) continue;
      const t = tplOf(road.foreign ? 'paidCrossing' : 'fuel');
      out.push({ id: `${t.id}-${e}`, condition: t.condition, params: t.params || {}, tiles });
    }
  }
  let n = 1;
  while (out.length < count) {
    const tiles = place(width);
    if (!tiles) break;
    const t = tplOf('none');
    out.push({ id: `${t.id}-${n++}`, condition: 'none', params: {}, tiles });
  }
  return out;
}
function stageDeployment(ctx) {
  const dep = G('deployment') || {};
  const r = ctx.region;
  const approach = r.approachSide || (r.roads || [])[0]?.edges?.[0] || 's';
  const walk = (x, y) => !terrain(ctx.tiles[y][x])?.impassable && ctx.tiles[y][x] !== 'floor';
  const zone = (e, depth) => {
    const out = [];
    for (let d = 0; d < depth; d++) for (let i = 0; i < ctx.size; i++) { const [x, y] = along(ctx.size, e, i, d); if (walk(x, y)) out.push([x, y]); }
    return out;
  };
  const player = zone(approach, dep.playerDepthTiles ?? 1);
  let enemy;
  if (r.poi) {
    const c = Math.floor(ctx.size / 2); const h = Math.floor((dep.enemyDepthTiles ?? 2) / 2); enemy = [];
    for (let y = c - h; y <= c + h; y++) for (let x = c - h; x <= c + h; x++) if (walk(x, y)) enemy.push([x, y]);
  } else enemy = zone(OPP[approach], dep.enemyDepthTiles ?? 1);
  return { approach, player, enemy };
}

// --- Checks (TAC-089) ---------------------------------------------------------------------------
function flood(size, walk, starts, canCross) {
  const seen = new Set();
  const q = [];
  for (const [x, y] of starts) if (walk(x, y)) { seen.add(y * size + x); q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy, side] of [[1, 0, 'e'], [-1, 0, 'w'], [0, 1, 's'], [0, -1, 'n']]) {
      const nx = x + dx; const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const k = ny * size + nx;
      if (seen.has(k) || !walk(nx, ny) || !canCross(x, y, side)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
export function checkMap(map) {
  const size = map.size ?? map.tiles.length;
  const ek = (x, y, s) => (s === 'e' ? `${x + 1},${y},w` : s === 's' ? `${x},${y + 1},n` : `${x},${y},${s}`);
  const edges = new Map((map.edges || []).map((e) => [ek(e.x, e.y, e.side), e]));
  const walk = (x, y) => !terrain(map.tiles[y][x])?.impassable;
  // On foot: half cover can be vaulted and doors opened (or cut); only walls block.
  const cross = (x, y, s) => { const e = edges.get(ek(x, y, s)); return !e || e.cover !== 'full' || e.kind === 'door' || e.kind === 'rubble'; };
  const failed = [];
  const n = (map.exits || []).length;
  const ec = G('exitCount');
  if (n < (ec?.min ?? 2) || n > (ec?.max ?? 4)) failed.push('exitCount');
  const pz = map.deployment?.player || [];
  const c = size / 2;
  const start = [...pz].sort((a, b) => Math.hypot(a[0] - c, a[1] - c) - Math.hypot(b[0] - c, b[1] - c))[0];
  const seen = start ? flood(size, walk, [start], cross) : new Set();
  const reach = (tiles) => tiles.some(([x, y]) => seen.has(y * size + x));
  if (!start || !(map.exits || []).every((e) => reach(e.tiles)) || ((map.deployment?.enemy || []).length && !reach(map.deployment.enemy))) failed.push('connected');
  const enterable = (map.buildings || []).every((bl) => {
    const [dx, dy] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[bl.door.side];
    const ox = bl.door.x + dx; const oy = bl.door.y + dy;
    return ox >= 0 && oy >= 0 && ox < size && oy < size && walk(ox, oy);
  });
  if (!enterable) failed.push('buildingsEnterable');
  const tol = G('validate')?.shareTolerance ?? 0;
  const mt = G('mapTypes')?.[map.type] || {};
  const all = map.tiles.flat();
  const land = all.filter((t) => !terrain(t)?.impassable && t !== 'shallowWater').length || 1;
  const foliageShare = all.filter((t) => terrain(t)?.obscuring).length / land;
  const builtShare = all.filter((t) => t === 'floor').length / land;
  const reported = [
    { name: 'foliageShare', value: foliageShare, ok: Math.abs(foliageShare - (mt.foliageShare ?? foliageShare)) <= tol },
    { name: 'builtShare', value: builtShare, ok: Math.abs(builtShare - (mt.builtShare ?? builtShare)) <= tol },
    { name: 'noVegetationOnRoads', ok: true },
  ];
  return { required: { ok: failed.length === 0, failed }, reported };
}
export { T };
