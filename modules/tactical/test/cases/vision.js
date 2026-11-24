// Vision, noise and reactions: TAC-016..TAC-023, TAC-075, TAC-081.
import { setup, soldier, rifle, battle, activate, pass, passTurn, endAct, ALWAYS, NEVER, testMap, near, side, request, asUnit, seeded } from '../helpers.js';

// Reaction layout: e1 at (10,12) faces north (cone ±60°). p1 starts at (18,10), outside the cone,
// and steps into it at (16,8), about 7 tiles away.
const reactionBattle = (c, o = {}) => battle(c, {
  player: [soldier({ id: 'p1', x: 18, y: 10, facing: 270, ...(o.p1 || {}) })],
  enemy: [soldier({ id: 'e1', x: 10, y: 12, facing: 0, reaction: o.reaction || 'fire', equipment: { weapon1: rifle(o.e1Weapon || {}) }, ...(o.e1 || {}) })],
  map: o.map, rng: o.rng || ALWAYS(),
});
const enterPath = [{ x: 17, y: 9 }, { x: 16, y: 8 }];
const attempts = (r, id = 'e1') => r.events.filter((e) => e.type === 'reactionAttempt' && e.reactor === id);

export default [
  // TAC-016
  {
    id: 'tac-016-vision-cone', spec: ['TAC-016'],
    name: 'Line of sight counts only inside the 120° cone and when not blocked',
    async run(ctx) {
      const c = await setup(ctx);
      const mk = (ex, ey, o = {}) => battle(c, { player: [soldier({ id: 'p1', x: 10, y: 10, facing: 0, ...o })], enemy: [soldier({ id: 'e1', x: ex, y: ey })] , map: o.map });
      ctx.assert.equal(c.lineOfSight(mk(10, 2), 'p1', 'e1'), true, 'straight ahead');
      ctx.assert.equal(c.lineOfSight(mk(17, 5), 'p1', 'e1'), true, '54° off the facing');
      ctx.assert.equal(c.lineOfSight(mk(10, 18), 'p1', 'e1'), false, 'behind');
      const rows = Array.from({ length: 20 }, (_, y) => (y === 6 ? '..........#.........' : '....................'));
      ctx.assert.equal(c.lineOfSight(mk(10, 2, { map: testMap(rows) }), 'p1', 'e1'), false, 'blocked by rock');
    },
  },
  {
    id: 'tac-016-helmet-cone', spec: ['TAC-016'],
    name: 'A helmet with visionConeDeg (Altyn 90°) narrows the cone',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 10, y: 10, facing: 0, equipment: { helmet: { item: 'altyn', durability: 60 } } })], enemy: [soldier({ id: 'e1', x: 17, y: 5 })] });
      ctx.assert.equal(c.lineOfSight(b, 'p1', 'e1'), false, '54° is outside ±45°');
    },
  },
  // TAC-017
  {
    id: 'tac-017-turn-cost', spec: ['TAC-017'],
    name: 'Turning on the spot costs turnCost per 90° or part of it',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.turnCost(0, 0), 0);
      ctx.assert.equal(c.turnCost(0, 45), 1);
      ctx.assert.equal(c.turnCost(0, 90), 1);
      ctx.assert.equal(c.turnCost(0, 135), 2);
      ctx.assert.equal(c.turnCost(0, 180), 2);
      ctx.assert.equal(c.turnCost(0, 225), 2, 'shortest way: 135°');
      ctx.assert.equal(c.turnCost(0, 315), 1, 'shortest way: 45°');
      const b = battle(c);
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'turn', facing: 135 });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 2);
    },
  },
  {
    id: 'tac-017-turning-along-path-free', spec: ['TAC-017'],
    name: 'Turning along a path while moving costs nothing extra',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, facing: 0 })] });
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'move', path: [{ x: 5, y: 6 }] }); // south, opposite the facing
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 2);
    },
  },
  // TAC-018
  {
    id: 'tac-018-hearing-range', spec: ['TAC-018'],
    name: 'Unsuppressed: whole map; suppressed 18; suppressed subsonic 6; hearing-penalty helmet halves',
    async run(ctx) {
      const c = await setup(ctx);
      const plain = { weapon: rifle() };
      const supp = { weapon: rifle({ mods: ['suppressor545'] }) };
      const sub = { weapon: rifle({ mods: ['suppressor545'], ammo: 'a545sub' }) };
      const deaf = soldier({ equipment: { helmet: { item: 'altyn', durability: 60 } } });
      ctx.assert.equal(c.hearingRange(plain, soldier()), Infinity);
      ctx.assert.equal(c.hearingRange(supp, soldier()), 18);
      ctx.assert.equal(c.hearingRange(sub, soldier()), 6);
      ctx.assert.equal(c.hearingRange(supp, deaf), 9);
      ctx.assert.equal(c.hearingRange(sub, deaf), 3);
      ctx.assert.equal(c.hearingRange(plain, deaf), Infinity);
    },
  },
  // TAC-019
  {
    id: 'tac-019-alerted-turns-to-noise', spec: ['TAC-019'],
    name: 'A soldier who hears a shot outside its cone is alerted and faces the source at its next activation, free',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: { weapon1: rifle() } })],
        enemy: [soldier({ id: 'e1', x: 5, y: 9, facing: 0 }), soldier({ id: 'e2', x: 5, y: 17, facing: 180 })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 0 });
      ctx.assert.equal(c.unit(b, 'e2').alerted, true);
      ctx.assert.ok((c.perceptionView(b, 'red').noises || []).length > 0, 'noise marker in the side\'s view');
      endAct(c, b, 'pmc');
      activate(c, b, 'red', 'e2');
      const e2 = c.unit(b, 'e2');
      ctx.assert.equal(e2.facing, 0, 'faces north, toward the shot');
      ctx.assert.equal(e2.ap, c.fullAp(soldier()), 'no AP spent');
      ctx.assert.equal(e2.alerted, false, 'cleared once applied');
    },
  },
  {
    id: 'tac-019-alert-no-reaction', spec: ['TAC-019'],
    name: 'Being alerted never triggers a reaction attempt',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: { weapon1: rifle() } })],
        enemy: [soldier({ id: 'e1', x: 5, y: 9, facing: 0 }), soldier({ id: 'e2', x: 5, y: 17, facing: 180, reaction: 'fire', equipment: { weapon1: rifle() } })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 0 });
      ctx.assert.equal(attempts(r, 'e2').length, 0);
    },
  },
  // TAC-081
  {
    id: 'tac-081-sight-range', spec: ['TAC-081'],
    name: 'Day sight = 25 + 0.25 × Perception + 0.1 × Recon (25–60)',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.sightRange(soldier(), {}), 42.5);
      near(ctx.assert, c.sightRange(soldier({ attributes: { perception: 100, recon: 100 } }), {}), 60);
      near(ctx.assert, c.sightRange(soldier({ attributes: { perception: 1, recon: 1 } }), {}), 25.35);
    },
  },
  {
    id: 'tac-081-concealment-and-spotting', spec: ['TAC-081', 'TAC-082'],
    name: 'Spotted when distance ≤ sight × concealment (design example: crouched ≈ 25, in brush ≈ 18)',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.concealmentFactor(soldier({ stance: 'crouched' }), {}), 0.6);
      near(ctx.assert, c.concealmentFactor(soldier({ stance: 'crouched' }), { obscuringTile: true }), 0.42);
      near(ctx.assert, c.concealmentFactor(soldier({ attributes: { recon: 100, agility: 100 } }), {}), 0.5);
      near(ctx.assert, c.spotDistance(soldier(), soldier({ stance: 'crouched' }), {}), 25.5);
      near(ctx.assert, c.spotDistance(soldier(), soldier({ stance: 'crouched' }), { obscuringTile: true }), 17.85);
      near(ctx.assert, c.spotDistance(soldier(), soldier({ stance: 'prone' }), {}), 19.125);
    },
  },
  {
    id: 'tac-081-no-roll-in-battle', spec: ['TAC-081'],
    name: 'Spotting in battle follows the values, no roll',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { map: testMap(40), player: [soldier({ id: 'p1', x: 20, y: 2, facing: 180 })],
        enemy: [soldier({ id: 'e1', x: 20, y: 30 }), soldier({ id: 'e2', x: 22, y: 32, stance: 'crouched' })] });
      ctx.assert.equal(c.spotted(b, 'p1', 'e1'), true, '28 tiles ≤ 31.875');
      ctx.assert.equal(c.spotted(b, 'p1', 'e2'), false, '30+ tiles > 25.5 crouched');
    },
  },
  // TAC-020
  {
    id: 'tac-020-entering-cone-triggers', spec: ['TAC-020'],
    name: 'Moving into a reactor\'s cone triggers one reaction check per entry',
    async run(ctx) {
      const c = await setup(ctx);
      const b = reactionBattle(c, { rng: NEVER() });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'move', path: [...enterPath, { x: 15, y: 8 }, { x: 14, y: 8 }] });
      ctx.assert.equal(attempts(r).length, 1, 'one attempt for the whole stretch inside the cone');
    },
  },
  {
    id: 'tac-020-visible-action-in-place', spec: ['TAC-020'],
    name: 'A visible action inside the cone (reload) triggers a check',
    async run(ctx) {
      const c = await setup(ctx);
      const b = reactionBattle(c, { rng: NEVER(), p1: { x: 16, y: 8, equipment: { weapon1: rifle({ rounds: 5 }), vest: { item: 'chestrig', contents: [{ item: 'mag545', rounds: 30, ammo: 'a545fmj', id: 'm1' }] } } } });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'reload', magazine: 'm1', sourceSlot: 'vest' });
      ctx.assert.equal(r.ok, true);
      ctx.assert.equal(attempts(r).length, 1);
    },
  },
  {
    id: 'tac-020-no-attempt-hold-suppressed', spec: ['TAC-020'],
    name: 'Reactors on Hold or suppressed make no attempt',
    async run(ctx) {
      const c = await setup(ctx);
      for (const o of [{ reaction: 'hold' }, { e1: { conditions: [{ type: 'suppressed' }] } }]) {
        const b = reactionBattle(c, o);
        activate(c, b, 'pmc', 'p1');
        ctx.assert.equal(attempts(c.act(b, 'pmc', { type: 'move', path: enterPath })).length, 0, JSON.stringify(o));
      }
    },
  },
  {
    id: 'tac-020-player-vip-never-reacts', spec: ['TAC-020', 'TAC-005'],
    name: 'A player-controlled VIP never reacts',
    async run(ctx) {
      const c = await setup(ctx);
      const vip = { ...asUnit(soldier({ id: 'vip1', reaction: 'fire', equipment: { weapon1: rifle() } })), rank: undefined, controller: 'player' };
      const req = request({ vipControl: 'player', sides: [side('pmc', 'player', [asUnit(soldier({ id: 'p1' })), vip]), side('red', 'ai', [asUnit(soldier({ id: 'e1' }))])] });
      const b = c.createBattle(req, { map: testMap(20), placements: { p1: { x: 1, y: 1 }, vip1: { x: 10, y: 12, facing: 0 }, e1: { x: 18, y: 10, facing: 270 } }, rng: ALWAYS() });
      pass(c, b, 'pmc');
      activate(c, b, 'red', 'e1');
      ctx.assert.equal(attempts(c.act(b, 'red', { type: 'move', path: enterPath }), 'vip1').length, 0);
    },
  },
  // TAC-021
  {
    id: 'tac-021-reaction-setting', spec: ['TAC-021'],
    name: 'Setting the reaction is free, repeatable within the activation and persists',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'setReaction', reaction: 'fire' });
      c.act(b, 'pmc', { type: 'setReaction', reaction: 'takeCover' });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap);
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      ctx.assert.equal(c.unit(b, 'p1').reaction, 'takeCover');
    },
  },
  // TAC-022
  {
    id: 'tac-022-reaction-chance', spec: ['TAC-022'],
    name: 'Chance = clamp(50 + (Perception − Agility)/2 + modifiers, 10, 90)',
    async run(ctx) {
      const c = await setup(ctx);
      const ch = (r, m, o = {}) => c.reactionChance(soldier(r), soldier(m), { distance: 5, ...o });
      ctx.assert.equal(ch({}, {}), 45, '50 − Recon 50 × 0.1 noise');
      ctx.assert.equal(ch({ attributes: { perception: 90 } }, { attributes: { agility: 10 } }), 85);
      ctx.assert.equal(ch({ attributes: { perception: 100 } }, { attributes: { agility: 1 } }), 90, 'clamped at 90');
      ctx.assert.equal(ch({ attributes: { perception: 1 } }, { attributes: { agility: 100 } }), 10, 'clamped at 10');
      ctx.assert.equal(ch({}, {}, { distance: 20 }), 40, '5 steps of 2 tiles beyond 10');
      ctx.assert.equal(ch({}, {}, { distance: 100 }), 25, 'distance malus capped at 20');
      ctx.assert.equal(ch({}, { stance: 'crouched' }), 35);
      ctx.assert.equal(ch({}, { stance: 'prone' }), 25);
      ctx.assert.equal(ch({}, {}, { sprinting: true }), 60);
      ctx.assert.equal(ch({}, {}, { sprinting: true, inPlace: true }), 45, 'no sprint modifier for an action in place');
      ctx.assert.equal(ch({}, { attributes: { recon: 100 } }), 40);
      ctx.assert.equal(ch({ conditions: [{ type: 'pain' }] }, {}), 35);
      ctx.assert.equal(ch({ zoneHp: { leftArm: 10, leftLeg: 0 } }, {}), 35, '−5 per wounded or disabled limb');
      ctx.assert.equal(ch({}, {}, { leaderBonus: 4 }), 49);
    },
  },
  // TAC-023
  {
    id: 'tac-023-fire-reaction-single-round', spec: ['TAC-023'],
    name: 'A Fire reaction is a single round whatever the selected fire mode; no AP spent',
    async run(ctx) {
      const c = await setup(ctx);
      const b = reactionBattle(c, { e1Weapon: { fireMode: 'auto' } });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'move', path: enterPath });
      const fire = r.events.find((e) => e.type === 'reactionFire' && e.reactor === 'e1');
      ctx.assert.ok(fire, 'reaction fired');
      ctx.assert.equal(fire.rounds, 1);
      ctx.assert.equal(fire.snapShot, true);
      ctx.assert.equal(c.unit(b, 'e1').equipment.weapon1.rounds, 29);
    },
  },
  {
    id: 'tac-023-take-cover', spec: ['TAC-023'],
    name: 'Take cover moves to the nearest tile within 1 with cover against the mover, else crouches',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(20, { edges: [{ x: 9, y: 12, side: 'n', cover: 'half', material: 'sandbag', kind: 'sandbag' }, { x: 9, y: 12, side: 'e', cover: 'half', material: 'sandbag', kind: 'sandbag' }] });
      const b = reactionBattle(c, { reaction: 'takeCover', map });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'move', path: enterPath });
      const e1 = c.unit(b, 'e1');
      ctx.assert.deepEqual([e1.x, e1.y], [9, 12]);
      ctx.assert.deepEqual([c.unit(b, 'p1').x, c.unit(b, 'p1').y], [16, 8], 'the mover continues');
      const b2 = reactionBattle(c, { reaction: 'takeCover' });
      activate(c, b2, 'pmc', 'p1');
      c.act(b2, 'pmc', { type: 'move', path: enterPath });
      ctx.assert.equal(c.unit(b2, 'e1').stance, 'crouched', 'no cover in range: crouch');
    },
  },
  {
    id: 'tac-023-failure-unnoticed', spec: ['TAC-023', 'TAC-022'],
    name: 'On failure the mover is not noticed; the stamina point is still spent',
    async run(ctx) {
      const c = await setup(ctx);
      const b = reactionBattle(c, { rng: NEVER() });
      const st = c.unit(b, 'e1').stamina;
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'move', path: enterPath });
      ctx.assert.equal(r.events.some((e) => e.type === 'reactionFire'), false);
      ctx.assert.equal(c.unit(b, 'e1').stamina, st - 1);
    },
  },
  // TAC-075
  {
    id: 'tac-075-overwatch', spec: ['TAC-075'],
    name: 'Overwatch costs overwatchCost AP; its Fire reaction is a full shot action without snap penalty',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 10, y: 12, facing: 0, reaction: 'fire', equipment: { weapon1: rifle({ fireMode: 'auto' }) } })],
        enemy: [soldier({ id: 'e1', x: 18, y: 10, facing: 270 })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'holdOverwatch' });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 4);
      ctx.assert.equal(c.unit(b, 'p1').overwatch, true);
      endAct(c, b, 'pmc');
      activate(c, b, 'red', 'e1');
      const r = c.act(b, 'red', { type: 'move', path: enterPath });
      const fire = r.events.find((e) => e.type === 'reactionFire' && e.reactor === 'p1');
      ctx.assert.ok(fire);
      ctx.assert.equal(fire.rounds, 5, 'auto mode: autoRounds');
      ctx.assert.equal(fire.snapShot, false);
    },
  },
  {
    id: 'tac-075-overwatch-ends', spec: ['TAC-075', 'TAC-015'],
    name: 'Overwatch ends when suppressed, when rounds < mode, and at the next activation',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: { weapon1: rifle({ fireMode: 'auto', rounds: 4 }) } })] });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'holdOverwatch' });
      ctx.assert.ok(!r.ok || c.unit(b, 'p1').overwatch === false, 'fewer rounds than the mode fires: no overwatch');
      const b2 = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: { weapon1: rifle() } })] });
      activate(c, b2, 'pmc', 'p1');
      c.act(b2, 'pmc', { type: 'holdOverwatch' });
      endAct(c, b2, 'pmc');
      pass(c, b2, 'red');
      activate(c, b2, 'pmc', 'p1');
      ctx.assert.equal(c.unit(b2, 'p1').overwatch, false, 'cleared at the start of the next activation');
    },
  },
];
