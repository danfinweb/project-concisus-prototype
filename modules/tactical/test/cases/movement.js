// Action costs, AP modifiers and movement: TAC-024..TAC-038.
import { setup, soldier, rifle, battle, activate, pass, endAct, ALWAYS, testMap, near } from '../helpers.js';

const bricks = (n) => Array.from({ length: n }, () => ({ item: 'brick' }));
const pack = (n) => ({ backpack: { item: 'rucksack', contents: bricks(n) } }); // 3 kg + n × 10 kg

export default [
  // TAC-024
  {
    id: 'tac-024-cost-order', spec: ['TAC-024'],
    name: 'Base × all factors, + additive terms, rounded down, at least 1; free actions stay 0',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.actionCost(2, { factors: [1.5, 2], add: [1] }), 7);
      ctx.assert.equal(c.actionCost(5, { factors: [1.5], add: [] }), 7, 'floor(7.5)');
      ctx.assert.equal(c.actionCost(5, { factors: [1.5], add: [-1, 0.5] }), 7, 'floor(7.0)');
      ctx.assert.equal(c.actionCost(2, { add: [-3] }), 1, 'never below 1');
      ctx.assert.equal(c.actionCost(0, { free: true }), 0, 'free actions exempt from the minimum');
    },
  },
  {
    id: 'tac-024-cannot-start-unaffordable', spec: ['TAC-024'],
    name: 'An action costing more AP than left cannot be started',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, attributes: { agility: 1 } })] });
      activate(c, b, 'pmc', 'p1');
      const path = Array.from({ length: 12 }, (_, i) => ({ x: 5, y: 6 + i })); // 12 × 2 = 24 of 25 AP
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path }).ok, true);
      ctx.assert.equal(c.unit(b, 'p1').ap, 1);
      ctx.assert.equal(c.act(b, 'pmc', { type: 'changeStance', stance: 'crouched' }).ok, false, '2 AP needed, 1 left');
    },
  },
  // TAC-025
  {
    id: 'tac-025-stun', spec: ['TAC-025'],
    name: 'A non-lethal head hit (blunt too) stuns with stunChance; −stunApLoss next activation, then clears',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.hitEffects(soldier(), 'head', { damage: 5 }, ALWAYS()).stunned, true);
      ctx.assert.equal(c.hitEffects(soldier(), 'head', { damage: 5, blunt: true }, ALWAYS()).stunned, true);
      ctx.assert.equal(c.hitEffects(soldier(), 'head', { damage: 5 }, { ...ALWAYS(), next: () => 0.36, roll: (p) => 36 < p }).stunned, false, 'roll above 35%');
      ctx.assert.equal(c.hitEffects(soldier(), 'thorax', { damage: 5 }, ALWAYS()).stunned, false);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, conditions: [{ type: 'stunned' }] })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.unit(b, 'p1').ap, 20);
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.unit(b, 'p1').conditions.some((x) => x.type === 'stunned'), false);
    },
  },
  // TAC-026
  {
    id: 'tac-026-pain', spec: ['TAC-026', 'TAC-040'],
    name: 'Pain: −painApLoss AP, + painSpread MoA, + aimPainSurcharge per aim step',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ conditions: [{ type: 'pain' }] });
      ctx.assert.equal(c.activationAp(s), 26);
      near(ctx.assert, c.shooterSpread(s, { distance: 10, aimSteps: 0 }), 6.0);
      ctx.assert.equal(c.aimCost(s, 2), 6);
      const masked = soldier({ conditions: [{ type: 'pain' }, { type: 'painMasked', turnsLeft: 5 }] });
      ctx.assert.equal(c.activationAp(masked), 30, 'painkillers mask it');
    },
  },
  // TAC-027
  {
    id: 'tac-027-carry-capacity', spec: ['TAC-027'],
    name: 'Carry capacity = 15 + 0.3 × Strength + 0.1 × Endurance kg',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.carryCapacity(soldier()), 35);
      near(ctx.assert, c.carryCapacity(soldier({ attributes: { strength: 100, endurance: 100 } })), 55);
      near(ctx.assert, c.carriedWeight(soldier({ equipment: pack(3) })), 33);
    },
  },
  {
    id: 'tac-027-encumbrance-penalty', spec: ['TAC-027'],
    name: 'Over capacity −5 AP, over 1.25 × capacity −10, × (1 − Strength ÷ 200) rounded down; armour apPenalty always',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.encumbranceApPenalty(soldier({ equipment: pack(3) })), 0, '33 ≤ 35');
      ctx.assert.equal(c.encumbranceApPenalty(soldier({ equipment: pack(4) })), 3, '43 kg: floor(5 × 0.75)');
      ctx.assert.equal(c.encumbranceApPenalty(soldier({ equipment: pack(5) })), 7, '53 kg > 43.75: floor(10 × 0.75)');
      ctx.assert.equal(c.encumbranceApPenalty(soldier({ attributes: { strength: 100 }, equipment: pack(5) })), 2, 'capacity 50, 53 kg: floor(5 × 0.5)');
      ctx.assert.equal(c.activationAp(soldier({ equipment: { bodyArmour: { item: 'heavy6', durability: 80 } } })), 25, 'heavy armour −5, not over capacity');
    },
  },
  // TAC-028
  {
    id: 'tac-028-eight-directions', spec: ['TAC-028', 'TAC-029'],
    name: 'Movement is tile to tile in 8 directions',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5 })] });
      const p = c.previewPath(b, 'p1', { x: 7, y: 7 });
      ctx.assert.equal(p.path.length, 2, 'two diagonal steps');
      ctx.assert.equal(p.cost, 6);
    },
  },
  // TAC-029
  {
    id: 'tac-029-step-cost', spec: ['TAC-029', 'TAC-024'],
    name: 'Walk 2 / diagonal 3 + terrain; leg wound +1 each; disabled ×2 once; fracture ×1.5, stacking to ×3',
    async run(ctx) {
      const c = await setup(ctx);
      const sc = (o, s = {}) => c.stepCost(soldier(s), { terrain: 'grass', ...o });
      ctx.assert.equal(sc({}), 2);
      ctx.assert.equal(sc({ diagonal: true }), 3);
      ctx.assert.equal(sc({ terrain: 'mud' }), 3);
      ctx.assert.equal(sc({ terrain: 'stairs' }), 3);
      ctx.assert.equal(sc({}, { zoneHp: { leftLeg: 20 } }), 3);
      ctx.assert.equal(sc({}, { zoneHp: { leftLeg: 20, rightLeg: 20 } }), 4);
      ctx.assert.equal(sc({}, { zoneHp: { leftLeg: 0, rightLeg: 0 } }), 4, 'disabled ×2 once');
      ctx.assert.equal(sc({ terrain: 'mud' }, { zoneHp: { leftLeg: 0 } }), 6);
      ctx.assert.equal(sc({}, { conditions: [{ type: 'fracture', zone: 'leftLeg' }] }), 3);
      ctx.assert.equal(sc({}, { zoneHp: { leftLeg: 0 }, conditions: [{ type: 'fracture', zone: 'leftLeg' }] }), 6, '×2 × 1.5');
      ctx.assert.equal(sc({}, { zoneHp: { leftLeg: 0, rightLeg: 20 } }), 5, 'disabled ×2, other leg wounded +1');
    },
  },
  {
    id: 'tac-029-impassable', spec: ['TAC-029'],
    name: 'Impassable tiles (rock, deep water) cannot be entered',
    async run(ctx) {
      const c = await setup(ctx);
      const rows = Array.from({ length: 10 }, (_, y) => (y === 5 ? '...#~.....' : '..........'));
      const b = battle(c, { map: testMap(rows), player: [soldier({ id: 'p1', x: 2, y: 5 })], enemy: [soldier({ id: 'e1', x: 9, y: 9 })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 3, y: 5 }] }).ok, false, 'rock');
      ctx.assert.equal(c.previewPath(b, 'p1', { x: 4, y: 5 }).path, null, 'deep water unreachable');
    },
  },
  // TAC-030 / TAC-031
  {
    id: 'tac-030-031-stance-steps', spec: ['TAC-030', 'TAC-031'],
    name: 'Crouched step + crouchSurcharge; prone step + proneSurcharge',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.stepCost(soldier({ stance: 'crouched' }), { terrain: 'grass' }), 3);
      ctx.assert.equal(c.stepCost(soldier({ stance: 'prone' }), { terrain: 'grass' }), 5);
      ctx.assert.equal(c.stepCost(soldier({ stance: 'crouched' }), { terrain: 'mud', diagonal: true }), 5);
    },
  },
  // TAC-032
  {
    id: 'tac-032-sprint', spec: ['TAC-032'],
    name: 'Sprinting: walk cost − sprintDiscount, at least 1; upright only; not with leg fracture or noSprint backpack',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.stepCost(soldier(), { terrain: 'grass', sprint: true }), 1);
      ctx.assert.equal(c.stepCost(soldier(), { terrain: 'mud', sprint: true }), 2);
      ctx.assert.equal(c.stepCost(soldier({ zoneHp: { leftLeg: 20 } }), { terrain: 'grass', sprint: true }), 2);
      ctx.assert.equal(c.canSprint(soldier()), true);
      ctx.assert.equal(c.canSprint(soldier({ stance: 'crouched' })), false);
      ctx.assert.equal(c.canSprint(soldier({ stance: 'prone' })), false);
      ctx.assert.equal(c.canSprint(soldier({ conditions: [{ type: 'fracture', zone: 'rightLeg' }] })), false);
      ctx.assert.equal(c.canSprint(soldier({ conditions: [{ type: 'fracture', zone: 'rightArm' }] })), true, 'arm fracture does not stop sprinting');
      ctx.assert.equal(c.canSprint(soldier({ equipment: { backpack: { item: 'rucksack', contents: [] } } })), false);
      ctx.assert.equal(c.canSprint(soldier({ equipment: { backpack: { item: 'daypack', contents: [] } } })), true);
    },
  },
  // TAC-033
  {
    id: 'tac-033-stance-change', spec: ['TAC-033'],
    name: 'Stance change costs per transition; upright → prone = 2 + 2',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.stanceCost('upright', 'crouched'), 2);
      ctx.assert.equal(c.stanceCost('crouched', 'upright'), 2);
      ctx.assert.equal(c.stanceCost('crouched', 'prone'), 2);
      ctx.assert.equal(c.stanceCost('prone', 'crouched'), 4);
      ctx.assert.equal(c.stanceCost('prone', 'upright'), 6);
      ctx.assert.equal(c.stanceCost('upright', 'prone'), 4);
      const b = battle(c);
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'changeStance', stance: 'prone' });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 4);
      ctx.assert.equal(c.unit(b, 'p1').stance, 'prone');
    },
  },
  // TAC-034
  {
    id: 'tac-034-vault-climb', spec: ['TAC-034'],
    name: 'Vault 4 (3 at Agility 70+); climb 4 per level (3); not prone; not with a body',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.vaultCost(soldier()), 4);
      ctx.assert.equal(c.vaultCost(soldier({ attributes: { agility: 70 } })), 3);
      ctx.assert.equal(c.climbCost(soldier(), 1), 4);
      ctx.assert.equal(c.climbCost(soldier({ attributes: { agility: 70 } }), 2), 6);
      ctx.assert.equal(c.canVault(soldier({ stance: 'prone' })), false);
      ctx.assert.equal(c.canClimb(soldier({ stance: 'prone' })), false);
      ctx.assert.equal(c.canVault(soldier({ carrying: { body: 'x', mode: 'drag' } })), false);
      ctx.assert.equal(c.canClimb(soldier({ carrying: { body: 'x', mode: 'carry' } })), false);
      ctx.assert.equal(c.canVault(soldier({ stance: 'crouched' })), true);
    },
  },
  {
    id: 'tac-034-half-cover-only-by-vault', spec: ['TAC-034', 'TAC-035'],
    name: 'A half-cover edge is crossed only by vaulting; a full-cover wall cannot be crossed',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(10, { edges: [
        { x: 5, y: 5, side: 'e', cover: 'half', material: 'wood', kind: 'window' },
        { x: 5, y: 6, side: 'e', cover: 'full', material: 'brick', kind: 'wall' },
      ] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 5, y: 5 }), soldier({ id: 'p2', x: 5, y: 6 })], enemy: [soldier({ id: 'e1', x: 9, y: 9 })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 6, y: 5 }] }).ok, false, 'walking over a window is not allowed');
      const ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'vault', tile: { x: 6, y: 5 } }).ok, true);
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 4);
      ctx.assert.equal(c.unit(b, 'p1').x, 6);
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      activate(c, b, 'pmc', 'p2');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'vault', tile: { x: 6, y: 6 } }).ok, false, 'full cover cannot be vaulted');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 6, y: 6 }] }).ok, false);
    },
  },
  // TAC-035
  {
    id: 'tac-035-cover-per-edge', spec: ['TAC-035'],
    name: 'Cover is stored per tile edge (none, half, full) with a material; edges are shared by neighbours',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(10, { edges: [{ x: 5, y: 5, side: 'n', cover: 'half', material: 'wood', kind: 'fence' }] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 1, y: 1 })], enemy: [soldier({ id: 'e1', x: 9, y: 9 })] });
      ctx.assert.equal(c.cover(b, 5, 5, 'n').cover, 'half');
      ctx.assert.equal(c.cover(b, 5, 5, 'n').material, 'wood');
      ctx.assert.equal(c.cover(b, 5, 4, 's').cover, 'half', 'same edge seen from the north tile');
      ctx.assert.equal(c.cover(b, 5, 5, 'e').cover, 'none');
    },
  },
  // TAC-036
  {
    id: 'tac-036-recalc-after-destruction', spec: ['TAC-036', 'TAC-085', 'TAC-072'],
    name: 'A destroyed edge is recalculated at once: no cover, walkable, sightline open',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(10, { edges: [{ x: 5, y: 5, side: 'e', cover: 'full', material: 'wood', kind: 'wall' }] });
      const b = battle(c, {
        map,
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90, attributes: { technical: 60 }, equipment: { vest: { item: 'chestrig', contents: [{ id: 'ch1', item: 'demoCharge' }] } } })],
        enemy: [soldier({ id: 'e1', x: 8, y: 5, facing: 270 })],
      });
      ctx.assert.equal(c.lineOfSight(b, 'p1', 'e1'), false, 'wall blocks');
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'placeCharge', item: 'ch1', edge: { tile: { x: 5, y: 5 }, side: 'e' } }).ok, true);
      endAct(c, b, 'pmc');
      ctx.assert.equal(c.cover(b, 5, 5, 'e').cover, 'none');
      ctx.assert.equal(c.lineOfSight(b, 'p1', 'e1'), true);
      ctx.assert.ok(c.previewPath(b, 'p1', { x: 6, y: 5 }).path, 'walkable now');
    },
  },
  // TAC-037
  {
    id: 'tac-037-path-preview', spec: ['TAC-037'],
    name: 'Path preview returns path, total AP and where the AP run out; execution costs the same',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [soldier({ id: 'p1', x: 2, y: 2 })], enemy: [soldier({ id: 'e1', x: 19, y: 19 })] });
      activate(c, b, 'pmc', 'p1');
      const far = c.previewPath(b, 'p1', { x: 19, y: 2 });
      ctx.assert.equal(far.cost, 34);
      ctx.assert.deepEqual([far.apRunsOutAt.x, far.apRunsOutAt.y], [17, 2], '30 AP = 15 steps');
      const near5 = c.previewPath(b, 'p1', { x: 7, y: 2 });
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'move', path: near5.path });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - near5.cost);
    },
  },
  // TAC-038
  {
    id: 'tac-038-leave-map', spec: ['TAC-038'],
    name: 'Leaving at an exit tile is free; the soldier counts as survivor with leftMap and exitId',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(10, { exits: [{ id: 'x1', tiles: [[0, 5]], condition: 'none' }] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 1, y: 5 }), soldier({ id: 'p2', x: 0, y: 5 })], enemy: [soldier({ id: 'e1', x: 9, y: 9 })] });
      activate(c, b, 'pmc', 'p2');
      const ap = c.unit(b, 'p2').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'leaveMap', exit: 'x1' }).ok, true, 'already on the exit: leave without moving');
      ctx.assert.equal(c.unit(b, 'p2').status, 'leftMap');
      ctx.assert.equal(c.unit(b, 'p2').ap, ap);
      const r = c.battleResult(b).soldiers.find((s) => s.id === 'p2');
      ctx.assert.equal(r.status, 'leftMap');
      ctx.assert.equal(r.exitId, 'x1');
      ctx.assert.equal(c.state(b).ended, false, 'p1 is still on the map');
    },
  },
  {
    id: 'tac-038-exit-condition-and-end', spec: ['TAC-038'],
    name: 'An exit whose condition is not met cannot be used; the battle ends when no player soldier is left',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(10, { exits: [{ id: 'road', tiles: [[0, 5]], condition: 'fuel' }, { id: 'foot', tiles: [[9, 0]], condition: 'none' }] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 0, y: 5 }), soldier({ id: 'p2', x: 9, y: 0 })], enemy: [soldier({ id: 'e1', x: 9, y: 9 })], playerSide: { vehicle: null } });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'leaveMap', exit: 'road' }).ok, false, 'no vehicle fuel');
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      activate(c, b, 'pmc', 'p2');
      c.act(b, 'pmc', { type: 'leaveMap', exit: 'foot' });
      ctx.assert.equal(c.state(b).ended, false);
      endAct(c, b, 'pmc');
      pass(c, b, 'red');
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'move', path: [{ x: 1, y: 4 }, { x: 2, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 1 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 }] });
      c.act(b, 'pmc', { type: 'leaveMap', exit: 'foot' });
      ctx.assert.equal(c.state(b).ended, true);
    },
  },
];
