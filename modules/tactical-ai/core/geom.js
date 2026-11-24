// Grid helpers on plain view data. Distance is in tiles, 8-neighbourhood (TAC-028).

export const sameTile = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y && (a.level ?? 0) === (b.level ?? 0);
export const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
export const tileKey = (t) => (t ? `${t.x},${t.y},${t.level ?? 0}` : '');

export function tileAt(view, t) {
  return (view.map?.tiles ?? []).find((x) => sameTile(x, t));
}

// Edge of tile `from` that faces a point `to` (y grows to the south).
export function facingEdge(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? 's' : 'n';
  return dx >= 0 ? 'e' : 'w';
}

// Offset across the line toward `to` (how far to the side of the enemy's facing axis we stand).
export function lateral(from, to) {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return dy >= dx ? dx : dy;
}

export function nearest(from, items, pos = (i) => i) {
  let best = null;
  let bd = Infinity;
  for (const it of items) {
    const p = pos(it);
    if (!p) continue;
    const d = dist(from, p);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}
