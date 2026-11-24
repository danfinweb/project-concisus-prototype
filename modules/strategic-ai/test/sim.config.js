// Strategic AI (faction AI) — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// Example (tactical): { id: 'duel', run: (core, data, seed, p) => core.resolveBattle(/* … */),
//                       params: { attackerPreset: ['rifleman'], terrain: ['open', 'urban'] },
//                       metrics: ['winner', 'turns', 'casualties'], seeds: 200 }
//
// The runner passes core = null and the registry as `data`; each sim loads its own core and the fixtures.
// The strategic AI has no loop of its own (Strategic resolves the commands), so these sims run one
// controller call per seed on a random view and measure the decisions across many seeds. A full-loop
// run with the strategic module belongs in the cross-sim (tools/), once both adapters exist.
import { TABLES, randomView, violations, targetsPlayer, hostileToPlayer, loadCore, Rng } from './helpers.js';

let ready = null;
async function prepare(data) {
  ready ??= data.loadData(TABLES, new URL('./fixtures', import.meta.url).href.replace(/\/$/, ''));
  await ready;
  return loadCore();
}

const DOCTRINE_FACTION = { ssv: 'ssv', vdk: 'vdk', varyag: 'varyag', aegis: 'aegis', krug: 'krug', resistance: 'res-1', rogue: 'varyag' };

export default {
  module: 'strategic-ai',
  sims: [
    {
      id: 'hour-legality', spec: ['SAI-004', 'SAI-005', 'SAI-012', 'SAI-013', 'SAI-014'],
      name: 'One hour on a random map: illegal commands, player targeting, spending, call time',
      params: { faction: ['ssv', 'vdk', 'varyag', 'aegis', 'krug'], standing: ['neutral', 'unfriendly', 'hostile'] },
      metrics: ['commands', 'violations', 'playerTargeting', 'offers', 'recruits', 'ms'],
      seeds: 100,
      async run(_core, data, seed, p) {
        const core = await prepare(data);
        const v = randomView(seed, { faction: p.faction, standing: p.standing });
        const t0 = performance.now();
        const res = core.decide(v, new Rng(seed));
        const ms = performance.now() - t0;
        const cs = res.commands;
        return {
          commands: cs.length,
          violations: violations(v, res).length, // must stay 0
          playerTargeting: cs.filter((c) => targetsPlayer(v, c)).length, // 0 unless hostileToPlayer(v)
          hostile: hostileToPlayer(v) ? 1 : 0,
          offers: cs.filter((c) => c.type === 'offerContract').length,
          recruits: cs.filter((c) => c.type === 'recruit').length,
          ms,
        };
      },
    },
    {
      id: 'doctrine-character', spec: ['SAI-008', 'SAI-010', 'SAI-014'],
      name: 'Doctrine character on random maps: share of attack goals, holds and contract offers',
      params: { doctrine: ['ssv', 'vdk', 'varyag', 'aegis', 'krug', 'resistance', 'rogue'] },
      metrics: ['attackShare', 'holdShare', 'offers', 'setGoals'],
      seeds: 100,
      async run(_core, data, seed, p) {
        const core = await prepare(data);
        const v = randomView(seed, { faction: DOCTRINE_FACTION[p.doctrine], squads: 3, funds: 50000, standing: 'neutral' });
        v.doctrine = p.doctrine;
        const cs = core.decide(v, new Rng(seed)).commands;
        const goals = cs.filter((c) => c.type === 'setGoal');
        const actions = cs.filter((c) => ['moveSquad', 'hold', 'scout', 'attack'].includes(c.type));
        return {
          attackShare: goals.length ? goals.filter((c) => ['attackPoi', 'hunt'].includes(c.goal)).length / goals.length : 0,
          holdShare: actions.length ? actions.filter((c) => c.type === 'hold').length / actions.length : 0,
          offers: cs.filter((c) => c.type === 'offerContract').length,
          setGoals: goals.length,
        };
      },
    },
  ],
};
