// Candidate actions (TAI-005, TAI-007). Every candidate comes from the view's precomputed allowedActions,
// so the AI never issues a command the view did not offer (TAI-006). One option = one action this call.
import { context } from './context.js';
import { tileKey } from './geom.js';

const STANCES = ['upright', 'crouched', 'prone'];
const REACTIONS = ['fire', 'takeCover', 'hold'];

// Identity of an action for the retry rule (TAI-005): same type and same object = same action.
export function actionKey(cmd) {
  if (!cmd) return '';
  const end = cmd.path?.[cmd.path.length - 1] ?? cmd.tile;
  return [cmd.type, cmd.target ?? cmd.unit ?? cmd.exit ?? '', tileKey(end), cmd.stance ?? '', cmd.reaction ?? '', cmd.magazine ?? ''].join('|');
}

function forEntry(ctx, a) {
  const { me, weapon } = ctx;
  switch (a.type) {
    case 'activate': return a.unit ? [[{ type: 'activate', unit: a.unit }]] : [];
    case 'pass': return [[{ type: 'pass' }]];
    case 'move':
      return (a.reachable ?? []).map((r) => [{ type: 'move', path: [r.tile] }]);
    case 'shoot': {
      const mode = weapon.def?.fireModes?.[0];
      return (a.targets ?? []).filter((t) => t.unit).map((t) => {
        const cmd = { type: 'shoot', target: t.unit, aimSteps: 0 };
        if (mode !== undefined) cmd.fireMode = mode;
        return [cmd];
      });
    }
    case 'reload': {
      const mags = (me?.magazines ?? []).filter((m) => (m.rounds ?? 0) > 0);
      if (mags.length === 0) return [];
      const best = mags.reduce((x, y) => ((y.rounds ?? 0) > (x.rounds ?? 0) ? y : x));
      const cmd = { type: 'reload', magazine: best.id };
      if (best.slot) cmd.sourceSlot = best.slot;
      return [[cmd]];
    }
    case 'changeStance':
      return STANCES.filter((s) => s !== me?.stance).map((stance) => [{ type: 'changeStance', stance }]);
    case 'setReaction':
      return REACTIONS.filter((r) => r !== me?.reaction).map((reaction) => [{ type: 'setReaction', reaction }]);
    case 'leaveMap': {
      const ex = me ? (ctx.exitAt(me.position) ?? ctx.nearestExit(me.position)) : null;
      return ex ? [[{ type: 'leaveMap', exit: ex.id }]] : [];
    }
    case 'holdOverwatch': case 'clearJam': case 'endActivation':
      return [[{ type: a.type }]];
    default:
      // Not built yet (no scoring rule in TAI-001..016): throwGrenade, useItem, search, pickUp, cutLock,
      // closeDoor, placeCharge, restrainVip, liftBody, putDownBody, vault, climb, turn, swapWeapon,
      // dropBackpack, pickUpBackpack. They are never chosen until they have a fit rule.
      return [];
  }
}

export function candidatesIn(ctx) {
  const { view } = ctx;
  const out = [];
  const rejected = view.rejection?.command ? actionKey(view.rejection.command) : null;
  for (const a of view.allowedActions ?? []) {
    if (view.activeUnit == null && a.type !== 'activate' && a.type !== 'pass') continue;
    if (view.activeUnit != null && (a.type === 'activate' || a.type === 'pass')) continue;
    for (const commands of forEntry(ctx, a)) {
      if (rejected && actionKey(commands[0]) === rejected) continue;
      out.push({ commands });
    }
  }
  if (out.length === 0) out.push({ commands: [{ type: view.activeUnit == null ? 'pass' : 'endActivation' }] });
  return out;
}

export function candidates(view) {
  return candidatesIn(context(view));
}
