// Battle map model: tiles, cover edges (TAC-035), doors (TAC-084), smoke, lines of sight (TAC-016) and
// walking legality (TAC-029, TAC-034). Coordinates: x east, y south; facing 0 = north, clockwise.
import { T, terrain } from './data.js';
import { visionCone } from './combat.js';

export const SIDES = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };

// Canonical key of the edge on `side` of tile (x, y): stored as the n or w edge of a tile.
export function edgeKey(x, y, side) {
  if (side === 'e') return `${x + 1},${y},w`;
  if (side === 's') return `${x},${y + 1},n`;
  return `${x},${y},${side}`;
}

export function buildMap(src) {
  const tiles = src.tiles || src.rows.map((row) => [...row].map((ch) => src.legend[ch]));
  const m = {
    width: src.width ?? tiles[0].length, height: src.height ?? tiles.length, tiles,
    edges: new Map(), ladders: src.ladders || [], exits: (src.exits || []).map((e) => ({ ...e, tiles: e.tiles.map((t) => [...t]) })),
    containers: (src.containers || []).map((c) => ({ ...c, contents: (c.contents || []).map((i) => ({ ...i })) })),
    smoke: [], deployment: src.deployment || null,
  };
  for (const e of src.edges || []) setEdge(m, e.x, e.y, e.side, e);
  return m;
}
export function setEdge(m, x, y, side, e) {
  m.edges.set(edgeKey(x, y, side), { cover: e.cover, material: e.material, kind: e.kind, open: !!e.open, locked: !!e.locked,
    interior: !!e.interior, hp: e.hp ?? undefined, id: e.id });
}
export const getEdge = (m, x, y, side) => m.edges.get(edgeKey(x, y, side)) || null;

// Effective cover of an edge: an open door or rubble gives none.
export function edgeCover(e) {
  if (!e) return 'none';
  if (e.kind === 'door' && e.open) return 'none';
  return e.cover || 'none';
}
export const inBounds = (m, x, y) => x >= 0 && y >= 0 && x < m.width && y < m.height;
export const terrainAt = (m, x, y) => terrain(m.tiles[y]?.[x]);
export const impassable = (m, x, y) => !inBounds(m, x, y) || !!terrainAt(m, x, y)?.impassable;
export const obscuring = (m, x, y) => !!terrainAt(m, x, y)?.obscuring;

// Edge between two orthogonally adjacent tiles.
export function edgeBetween(m, ax, ay, bx, by) {
  for (const [s, [dx, dy]] of Object.entries(SIDES)) if (ax + dx === bx && ay + dy === by) return { edge: getEdge(m, ax, ay, s), side: s };
  return null;
}

// Tiles crossed by the line between tile centres, stepping one axis at a time (no corner skipping).
export function lineTiles(ax, ay, bx, by) {
  const out = [[ax, ay]];
  let x = ax; let y = ay;
  const dx = bx - ax; const dy = by - ay;
  const nx = Math.abs(dx); const ny = Math.abs(dy);
  const sx = Math.sign(dx); const sy = Math.sign(dy);
  for (let ix = 0, iy = 0; ix < nx || iy < ny;) {
    const stepX = iy === ny || (ix < nx && (0.5 + ix) / nx <= (0.5 + iy) / ny);
    if (stepX) { x += sx; ix++; } else { y += sy; iy++; }
    out.push([x, y]);
  }
  return out;
}

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const bearing = (a, b) => ((Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI + 360) % 360;
export const angleDiff = (a, b) => { const d = Math.abs((((a - b) % 360) + 360) % 360); return d > 180 ? 360 - d : d; };
export const snapFacing = (deg) => (Math.round(deg / 45) * 45) % 360;

export function inCone(viewer, target) {
  if (viewer.x === target.x && viewer.y === target.y) return true;
  return angleDiff(bearing(viewer, target), viewer.facing || 0) <= visionCone(viewer) / 2 + 1e-9;
}
const inSmoke = (m, x, y) => m.smoke.some((c) => Math.hypot(c.x - x, c.y - y) <= c.radius + 1e-9);

// Line clear for sight: no full-cover edge, no sight-blocking terrain or smoke between the tiles.
export function clearLine(m, a, b) {
  const pts = lineTiles(a.x, a.y, b.x, b.y);
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]; const [x, y] = pts[i];
    if (edgeCover(edgeBetween(m, px, py, x, y)?.edge) === 'full') return false;
    if (i < pts.length - 1 && impassable(m, x, y)) return false;
  }
  for (const [x, y] of pts) if (inSmoke(m, x, y)) return false;
  return true;
}

// Cover a tile gives against an attacker at `from`: the best edge on the tile's sides facing it.
export function coverAgainst(m, x, y, from) {
  const dx = from.x - x; const dy = from.y - y;
  const sides = [];
  if (dx > 0) sides.push('e'); if (dx < 0) sides.push('w');
  if (dy > 0) sides.push('s'); if (dy < 0) sides.push('n');
  let best = 'none';
  for (const s of sides) {
    const c = edgeCover(getEdge(m, x, y, s));
    if (c === 'full') return 'full';
    if (c === 'half') best = 'half';
  }
  return best;
}

// Orthogonal or diagonal step legality for walking (TAC-029, TAC-034, TAC-084).
// Returns { ok, door: edge|null, reason }.
export function stepCheck(m, ax, ay, bx, by) {
  if (!inBounds(m, bx, by)) return { ok: false, reason: 'off the map' };
  if (impassable(m, bx, by)) return { ok: false, reason: 'impassable terrain' };
  const dx = bx - ax; const dy = by - ay;
  if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) return { ok: false, reason: 'not adjacent' };
  if (dx !== 0 && dy !== 0) {
    const edges = [edgeBetween(m, ax, ay, ax + dx, ay), edgeBetween(m, ax, ay, ax, ay + dy),
      edgeBetween(m, bx, by, bx - dx, by), edgeBetween(m, bx, by, bx, by - dy)];
    if (edges.some((e) => edgeCover(e?.edge) !== 'none')) return { ok: false, reason: 'corner blocked by an edge' };
    if (impassable(m, ax + dx, ay) && impassable(m, ax, ay + dy)) return { ok: false, reason: 'corner blocked' };
    return { ok: true, door: null };
  }
  const e = edgeBetween(m, ax, ay, bx, by).edge;
  if (!e || edgeCover(e) === 'none') return { ok: true, door: null };
  if (e.kind === 'door' && !e.open) {
    if (e.locked) return { ok: false, reason: 'locked door' };
    return { ok: true, door: e };
  }
  if (edgeCover(e) === 'half') return { ok: false, reason: 'half cover: vault it' };
  return { ok: false, reason: 'wall' };
}

export { OPP };
export const halfCoverHeight = () => T('halfCoverHeightM');
