// Gear and interaction: TAC-068..TAC-074, TAC-084, TAC-085.
import { setup, soldier, rifle, battle, activate, pass, endAct, ALWAYS, fixedRng, seeded, testMap, near } from '../helpers.js';

const door = (o = {}) => ({ x: 5, y: 5, side: 'e', cover: 'full', material: 'wood', kind: 'door', open: false, locked: false, ...o });
const onlyPlayerMap = (extra) => testMap(12, extra);
const far = () => [soldier({ id: 'e1', x: 11, y: 11, facing: 0 })];

export default [
  // TAC-068
  {
    id: 'tac-068-backpack-tier', spec: ['TAC-068'],
    name: '(open) From the backpack every item costs + backpackSurcharge; an awkward bag adds its extraAccessAp',
    async run(ctx) {
      const c = await setup(ctx);
      const kit = (bag) => ({ backpack: { item: bag, contents: [{ id: 'b1', item: 'bandage' }] }, vest: { item: 'chestrig', contents: [{ id: 'b2', item: 'bandage' }] } });
      for (const [bag, extra] of [['daypack', 0], ['duffel', 2]]) {
        const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: kit(bag), conditions: [{ type: 'lightBleeding', zone: 'leftArm' }, { type: 'lightBleeding', zone: 'rightArm' }] })], enemy: far(), map: onlyPlayerMap() });
        activate(c, b, 'pmc', 'p1');
        let ap = c.unit(b, 'p1').ap;
        c.act(b, 'pmc', { type: 'useItem', item: 'b2', unit: 'p1', zone: 'leftArm', sourceSlot: 'vest' });
        ctx.assert.equal(ap - c.unit(b, 'p1').ap, 4, 'vest: normal cost (2 + 2 self)');
        ap = c.unit(b, 'p1').ap;
        c.act(b, 'pmc', { type: 'useItem', item: 'b1', unit: 'p1', zone: 'rightArm', sourceSlot: 'backpack' });
        ctx.assert.equal(ap - c.unit(b, 'p1').ap, 8 + extra, `${bag}: + 4${extra ? ' + 2' : ''}`);
      }
    },
  },
  // TAC-069
  {
    id: 'tac-069-drop-and-pick-up-backpack', spec: ['TAC-069', 'TAC-027'],
    name: 'Drop the backpack for 1 AP (its weight stops counting); pick it up again on its tile for 4 AP',
    async run(ctx) {
      const c = await setup(ctx);
      const eq = { backpack: { id: 'bp1', item: 'rucksack', contents: [{ item: 'brick' }, { item: 'brick' }] } };
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: eq })], enemy: far(), map: onlyPlayerMap() });
      activate(c, b, 'pmc', 'p1');
      const w0 = c.carriedWeight(c.unit(b, 'p1'));
      let ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'dropBackpack' }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 1);
      near(ctx.assert, w0 - c.carriedWeight(c.unit(b, 'p1')), 23);
      ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'pickUpBackpack', target: 'bp1' }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 4);
      ctx.assert.equal(c.unit(b, 'p1').equipment.backpack.contents.length, 2, 'with its contents');
    },
  },
  // TAC-070
  {
    id: 'tac-070-search-once-per-side', spec: ['TAC-070'],
    name: 'Opening a container costs 3 AP once per side; each item taken 2 AP',
    async run(ctx) {
      const c = await setup(ctx);
      const map = onlyPlayerMap({ containers: [{ id: 'c1', x: 6, y: 5, contents: [{ id: 'i1', item: 'bandage' }, { id: 'i2', item: 'ifak' }] }] });
      const vest = () => ({ vest: { item: 'chestrig', contents: [] } });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 5, y: 5, equipment: vest() }), soldier({ id: 'p2', x: 6, y: 6, equipment: vest() })], enemy: far() });
      activate(c, b, 'pmc', 'p1');
      let ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'search', target: 'c1' });
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 3);
      ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'pickUp', target: 'c1', item: 'i1' });
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 2);
      ctx.assert.ok(c.perceptionView(b, 'pmc').containers.find((x) => x.id === 'c1').contents, 'contents visible to the side');
      endAct(c, b, 'pmc'); pass(c, b, 'red');
      activate(c, b, 'pmc', 'p2');
      ap = c.unit(b, 'p2').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'pickUp', target: 'c1', item: 'i2' }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p2').ap, 2, 'already opened by the side: no opening cost');
    },
  },
  {
    id: 'tac-070-loot-only-carried-off', spec: ['TAC-070', 'TAC-038'],
    name: 'Only items carried off the map count as loot',
    async run(ctx) {
      const c = await setup(ctx);
      const map = onlyPlayerMap({ containers: [{ id: 'c1', x: 6, y: 5, contents: [{ id: 'i1', item: 'bandage' }, { id: 'i2', item: 'ifak' }] }], exits: [{ id: 'x1', tiles: [[4, 5]], condition: 'none' }] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 5, y: 5, equipment: { vest: { item: 'chestrig', contents: [] } } })], enemy: far() });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'search', target: 'c1' });
      c.act(b, 'pmc', { type: 'pickUp', target: 'c1', item: 'i1' });
      c.act(b, 'pmc', { type: 'move', path: [{ x: 4, y: 5 }] });
      c.act(b, 'pmc', { type: 'leaveMap', exit: 'x1' });
      const loot = c.battleResult(b).loot.map((l) => l.item);
      ctx.assert.ok(loot.includes('bandage'));
      ctx.assert.equal(loot.includes('ifak'), false);
    },
  },
  // TAC-071
  {
    id: 'tac-071-cut-lock', spec: ['TAC-071', 'TAC-084', 'TAC-096'],
    name: 'Bolt cutters cut an adjacent lock for 10 AP (Sapper 5), silently; the door is then unlocked',
    async run(ctx) {
      const c = await setup(ctx);
      const mk = (o = {}) => battle(c, { map: onlyPlayerMap({ edges: [door({ locked: true })] }), enemy: far(),
        player: [soldier({ id: 'p1', x: 5, y: 5, equipment: { belt: { item: 'beltPadded', contents: o.noCutters ? [] : [{ id: 'bc', item: 'boltCutters' }] } }, perks: o.perks || [] })] });
      const b = mk();
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 6, y: 5 }] }).ok, false, 'locked door blocks');
      const ap = c.unit(b, 'p1').ap;
      const r = c.act(b, 'pmc', { type: 'cutLock', edge: { tile: { x: 5, y: 5 }, side: 'e' } });
      ctx.assert.equal(r.ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 10);
      ctx.assert.equal(r.events.some((e) => e.type === 'noise'), false, 'no noise');
      ctx.assert.equal(c.cover(b, 5, 5, 'e').locked, false);
      const s = mk({ perks: ['sapper'] });
      activate(c, s, 'pmc', 'p1');
      const ap2 = c.unit(s, 'p1').ap;
      c.act(s, 'pmc', { type: 'cutLock', edge: { tile: { x: 5, y: 5 }, side: 'e' } });
      ctx.assert.equal(ap2 - c.unit(s, 'p1').ap, 5);
      const n = mk({ noCutters: true });
      activate(c, n, 'pmc', 'p1');
      ctx.assert.equal(c.act(n, 'pmc', { type: 'cutLock', edge: { tile: { x: 5, y: 5 }, side: 'e' } }).ok, false, 'needs bolt cutters');
    },
  },
  // TAC-072
  {
    id: 'tac-072-place-charge-cost', spec: ['TAC-072'],
    name: 'Placing a charge on an adjacent target costs 8 AP, 6 at Technical 50+',
    async run(ctx) {
      const c = await setup(ctx);
      for (const [tech, cost] of [[49, 8], [50, 6]]) {
        const b = battle(c, { map: onlyPlayerMap({ edges: [door({ kind: 'wall', material: 'brick' })] }), enemy: far(),
          player: [soldier({ id: 'p1', x: 5, y: 5, attributes: { technical: tech }, equipment: { vest: { item: 'chestrig', contents: [{ id: 'ch', item: 'demoCharge' }] } } })] });
        activate(c, b, 'pmc', 'p1');
        const ap = c.unit(b, 'p1').ap;
        ctx.assert.equal(c.act(b, 'pmc', { type: 'placeCharge', item: 'ch', edge: { tile: { x: 5, y: 5 }, side: 'e' } }).ok, true);
        ctx.assert.equal(ap - c.unit(b, 'p1').ap, cost, `Technical ${tech}`);
      }
      const b = battle(c, { map: onlyPlayerMap({ edges: [door({ x: 8, kind: 'wall', material: 'brick' })] }), enemy: far(),
        player: [soldier({ id: 'p1', x: 5, y: 5, equipment: { vest: { item: 'chestrig', contents: [{ id: 'ch', item: 'demoCharge' }] } } })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'placeCharge', item: 'ch', edge: { tile: { x: 8, y: 5 }, side: 'e' } }).ok, false, 'not adjacent');
    },
  },
  // TAC-073
  {
    id: 'tac-073-restrain-vip', spec: ['TAC-073', 'TAC-076'],
    name: 'Restraining an adjacent VIP costs 6 AP and needs the VIP surrendered or wounded',
    async run(ctx) {
      const c = await setup(ctx);
      const mk = (vip) => battle(c, { map: onlyPlayerMap(), objectives: [{ id: 'o1', type: 'captureVip', targets: ['v1'] }],
        player: [soldier({ id: 'p1', x: 5, y: 5 })], enemy: [{ ...soldier({ id: 'v1', x: 6, y: 5, ...vip }), rank: undefined }], enemySide: { role: 'vip' } });
      const b = mk({});
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'restrainVip', unit: 'v1' }).ok, false, 'unhurt, not surrendered');
      const w = mk({ zoneHp: { leftLeg: 20 } });
      activate(c, w, 'pmc', 'p1');
      const ap = c.unit(w, 'p1').ap;
      ctx.assert.equal(c.act(w, 'pmc', { type: 'restrainVip', unit: 'v1' }).ok, true);
      ctx.assert.equal(ap - c.unit(w, 'p1').ap, 6);
      ctx.assert.equal(c.unit(w, 'v1').restrained, true);
    },
  },
  // TAC-074
  {
    id: 'tac-074-carry-drag-costs', spec: ['TAC-074', 'TAC-032', 'TAC-034'],
    name: 'Carry step + 2, drag step + 3 (+ crouch); no sprint carrying; no vault with a body',
    async run(ctx) {
      const c = await setup(ctx);
      const carry = soldier({ carrying: { body: 'x', mode: 'carry' } });
      const drag = soldier({ carrying: { body: 'x', mode: 'drag' } });
      ctx.assert.equal(c.stepCost(carry, { terrain: 'grass' }), 4);
      ctx.assert.equal(c.stepCost(drag, { terrain: 'grass' }), 5);
      ctx.assert.equal(c.stepCost({ ...drag, stance: 'crouched' }, { terrain: 'grass' }), 6);
      ctx.assert.equal(c.canSprint(carry), false);
      ctx.assert.equal(c.canVault(carry) || c.canVault(drag), false);
    },
  },
  {
    id: 'tac-074-lift-rules', spec: ['TAC-074', 'TAC-027'],
    name: 'Lift 4 AP, put down 2; carrying may not exceed capacity, dragging always works; no dragging prone',
    async run(ctx) {
      const c = await setup(ctx);
      const heavyGear = { bodyArmour: { item: 'heavy6', durability: 80 }, backpack: { item: 'rucksack', contents: [{ item: 'brick' }, { item: 'brick' }] } };
      const mk = (o = {}) => battle(c, { map: onlyPlayerMap(), enemy: far(), player: [soldier({ id: 'p1', x: 5, y: 5, ...(o.p1 || {}) }), soldier({ id: 'p2', x: 6, y: 5, zoneHp: { leftLeg: 0 }, equipment: o.gear || {} })] });
      const b = mk();
      activate(c, b, 'pmc', 'p1');
      let ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'liftBody', target: 'p2', mode: 'drag' }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 4);
      ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'putDownBody' }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 2);
      const h = mk({ gear: heavyGear });
      activate(c, h, 'pmc', 'p1');
      ctx.assert.equal(c.act(h, 'pmc', { type: 'liftBody', target: 'p2', mode: 'carry' }).ok, false, '43 kg of gear on the body > 35 kg capacity: carrying fails');
      ctx.assert.equal(c.act(h, 'pmc', { type: 'liftBody', target: 'p2', mode: 'drag' }).ok, true, 'dragging always works');
      const p = mk({ p1: { stance: 'prone' } });
      activate(c, p, 'pmc', 'p1');
      ctx.assert.equal(c.act(p, 'pmc', { type: 'liftBody', target: 'p2', mode: 'drag' }).ok, false, 'not while prone');
    },
  },
  // TAC-084
  {
    id: 'tac-084-doors', spec: ['TAC-084'],
    name: 'A closed door blocks sight; walking through opens it for + 1 AP; closing costs 1 AP',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { map: onlyPlayerMap({ edges: [door()] }), player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90 })], enemy: [soldier({ id: 'e1', x: 9, y: 5, facing: 270 })] });
      ctx.assert.equal(c.lineOfSight(b, 'p1', 'e1'), false);
      activate(c, b, 'pmc', 'p1');
      let ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'move', path: [{ x: 6, y: 5 }] }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 3, 'walk 2 + open 1');
      ctx.assert.equal(c.cover(b, 5, 5, 'e').open, true);
      ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'closeDoor', edge: { tile: { x: 5, y: 5 }, side: 'e' } }).ok, true);
      ctx.assert.equal(ap - c.unit(b, 'p1').ap, 1);
      ctx.assert.equal(c.cover(b, 5, 5, 'e').open, false);
    },
  },
  // TAC-085
  {
    id: 'tac-085-material-hp', spec: ['TAC-085'],
    name: 'Edges have their material\'s HP; a blast hits them for edgeBlastFactor × blast damage',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.materialHp('wood'), 40);
      ctx.assert.equal(c.materialHp('concrete'), 300);
      ctx.assert.equal(c.edgeBlastDamage(48), 144);
    },
  },
  {
    id: 'tac-085-blast-breaks-wood-not-concrete', spec: ['TAC-085', 'TAC-079', 'TAC-036'],
    name: 'A frag grenade breaks wood nearby and leaves concrete standing; bullets never damage edges',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(20, { edges: [
        { x: 10, y: 8, side: 's', cover: 'full', material: 'wood', kind: 'wall' },
        { x: 12, y: 8, side: 's', cover: 'full', material: 'concrete', kind: 'wall' },
      ] });
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 11, y: 2, facing: 180, equipment: { vest: { item: 'chestrig', contents: [{ id: 'g1', item: 'f1' }] } } })], enemy: [soldier({ id: 'e1', x: 2, y: 18 })], rng: fixedRng(0.5) });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'throwGrenade', item: 'g1', tile: { x: 11, y: 10 } });
      ctx.assert.equal(c.cover(b, 10, 8, 's').cover, 'none', 'wood edge is rubble');
      ctx.assert.equal(c.cover(b, 12, 8, 's').cover, 'full', 'concrete stands');
      const w = battle(c, { map: testMap(20, { edges: [{ x: 5, y: 7, side: 's', cover: 'half', material: 'wood', kind: 'window' }] }),
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: { weapon1: rifle() } })], enemy: [soldier({ id: 'e1', x: 5, y: 8, facing: 0 })], rng: seeded(4) });
      const hp0 = c.cover(w, 5, 7, 's').hp;
      activate(c, w, 'pmc', 'p1');
      c.act(w, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' });
      ctx.assert.equal(c.cover(w, 5, 7, 's').hp, hp0);
    },
  },
];
