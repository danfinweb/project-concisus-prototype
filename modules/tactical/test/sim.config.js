// Tactical Layer — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// The runs drive the battle through the same core API as the scenarios (test/CORE-API.md).
import { soldier, rifle, battle as mkBattle, activate as act0, pass as pass0, endAct as end0, seeded, testMap } from './helpers.js';
import * as tacticalCore from '../core/index.js';

// The Test Lab currently passes core = null to run(); fall back to this module's own core.
const use = (core) => core || tacticalCore;
const battle = (core, o) => mkBattle(use(core), o);
const activate = (core, ...a) => act0(use(core), ...a);
const pass = (core, ...a) => pass0(use(core), ...a);
const endAct = (core, ...a) => end0(use(core), ...a);

const mags = (n) => ({ item: 'chestrig', contents: Array.from({ length: n }, (_, i) => ({ id: `m${i}`, item: 'mag545', rounds: 30, ammo: 'a545fmj' })) });

// One activation of a scripted rifleman: shoot single shots with the given aim until out of AP,
// reloading from the vest when the magazine is empty. Returns the shots fired.
function shootOut(core, b, faction, me, foe, aimSteps) {
  let shots = 0;
  for (let guard = 0; guard < 20; guard++) {
    if (core.unit(b, foe).status !== 'active') break;
    const r = core.act(b, faction, { type: 'shoot', target: foe, fireMode: 1, aimSteps });
    if (r.ok) { shots++; continue; }
    const mag = core.unit(b, me).equipment.vest?.contents?.find((m) => m.item === 'mag545' && m.rounds > 0);
    if (core.unit(b, me).equipment.weapon1.rounds === 0 && mag && core.act(b, faction, { type: 'reload', magazine: mag.id, sourceSlot: 'vest' }).ok) continue;
    if (core.unit(b, me).equipment.weapon1.jammed && core.act(b, faction, { type: 'clearJam' }).ok) continue;
    break;
  }
  return shots;
}

function duel(core, seed, p) {
  const n = Math.max(20, p.distance + 6);
  const mk = (id, y, facing) => soldier({ id, x: Math.floor(n / 2), y, facing, stance: p.stance,
    equipment: { weapon1: rifle(), vest: mags(3), ...(p.armour ? { bodyArmour: { item: p.armour, durability: 50 } } : {}) } });
  const b = battle(core, { map: testMap(n), player: [mk('p1', 2, 180)], enemy: [mk('e1', 2 + p.distance, 0)], seed, rng: seeded(seed) });
  let shots = 0; let turns = 0;
  const alive = (id) => core.unit(b, id).status === 'active';
  for (turns = 1; turns <= p.maxTurns; turns++) {
    for (const [f, me, foe] of [['pmc', 'p1', 'e1'], ['red', 'e1', 'p1']]) {
      if (!alive(me) || !alive(foe) || !activate(core, b, f, me).ok) { pass(core, b, f); continue; }
      shots += shootOut(core, b, f, me, foe, p.aimSteps);
      endAct(core, b, f);
    }
    if (!alive('p1') || !alive('e1')) break;
  }
  const winner = alive('p1') && !alive('e1') ? 'player' : alive('e1') && !alive('p1') ? 'opponent' : 'none';
  return { winner, turns: Math.min(turns, p.maxTurns), shots, firstMoverWon: winner === 'player' ? 1 : 0 };
}

export default {
  module: 'tactical',
  sims: [
    {
      id: 'duel-open', spec: ['TAC-005', 'TAC-039', 'TAC-040', 'TAC-044', 'TAC-045', 'TAC-048', 'TAC-050', 'TAC-057', 'TAC-059'],
      name: 'Two average riflemen trade aimed single shots on open ground',
      run: (core, data, seed, p) => duel(use(core), seed, { maxTurns: 40, ...p }),
      params: { distance: [8, 20, 35], stance: ['upright', 'prone'], aimSteps: [0, 2], armour: [null, 'plate4'] },
      metrics: ['winner', 'turns', 'shots', 'firstMoverWon'],
      seeds: 100,
    },
    {
      id: 'preview-vs-real', spec: ['TAC-046', 'TAC-045'],
      name: 'The shot preview\'s hit % matches the real hit rate within a few percent',
      run(core0, data, seed, p) {
        const core = use(core0);
        const b = battle(core, { map: testMap(Math.max(20, p.distance + 6)), seed, rng: seeded(seed),
          player: [soldier({ id: 'p1', x: 3, y: 2, facing: 180, equipment: { weapon1: rifle() } })],
          enemy: [soldier({ id: 'e1', x: 3, y: 2 + p.distance, facing: 0, stance: p.stance })] });
        const preview = core.previewShot(b, 'p1', 'e1', { fireMode: 1, aimSteps: p.aimSteps });
        activate(core, b, 'pmc', 'p1');
        const r = core.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: p.aimSteps });
        const hit = r.events.some((e) => e.type === 'hit' && e.target === 'e1') ? 100 : 0;
        return { previewHitPct: preview.hitPct, hitPct: hit, delta: preview.hitPct - hit };
      },
      params: { distance: [5, 15, 30], aimSteps: [0, 3], stance: ['upright', 'crouched'] },
      metrics: ['previewHitPct', 'hitPct', 'delta'],
      seeds: 300,
    },
    {
      id: 'stall-length', spec: ['TAC-013', 'TAC-011'],
      name: 'Two squads out of contact: turns until both sides are back at full stamina under the stall rule',
      run(core0, data, seed, p) {
        const core = use(core0);
        const b = battle(core, { map: testMap(60), seed, rng: seeded(seed),
          player: [soldier({ id: 'p1', x: 2, y: 2, stamina: 0 })], enemy: [soldier({ id: 'e1', x: 57, y: 57, stamina: 0, facing: 90 })] });
        let turns = 0;
        while (turns < 20 && core.unit(b, 'p1').stamina < core.unit(b, 'p1').maxStamina) { pass(core, b, 'pmc'); pass(core, b, 'red'); turns++; }
        return { turns, autoAdvance: core.state(b).autoAdvance ? 1 : 0 };
      },
      params: {},
      metrics: ['turns', 'autoAdvance'],
      seeds: 5,
    },
  ],
};
