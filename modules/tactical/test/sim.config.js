// Tactical Layer — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
import * as turn from '../core/turn.js';
import { tacticalRules } from '../core/rules.js';
import { Rng } from '../../../shared/rng.js';

const fixtures = new URL('./fixtures', import.meta.url).href;

// Stamina rotation (TAC-005..TAC-012): each side activates one soldier per turn by a policy, or passes when
// nobody can act. Measures how often a side is forced to pass and how evenly activations spread.
async function rotation(_core, registry, seed, { policy, squad, endurance, sprintShare }) {
  if (!registry.loaded().includes('tactical-rules')) await registry.loadData(['tactical-rules'], fixtures);
  const R = tacticalRules(registry);
  const rng = new Rng(seed);
  const mkSquad = (side) => Array.from({ length: squad }, (_, i) => ({
    id: `${side}${i}`, attributes: { agility: 50, endurance: endurance + rng.int(-10, 10) },
    zones: { leftLeg: { hp: 70, max: 70 }, rightLeg: { hp: 70, max: 70 } },
  }));
  const b = turn.createBattle(R, { sides: [{ id: 'p', units: mkSquad('p') }, { id: 'o', units: mkSquad('o') }] });
  const counts = {}; let forced = 0;
  const TURNS = 40;
  while (b.turn <= TURNS) {
    const side = turn.currentSide(b);
    const ready = b.sides[side].units.map((id) => turn.soldier(b, id)).filter((u) => turn.canActivate(R, u));
    if (!ready.length) { forced++; turn.pass(b, side); continue; }
    const pick = policy === 'freshest'
      ? ready.reduce((a, u) => (u.stamina > a.stamina ? u : a))
      : ready[0]; // 'same': lean on the first soldier who can act
    turn.activate(b, side, pick.id);
    counts[pick.id] = (counts[pick.id] ?? 0) + 1;
    turn.endActivation(b, { sprinted: rng.next() < sprintShare });
  }
  const per = Object.values(counts);
  return {
    activations: per.reduce((a, n) => a + n, 0),
    forcedPasses: forced,
    maxShare: +(Math.max(...per) / per.reduce((a, n) => a + n, 0)).toFixed(3),
  };
}

export default {
  module: 'tactical',
  sims: [
    {
      id: 'stamina-rotation', spec: ['TAC-005', 'TAC-008', 'TAC-009', 'TAC-010', 'TAC-011', 'TAC-012'],
      name: 'Stamina rotation over 40 turns',
      run: rotation,
      params: { policy: ['freshest', 'same'], squad: [2, 4], endurance: [30, 70], sprintShare: [0, 0.5] },
      metrics: ['activations', 'forcedPasses', 'maxShare'],
      seeds: 20,
    },
  ],
};
