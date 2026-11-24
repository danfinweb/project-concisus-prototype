// decide(view, rng) → { commands, log } (SAI-001): one command set for one faction and one hour.
// Tier 1 situation maps → Tier 2 strategist → Tier 3 planner (SAI-007..SAI-009); the Krug answers its
// escort requests first (they resolve before the hour's moves, STR-094); at most one desperate measure.
import { buildContext, resolveDoctrine } from './context.js';
import { situationMaps } from './maps.js';
import { strategize } from './strategist.js';
import { plan } from './planner.js';
import { answerEscorts } from './escort.js';
import { pickBest, logEntry } from './scoring.js';

export function decide(view, rng) {
  const doctrine = resolveDoctrine(view);
  const ctx = buildContext(view);
  const maps = situationMaps(view, ctx);
  const commands = [], log = [];

  // Krug escorts (SAI-017): only the Krug's controller answers them.
  const taken = new Set();
  let assigned = new Map();
  if (ctx.faction?.kind === 'trader') {
    const e = answerEscorts(ctx, maps, doctrine, taken);
    commands.push(...e.commands); log.push(...e.log); assigned = e.assigned;
  }

  // Strategist (SAI-008): one decision over every candidate; 'none' is the zero line.
  const candidates = strategize(ctx, maps, doctrine);
  const none = { option: 'none', total: 0, considerations: {} };
  const all = [...candidates, none];
  log.unshift(logEntry(view, 'strategist', 'objectives', all, pickBest(all, rng), doctrine.logTopN));

  // Desperate measure (SAI-016): the best available one, if it scores above zero and above every
  // objective the faction already pursues.
  const measures = candidates.filter((c) => c.kind === 'measure');
  if (measures.length) {
    const best = pickBest(measures, rng);
    const pursued = candidates.filter((c) => c.kind === 'objective' && c.committed).map((c) => c.total);
    if (best.total > 0 && best.total > Math.max(-Infinity, ...pursued)) commands.push({ type: 'pickMeasure', measure: best.measure });
  }

  const p = plan(ctx, maps, doctrine, candidates, rng, { taken, assigned });
  commands.push(...p.commands); log.push(...p.log);
  return { commands, log };
}
