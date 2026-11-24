// Facts derived once per decide() call from the view and the doctrine: the active unit, its weapon and
// role, the effective battle goal (TAI-009 retreat switch) and where the goal's targets are.
import * as registry from '../../../shared/registry.js';
import { doctrineFor, roles } from './doctrine.js';
import { dist, nearest, sameTile } from './geom.js';

export const ROLES = ['flank', 'suppress', 'retreat'];
const DEFAULT_ROLE = 'flank';

// Share of the side's soldiers out of action (TAI-009). Wounded soldiers, disabled limbs included, never
// count; only `outOfAction` does. (How soldiers who left the map appear in the view is open, SCOPE.md.)
export function lossShare(view) {
  const squad = view.squad ?? [];
  if (squad.length === 0) return 0;
  return squad.filter((u) => u.outOfAction).length / squad.length;
}

export function isRetreating(view) {
  const limit = view.battleGoal?.acceptableLoss;
  if (typeof limit !== 'number') return false;
  const share = lossShare(view);
  return share > 0 && share >= limit;
}

export function itemDef(id) {
  if (!id) return undefined;
  try {
    return registry.has('items', id) ? registry.get('items', id) : undefined;
  } catch {
    return undefined; // items table not loaded: no gear lookups
  }
}

export function weaponOf(unit) {
  const slot = unit?.equipment?.weapon1;
  return { slot, def: itemDef(slot?.item) };
}

// Role per TAI-014: the plan's role, else the doctrine's default for the weapon type (DAT-011).
export function roleOf(view, d, unit) {
  const r = unit.role ?? view.squadPlan?.roles?.[unit.id];
  if (r) return r;
  const wt = weaponOf(unit).def?.weaponType;
  return roles(d).byWeaponType?.[wt] ?? DEFAULT_ROLE;
}

export const living = (view) => (view.squad ?? []).filter((u) => !u.outOfAction);
export const visibleEnemies = (view) => (view.knownEnemies ?? []).filter((e) => e.visibleNow);

// Resolve a battle-goal target ID to a position: enemy, squadmate, neutral, exit or objective.
function targetPos(view, id) {
  const unit = [...(view.knownEnemies ?? []), ...(view.squad ?? []), ...(view.knownNeutrals ?? [])].find((u) => u.id === id);
  if (unit?.position) return unit.position;
  const exit = (view.map?.exits ?? []).find((e) => e.id === id);
  if (exit?.tile) return exit.tile;
  const obj = (view.objectives ?? []).find((o) => o.id === id);
  return obj?.tile ?? obj?.position;
}

export function context(view) {
  const d = doctrineFor(view);
  const me = (view.squad ?? []).find((u) => u.id === view.activeUnit) ?? null;
  const retreating = isRetreating(view);
  const goal = retreating ? 'retreat' : (view.battleGoal?.goal ?? 'attack');
  const exits = view.map?.exits ?? [];
  let goalPoints;
  if (goal === 'retreat') {
    const ex = me ? nearest(me.position, exits, (e) => e.tile) : null;
    goalPoints = ex ? [ex.tile] : [];
  } else {
    const ids = view.battleGoal?.targets ?? [];
    goalPoints = ids.map((id) => targetPos(view, id)).filter(Boolean);
    if (goalPoints.length === 0 && (goal === 'attack' || goal === 'defend' || goal === 'hold')) {
      goalPoints = (view.knownEnemies ?? []).map((e) => e.position).filter(Boolean);
    }
    if (goalPoints.length === 0 && goal === 'reachExit') goalPoints = exits.map((e) => e.tile);
  }
  const moveEntry = (view.allowedActions ?? []).find((a) => a.type === 'move');
  const maxStep = me && moveEntry?.reachable?.length
    ? Math.max(...moveEntry.reachable.map((r) => dist(me.position, r.tile)))
    : 0;
  const goalTargets = new Set(view.battleGoal?.targets ?? []);
  return {
    view, d, me, goal, retreating, goalPoints, goalTargets, maxStep,
    role: me ? roleOf(view, d, me) : null,
    weapon: me ? weaponOf(me) : { slot: undefined, def: undefined },
    exitAt: (t) => exits.find((e) => sameTile(e.tile, t)),
    nearestExit: (t) => nearest(t, exits, (e) => e.tile),
  };
}
