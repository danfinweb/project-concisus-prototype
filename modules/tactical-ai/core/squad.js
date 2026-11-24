// Squad coordination writes (TAI-012, TAI-013, TAI-014): the leader's plan, its requests, and the claims
// the active unit makes for what it chose. Returned as blackboardWrites; TAC stores and applies them.
import { roles } from './doctrine.js';
import { living, roleOf, visibleEnemies, ROLES } from './context.js';
import { nearest } from './geom.js';
import { answeredRequest } from './score.js';

const isLeader = (ctx) => !!ctx.me && ctx.view.squadPlan?.leader === ctx.me.id;
const until = (ctx) => ctx.view.turn + (roles(ctx.d).claimTurns ?? 0);

// TAI-013: the leader keeps each living unit's valid role and fills the gaps (retreat when retreating,
// else the doctrine's role for the weapon type). Writes setPlan only when the roles change.
export function planWrites(ctx) {
  if (!isLeader(ctx)) return [];
  const { view, d } = ctx;
  const current = view.squadPlan?.roles ?? {};
  const next = {};
  for (const u of living(view)) {
    if (ctx.retreating) next[u.id] = 'retreat';
    else if (ROLES.includes(current[u.id])) next[u.id] = current[u.id];
    else next[u.id] = roleOf(view, d, { ...u, role: null });
  }
  const same = Object.keys(next).length === Object.keys(current).length
    && Object.entries(next).every(([k, v]) => current[k] === v);
  if (same) return [];
  return [{ op: 'setPlan', plan: { roles: next, intent: { ...(view.squadPlan?.intent ?? {}) } } }];
}

// TAI-013: the leader posts a suppress request on the nearest visible enemy when none is open.
export function requestWrites(ctx) {
  if (!isLeader(ctx) || ctx.retreating) return [];
  const { view, me } = ctx;
  const open = (view.blackboard?.requests ?? []).some((r) => r.type === 'suppress' && (r.untilTurn === undefined || r.untilTurn >= view.turn));
  if (open) return [];
  const target = nearest(me.position, visibleEnemies(view), (e) => e.position);
  if (!target) return [];
  return [{ op: 'addRequest', request: { id: `${me.id}-suppress`, type: 'suppress', by: me.id, target: target.id, untilTurn: until(ctx) } }];
}

// TAI-012: claim the chosen target or tile, and the request it answers. One claim id per unit and kind,
// so a new claim replaces the unit's previous one.
export function claimWrites(ctx, option) {
  const { me } = ctx;
  const cmd = option.commands[0];
  const out = [];
  if (cmd.type === 'shoot' && cmd.target) {
    out.push({ op: 'addClaim', claim: { id: `${me.id}-target`, unit: me.id, kind: 'target', target: cmd.target, untilTurn: until(ctx) } });
  }
  if (cmd.type === 'move') {
    out.push({ op: 'addClaim', claim: { id: `${me.id}-tile`, unit: me.id, kind: 'tile', tile: cmd.path[cmd.path.length - 1], untilTurn: until(ctx) } });
  }
  const req = answeredRequest(ctx, option);
  if (req) out.push({ op: 'addClaim', claim: { id: `${me.id}-request`, unit: me.id, kind: 'request', request: req.id, untilTurn: until(ctx) } });
  return out;
}
