// Tactical AI (unit and squad AI) — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// Example (tactical): { id: 'duel', run: (core, data, seed, p) => core.resolveBattle(/* … */),
//                       params: { attackerPreset: ['rifleman'], terrain: ['open', 'urban'] },
//                       metrics: ['winner', 'turns', 'casualties'], seeds: 200 }
//
// tactical-ai has no battle loop of its own (TAC resolves commands), so these sims run decide() over
// many seeds and read the distribution of choices. Full battles AI vs AI belong to the cross-sim.
// The Test Lab passes `sim.core` as the first run argument, so every sim exposes the core it imports.
import * as core from '../core/index.js';
import { loadData } from '../../../shared/registry.js';
import { Rng } from '../../../shared/rng.js';
import { baseView, retreatView, freeze, shootTarget, setRole, TOWARD_EXIT } from './views.js';

const FIXTURES = new URL('./fixtures', import.meta.url).href;
let loaded = null;
const ready = () => (loaded ??= loadData(['ai/doctrines', 'items'], FIXTURES));

export default {
  module: 'tactical-ai',
  sims: [
    {
      id: 'tie-spread', core, spec: ['TAI-007', 'TEC-015'],
      name: 'Two identical targets: the seed splits the choice (expect about 50 / 50)',
      async run(core, data, seed, p) {
        await ready();
        const v = baseView();
        v.doctrine = p.doctrine;
        v.allowedActions = [
          { type: 'shoot', apCost: 8, targets: [shootTarget('b1', 0.6), shootTarget('b2', 0.6)] },
          { type: 'endActivation', apCost: 0 },
        ];
        const cmd = core.decide(freeze(v), new Rng(seed)).commands[0];
        return { choice: cmd.type === 'shoot' ? cmd.target : cmd.type };
      },
      params: { doctrine: ['tac-balanced', 'tac-fit'] },
      metrics: ['choice'],
      seeds: 200,
    },
    {
      id: 'retreat-onset', core, spec: ['TAI-009'],
      name: 'Share of activations heading for the exit by soldiers lost (acceptableLoss 0.5 of 4)',
      async run(core, data, seed, p) {
        await ready();
        const v = retreatView(p.lost);
        v.doctrine = p.doctrine;
        const cmd = core.decide(freeze(v), new Rng(seed)).commands[0];
        const exitward = cmd.type === 'leaveMap'
          || (cmd.type === 'move' && cmd.path.at(-1).x === TOWARD_EXIT.x && cmd.path.at(-1).y === TOWARD_EXIT.y);
        return { exitward: exitward ? 1 : 0, action: cmd.type };
      },
      params: { lost: [0, 1, 2, 3], doctrine: ['tac-balanced', 'tac-goal'] },
      metrics: ['exitward', 'action'],
      seeds: 50,
    },
    {
      id: 'action-mix', core, spec: ['TAI-007', 'TAI-008', 'TAI-010', 'TAI-014'],
      name: 'What the active unit does by role and shot quality (behaviour profile per doctrine)',
      async run(core, data, seed, p) {
        await ready();
        const v = baseView();
        v.doctrine = p.doctrine;
        setRole(v, 'r1', p.role);
        v.allowedActions[1].targets = [shootTarget('b1', p.hitChance), shootTarget('b2', p.hitChance * 0.5)];
        const cmd = core.decide(freeze(v), new Rng(seed)).commands[0];
        return { action: cmd.type };
      },
      params: { role: ['flank', 'suppress', 'retreat'], hitChance: [0.2, 0.5, 0.8], doctrine: ['tac-balanced'] },
      metrics: ['action'],
      seeds: 30,
    },
  ],
};
