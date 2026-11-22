// Tactical AI (unit and squad AI) — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// Example (tactical): { id: 'duel', run: (core, data, seed, p) => core.resolveBattle(/* … */),
//                       params: { attackerPreset: ['rifleman'], terrain: ['open', 'urban'] },
//                       metrics: ['winner', 'turns', 'casualties'], seeds: 200 }
export default {
  module: 'tactical-ai',
  sims: [],
};
