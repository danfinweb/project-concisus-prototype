// Utility scoring (TAI-007..TAI-011). Every consideration is 0–1; all weights and curves come from the
// doctrine (TAI-015). Raw inputs are measurements (shares, counts, ordinals) that the doctrine curves shape.
import { clamp01 } from './curve.js';
import { entry, need, shaped, weight, roles } from './doctrine.js';
import { dist, facingEdge, lateral, nearest, sameTile, tileAt } from './geom.js';
import { visibleEnemies } from './context.js';

// Ordinals: protection of a cover edge and of a stance, 0 = none … 1 = most.
const COVER_ORD = { none: 0, half: 0.5, full: 1 };
const STANCE_ORD = { upright: 0, crouched: 0.5, prone: 1 };

// TAI-007: survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination).
export function combine(p, d) {
  return p.survival * ((d.wGoal ?? 0) * p.battleGoal + (d.wFit ?? 0) * p.actionFit + (d.wCoord ?? 0) * p.coordination);
}

const first = (o) => o.commands[0];
const destination = (ctx, cmd) => (cmd.type === 'move' ? cmd.path[cmd.path.length - 1] : ctx.me?.position);

// ---------------------------------------------------------------- TAI-008 Survival

function exposureAt(ctx, pos, stance) {
  const enemies = visibleEnemies(ctx.view);
  if (enemies.length === 0) return 0;
  const tile = tileAt(ctx.view, pos);
  let open = 0;
  for (const e of enemies) {
    const edge = facingEdge(pos, e.position);
    open += 1 - (COVER_ORD[tile?.cover?.[edge]] ?? 0);
  }
  let exposure = open / enemies.length;
  const st = entry(ctx.d, 'survival.stance');
  if (st) exposure *= shaped(st, STANCE_ORD[stance] ?? 0);
  return clamp01(exposure);
}

function hpShare(unit) {
  let hp = 0;
  let max = 0;
  for (const z of Object.values(unit?.zoneHp ?? {})) {
    if (z && typeof z === 'object' && typeof z.max === 'number') { hp += z.hp ?? 0; max += z.max; }
  }
  return max > 0 ? hp / max : null;
}

export function survival(ctx, option) {
  const { d, me } = ctx;
  if (!me) return 1;
  const cmd = first(option);
  const pos = destination(ctx, cmd);
  const stance = cmd.type === 'changeStance' ? cmd.stance : (cmd.stance ?? me.stance);
  const inputs = [
    ['survival.exposure', exposureAt(ctx, pos, stance)],
    ['survival.threat', visibleEnemies(ctx.view).length],
    ['survival.hp', hpShare(me)],
    ['survival.morale', me.morale],
  ];
  let sum = 0;
  let wsum = 0;
  for (const [name, x] of inputs) {
    const e = entry(d, name);
    if (!e || x === null || x === undefined) continue;
    const w = e.weight ?? 0;
    sum += w * shaped(e, x);
    wsum += w;
  }
  const danger = wsum > 0 ? sum / wsum : 0;
  return shaped(need(d, 'survival'), danger);
}

// ---------------------------------------------------------------- TAI-009 Battle goal

// Progress of a move toward the goal points, mapped from −1…1 to 0…1 (0.5 = no change).
function moveProgress(ctx, to) {
  const { me, goalPoints, maxStep } = ctx;
  if (!me || goalPoints.length === 0 || maxStep === 0) return 0.5;
  const ref = nearest(me.position, goalPoints);
  const p = (dist(me.position, ref) - dist(to, ref)) / maxStep;
  return clamp01((1 + p) / 2);
}

function rawGoal(ctx, cmd) {
  const { goal, goalTargets } = ctx;
  switch (cmd.type) {
    case 'move': return moveProgress(ctx, cmd.path[cmd.path.length - 1]);
    case 'leaveMap': return goal === 'retreat' || goal === 'reachExit' ? 1 : 0;
    case 'shoot':
      if (goal === 'attack') return goalTargets.size === 0 || goalTargets.has(cmd.target) ? 1 : 0.5;
      if (goal === 'defend' || goal === 'hold' || goal === 'escort') return 1;
      return 0.5;
    default: return 0.5;
  }
}

export function battleGoal(ctx, option) {
  const e = entry(ctx.d, `battleGoal.${ctx.goal}`) ?? need(ctx.d, 'battleGoal');
  return clamp01((e.weight ?? 1) * shaped(e, rawGoal(ctx, first(option))));
}

// ---------------------------------------------------------------- TAI-010 / TAI-014 Action fit

