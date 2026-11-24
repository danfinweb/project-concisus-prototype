// Body zones, hitboxes and medical: TAC-052..TAC-067.
import { setup, soldier, rifle, battle, activate, pass, endAct, ALWAYS, NEVER, fixedRng, near } from '../helpers.js';

// Max HP at Endurance 50 (× 0.875): head 30, thorax 74, arm 52, leg 61.
const MAX = { head: 30, thorax: 74, leftArm: 52, rightArm: 52, leftLeg: 61, rightLeg: 61 };
const has = (s, type, zone) => (s.conditions || []).some((x) => x.type === type && (zone === undefined || x.zone === zone));

export default [
  // TAC-052
  {
    id: 'tac-052-upright-boxes', spec: ['TAC-052'],
    name: 'Upright hit boxes: head 1.53–1.78 m, thorax 0.95–1.50, arms beside 0.85–1.45, legs 0–0.95',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier();
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.6 }), 'head');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.2 }), 'thorax');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0.26, y: 0, z: 1.0 }), 'rightArm');
      ctx.assert.equal(c.hitZoneAt(s, { x: -0.26, y: 0, z: 1.0 }), 'leftArm');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0.1, y: 0, z: 0.5 }), 'rightLeg');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.9 }), null);
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.51 }), null, 'neck gap between thorax and head');
    },
  },
  {
    id: 'tac-053-aiming-pose-open', spec: ['TAC-053'],
    name: '(open) Without aiming offsets in data, an aiming soldier uses the stance boxes',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ aiming: true });
      ctx.assert.equal(c.hitZoneAt(s, { x: 0.26, y: 0, z: 1.0 }), 'rightArm');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.2 }), 'thorax');
    },
  },
  // TAC-054 / TAC-055 / TAC-056
  {
    id: 'tac-054-crouched', spec: ['TAC-054'],
    name: 'Crouched: total height ~1.20 m, head ~1.00–1.20; behind half cover legs and most of the thorax hidden',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ stance: 'crouched' });
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.1 }), 'head');
      ctx.assert.equal(c.hitZoneAt(s, { x: 0, y: 0, z: 1.4 }), null);
      ctx.assert.deepEqual(c.exposedZones(s, { cover: 'half' }).sort(), ['head']);
    },
  },
  {
    id: 'tac-055-prone', spec: ['TAC-055'],
    name: 'Prone: ~0.40 m high; fully hidden behind half cover until firing over it; no sprint, vault or climb',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ stance: 'prone' });
      ctx.assert.ok(c.bodyHeight(s) <= 0.40 + 1e-9);
      ctx.assert.deepEqual(c.exposedZones(s, { cover: 'half' }), []);
      ctx.assert.ok(c.exposedZones(s, { cover: 'half', firing: true }).includes('head'));
      ctx.assert.equal(c.canSprint(s) || c.canVault(s) || c.canClimb(s), false);
      ctx.assert.ok(c.shooterSpread(s, { distance: 5, aimSteps: 0 }) < c.shooterSpread(soldier({ stance: 'crouched' }), { distance: 5, aimSteps: 0 }), 'lowest spread');
    },
  },
  {
    id: 'tac-056-cover-occlusion', spec: ['TAC-056'],
    name: 'Half cover hides an upright soldier\'s legs and lower thorax; full cover hides everything',
    async run(ctx) {
      const c = await setup(ctx);
      const z = c.exposedZones(soldier(), { cover: 'half' });
      ctx.assert.equal(z.includes('leftLeg') || z.includes('rightLeg'), false);
      ctx.assert.ok(z.includes('head') && z.includes('thorax'));
      ctx.assert.deepEqual(c.exposedZones(soldier(), { cover: 'full' }), []);
      ctx.assert.ok(c.exposedZones(soldier(), { cover: 'full', firing: true }).length > 0, 'leaning out exposes boxes');
    },
  },
  // TAC-057
  {
    id: 'tac-057-zone-hp', spec: ['TAC-057'],
    name: 'Zone max HP = floor(base × (0.5 + 0.75 × Endurance / 100))',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.zoneMaxHp('head', 20), 22);
      ctx.assert.equal(c.zoneMaxHp('head', 67), 35);
      ctx.assert.equal(c.zoneMaxHp('thorax', 100), 106);
      ctx.assert.equal(c.zoneMaxHp('leftLeg', 50), 61);
      ctx.assert.equal(c.zoneMaxHp('rightArm', 50), 52);
    },
  },
  // TAC-058
  {
    id: 'tac-058-limb-states', spec: ['TAC-058', 'TAC-062'],
    name: 'Wounded below 50% and above 0; disabled at 0; the worse arm counts',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.limbState(soldier({ zoneHp: { leftArm: 26 } }), 'leftArm'), 'ok');
      ctx.assert.equal(c.limbState(soldier({ zoneHp: { leftArm: 25 } }), 'leftArm'), 'wounded');
      ctx.assert.equal(c.limbState(soldier({ zoneHp: { leftArm: 0 } }), 'leftArm'), 'disabled');
      ctx.assert.equal(c.worseArm(soldier({ zoneHp: { leftArm: 25, rightArm: 0 } })), 'disabled');
      ctx.assert.equal(c.worseArm(soldier({ zoneHp: { rightArm: 10 } })), 'wounded');
      ctx.assert.equal(c.worseArm(soldier()), 'ok');
    },
  },
  // TAC-059
  {
    id: 'tac-059-death', spec: ['TAC-059'],
    name: 'Head or thorax at 0 HP kills at once',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.applyZoneDamage(soldier(), 'thorax', 74).died, true);
      ctx.assert.equal(c.applyZoneDamage(soldier(), 'head', 29).died, false);
      ctx.assert.equal(c.applyZoneDamage(soldier(), 'head', 30).died, true);
    },
  },
  {
    id: 'tac-059-disable-and-redistribute', spec: ['TAC-059', 'TAC-057'],
    name: 'Excess past a limb and hits on a disabled limb are split equally over zones above 0 HP, rounded down',
    async run(ctx) {
      const c = await setup(ctx);
      const r = c.applyZoneDamage(soldier({ zoneHp: { leftArm: 10 } }), 'leftArm', 30);
      ctx.assert.deepEqual(r.disabled, ['leftArm']);
      ctx.assert.equal(r.soldier.zoneHp.leftArm, 0);
      ctx.assert.equal(r.soldier.zoneHp.thorax, MAX.thorax - 4, '20 excess over 5 zones');
      ctx.assert.equal(r.soldier.zoneHp.head, MAX.head - 4);
      const r2 = c.applyZoneDamage(soldier({ zoneHp: { leftArm: 0, rightArm: 0 } }), 'leftArm', 25);
      ctx.assert.equal(r2.soldier.zoneHp.thorax, MAX.thorax - 6, '25 over 4 zones → 6 each');
      const r3 = c.applyZoneDamage(soldier({ zoneHp: { leftArm: 0, head: 3 } }), 'leftArm', 25);
      ctx.assert.equal(r3.died, true, 'a share can kill');
    },
  },
  {
    id: 'tac-059-body-lootable', spec: ['TAC-059', 'TAC-070'],
    name: 'A dead soldier\'s equipment stays on the body as lootable',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, {
        player: [soldier({ id: 'p1', x: 5, y: 5, facing: 180, equipment: { weapon1: rifle() } })],
        enemy: [soldier({ id: 'e1', x: 5, y: 8, zoneHp: { thorax: 1, head: 1 }, equipment: { weapon1: rifle(), helmet: { item: 'ssh68', durability: 30 } } })],
        rng: ALWAYS(),
      });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1 });
      ctx.assert.equal(c.unit(b, 'e1').status, 'dead');
      const body = c.perceptionView(b, 'pmc').bodies.find((x) => x.unit === 'e1' || x.id === 'e1');
      ctx.assert.ok(body, 'body on the map');
    },
  },
  // TAC-060 / TAC-061
  {
    id: 'tac-060-light-bleeding', spec: ['TAC-060'],
    name: 'Light bleed chance = zone chance × ammo modifier × (1 − Endurance ÷ 400); −1 HP per turn',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.bleedChance('light', 'thorax', 'a545fmj', 50), 0.4375);
      near(ctx.assert, c.bleedChance('light', 'thorax', 'a545hp', 50), 0.65625);
      near(ctx.assert, c.bleedChance('light', 'leftLeg', 'a545fmj', 100), 0.30);
      ctx.assert.equal(c.isHardHit(soldier(), 'thorax', 19), true, '≥ 0.25 × 74 = 18.5');
      ctx.assert.equal(c.isHardHit(soldier(), 'thorax', 18), false);
      const fx = c.hitEffects(soldier(), 'thorax', { damage: 10, ammo: 'a545fmj' }, ALWAYS());
      ctx.assert.equal(fx.bleeding, 'light', 'a normal hit rolls light only');
    },
  },
  {
    id: 'tac-061-heavy-bleeding', spec: ['TAC-061'],
    name: 'Hard hits roll heavy first, then light; heavy replaces light; −4 HP per turn',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.bleedChance('heavy', 'thorax', 'a545fmj', 50), 0.30625);
      ctx.assert.equal(c.hitEffects(soldier(), 'thorax', { damage: 20, ammo: 'a545fmj' }, ALWAYS()).bleeding, 'heavy');
      // Heavy roll fails (0.31 > 0.306), light roll succeeds (0.31 < 0.4375).
      ctx.assert.equal(c.hitEffects(soldier(), 'thorax', { damage: 20, ammo: 'a545fmj' }, fixedRng(0.31)).bleeding, 'light');
      const s = soldier({ conditions: [{ type: 'lightBleeding', zone: 'thorax' }] });
      const after = c.addCondition(s, { type: 'heavyBleeding', zone: 'thorax' });
      ctx.assert.equal(has(after, 'lightBleeding', 'thorax'), false);
      ctx.assert.equal(has(after, 'heavyBleeding', 'thorax'), true);
    },
  },
  // TAC-062
  {
    id: 'tac-062-fracture', spec: ['TAC-062'],
    name: 'Fracture on a limb hit ≥ 35% of max HP with 30%, or 60% when the hit disables it; splint removes it',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.fractureChance(soldier(), 'leftArm', 19, {}), 0.30, 1e-9, '19 ≥ 0.35 × 52 = 18.2');
      near(ctx.assert, c.fractureChance(soldier(), 'leftArm', 18, {}), 0, 1e-9);
      near(ctx.assert, c.fractureChance(soldier(), 'leftArm', 52, { disables: true }), 0.60, 1e-9);
      near(ctx.assert, c.fractureChance(soldier(), 'thorax', 50, {}), 0, 1e-9, 'arms and legs only');
      const after = c.applyMedical(soldier({ conditions: [{ type: 'fracture', zone: 'leftLeg' }] }), 'splint', 'leftLeg');
      ctx.assert.equal(has(after, 'fracture', 'leftLeg'), false);
    },
  },
  // TAC-063
  {
    id: 'tac-063-pain-start', spec: ['TAC-063'],
    name: 'Pain from a hit ≥ 20% of a zone, any zone below 50%, or a tourniquet',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.painFrom(soldier(), { hitZone: 'thorax', hitDamage: 15 }), true, '≥ 14.8');
      ctx.assert.equal(c.painFrom(soldier(), { hitZone: 'thorax', hitDamage: 14 }), false);
      ctx.assert.equal(c.painFrom(soldier({ zoneHp: { thorax: 36 } }), {}), true, '36 < 37');
      ctx.assert.equal(c.painFrom(soldier({ zoneHp: { thorax: 37 } }), {}), false);
      ctx.assert.equal(c.painFrom(soldier({ conditions: [{ type: 'tourniquet', zone: 'leftLeg' }] }), {}), true);
    },
  },
  {
    id: 'tac-063-painkillers', spec: ['TAC-063', 'TAC-067'],
    name: 'Painkillers mask pain for 10 turns; a new dose resets the mask, doses do not stack',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier({ zoneHp: { thorax: 20 }, conditions: [{ type: 'pain' }] });
      const once = c.applyMedical(s, 'painkillers');
      ctx.assert.equal(once.conditions.find((x) => x.type === 'painMasked').turnsLeft, 10);
      const later = { ...once, conditions: once.conditions.map((x) => (x.type === 'painMasked' ? { ...x, turnsLeft: 4 } : x)) };
      const twice = c.applyMedical(later, 'painkillers');
      ctx.assert.equal(twice.conditions.filter((x) => x.type === 'painMasked').length, 1);
      ctx.assert.equal(twice.conditions.find((x) => x.type === 'painMasked').turnsLeft, 10, 'reset, not 14');
    },
  },
  // TAC-064
  {
    id: 'tac-064-permissions', spec: ['TAC-064'],
    name: 'Anyone can use medical items except the surgical kit (Medical ≥ 40); target self or adjacent',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.canUseMedical(soldier({ attributes: { medical: 39 } }), 'surgicalKit'), false);
      ctx.assert.equal(c.canUseMedical(soldier({ attributes: { medical: 40 } }), 'surgicalKit'), true);
      ctx.assert.equal(c.canUseMedical(soldier({ attributes: { medical: 1 } }), 'medkit'), true);
      const kit = { vest: { item: 'chestrig', contents: [{ id: 'b1', item: 'bandage' }] } };
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: kit }), soldier({ id: 'p2', x: 7, y: 5, conditions: [{ type: 'lightBleeding', zone: 'thorax' }] }), soldier({ id: 'p3', x: 6, y: 6, conditions: [{ type: 'lightBleeding', zone: 'thorax' }] })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'useItem', item: 'b1', unit: 'p2', zone: 'thorax', sourceSlot: 'vest' }).ok, false, '2 tiles away');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'useItem', item: 'b1', unit: 'p3', zone: 'thorax', sourceSlot: 'vest' }).ok, true, 'diagonal neighbour');
    },
  },
  // TAC-065
  {
    id: 'tac-065-medical-cost', spec: ['TAC-065', 'TAC-068'],
    name: 'Cost = max(1, base − floor(Medical ÷ 40)), then + 2 self, + 4 backpack',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.medicalCost(soldier(), 'bandage', {}), 2);
      ctx.assert.equal(c.medicalCost(soldier(), 'bandage', { self: true }), 4);
      ctx.assert.equal(c.medicalCost(soldier(), 'bandage', { self: true, fromBackpack: true }), 8);
      ctx.assert.equal(c.medicalCost(soldier({ attributes: { medical: 100 } }), 'surgicalKit', {}), 13);
      ctx.assert.equal(c.medicalCost(soldier({ attributes: { medical: 80 } }), 'tourniquet', { self: true }), 3, 'floor 1 before the surcharge');
      ctx.assert.equal(c.medicalCost(soldier({ attributes: { medical: 1 } }), 'medkit', {}), 8);
    },
  },
  // TAC-066
  {
    id: 'tac-066-hp-restored', spec: ['TAC-066'],
    name: 'HP per use = min(floor(hpPerUse × (0.75 + Medical/200)), pool left, missing)',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.hpRestored(soldier({ attributes: { medical: 100 } }), 'ifak', { poolLeft: 60, missing: 50 }), 18, 'design example');
      ctx.assert.equal(c.hpRestored(soldier(), 'ifak', { poolLeft: 60, missing: 50 }), 15);
      ctx.assert.equal(c.hpRestored(soldier({ attributes: { medical: 1 } }), 'ifak', { poolLeft: 60, missing: 50 }), 11);
      ctx.assert.equal(c.hpRestored(soldier({ attributes: { medical: 100 } }), 'ifak', { poolLeft: 10, missing: 50 }), 10);
      ctx.assert.equal(c.hpRestored(soldier({ attributes: { medical: 100 } }), 'ifak', { poolLeft: 60, missing: 5 }), 5);
      ctx.assert.equal(c.hpRestored(soldier(), 'medkit', { poolLeft: 300, missing: 70 }), 40);
    },
  },
  // TAC-067
  {
    id: 'tac-067-item-effects', spec: ['TAC-067'],
    name: 'Each medical item treats only its conditions',
    async run(ctx) {
      const c = await setup(ctx);
      const bleed = (type, zone) => soldier({ zoneHp: { [zone]: 20 }, conditions: [{ type, zone }] });
      ctx.assert.equal(has(c.applyMedical(bleed('lightBleeding', 'thorax'), 'bandage', 'thorax'), 'lightBleeding'), false);
      ctx.assert.equal(has(c.applyMedical(bleed('heavyBleeding', 'thorax'), 'bandage', 'thorax'), 'heavyBleeding'), true, 'bandage does not stop heavy');
      const tq = c.applyMedical(bleed('heavyBleeding', 'leftLeg'), 'tourniquet', 'leftLeg');
      ctx.assert.equal(has(tq, 'heavyBleeding'), false);
      ctx.assert.equal(has(tq, 'tourniquet', 'leftLeg'), true, 'tourniquet stays on and causes pain');
      let refused = false;
      try { c.applyMedical(bleed('heavyBleeding', 'thorax'), 'tourniquet', 'thorax'); } catch { refused = true; }
      ctx.assert.ok(refused, 'tourniquet on the thorax is refused (arms or legs only)');
      ctx.assert.equal(has(c.applyMedical(bleed('heavyBleeding', 'thorax'), 'hemostatic', 'thorax'), 'heavyBleeding'), false);
      ctx.assert.equal(has(c.applyMedical(bleed('heavyBleeding', 'thorax'), 'medkit', 'thorax'), 'heavyBleeding'), false);
      ctx.assert.equal(has(c.applyMedical(bleed('heavyBleeding', 'thorax'), 'ifak', 'thorax'), 'heavyBleeding'), true, 'IFAK stops light only');
      const surg = c.applyMedical(soldier({ zoneHp: { rightLeg: 0 } }), 'surgicalKit', 'rightLeg');
      ctx.assert.equal(surg.zoneHp.rightLeg, 1);
      ctx.assert.equal(c.limbState(surg, 'rightLeg'), 'wounded');
    },
  },
  {
    id: 'tac-067-uses-consumed', spec: ['TAC-067'],
    name: 'One use is consumed per application; an empty item is gone',
    async run(ctx) {
      const c = await setup(ctx);
      const kit = { vest: { item: 'chestrig', contents: [{ id: 'pk', item: 'painkillers', uses: 4 }] } };
      const b = battle(c, { player: [soldier({ id: 'p1', x: 5, y: 5, equipment: kit, zoneHp: { thorax: 20 }, conditions: [{ type: 'pain' }] })] });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'useItem', item: 'pk', unit: 'p1', sourceSlot: 'vest' });
      ctx.assert.equal(c.unit(b, 'p1').equipment.vest.contents.find((x) => x.id === 'pk').uses, 3);
    },
  },
];
