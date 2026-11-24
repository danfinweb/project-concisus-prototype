// Tactical AI core (TAI-001..TAI-016). Pure: decide(view, rng) → { commands, blackboardWrites, log }.
// Reads only the perception view and /data (doctrines, items) through shared/registry.js; randomness only
// through the passed seeded rng, used for ties (TAI-007). Keeps no state between calls (TAI-016).
import { context, lossShare, ROLES } from './context.js';
import { candidatesIn } from './candidates.js';
import { combine, scoreIn } from './score.js';
import { doctrineFor } from './doctrine.js';
import { curve } from './curve.js';
import { planWrites, claimWrites, requestWrites } from './squad.js';

export { combine, curve, doctrineFor, lossShare, ROLES };

export function candidates(view) {
  return candidatesIn(context(view));
}

// score(view, option, doctrine): the doctrine argument must be the view's own (doctrineFor(view)).
export function score(view, option, doctrine) {
  const ctx = context(view);
  if (doctrine && doctrine !== ctx.d) ctx.d = doctrine;
  return scoreIn(ctx, option);
}

// Highest `score` wins; exact ties are broken by the seeded rng (TAI-007).
export function pickBest(scored, rng) {
  let top = -Infinity;
  for (const s of scored) if (s.score > top) top = s.score;
  const tied = scored.filter((s) => s.score === top);
  return tied.length === 1 ? tied[0] : rng.pick(tied);
}

export function decide(view, rng) {
  const ctx = context(view);
  const scored = candidatesIn(ctx).map((option) => ({ option, ...scoreIn(ctx, option) }));
  const best = pickBest(scored, rng);
  const commands = best.option.commands.map((c) => ({ ...c }));

  const blackboardWrites = ctx.me
    ? [...planWrites(ctx), ...requestWrites(ctx), ...claimWrites(ctx, best.option)]
    : [];

  // Log: best first, the chosen option at the head of its tie (TAI-016).
  const ordered = [best, ...scored.filter((s) => s !== best)].sort((a, b) => b.score - a.score); // stable: best stays first among ties
  const topN = ctx.d.logTopN ?? ordered.length;
  const entry = {
    turn: view.turn,
    unit: view.activeUnit ?? null,
    chosen: commands[0],
    options: ordered.slice(0, Math.max(1, topN)).map((s) => ({
      command: s.option.commands[0], score: s.score,
      survival: s.survival, battleGoal: s.battleGoal, actionFit: s.actionFit, coordination: s.coordination,
    })),
  };
  if (view.rejection) entry.rejection = view.rejection;
  return { commands, blackboardWrites, log: [entry] };
}