function baseFit(ctx, cmd) {
  const { d, me, view, weapon } = ctx;
  switch (cmd.type) {
    case 'shoot': {
      const a = view.allowedActions.find((x) => x.type === 'shoot');
      const t = a?.targets?.find((x) => x.unit === cmd.target);
      if (!t) return 0;
      return (t.hitChance ?? 0) * (t.penetrates === false ? weight(d, 'actionFit.noPenetration') : 1);
    }
    case 'move': {
      const r = view.allowedActions.find((x) => x.type === 'move')?.reachable?.find((x) => sameTile(x.tile, cmd.path[cmd.path.length - 1]));
      const apShare = me?.ap ? clamp01((r?.apLeft ?? 0) / me.ap) : 0;
      return weight(d, 'actionFit.move') * apShare;
    }
    case 'reload': {
      const size = weapon.def?.magazineSize;
      const rounds = weapon.slot?.rounds ?? 0;
      return size ? clamp01(1 - rounds / size) : 0;
    }
    case 'clearJam': return me?.weaponJammed ? 1 : 0;
    case 'activate': {
      const u = view.squad.find((x) => x.id === cmd.unit);
      return u?.staminaMax ? clamp01((u.stamina ?? 0) / u.staminaMax) : 0;
    }
    default: return weight(d, `actionFit.${cmd.type}`);
  }
}

function roleBonus(ctx, cmd) {
  const { role, me, view } = ctx;
  const bonus = roles(ctx.d).fitBonus ?? 0;
  if (!me || !role) return 0;
  if (role === 'suppress' && cmd.type === 'shoot') return bonus;
  if (cmd.type !== 'move' && cmd.type !== 'leaveMap') return 0;
  if (role === 'retreat') {
    if (cmd.type === 'leaveMap') return bonus;
    const to = cmd.path[cmd.path.length - 1];
    const ex = ctx.nearestExit(me.position);
    return ex && dist(to, ex.tile) < dist(me.position, ex.tile) ? bonus : 0;
  }
  if (role === 'flank' && cmd.type === 'move') {
    const ref = nearest(me.position, visibleEnemies(view), (e) => e.position);
    if (!ref) return 0;
    const to = cmd.path[cmd.path.length - 1];
    return lateral(to, ref.position) > lateral(me.position, ref.position) ? bonus : 0;
  }
  return 0;
}

export function actionFit(ctx, option) {
  const cmd = first(option);
  return shaped(need(ctx.d, 'actionFit'), clamp01(baseFit(ctx, cmd) + roleBonus(ctx, cmd)));
}

// ---------------------------------------------------------------- TAI-011 Coordination

const valid = (ctx, x) => x.untilTurn === undefined || x.untilTurn >= ctx.view.turn;

export function openRequests(ctx) {
  const bb = ctx.view.blackboard ?? {};
  const meId = ctx.view.activeUnit;
  const taken = new Set((bb.claims ?? []).filter((k) => k.kind === 'request' && k.unit !== meId && valid(ctx, k)).map((k) => k.request));
  return (bb.requests ?? []).filter((r) => r.by !== meId && valid(ctx, r) && !taken.has(r.id));
}

// The open request this option answers, if any.
export function answeredRequest(ctx, option) {
  const cmd = first(option);
  return openRequests(ctx).find((r) => (cmd.type === 'shoot' && r.target && r.target === cmd.target)
    || (cmd.type === 'move' && r.tile && sameTile(r.tile, cmd.path[cmd.path.length - 1])));
}

function claimedByOther(ctx, cmd) {
  const meId = ctx.view.activeUnit;
  return (ctx.view.blackboard?.claims ?? []).some((k) => k.unit !== meId && valid(ctx, k) && (
    (k.kind === 'target' && cmd.type === 'shoot' && k.target === cmd.target)
    || (k.kind === 'tile' && cmd.type === 'move' && sameTile(k.tile, cmd.path[cmd.path.length - 1]))));
}

export function coordination(ctx, option) {
  const { d } = ctx;
  const rb = entry(d, 'requestBonus');
  const cp = entry(d, 'claimPenalty');
  const bonus = rb ? (rb.weight ?? 0) * shaped(rb, answeredRequest(ctx, option) ? 1 : 0) : 0;
  const penalty = cp ? (cp.weight ?? 0) * shaped(cp, claimedByOther(ctx, first(option)) ? 1 : 0) : 0;
  return clamp01((1 + bonus - penalty) / 2);
}

// ---------------------------------------------------------------- total

export function scoreIn(ctx, option) {
  const p = {
    survival: survival(ctx, option),
    battleGoal: battleGoal(ctx, option),
    actionFit: actionFit(ctx, option),
    coordination: coordination(ctx, option),
  };
  return { score: combine(p, ctx.d), ...p };
}
