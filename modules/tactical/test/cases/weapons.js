// Weapons, hit model, derived per shot: TAC-039..TAC-051, TAC-079, TAC-082, TAC-083.
import { setup, soldier, rifle, battle, activate, pass, passTurn, endAct, ALWAYS, NEVER, fixedRng, seeded, testMap, near } from '../helpers.js';

const W = (item, o = {}) => ({ item, condition: 100, rounds: 10, ammo: 'a545fmj', mods: [], ...o });
const shooterAt = (o = {}) => soldier({ id: 'p1', x: 5, y: 5, facing: 180, ...o });
const targetAt = (o = {}) => soldier({ id: 'e1', x: 5, y: 10, facing: 0, ...o });

export default [
  // TAC-039
  {
    id: 'tac-039-fire-ap', spec: ['TAC-039'],
    name: 'Fire AP = weapon fire AP (override or type default) + burst/auto surcharge ± ergonomics',
    async run(ctx) {
      const c = await setup(ctx);
      const s = soldier();
      ctx.assert.equal(c.fireApCost(s, W('ak74m'), 1), 6);
      ctx.assert.equal(c.fireApCost(s, W('ak74m'), 'auto'), 10);
      ctx.assert.equal(c.fireApCost(s, W('aks74u'), 1), 4, 'smg 5, ergonomics 75 → −1');
      ctx.assert.equal(c.fireApCost(s, W('aks74u'), 3), 6, '5 + 2 − 1');
      ctx.assert.equal(c.fireApCost(s, W('svd', { ammo: 'a762' }), 1), 9, 'fireApCost 8 replaces dmr 7; ergonomics 25 → +1');
      ctx.assert.equal(c.fireApCost(s, W('pm', { ammo: 'a9x18' }), 1), 3);
      ctx.assert.equal(c.fireApCost(s, W('pkm', { ammo: 'a762' }), 'auto'), 13, '8 + 4 + 1');
      ctx.assert.equal(c.roundsForMode(W('ak74m'), 'auto'), 5);
      ctx.assert.equal(c.roundsForMode(W('aks74u'), 3), 3);
      ctx.assert.equal(c.roundsForMode(W('ak74m'), 1), 1);
    },
  },
  {
    id: 'tac-039-fire-rules-in-battle', spec: ['TAC-039'],
    name: 'Each round uses a cartridge; empty magazine cannot fire; short burst fires what is left at full cost; mode must exist',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m', { rounds: 2 }) } })], enemy: [targetAt()], rng: seeded(3) });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 3 }).ok, false, 'AK-74M has no 3-round mode');
      const ap = c.unit(b, 'p1').ap;
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' });
      ctx.assert.equal(r.ok, true);
      ctx.assert.equal(r.events.filter((e) => e.type === 'round').length, 2, 'fires the 2 rounds left');
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 10, 'at the full auto cost');
      ctx.assert.equal(c.unit(b, 'p1').equipment.weapon1.rounds, 0);
      ctx.assert.equal(c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1 }).ok, false, 'empty');
    },
  },
  // TAC-040
  {
    id: 'tac-040-aim-steps', spec: ['TAC-040'],
    name: 'Aim step 2 AP (1 at Marksmanship 75+), at most maxAimSteps; spread × 0.85^n',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.aimCost(soldier(), 3), 6);
      ctx.assert.equal(c.aimCost(soldier({ attributes: { marksmanship: 75 } }), 3), 3);
      ctx.assert.equal(c.aimCost(soldier({ zoneHp: { rightArm: 10 } }), 2), 4, 'arm wound adds no aim AP');
      near(ctx.assert, c.shooterSpread(soldier(), { distance: 5, aimSteps: 3 }), 4.5 * 0.85 ** 3);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m') } })], enemy: [targetAt()] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 4 }).ok, false);
      const ap = c.unit(b, 'p1').ap;
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1, aimSteps: 2 });
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 6 - 4);
    },
  },
  // TAC-041
  {
    id: 'tac-041-reload-cost', spec: ['TAC-041', 'TAC-068'],
    name: 'Reload by feed type; arm fracture ×1.5; skilled −1; ergonomics ±1; backpack +4; tube per shell',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.reloadCost(soldier(), W('ak74m'), {}), 5);
      ctx.assert.equal(c.reloadCost(soldier({ attributes: { marksmanship: 70 } }), W('ak74m'), {}), 4);
      ctx.assert.equal(c.reloadCost(soldier(), W('ak74m'), { fromBackpack: true }), 9);
      ctx.assert.equal(c.reloadCost(soldier({ conditions: [{ type: 'fracture', zone: 'leftArm' }] }), W('ak74m'), {}), 7, 'floor(5 × 1.5)');
      ctx.assert.equal(c.reloadCost(soldier({ zoneHp: { leftArm: 0 } }), W('ak74m'), {}), 5, 'disabled arm adds no AP');
      ctx.assert.equal(c.reloadCost(soldier(), W('pkm', { ammo: 'a762' }), {}), 11, 'belt 10, ergonomics 20 → +1');
      ctx.assert.equal(c.reloadCost(soldier(), W('pm', { ammo: 'a9x18' }), {}), 3, 'pistol 4, ergonomics 80 → −1');
      ctx.assert.equal(c.reloadCost(soldier(), W('mp133', { ammo: 'a12buck' }), { shells: 3 }), 6);
      ctx.assert.equal(c.reloadCost(soldier({ attributes: { marksmanship: 70 } }), W('mp133', { ammo: 'a12buck' }), { shells: 3, fromBackpack: true }), 9, '6 − 1 + 4: modifiers once per reload');
    },
  },
  {
    id: 'tac-041-swap-magazine', spec: ['TAC-041'],
    name: 'Reload swaps in a fitting magazine; the removed one keeps its rounds; magazines are never refilled',
    async run(ctx) {
      const c = await setup(ctx);
      const vest = { item: 'chestrig', contents: [{ id: 'm1', item: 'mag545', rounds: 30, ammo: 'a545ap' }, { id: 'm2', item: 'mag9x18', rounds: 8, ammo: 'a9x18' }] };
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m', { rounds: 7 }), vest } })], enemy: [targetAt({ x: 19, y: 19 })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'reload', magazine: 'm2', sourceSlot: 'vest' }).ok, false, 'does not fit');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'reload', magazine: 'm1', sourceSlot: 'vest' }).ok, true);
      const u = c.unit(b, 'p1');
      ctx.assert.equal(u.equipment.weapon1.rounds, 30);
      ctx.assert.equal(u.equipment.weapon1.ammo, 'a545ap', 'load type comes with the magazine');
      const old = u.equipment.vest.contents.find((m) => m.item === 'mag545');
      ctx.assert.equal(old.rounds, 7, 'removed magazine keeps its rounds');
      ctx.assert.equal(old.ammo, 'a545fmj');
    },
  },
  // TAC-042
  {
    id: 'tac-042-swap', spec: ['TAC-042'],
    name: 'Swap 3 AP, 2 with a pistol, −1 at Agility 70+; drawing the holstered pistol is a pistol swap',
    async run(ctx) {
      const c = await setup(ctx);
      const eq = { weapon1: W('ak74m'), weapon2: W('svd', { ammo: 'a762' }), holster: W('pm', { ammo: 'a9x18' }) };
      ctx.assert.equal(c.swapCost(soldier({ equipment: eq }), 'weapon1', 'weapon2'), 3);
      ctx.assert.equal(c.swapCost(soldier({ equipment: eq }), 'weapon1', 'holster'), 2);
      ctx.assert.equal(c.swapCost(soldier({ equipment: eq, attributes: { agility: 70 } }), 'weapon1', 'weapon2'), 2);
      ctx.assert.equal(c.swapCost(soldier({ equipment: eq, attributes: { agility: 70 } }), 'holster', 'weapon1'), 1);
      const b = battle(c, { player: [shooterAt({ equipment: eq })], enemy: [targetAt({ x: 19, y: 19 })] });
      activate(c, b, 'pmc', 'p1');
      const ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'swapWeapon', slot: 'holster' }).ok, true);
      ctx.assert.equal(c.unit(b, 'p1').activeSlot, 'holster');
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 2);
    },
  },
  // TAC-043
  {
    id: 'tac-043-throw', spec: ['TAC-043'],
    name: 'Throw 5 AP (+4 from backpack); range 10 + floor(Strength ÷ 10); scatter 1 + d/10, × arm factors',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.throwCost(soldier(), {}), 5);
      ctx.assert.equal(c.throwCost(soldier({ zoneHp: { rightArm: 10 } }), {}), 5, 'arm wounds add no AP');
      ctx.assert.equal(c.throwCost(soldier(), { fromBackpack: true }), 9);
      ctx.assert.equal(c.throwRange(soldier()), 15);
      ctx.assert.equal(c.throwRange(soldier({ attributes: { strength: 1 } })), 10);
      ctx.assert.equal(c.throwRange(soldier({ attributes: { strength: 100 } })), 20);
      ctx.assert.equal(c.throwRange(soldier({ zoneHp: { rightArm: 0 } })), 15, 'arm wounds do not change range');
      near(ctx.assert, c.scatterRadius(soldier(), 10), 2);
      near(ctx.assert, c.scatterRadius(soldier({ zoneHp: { leftArm: 10 } }), 10), 3);
      near(ctx.assert, c.scatterRadius(soldier({ zoneHp: { leftArm: 10, rightArm: 0 } }), 10), 4, 1e-6, 'the worse arm counts');
    },
  },
  {
    id: 'tac-043-throw-range-in-battle', spec: ['TAC-043'],
    name: 'A throw beyond the maximum distance is rejected',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { map: testMap(30), player: [shooterAt({ equipment: { vest: { item: 'chestrig', contents: [{ id: 'g1', item: 'f1' }] } } })], enemy: [targetAt({ x: 28, y: 28 })] });
      activate(c, b, 'pmc', 'p1');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'throwGrenade', item: 'g1', tile: { x: 5, y: 21 } }).ok, false, '16 tiles > 15');
      ctx.assert.equal(c.act(b, 'pmc', { type: 'throwGrenade', item: 'g1', tile: { x: 5, y: 20 } }).ok, true);
    },
  },
  // TAC-079
  {
    id: 'tac-079-frag', spec: ['TAC-079'],
    name: 'Frag damage falls linearly to 0 at radiusTiles; half cover × 0.5; full cover blocks; split by zone shares',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.blastDamage('f1', 0, 'none'), 120);
      ctx.assert.equal(c.blastDamage('f1', 2.5, 'none'), 60);
      ctx.assert.equal(c.blastDamage('f1', 5, 'none'), 0);
      ctx.assert.equal(c.blastDamage('f1', 2.5, 'half'), 30);
      ctx.assert.equal(c.blastDamage('f1', 1, 'full'), 0);
      ctx.assert.deepEqual(c.blastZoneSplit(100), { head: 8, thorax: 30, leftArm: 10, rightArm: 10, leftLeg: 21, rightLeg: 21 });
      ctx.assert.deepEqual(c.blastZoneSplit(50), { head: 4, thorax: 15, leftArm: 5, rightArm: 5, leftLeg: 10, rightLeg: 10 }, 'each share rounded down');
    },
  },
  {
    id: 'tac-079-frag-loud-smoke-quiet', spec: ['TAC-079', 'TAC-019'],
    name: 'A frag blast is heard across the map; smoke is quiet and blocks sight for durationTurns',
    async run(ctx) {
      const c = await setup(ctx);
      const mk = (g) => battle(c, {
        player: [shooterAt({ equipment: { vest: { item: 'chestrig', contents: [{ id: 'g1', item: g }] } } })],
        enemy: [targetAt({ x: 5, y: 15 }), soldier({ id: 'e2', x: 18, y: 18, facing: 90 })],
        rng: fixedRng(0.5),
      });
      const b = mk('f1');
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'throwGrenade', item: 'g1', tile: { x: 12, y: 5 } });
      ctx.assert.equal(c.unit(b, 'e2').alerted, true, 'frag heard');
      const s = mk('rdg2');
      ctx.assert.equal(c.lineOfSight(s, 'p1', 'e1'), true);
      activate(c, s, 'pmc', 'p1');
      c.act(s, 'pmc', { type: 'throwGrenade', item: 'g1', tile: { x: 5, y: 10 } });
      ctx.assert.equal(c.unit(s, 'e2').alerted, false, 'smoke is quiet');
      ctx.assert.equal(c.lineOfSight(s, 'p1', 'e1'), false, 'cloud blocks the line');
      endAct(c, s, 'pmc'); pass(c, s, 'red');
      passTurn(c, s); passTurn(c, s);
      ctx.assert.equal(c.lineOfSight(s, 'p1', 'e1'), true, 'cleared after 3 turns');
    },
  },
  // TAC-044
  {
    id: 'tac-044-design-examples', spec: ['TAC-044', 'TAC-040'],
    name: 'Design: Marksmanship 50, upright, no aim, AK-74M = 9.5 MoA; prone with 3 aim steps ≈ 6.65',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.totalSpread(soldier(), W('ak74m'), { distance: 10, aimSteps: 0 }), 9.5);
      near(ctx.assert, c.totalSpread(soldier({ stance: 'prone' }), W('ak74m'), { distance: 10, aimSteps: 3 }), 6.658, 0.01);
      near(ctx.assert, c.shooterSpread(soldier({ attributes: { marksmanship: 1 } }), { distance: 1, aimSteps: 0 }), 7.93, 1e-6);
      near(ctx.assert, c.shooterSpread(soldier({ attributes: { marksmanship: 100 } }), { distance: 1, aimSteps: 0 }), 1.0, 1e-6);
    },
  },
  {
    id: 'tac-044-terms', spec: ['TAC-044', 'TAC-062', 'TAC-058'],
    name: 'Range spread, optic, ammo, condition, arm wound factor and penalties',
    async run(ctx) {
      const c = await setup(ctx);
      const t = (s, w, o = {}) => c.totalSpread(soldier(s), w, { distance: 10, aimSteps: 0, ...o });
      near(ctx.assert, t({}, W('ak74m'), { distance: 40 }), 10, 1e-6, 'range spread 0.5 × 0.05 × 20');
      near(ctx.assert, t({}, W('ak74m', { mods: ['pso1'] }), { distance: 40 }), 9.75, 1e-6, 'optic halves the range spread');
      near(ctx.assert, t({}, W('ak74m', { ammo: 'a545sub' })), 10, 1e-6, 'subsonic ×1.1');
      near(ctx.assert, t({}, W('ak74m', { condition: 0 })), 12, 1e-6, 'condition 0 → base × 1.5');
      near(ctx.assert, t({}, W('ak74m', { condition: 50 })), 10.75, 1e-6);
      near(ctx.assert, t({ zoneHp: { leftArm: 20 } }, W('ak74m')), 14.25, 1e-6, 'wounded arm × 1.5');
      near(ctx.assert, t({ zoneHp: { leftArm: 0 } }, W('ak74m')), 19, 1e-6, 'disabled arm × 2');
      near(ctx.assert, t({ conditions: [{ type: 'fracture', zone: 'rightArm' }] }, W('ak74m')), 11.5, 1e-6, 'arm fracture + 2');
      near(ctx.assert, t({}, W('ak74m'), { snapShot: true }), 12.5, 1e-6, 'snap shot + 3');
    },
  },
  // TAC-045
  {
    id: 'tac-045-normal-trace', spec: ['TAC-045'],
    name: 'Shot directions are 2D normal around the aim point, cone edge at 2σ (≈95% per axis inside)',
    async run(ctx) {
      const c = await setup(ctx);
      const rng = seeded(11);
      const n = 4000; const spread = 8;
      let inside = 0; let sx = 0; let sy = 0;
      for (let i = 0; i < n; i++) {
        const o = c.sampleOffset(spread, rng);
        sx += o.x; sy += o.y;
        if (Math.abs(o.x) <= spread / 2) inside++;
      }
      near(ctx.assert, inside / n, 0.954, 0.02, 'share within the half-width on one axis');
      near(ctx.assert, sx / n, 0, 0.15); near(ctx.assert, sy / n, 0, 0.15);
    },
  },
  {
    id: 'tac-045-pellets-and-cover', spec: ['TAC-045', 'TAC-056'],
    name: 'Buckshot traces every pellet; full cover between shooter and target stops the trace',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('mp133', { ammo: 'a12buck', rounds: 6 }) } })], enemy: [targetAt({ y: 8 })], rng: ALWAYS() });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1 });
      ctx.assert.equal(r.events.filter((e) => e.type === 'projectile').length, 8);
      const wall = testMap(20, { edges: [{ x: 5, y: 7, side: 's', cover: 'full', material: 'concrete', kind: 'wall' }] });
      const b2 = battle(c, { map: wall, player: [shooterAt({ equipment: { weapon1: W('ak74m') } })], enemy: [targetAt({ y: 8, facing: 0 })], rng: ALWAYS() });
      activate(c, b2, 'pmc', 'p1');
      const r2 = c.act(b2, 'pmc', { type: 'shoot', tile: { x: 5, y: 8 }, fireMode: 1 });
      ctx.assert.equal(r2.events.some((e) => e.type === 'hit' && e.target === 'e1'), false);
    },
  },
  // TAC-046
  {
    id: 'tac-046-preview-shape', spec: ['TAC-046'],
    name: 'Preview reports hit %, zone distribution, likely zone and penetration',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m') } })], enemy: [targetAt({ equipment: { bodyArmour: { item: 'paca', durability: 40 } } })] });
      const p = c.previewShot(b, 'p1', 'e1', { fireMode: 1, aimSteps: 0 });
      ctx.assert.ok(p.hitPct >= 0 && p.hitPct <= 100);
      near(ctx.assert, Object.values(p.zones).reduce((a, x) => a + x, 0), 1, 1e-6, 'zone shares sum to 1');
      ctx.assert.ok(p.likelyZone in p.zones);
      ctx.assert.equal(typeof p.penetrates, 'boolean');
      ctx.assert.equal(p.concealed, false);
    },
  },
  {
    id: 'tac-046-preview-leaves-rng-alone', spec: ['TAC-046'],
    name: 'Looking at a preview never changes the battle RNG sequence',
    async run(ctx) {
      const c = await setup(ctx);
      const mk = () => battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m', { rounds: 30 }) } })], enemy: [targetAt({ y: 14 })], seed: 99, rng: seeded(99) });
      const a = mk(); const z = mk();
      c.previewShot(a, 'p1', 'e1', { fireMode: 'auto', aimSteps: 0 });
      activate(c, a, 'pmc', 'p1'); activate(c, z, 'pmc', 'p1');
      const ra = c.act(a, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' });
      const rz = c.act(z, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' });
      ctx.assert.deepEqual(ra.events, rz.events);
    },
  },
  // TAC-047
  {
    id: 'tac-047-recoil', spec: ['TAC-047', 'TAC-049'],
    name: 'Recoil per extra round = 0.04 × effective recoil × (1 − control) × ammo modifier (design ≈ 0.9 MoA)',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.recoilPerRound(soldier(), W('ak74m')), 0.896);
      near(ctx.assert, c.recoilPerRound(soldier(), W('ak74m', { ammo: 'a545tracer' })), 0.7616);
      near(ctx.assert, c.recoilPerRound(soldier({ attributes: { marksmanship: 100, strength: 100 } }), W('ak74m')), 0.512);
    },
  },
  {
    id: 'tac-047-tracer-no-reveal', spec: ['TAC-047'],
    name: 'Tracers make no extra noise or spotting: hearing range as a normal shot',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.hearingRange({ weapon: W('ak74m', { ammo: 'a545tracer', mods: ['suppressor545'] }) }, soldier()), 18);
    },
  },
  // TAC-082
  {
    id: 'tac-082-concealed', spec: ['TAC-082'],
    name: 'Concealed when the target stands on, or the line crosses, an obscuring tile beyond the shooter\'s own',
    async run(ctx) {
      const c = await setup(ctx);
      const row = (s) => testMap(Array.from({ length: 20 }, (_, y) => (y === 5 ? s : '....................')));
      const mk = (map) => battle(c, { map, player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90, equipment: { weapon1: W('ak74m') } })], enemy: [soldier({ id: 'e1', x: 12, y: 5, facing: 270 })] });
      ctx.assert.equal(c.isConcealed(mk(row('....................')), 'p1', 'e1'), false);
      ctx.assert.equal(c.isConcealed(mk(row('........b...........')), 'p1', 'e1'), true, 'brush on the line');
      ctx.assert.equal(c.isConcealed(mk(row('............b.......')), 'p1', 'e1'), true, 'target on brush');
      ctx.assert.equal(c.isConcealed(mk(row('.....b..............')), 'p1', 'e1'), false, 'shooter\'s own tile never counts');
      const p = c.previewShot(mk(row('........b...........')), 'p1', 'e1', { fireMode: 1, aimSteps: 0 });
      ctx.assert.equal(p.concealed, true);
    },
  },
  {
    id: 'tac-082-one-shift-per-action', spec: ['TAC-082'],
    name: 'The aim point shifts once per shot action: every round of a burst uses the same shifted cone',
    async run(ctx) {
      const c = await setup(ctx);
      const map = testMap(Array.from({ length: 20 }, (_, y) => (y === 5 ? '........bb..........' : '....................')));
      const b = battle(c, { map, player: [soldier({ id: 'p1', x: 5, y: 5, facing: 90, equipment: { weapon1: W('ak74m', { rounds: 30 }) } })], enemy: [soldier({ id: 'e1', x: 14, y: 5, facing: 270 })], rng: seeded(5) });
      activate(c, b, 'pmc', 'p1');
      const rounds = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' }).events.filter((e) => e.type === 'round');
      ctx.assert.equal(rounds.length, 5);
      for (const r of rounds) ctx.assert.deepEqual(r.aimPoint, rounds[0].aimPoint);
    },
  },
  // TAC-083
  {
    id: 'tac-083-jam-and-wear', spec: ['TAC-083'],
    name: 'Jam chance 0.10 × ((100 − Condition)/100)², clear jam 4 AP (3 at Technical 50+), wear 0.02 per round',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.jamChance(100), 0);
      near(ctx.assert, c.jamChance(50), 0.025);
      near(ctx.assert, c.jamChance(0), 0.10);
      ctx.assert.equal(c.clearJamCost(soldier({ attributes: { technical: 49 } })), 4);
      ctx.assert.equal(c.clearJamCost(soldier({ attributes: { technical: 50 } })), 3);
      near(ctx.assert, c.wearPerRound(soldier()), 0.02);
    },
  },
  {
    id: 'tac-083-jam-in-battle', spec: ['TAC-083'],
    name: 'A jam is rolled before the rounds; a jammed weapon cannot fire until cleared',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m', { condition: 0, rounds: 30 }) } })], enemy: [targetAt()], rng: ALWAYS() });
      activate(c, b, 'pmc', 'p1');
      const r = c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1 });
      ctx.assert.ok(r.events.some((e) => e.type === 'jam'));
      ctx.assert.equal(r.events.filter((e) => e.type === 'round').length, 0);
      ctx.assert.equal(c.unit(b, 'p1').equipment.weapon1.rounds, 30);
      ctx.assert.equal(c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 1 }).ok, false, 'jammed');
      const ap = c.unit(b, 'p1').ap;
      ctx.assert.equal(c.act(b, 'pmc', { type: 'clearJam' }).ok, true);
      ctx.assert.equal(c.unit(b, 'p1').ap, ap - 3);
    },
  },
  {
    id: 'tac-083-condition-loss', spec: ['TAC-083'],
    name: 'Each round fired costs weaponWearPerShot Condition',
    async run(ctx) {
      const c = await setup(ctx);
      const b = battle(c, { player: [shooterAt({ equipment: { weapon1: W('ak74m', { condition: 100, rounds: 30 }) } })], enemy: [targetAt()], rng: seeded(2) });
      activate(c, b, 'pmc', 'p1');
      c.act(b, 'pmc', { type: 'shoot', target: 'e1', fireMode: 'auto' });
      near(ctx.assert, c.unit(b, 'p1').equipment.weapon1.condition, 99.9, 1e-9);
    },
  },
  // TAC-048 / TAC-049
  {
    id: 'tac-048-damage-falloff', spec: ['TAC-048'],
    name: 'Muzzle = calibre × ammo × barrel; −falloff per falloffRange tiles; never below 10%',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.muzzleDamage(W('ak74m')), 40);
      near(ctx.assert, c.muzzleDamage(W('aks74u')), 34);
      near(ctx.assert, c.muzzleDamage(W('ak74m', { ammo: 'a545ap' })), 36);
      near(ctx.assert, c.damageAt(W('ak74m'), 15), 37.6, 1e-9, 'design: −6% at 15');
      near(ctx.assert, c.damageAt(W('ak74m'), 30), 35.2, 1e-9, 'design: −12% at 30');
      near(ctx.assert, c.damageAt(W('ak74m'), 1000), 4, 1e-9, 'floor 10%');
    },
  },
  {
    id: 'tac-049-effective-recoil', spec: ['TAC-049'],
    name: 'Effective recoil = weapon Recoil × calibre recoil modifier',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.effectiveRecoil(W('ak74m')), 32);
      near(ctx.assert, c.effectiveRecoil(W('svd', { ammo: 'a762' })), 50);
    },
  },
  // TAC-050
  {
    id: 'tac-050-penetration', spec: ['TAC-050'],
    name: 'Penetrates if class ≥ armour; class − 1 under 50% condition with (50 − cond)% chance; 0 durability = no armour',
    async run(ctx) {
      const c = await setup(ctx);
      const A = (item, durability) => ({ item, durability });
      ctx.assert.equal(c.penetrates('a545fmj', A('paca', 40), NEVER()), true);
      ctx.assert.equal(c.penetrates('a545fmj', A('plate4', 50), ALWAYS()), false);
      ctx.assert.equal(c.penetrates('a545ap', A('plate4', 50), NEVER()), true);
      ctx.assert.equal(c.penetrates('a545fmj', A('plate4', 20), fixedRng(0.09)), true, '40%: 10% chance, roll 9');
      ctx.assert.equal(c.penetrates('a545fmj', A('plate4', 20), fixedRng(0.11)), false, 'roll 11');
      ctx.assert.equal(c.penetrates('a545fmj', A('plate4', 30), ALWAYS()), false, '60% condition: no chance');
      ctx.assert.equal(c.penetrates('a545hp', A('plate4', 5), ALWAYS()), false, 'two classes below: never');
      ctx.assert.equal(c.penetrates('a545hp', A('plate4', 0), NEVER()), true, 'broken armour');
      ctx.assert.equal(c.penetrates('a545hp', null, NEVER()), true, 'unarmoured zone');
    },
  },
  // TAC-051
  {
    id: 'tac-051-blunt-and-wear', spec: ['TAC-051'],
    name: 'Blunt = 20% of damage at distance; wear ceil(dmg × 0.10 / 0.05), at least 1, × durabilityLossModifier',
    async run(ctx) {
      const c = await setup(ctx);
      near(ctx.assert, c.bluntDamage(40), 8);
      ctx.assert.equal(c.armourWearAmount({ item: 'paca', durability: 40 }, 40, false), 4);
      ctx.assert.equal(c.armourWearAmount({ item: 'paca', durability: 40 }, 40, true), 2);
      ctx.assert.equal(c.armourWearAmount({ item: 'paca', durability: 40 }, 5, true), 1, 'at least 1');
      ctx.assert.equal(c.armourWearAmount({ item: 'plate4', durability: 50 }, 40, false), 6, 'ceramic × 1.5');
    },
  },
  {
    id: 'tac-051-blunt-never-bleeds', spec: ['TAC-051', 'TAC-060'],
    name: 'A blocked round never causes bleeding, even on a sure roll',
    async run(ctx) {
      const c = await setup(ctx);
      const fx = c.hitEffects(soldier(), 'thorax', { damage: 30, blunt: true }, ALWAYS());
      ctx.assert.equal(fx.bleeding, null);
    },
  },
];
