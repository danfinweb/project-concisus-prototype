// Battle frame: TAC-001..TAC-004, TAC-076, TAC-078, TAC-080.
import { setup, soldier, rifle, battle, request, activate, pass, passTurn, endAct, ALWAYS, testMap, near } from '../helpers.js';

const gun = (o = {}) => ({ weapon1: rifle(o) });

export default [
  {
    id: 'tac-001-neutral-never-activates', spec: ['TAC-001', 'TAC-005'],
    name: 'A neutral side is never given an activation until it turns hostile',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { neutral: [soldier({ id: 'n1', x: 15, y: 15 })] });
      const civ = c.state(b).sides.find((s) => s.faction === 'civ');
      ctx.assert.equal(civ.hostile, false);
      passTurn(c, b);
      ctx.assert.equal(c.state(b).activeFaction, 'pmc', 'turn order skips the neutral side');
      ctx.assert.equal(activate(c, b, 'civ', 'n1').ok, false);
    },
  },
  {
    id: 'tac-001-attacked-neutral-turns-hostile', spec: ['TAC-001', 'TAC-005'],
    name: 'An attacked neutral turns hostile to the attacker and activates third',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90, equipment: gun() })],
        neutral: [soldier({ id: 'n1', x: 9, y: 5, facing: 270 })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'shoot', target: 'n1', fireMode: 1, aimSteps: 0 }).ok, true);
      endAct(c, b, 'pmc');
      const civ = c.state(b).sides.find((s) => s.faction === 'civ');
      ctx.assert.equal(civ.hostile, true, 'neutral faction is now hostile');
      pass(c, b, 'red');
      ctx.assert.equal(c.state(b).activeFaction, 'civ', 'third side activates after the opponent');
    },
  },
  {
    id: 'tac-001-civilian-flees-armed-neutral-covers', spec: ['TAC-001', 'TAC-023'],
    name: 'A shot within neutralReactRadiusTiles makes a civilian flee, free of stamina and AI calls',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90, equipment: gun() })],
        enemy: [soldier({ id: 'e1', x: 12, y: 5, facing: 270 })],
        neutral: [soldier({ id: 'n1', x: 12, y: 7, equipment: {} })],
        rng: ALWAYS(),
      });
      const stamina0 = c.unit(b, 'n1').stamina;
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 0 });
      const ev = r.events.find((e) => e.type === 'neutralReaction' && e.unit === 'n1');
      ctx.assert.ok(ev, 'neutral reacts to a shot landing 2 tiles away');
      ctx.assert.equal(ev.reaction, 'flee', 'unarmed civilian flees');
      ctx.assert.equal(c.unit(b, 'n1').stamina, stamina0, 'neutral reaction costs no stamina');
    },
  },
  {
    id: 'tac-002-turn-based-from-start', spec: ['TAC-002'],
    name: 'The battle starts in turn 1 with the player side to act',
    async run(ctx) {
      const c = await setup(ctx);
      const s = c.state(battle(c));
      ctx.assert.equal(s.turn, 1);
      ctx.assert.equal(s.activeFaction, 'pmc');
    },
  },
  {
    id: 'tac-003-day-night-boundaries', spec: ['TAC-003'],
    name: '06:00 up to 21:00 is day, 21:00 up to 06:00 is night',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.isNight(5), true);
      ctx.assert.equal(c.isNight(6), false);
      ctx.assert.equal(c.isNight(20), false);
      ctx.assert.equal(c.isNight(21), true);
      ctx.assert.equal(c.isNight(0), true);
      ctx.assert.equal(c.state(battle(c, { hour: 22 })).night, true);
    },
  },
  {
    id: 'tac-003-one-hour-regardless-of-turns', spec: ['TAC-003'],
    name: 'battle_result.gameTimeHours is 1 however many turns were played',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c);
      for (let i = 0; i < 5; i++) passTurn(c, b);
      ctx.assert.equal(c.battleResult(b).gameTimeHours, 1);
    },
  },
  {
    id: 'tac-004-night-sight', spec: ['TAC-004', 'TAC-081'],
    name: 'Night sight = day × 1/3; an active flashlight restores the day range',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier();
      near(ctx.assert, c.sightRange(s, { night: false }), 42.5);
      near(ctx.assert, c.sightRange(s, { night: true }), 42.5 / 3, 1e-6);
      const lit = soldier({ equipment: { weapon1: rifle({ mods: ['flashlight'], light: true }) } });
      near(ctx.assert, c.sightRange(lit, { night: true }), 42.5);
    },
  },
  {
    id: 'tac-004-blinded-spread', spec: ['TAC-004', 'TAC-044'],
    name: 'A blinded soldier has shooter spread + blindSpread',
    async run(ctx) {
      const c = await setup(ctx);
      const base = c.shooterSpread(soldier(), { distance: 10, aimSteps: 0 });
      const blind = c.shooterSpread(soldier({ conditions: [{ type: 'blinded' }] }), { distance: 10, aimSteps: 0 });
      near(ctx.assert, blind - base, 4);
    },
  },
  {
    id: 'tac-004-flashlight-blinds-in-cone', spec: ['TAC-004'],
    name: 'At night a lit flashlight blinds enemies inside its cone within blindRangeTiles',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        hour: 23,
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: { weapon1: rifle({ mods: ['flashlight'], light: true }) } })],
        enemy: [soldier({ id: 'e1', x: 5, y: 12, facing: 0 }), soldier({ id: 'e2', x: 5, y: 19, facing: 0 })],
      });
      ctx.assert.equal(c.unit(b, 'e1').conditions.some((x) => x.type === 'blinded'), true, '7 tiles: blinded');
      ctx.assert.equal(c.unit(b, 'e2').conditions.some((x) => x.type === 'blinded'), false, '14 tiles: not blinded');
    },
  },
  {
    id: 'tac-076-objective-met-and-kept', spec: ['TAC-076'],
    name: 'killVip is marked met with its turn and stays met',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: gun() })],
        enemy: [soldier({ id: 'v1', x: 5, y: 8, facing: 0, zoneHp: { head: 1, thorax: 1 } })],
        objectives: [{ id: 'o1', missionId: 'm1', type: 'killVip', targets: ['v1'] }],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'v1', fireMode: 1, aimSteps: 0 });
      ctx.assert.ok(r.events.some((e) => e.type === 'objectiveMet' && e.objective === 'o1'), 'notification event');
      const o = c.objectives(b).find((x) => x.id === 'o1');
      ctx.assert.equal(o.met, true);
      ctx.assert.equal(o.metTurn, 1);
      const res = c.battleResult(b).objectives.find((x) => x.id === 'o1');
      ctx.assert.equal(res.met, true);
    },
  },
  {
    id: 'tac-078-flags-ignored-until-built', spec: ['TAC-078'],
    name: '(optional) contaminated and mined flags change nothing in the first build',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { region: { id: 'r1', terrain: 'steppe', biome: 'steppe', flags: ['contaminated', 'mined'] } });
      const hp0 = JSON.stringify(c.unit(b, 'p1').zoneHp);
      passTurn(c, b);
      ctx.assert.equal(JSON.stringify(c.unit(b, 'p1').zoneHp), hp0);
    },
  },
  {
    id: 'tac-080-same-request-same-map', spec: ['TAC-080', 'TAC-093'],
    name: 'The same request and rules version always give the same map',
    async run(ctx) {
      const c = await setup(ctx);
      const req = request({ seed: 4812 });
      ctx.assert.deepEqual(c.generateMap(req), c.generateMap(req));
      ctx.assert.notEqual(JSON.stringify(c.generateMap(request({ seed: 4813 })).tiles), JSON.stringify(c.generateMap(req).tiles));
    },
  },
  {
    id: 'tac-080-terrain-from-biome-table', spec: ['TAC-080'],
    name: 'Tactical terrain is drawn only from the biome\'s terrain table',
    async run(ctx) {
      const c = await setup(ctx);
      const m = c.generateMap(request({ seed: 9 }));
      const used = new Set(m.tiles.flat());
      for (const t of used) ctx.assert.ok(['grass', 'road', 'floor', 'field', 'mud', 'shallowWater', 'rubble', 'brush', 'stairs', 'rock', 'deepWater'].includes(t), `terrain ${t} is in table steppe`);
      ctx.assert.equal(used.has('trees') || used.has('trunk') || used.has('asphaltUrban'), false);
    },
  },
  {
    id: 'tac-080-exits-from-request-plus-plain', spec: ['TAC-080', 'TAC-038'],
    name: 'Every request exit is placed; plain exits fill up to 2–4 with unique ids',
    async run(ctx) {
      const c = await setup(ctx);
      const m = c.generateMap(request({ seed: 3, exits: [{ id: 'boat', condition: 'boatAtTurn', params: { turn: 8 } }] }));
      ctx.assert.ok(m.exits.length >= 2 && m.exits.length <= 4, `exit count ${m.exits.length}`);
      ctx.assert.ok(m.exits.some((e) => e.id === 'boat' && e.condition === 'boatAtTurn'));
      ctx.assert.equal(new Set(m.exits.map((e) => e.id)).size, m.exits.length, 'ids unique');
    },
  },
];
