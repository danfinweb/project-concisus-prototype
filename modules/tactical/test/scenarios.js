// Tactical Layer — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=tactical).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
import { tacticalRules } from '../core/rules.js';
import {
  createBattle, fullAp, activationAp, maxStamina, canActivate, canReact, mustPass,
  activate, endActivation, pass, currentSide, noteContact, addEffect, soldier,
} from '../core/turn.js';

// A soldier record as the battle uses it: attributes from the roster, legs with HP for TAC-009.
const mk = (id, { agility = 50, endurance = 50, legs = [70, 70], legsMax = [70, 70] } = {}) => ({
  id, attributes: { agility, endurance },
  zones: { leftLeg: { hp: legs[0], max: legsMax[0] }, rightLeg: { hp: legs[1], max: legsMax[1] } },
});

const twoSides = (R, a = [mk('p1'), mk('p2')], b = [mk('o1')]) =>
  createBattle(R, { sides: [{ id: 'player', units: a }, { id: 'opponent', units: b }] });

async function rules(ctx) {
  await ctx.loadFixtures(['tactical-rules']);
  return tacticalRules(ctx.registry);
}

export default {
  module: 'tactical',
  scenarios: [
    {
      id: 'tac-006-full-ap', spec: ['TAC-006'], name: 'Full AP = 25 + floor(Agility ÷ 10), 25–35',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        assert.equal(fullAp(R, mk('a', { agility: 1 })), 25);
        assert.equal(fullAp(R, mk('a', { agility: 49 })), 29);
        assert.equal(fullAp(R, mk('a', { agility: 50 })), 30);
        assert.equal(fullAp(R, mk('a', { agility: 100 })), 35);
      },
    },
    {
      id: 'tac-006-ap-modifiers', spec: ['TAC-006'], name: 'Only suppression, stun, pain and encumbrance lower the AP pool; never below 0',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const s = mk('a', { agility: 50 });
        assert.equal(activationAp(R, s, {}), 30);
        assert.equal(activationAp(R, s, { suppressed: true }), 25);
        assert.equal(activationAp(R, s, { suppressed: true, stunned: true, pain: true }), 11);
        assert.equal(activationAp(R, s, { encumbrance: 'over' }), 25);
        assert.equal(activationAp(R, s, { encumbrance: 'heavy' }), 20, 'heavy replaces over, no stacking');
        assert.equal(activationAp(R, s, { pain: true, painMasked: true }), 30, 'masked pain costs nothing');
        assert.equal(activationAp(R, mk('b', { agility: 1 }), { suppressed: true, stunned: true, pain: true, encumbrance: 'heavy' }), 0);
        const wounded = mk('c', { legs: [10, 0] });
        assert.equal(activationAp(R, wounded, {}), 30, 'wounds never reduce the AP pool');
      },
    },
    {
      id: 'tac-009-max-stamina', spec: ['TAC-009'], name: 'Max stamina = 2 + floor(Endurance ÷ 20) − 1 per wounded or disabled leg',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        assert.equal(maxStamina(R, mk('a', { endurance: 1 })), 2);
        assert.equal(maxStamina(R, mk('a', { endurance: 50 })), 4);
        assert.equal(maxStamina(R, mk('a', { endurance: 90 })), 6);
        assert.equal(maxStamina(R, mk('a', { endurance: 100 })), 7);
        assert.equal(maxStamina(R, mk('a', { endurance: 50, legs: [34, 70] })), 3, 'below 50% counts as wounded');
        assert.equal(maxStamina(R, mk('a', { endurance: 50, legs: [35, 70] })), 4, 'exactly 50% is not wounded');
        assert.equal(maxStamina(R, mk('a', { endurance: 50, legs: [0, 20] })), 2, 'a disabled leg counts as wounded');
        assert.equal(maxStamina(R, mk('a', { endurance: 1, legs: [0, 0] })), 0, 'never below 0');
      },
    },
    {
      id: 'tac-009-enter-at-max', spec: ['TAC-009'], name: 'Soldiers enter the battle at max stamina; current stamina is clamped to a lower max',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1'), mk('p2', { endurance: 90 })]);
        const p2 = soldier(b, 'p2');
        assert.equal(p2.stamina, 6, 'enters at max');
        p2.zones.leftLeg.hp = 10; p2.zones.rightLeg.hp = 0; // both legs hit mid-battle: max 6 → 4
        activate(b, 'player', 'p1'); endActivation(b);
        pass(b, 'opponent');                                 // turn end: p2 not activated
        assert.equal(p2.stamina, 4, 'clamped to the new max (recovery cannot exceed it)');
      },
    },
    {
      id: 'tac-005-turn-order', spec: ['TAC-005', 'TAC-010'], name: 'A turn is one player activation then one opponent activation; a side may reuse the same soldier',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1', { endurance: 90 }), mk('p2')]);
        assert.equal(b.turn, 1);
        assert.equal(currentSide(b), 'player');
        activate(b, 'player', 'p1'); endActivation(b);
        assert.equal(currentSide(b), 'opponent');
        assert.throws(() => activate(b, 'player', 'p1'), 'not the player side\'s slot');
        pass(b, 'opponent');
        assert.equal(b.turn, 2);
        assert.equal(currentSide(b), 'player');
        activate(b, 'player', 'p1'); // same soldier again is allowed
        assert.equal(soldier(b, 'p1').ap, 30, 'AP refilled to full on every activation');
      },
    },
    {
      id: 'tac-005-ap-lost', spec: ['TAC-005'], name: 'Unspent AP is lost at the end of an activation',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        activate(b, 'player', 'p1');
        soldier(b, 'p1').ap -= 7;
        endActivation(b);
        assert.equal(soldier(b, 'p1').ap, 0);
      },
    },
    {
      id: 'tac-007-final-facing', spec: ['TAC-007'], name: 'The final facing is set free at the end of an activation (8 directions)',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        activate(b, 'player', 'p1');
        const ap = soldier(b, 'p1').ap;
        endActivation(b, { facing: 5 });
        assert.equal(soldier(b, 'p1').facing, 5);
        assert.equal(ap, 30, 'no AP spent on the final facing');
        activate(b, 'opponent', 'o1');
        assert.throws(() => endActivation(b, { facing: 8 }), 'only 0–7');
      },
    },
    {
      id: 'tac-008-activation-cost', spec: ['TAC-008'], name: 'Activation needs and costs 2 stamina; +1 at the end after a sprint or over capacity',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1'), mk('p2')], [mk('o1'), mk('o2')]);
        activate(b, 'player', 'p1');
        assert.equal(soldier(b, 'p1').stamina, 2, '4 − 2');
        endActivation(b, { sprinted: true });
        assert.equal(soldier(b, 'p1').stamina, 1, 'sprint surcharge charged at the end');
        activate(b, 'opponent', 'o1');
        endActivation(b, { overCapacity: true });
        assert.equal(soldier(b, 'o1').stamina, 1, 'over-capacity surcharge');
      },
    },
    {
      id: 'tac-008-floor-zero', spec: ['TAC-008'], name: 'A soldier with exactly 2 stamina may sprint; the surcharge stops at 0',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1', { endurance: 1 })]);
        assert.equal(soldier(b, 'p1').stamina, 2);
        activate(b, 'player', 'p1');
        endActivation(b, { sprinted: true });
        assert.equal(soldier(b, 'p1').stamina, 0);
      },
    },
    {
      id: 'tac-012-exhaustion', spec: ['TAC-012', 'TAC-010'], name: 'Below 2 stamina a soldier cannot be activated; at 0 it cannot react; a side with nobody able must pass',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1', { endurance: 1 })], [mk('o1')]);
        const p1 = soldier(b, 'p1');
        assert.ok(canActivate(R, p1) && canReact(p1));
        activate(b, 'player', 'p1'); endActivation(b, { sprinted: true });
        assert.ok(!canActivate(R, p1));
        assert.ok(!canReact(p1));
        pass(b, 'opponent');                       // turn 1 ends; p1 was activated, so no recovery
        assert.ok(mustPass(b, 'player'), 'nobody on the player side can act');
        assert.throws(() => activate(b, 'player', 'p1'), 'cannot activate an exhausted soldier');
        pass(b, 'player');
        assert.equal(currentSide(b), 'opponent');
        pass(b, 'opponent');                       // turn 2 ends; p1 recovers 0 → 1
        assert.equal(p1.stamina, 1);
        assert.ok(!canActivate(R, p1), '1 stamina is still below the activation cost');
        assert.ok(canReact(p1), '1 stamina may react');
      },
    },
    {
      id: 'tac-010-pass-free', spec: ['TAC-010'], name: 'Passing is free and uses the side\'s slot of the turn',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        const before = soldier(b, 'p1').stamina;
        pass(b, 'player');
        assert.equal(currentSide(b), 'opponent');
        assert.equal(soldier(b, 'p1').stamina, before, 'no stamina spent by passing');
      },
    },
    {
      id: 'tac-011-recovery', spec: ['TAC-011'], name: 'Every soldier not activated in a turn recovers 1 stamina at turn end, up to max; reacting does not count',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R, [mk('p1'), mk('p2')], [mk('o1')]);
        activate(b, 'player', 'p1'); endActivation(b);          // p1: 4 → 2
        soldier(b, 'p2').stamina = 1; soldier(b, 'p2').reactedThisTurn = true; // p2 only reacted
        pass(b, 'opponent');                                     // turn end
        assert.equal(soldier(b, 'p1').stamina, 2, 'activated: no recovery');
        assert.equal(soldier(b, 'p2').stamina, 2, 'only reacted: recovers');
        assert.equal(soldier(b, 'o1').stamina, 4, 'already at max');
      },
    },
    {
      id: 'tac-013-stall', spec: ['TAC-013'], name: 'After 2 turns of both sides passing with no contact, turns advance automatically',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        pass(b, 'player'); pass(b, 'opponent');
        assert.ok(!b.autoAdvance, 'one quiet turn is not a stall');
        pass(b, 'player'); pass(b, 'opponent');
        assert.ok(b.autoAdvance, 'two quiet turns start the automatic advance');
      },
    },
    {
      id: 'tac-013-stall-stops', spec: ['TAC-013'], name: 'The advance stops when an enemy is seen or heard, or a side activates a soldier',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        for (let i = 0; i < 2; i++) { pass(b, 'player'); pass(b, 'opponent'); }
        assert.ok(b.autoAdvance);
        activate(b, 'player', 'p1');
        assert.ok(!b.autoAdvance, 'the player interrupts by activating');
        endActivation(b); pass(b, 'opponent');
        for (let i = 0; i < 2; i++) { pass(b, 'player'); pass(b, 'opponent'); }
        assert.ok(b.autoAdvance);
        noteContact(b);
        assert.ok(!b.autoAdvance, 'contact stops it');
        pass(b, 'player'); noteContact(b); pass(b, 'opponent');
        assert.ok(!b.autoAdvance, 'a turn with contact resets the count');
      },
    },
    {
      id: 'tac-014-durations', spec: ['TAC-014'], name: 'Durations count in turns; per-turn effects apply once at turn end',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const b = twoSides(R);
        let ticks = 0;
        addEffect(b, { id: 'smoke-1', turns: 2 });
        addEffect(b, { id: 'bleed-1', turns: null, onTurnEnd: () => { ticks++; } });
        pass(b, 'player');
        assert.equal(ticks, 0, 'nothing mid-turn');
        pass(b, 'opponent');
        assert.equal(ticks, 1, 'once at the end of turn 1');
        assert.ok(b.effects.some((e) => e.id === 'smoke-1'), 'smoke has 1 turn left');
        pass(b, 'player'); pass(b, 'opponent');
        assert.equal(ticks, 2);
        assert.ok(!b.effects.some((e) => e.id === 'smoke-1'), 'smoke expired after 2 turns');
        assert.ok(b.effects.some((e) => e.id === 'bleed-1'), 'untimed effects stay until removed');
      },
    },
    {
      id: 'tac-005-deterministic', spec: ['TAC-005'], name: 'Same inputs, same battle state (no hidden randomness)',
      async run(ctx) {
        const R = await rules(ctx), { assert } = ctx;
        const play = () => {
          const b = twoSides(R);
          activate(b, 'player', 'p1'); endActivation(b, { sprinted: true, facing: 2 });
          pass(b, 'opponent'); pass(b, 'player'); activate(b, 'opponent', 'o1'); endActivation(b);
          return JSON.stringify(b, (k, v) => (typeof v === 'function' ? undefined : v));
        };
        assert.equal(play(), play());
      },
    },
  ],
};
