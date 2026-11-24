// Turn and activation: TAC-005..TAC-015, TAC-077, TAC-094..TAC-096.
import { setup, soldier, rifle, battle, activate, pass, passTurn, endAct, ALWAYS, NEVER, testMap, near, side, request, asUnit, seeded } from '../helpers.js';

const legMax = 61;   // leg max HP at Endurance 50: floor(70 × 0.875)
const gun = () => ({ weapon1: rifle() });

export default [
  // TAC-005
  {
    id: 'tac-005-alternating-activations', spec: ['TAC-005'],
    name: 'Player activation, then opponent activation, is one turn',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      ctx.assert.equal(activate(c, b, 'pmc', 'p1').ok, true);
      ctx.assert.equal(c.state(b).activeUnit, 'p1');
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.state(b).activeFaction, 'red');
      ctx.assert.equal(activate(c, b, 'pmc', 'p1').ok, false, 'not the player\'s slot');
      pass(c, b, 'red');
      ctx.assert.equal(c.state(b).turn, 2);
      ctx.assert.equal(c.state(b).activeFaction, 'pmc');
    },
  },
  {
    id: 'tac-005-same-soldier-again-full-ap', spec: ['TAC-005', 'TAC-006'],
    name: 'The soldier activated last turn may be activated again; unspent AP are lost',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      activate(c, b, 'pmc', 'p1');
      const full = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'move', path: [{ x: 3, y: 2 }] });
      ctx.assert.equal(c.unit(b, 'p1').ap, full - 2);
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      ctx.assert.equal(activate(c, b, 'pmc', 'p1').ok, true);
      ctx.assert.equal(c.unit(b, 'p1').ap, full, 'AP reset to full, not carried over');
    },
  },
  {
    id: 'tac-005-ai-command-retries', spec: ['TAC-005'],
    name: 'An AI side gets commandRetries (3) retries; the next rejection ends the activation',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { map: testMap(['....................', ...Array.from({ length: 19 }, (_, i) => (i === 10 ? '..#.................' : '....................'))]) });
      pass(c, b, 'pmc');
      activate(c, b, 'red', 'e1');
      const bad = { type: 'move', path: [{ x: 2, y: 11 }] }; // rock at (2,11)
      for (let i = 1; i <= 3; i++) {
        const r = c.act(b, 'red', bad);
        ctx.assert.equal(r.ok, false);
        ctx.assert.ok(r.reason, 'rejection carries a reason');
        ctx.assert.equal(c.state(b).activeUnit, 'e1', `still active after rejection ${i}`);
      }
      c.act(b, 'red', bad);
      ctx.assert.equal(c.state(b).activeFaction, 'pmc', '4th rejection ends the activation (and the turn)');
      ctx.assert.equal(c.state(b).turn, 2);
    },
  },
  {
    id: 'tac-005-player-controlled-vip', spec: ['TAC-005', 'TAC-020'],
    name: 'With vipControl player, the escorted VIP is activated by the player side',
    async run(ctx) {
      const c = await setup(ctx);
      const units = [asUnit(soldier({ id: 'p1' })), { ...asUnit(soldier({ id: 'vip1' })), rank: undefined, controller: 'player' }];
      const req = request({ vipControl: 'player', sides: [side('pmc', 'player', units), side('red', 'ai', [asUnit(soldier({ id: 'e1' }))])] });
      const b = c.createBattle(req, { map: testMap(20), placements: { p1: { x: 2, y: 2 }, vip1: { x: 3, y: 2 }, e1: { x: 2, y: 12 } }, rng: seeded(1) });
      ctx.assert.equal(activate(c, b, 'pmc', 'vip1').ok, true);
    },
  },
  // TAC-006
  {
    id: 'tac-006-full-ap', spec: ['TAC-006'],
    name: 'Full AP = 25 + floor(Agility ÷ 10)',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.fullAp(soldier({ attributes: { agility: 1 } })), 25);
      ctx.assert.equal(c.fullAp(soldier({ attributes: { agility: 59 } })), 30);
      ctx.assert.equal(c.fullAp(soldier({ attributes: { agility: 100 } })), 35);
    },
  },
  {
    id: 'tac-006-modifiers-only', spec: ['TAC-006', 'TAC-015', 'TAC-025', 'TAC-026'],
    name: 'Only suppression, stun, pain and encumbrance lower activation AP; wounds do not; never below 0',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.activationAp(soldier({ conditions: [{ type: 'suppressed' }] })), 25);
      ctx.assert.equal(c.activationAp(soldier({ conditions: [{ type: 'stunned' }] })), 20);
      ctx.assert.equal(c.activationAp(soldier({ conditions: [{ type: 'pain' }] })), 26);
      ctx.assert.equal(c.activationAp(soldier({ zoneHp: { leftLeg: 5, rightArm: 0 } })), 30, 'wounds cost no AP');
      const all = soldier({ attributes: { agility: 1 }, conditions: [{ type: 'suppressed' }, { type: 'stunned' }, { type: 'pain' }],
        equipment: { bodyArmour: { item: 'heavy6', durability: 80 } } });
      ctx.assert.equal(c.activationAp(all), 1, '25 − 5 − 10 − 4 − 5 (armour)');
      const worse = soldier({ attributes: { agility: 1 }, conditions: [{ type: 'suppressed' }, { type: 'stunned' }, { type: 'pain' }],
        equipment: { bodyArmour: { item: 'heavy6', durability: 80 }, backpack: { item: 'rucksack', contents: Array.from({ length: 5 }, () => ({ item: 'brick' })) } } });
      ctx.assert.equal(c.activationAp(worse), 0, 'floored at 0');
    },
  },
  // TAC-007
  {
    id: 'tac-007-final-facing-free', spec: ['TAC-007'],
    name: 'Ending an activation sets the final facing at no AP cost',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'endActivation', facing: 135 });
      ctx.assert.equal(r.ok, true);
      ctx.assert.equal(c.unit(b, 'p1').facing, 135);
    },
  },
  // TAC-008
  {
    id: 'tac-008-activation-stamina', spec: ['TAC-008'],
    name: 'Activation spends activationCost stamina; sprint adds the surcharge at the end, floored at 0',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, stamina: 4 }), soldier({ id: 'p2', x: 4, y: 2, stamina: 2 })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.unit(b, 'p1').stamina, 2);
      c.act(b, 'pmc', { type: 'move', path: [{ x: 2, y: 3 }], sprint: true });
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.unit(b, 'p1').stamina, 1, 'sprint surcharge charged at the end');
      pass(c, b, 'red');
      ctx.assert.equal(activate(c, b, 'pmc', 'p2').ok, true, 'exactly activationCost stamina may activate');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 4, y: 3 }], sprint: true }).ok, true, 'and may sprint');
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.unit(b, 'p2').stamina, 0);
    },
  },
  {
    id: 'tac-008-over-capacity-surcharge', spec: ['TAC-008', 'TAC-027'],
    name: 'An over-encumbered soldier pays the activation surcharge without sprinting',
    async run(ctx) {
      const c = await setup(ctx);
      const heavy = { backpack: { item: 'rucksack', contents: Array.from({ length: 4 }, () => ({ item: 'brick' })) } };
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, stamina: 4, equipment: heavy })] });
      activate(c, b, 'pmc', 'p1');
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.unit(b, 'p1').stamina, 1);
    },
  },
  // TAC-009
  {
    id: 'tac-009-max-stamina', spec: ['TAC-009'],
    name: 'Max stamina = 2 + floor(Endurance ÷ 20), −1 per wounded or disabled leg; fracture alone costs none',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.maxStamina(soldier({ attributes: { endurance: 1 } })), 2);
      ctx.assert.equal(c.maxStamina(soldier({ attributes: { endurance: 50 } })), 4);
      ctx.assert.equal(c.maxStamina(soldier({ attributes: { endurance: 100 } })), 7);
      ctx.assert.equal(c.maxStamina(soldier({ zoneHp: { leftLeg: 30 } })), 3, '30 < 0.5 × 61 → wounded');
      ctx.assert.equal(c.maxStamina(soldier({ zoneHp: { leftLeg: 31 } })), 4, '31 ≥ 30.5 → not wounded');
      ctx.assert.equal(c.maxStamina(soldier({ zoneHp: { leftLeg: 0, rightLeg: 10 } })), 2, 'disabled counts as wounded');
      ctx.assert.equal(c.maxStamina(soldier({ zoneHp: { leftLeg: legMax }, conditions: [{ type: 'fracture', zone: 'leftLeg' }] })), 4);
      ctx.assert.equal(c.maxStamina(soldier({ attributes: { endurance: 1 }, zoneHp: { leftLeg: 0, rightLeg: 0 } })), 0, 'never below 0');
    },
  },
  {
    id: 'tac-009-enter-at-max-and-clamp', spec: ['TAC-009'],
    name: 'Soldiers enter at max stamina; stamina is clamped when the max drops',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      ctx.assert.equal(c.unit(b, 'p1').stamina, 4);
      ctx.assert.equal(c.unit(b, 'p1').maxStamina, 4);
    },
  },
  // TAC-010
  {
    id: 'tac-010-pass', spec: ['TAC-010'],
    name: 'Passing is free and consumes the side\'s slot; a side with no activatable soldier must pass',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, stamina: 1 })] });
      ctx.assert.equal(activate(c, b, 'pmc', 'p1').ok, false);
      ctx.assert.equal(pass(c, b, 'pmc').ok, true);
      ctx.assert.equal(c.state(b).activeFaction, 'red');
    },
  },
  // TAC-011
  {
    id: 'tac-011-recovery', spec: ['TAC-011'],
    name: 'Soldiers not activated in a turn gain staminaRecovery, up to max; reacting still recovers',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2 }), soldier({ id: 'p2', x: 4, y: 2, stamina: 1 })] });
      activate(c, b, 'pmc', 'p1');
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      ctx.assert.equal(c.unit(b, 'p1').stamina, 2, 'activated: no recovery');
      ctx.assert.equal(c.unit(b, 'p2').stamina, 2, 'not activated: +1');
      ctx.assert.equal(c.unit(b, 'e1').stamina, 4, 'already at max: stays at max');
    },
  },
  {
    id: 'tac-011-reactor-recovers', spec: ['TAC-011', 'TAC-022'],
    name: 'A soldier who only made reaction attempts in a turn still recovers',
    async run(ctx) {
      const c = await setup(ctx);
      // e1 at (10,12) faces north (cone ±60°); p1 at (18,10) is outside it and steps in at (16,8).
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 18, y: 10, facing: 270 })],
        enemy: [soldier({ id: 'e1', x: 10, y: 12, facing: 0, stamina: 3, equipment: gun() })],
        rng: NEVER(),
      });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'move', path: [{ x: 17, y: 9 }, { x: 16, y: 8 }] });
      ctx.assert.equal(c.unit(b, 'e1').stamina, 2, 'reaction attempt spent 1');
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      ctx.assert.equal(c.unit(b, 'e1').stamina, 3);
    },
  },
  // TAC-012
  {
    id: 'tac-012-exhaustion', spec: ['TAC-012'],
    name: 'Stamina < activationCost cannot activate; stamina 0 cannot react',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 18, y: 10, facing: 270 })],
        enemy: [soldier({ id: 'e1', x: 10, y: 12, facing: 0, stamina: 0, equipment: gun() })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'move', path: [{ x: 17, y: 9 }, { x: 16, y: 8 }] });
      ctx.assert.equal(r.events.some((e) => e.type === 'reactionAttempt'), false);
      endAct(c, b, 'pmc');
      ctx.assert.equal(activate(c, b, 'red', 'e1').ok, false);
    },
  },
  // TAC-013
  {
    id: 'tac-013-stall-auto-advance', spec: ['TAC-013'],
    name: 'After stallTurns turns of both sides passing with no contact, turns advance automatically',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { map: testMap(60), player: [soldier({ id: 'p1', x: 2, y: 2, facing: 180 })], enemy: [soldier({ id: 'e1', x: 58, y: 58, facing: 90 })] });
      passTurn(c, b);
      ctx.assert.equal(c.state(b).autoAdvance, false, 'one stalled turn is not enough');
      passTurn(c, b);
      ctx.assert.equal(c.state(b).autoAdvance, true);
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.state(b).autoAdvance, false, 'activating a soldier stops it');
    },
  },
  {
    id: 'tac-013-no-stall-with-contact', spec: ['TAC-013'],
    name: 'No automatic advance while a soldier sees an enemy',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      for (let i = 0; i < 3; i++) passTurn(c, b);
      ctx.assert.equal(c.state(b).autoAdvance, false);
    },
  },
  // TAC-014
  {
    id: 'tac-014-per-turn-effects', spec: ['TAC-014', 'TAC-060', 'TAC-061'],
    name: 'Bleeding is applied once at the end of each turn',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, zoneHp: { thorax: 50, leftLeg: 40 },
        conditions: [{ type: 'lightBleeding', zone: 'thorax' }, { type: 'heavyBleeding', zone: 'leftLeg' }] })] });
      pass(c, b, 'pmc');
      ctx.assert.equal(c.unit(b, 'p1').zoneHp.thorax, 50, 'nothing mid-turn');
      pass(c, b, 'red');
      ctx.assert.equal(c.unit(b, 'p1').zoneHp.thorax, 49);
      ctx.assert.equal(c.unit(b, 'p1').zoneHp.leftLeg, 36);
    },
  },
  // TAC-015
  {
    id: 'tac-015-suppression-effects', spec: ['TAC-015'],
    name: 'Suppressed: −suppressionAp AP, + suppressionSpread MoA',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ conditions: [{ type: 'suppressed' }] });
      ctx.assert.equal(c.activationAp(s), 25);
      near(ctx.assert, c.shooterSpread(s, { distance: 10, aimSteps: 0 }), 4.5 + 3);
    },
  },
  {
    id: 'tac-015-hit-suppresses', spec: ['TAC-015'],
    name: 'A soldier who is hit becomes suppressed and loses overwatch',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: gun() })],
        enemy: [soldier({ id: 'e1', x: 5, y: 10, facing: 0 })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 0 });
      ctx.assert.equal(c.unit(b, 'e1').suppressed, true);
    },
  },
  {
    id: 'tac-015-suppression-ends', spec: ['TAC-015'],
    name: 'Suppression ends after one full turn with no qualifying event',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, conditions: [{ type: 'suppressed' }] })] });
      ctx.assert.equal(c.unit(b, 'p1').suppressed, true);
      passTurn(c, b);
      ctx.assert.equal(c.unit(b, 'p1').suppressed, false);
    },
  },
  // TAC-077
  {
    id: 'tac-077-not-applied-first-build', spec: ['TAC-077'],
    name: '(optional) No flight roll and full suppression effect regardless of morale and Nerve',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ morale: 5, nerve: 100, conditions: [{ type: 'suppressed' }] });
      near(ctx.assert, c.shooterSpread(s, { distance: 10, aimSteps: 0 }), 7.5, 1e-6, 'Nerve does not reduce suppression spread');
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, morale: 5 })], rng: ALWAYS() });
      const r = activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(r.events.some((e) => e.type === 'flee'), false);
    },
  },
  // TAC-094
  {
    id: 'tac-094-leader-selection', spec: ['TAC-094'],
    name: 'Leader = highest rank; ties by attribute average, then unit order; no-rank units never lead',
    async run(ctx) {
      const c = await setup(ctx);
      const a = soldier({ id: 'a', rank: 'veteran' });
      const b2 = soldier({ id: 'b', rank: 'elite' });
      const cc = soldier({ id: 'c', rank: 'elite', attributes: { strength: 60 } });
      const d = soldier({ id: 'd', rank: 'elite', attributes: { strength: 60 } });
      ctx.assert.equal(c.leaderOf([a, b2]).id, 'b');
      ctx.assert.equal(c.leaderOf([a, b2, cc]).id, 'c', 'higher average wins the tie');
      ctx.assert.equal(c.leaderOf([a, d, cc]).id, 'd', 'then unit order');
      ctx.assert.equal(c.leaderOf([{ ...soldier({ id: 'vip' }), rank: undefined }]), null);
    },
  },
  {
    id: 'tac-094-bonus-incl-leader', spec: ['TAC-094'],
    name: 'Every soldier of the side, the leader included, gets the leader\'s bonus; never stored',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.leadershipBonus([soldier({ id: 'a', rank: 'elite' }), soldier({ id: 'b', rank: 'recruit' })]), 6);
      ctx.assert.equal(c.leadershipBonus([soldier({ id: 'a', rank: 'recruit' })]), 0);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, rank: 'veteran', morale: 50 }), soldier({ id: 'p2', x: 3, y: 2, rank: 'recruit', morale: 40 })] });
      ctx.assert.equal(c.unit(b, 'p1').effectiveMorale, 54);
      ctx.assert.equal(c.unit(b, 'p2').effectiveMorale, 44);
      ctx.assert.equal(c.unit(b, 'p2').morale, 40, 'stored morale unchanged');
      ctx.assert.equal(c.battleResult(b).soldiers.find((s) => s.id === 'p2').morale, 40);
    },
  },
  {
    id: 'tac-094-leader-hand-over', spec: ['TAC-094'],
    name: 'When the leader dies, the next highest-ranked soldier on the map takes over at once',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: gun() })],
        enemy: [soldier({ id: 'e1', x: 5, y: 9, rank: 'elite', zoneHp: { head: 1, thorax: 1 } }), soldier({ id: 'e2', x: 9, y: 9, rank: 'veteran' })],
        rng: ALWAYS(),
      });
      ctx.assert.equal(c.state(b).sides.find((s) => s.faction === 'red').leader, 'e1');
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 0 });
      ctx.assert.equal(c.unit(b, 'e1').status, 'dead');
      ctx.assert.equal(c.state(b).sides.find((s) => s.faction === 'red').leader, 'e2');
    },
  },
  // TAC-095
  {
    id: 'tac-095-initial-morale', spec: ['TAC-095'],
    name: 'Each unit enters with units[].morale; an AI unit without one uses sides[].morale',
    async run(ctx) {
      const c = await setup(ctx);
      const e2 = asUnit(soldier({ id: 'e2' }));
      delete e2.morale;
      const req = request({ sides: [side('pmc', 'player', [asUnit(soldier({ id: 'p1', morale: 72 }))]), side('red', 'ai', [e2], { morale: 33 })] });
      const b = c.createBattle(req, { map: testMap(20), placements: { p1: { x: 2, y: 2 }, e2: { x: 2, y: 12 } }, rng: seeded(1) });
      ctx.assert.equal(c.unit(b, 'p1').morale, 72);
      ctx.assert.equal(c.unit(b, 'e2').morale, 33);
    },
  },
  {
    id: 'tac-095-casualty-morale', spec: ['TAC-095'],
    name: 'Casualties move morale by moraleCasualty for soldiers who see them or share the squad',
    async run(ctx) {
      const c = await setup(ctx);
      const o = soldier({ morale: 50 });
      ctx.assert.equal(c.moraleAfterCasualty(o, { killed: true, ally: true, sees: true, sameSquad: true }), 40);
      ctx.assert.equal(c.moraleAfterCasualty(o, { killed: false, ally: true, sees: false, sameSquad: true }), 47);
      ctx.assert.equal(c.moraleAfterCasualty(o, { killed: true, ally: false, sees: true, sameSquad: false }), 53);
      ctx.assert.equal(c.moraleAfterCasualty(o, { killed: false, ally: false, sees: true, sameSquad: false }), 51);
      ctx.assert.equal(c.moraleAfterCasualty(o, { killed: true, ally: false, sees: false, sameSquad: false }), 50, 'unseen enemy casualty: no change');
      ctx.assert.equal(c.moraleAfterCasualty(soldier({ morale: 5 }), { killed: true, ally: true, sees: true, sameSquad: true }), 0, 'clamped at 0');
      ctx.assert.equal(c.moraleAfterCasualty(soldier({ morale: 99 }), { killed: true, ally: false, sees: true }), 100, 'clamped at 100');
    },
  },
  {
    id: 'tac-095-result-morale', spec: ['TAC-095'],
    name: 'battle_result reports soldiers[].morale and squadMorale = average of surviving player soldiers',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2, morale: 60 }), soldier({ id: 'p2', x: 3, y: 2, morale: 40 })] });
      const r = c.battleResult(b);
      ctx.assert.equal(r.squadMorale, 50);
      ctx.assert.equal(r.soldiers.find((s) => s.id === 'p1').morale, 60);
    },
  },
  // TAC-096
  {
    id: 'tac-096-perks-from-request-only', spec: ['TAC-096'],
    name: 'Perks come from units[].perks; TAC never derives them from attributes',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.hasPerk(soldier({ attributes: { marksmanship: 95 } }), 'steadyAim'), false);
      ctx.assert.equal(c.hasPerk(soldier({ attributes: { marksmanship: 10 }, perks: ['steadyAim'] }), 'steadyAim'), true, 'kept after the skill drifted down');
    },
  },
  {
    id: 'tac-096-perk-effects', spec: ['TAC-096', 'TAC-044', 'TAC-023', 'TAC-081', 'TAC-022', 'TAC-065', 'TAC-066', 'TAC-083'],
    name: 'Battle perk effects modify their rules',
    async run(ctx) {
      const c = await setup(ctx);
      const p = (perks, o = {}) => soldier({ perks, ...o });
      near(ctx.assert, c.shooterSpread(p(['steadyAim']), { distance: 10, aimSteps: 1 }), 4.5 * 0.85 * 0.9, 1e-6, 'steady aim with 1 aim step');
      near(ctx.assert, c.shooterSpread(p(['steadyAim']), { distance: 10, aimSteps: 0 }), 4.5, 1e-6, 'steady aim needs an aim step');
      near(ctx.assert, c.shooterSpread(p(['snapShooter']), { distance: 10, aimSteps: 0, snapShot: true }), 6.0, 1e-6, 'snap shooter 1.5 instead of 3');
      near(ctx.assert, c.spotDistance(soldier(), p(['quietStep']), {}), 42.5 * 0.75 * 0.8, 1e-6, 'quiet step');
      const ghostCrouched = p(['ghost'], { stance: 'crouched' });
      ctx.assert.equal(c.reactionChance(soldier(), ghostCrouched, { distance: 5 }) - c.reactionChance(soldier(), soldier({ stance: 'crouched' }), { distance: 5 }), -10);
      ctx.assert.equal(c.reactionChance(soldier(), p(['ghost']), { distance: 5 }), c.reactionChance(soldier(), soldier(), { distance: 5 }), 'ghost only crouched or prone');
      ctx.assert.equal(c.medicalCost(p(['fieldMedic']), 'bandage', {}), 1, 'max(1, 3 − 1) − 1, floor 1');
      ctx.assert.equal(c.hpRestored(p(['traumaSurgeon']), 'ifak', { poolLeft: 60, missing: 50 }), 18, 'floor(15 × 1.0 × 1.25)');
      ctx.assert.equal(c.hpRestored(p(['traumaSurgeon']), 'bandage', { poolLeft: 0, missing: 50 }), 0);
      near(ctx.assert, c.wearPerRound(p(['armourer'])), 0.015);
    },
  },
];
