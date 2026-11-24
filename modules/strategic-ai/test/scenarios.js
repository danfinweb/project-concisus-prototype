// Strategic AI (faction AI) — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=strategic-ai).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
//
// Core API these tests expect from ../core/index.js (written by /apply-spec):
//   decide(view, rng) → { commands, log }          SAI-001; rng is a shared/rng.js Rng
//   responseCurve(curve, x) → number in [0, 1]     SAI-006; curve { type: 'linear', points: [[x, y], …] }
//                                                  (piecewise-linear, clamped at both ends and to 0..1)
//   pickBest(options, rng) → one entry of options  SAI-006; highest `total`, ties broken by rng
//   situationMaps(view) → { [regionId]: { ownStrength, enemyStrength, economicValue, threat,
//                                         frontline, supplyReach } }   SAI-007
// Conventions the tests rely on (test choices, reported to the user):
//   - log option labels name the IDs they are about (region, squad, contract, measure or request ID);
//   - consideration names: strategist terms `damageToRivals`, `cost`, `risk`, `overdraft`, `signOverlap`,
//     `commitmentBonus` and the doctrine's `gainTerms` names (`capital`, `contractPay`, …); a logged
//     total is the weighted sum of its logged considerations, cost/risk/overdraft subtracted (SAI-008);
//   - Krug escort scoring: doctrine `escortAccept { considerations, threshold }`.
// Core is loaded per scenario, so each case fails on its own until core/ exists.
import {
  setup, loadCore, schemaErrors, deepFreeze, makeView, randomView, offer, grid, violations,
  playerTargets, strategistEntries, allOptions, optionsNaming, expectedTotal, patchDoctrine, patchTable,
  AI_FACTIONS, Rng, registry,
} from './helpers.js';

const json = (x) => JSON.stringify(x);
const seeds = (n, from = 1) => Array.from({ length: n }, (_, i) => from + i);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

async function run(view, seed = 1) {
  const core = await loadCore();
  return core.decide(view, new Rng(seed));
}
function noViolations(assert, view, res, label = '') {
  const v = violations(view, res);
  assert.ok(v.length === 0, `${label} ${v.join('; ')}`);
}
function cmds(res, type) { return res.commands.filter((c) => c.type === type); }

// A view with a weak player squad on s1's tile and a player-held tile next to own ground (SAI-013).
function playerNearby(faction = 'ssv', o = {}) {
  const v = makeView(faction, o);
  v.knownSquads = [...v.knownSquads, { id: 'player-k1', faction: 'player', region: 'r0_1', estimatedStrength: 1, seen: { ...v.time } }];
  const r = v.knownRegions.find((x) => x.id === 'r1_2');
  r.controller = 'player'; r.poi = 'gas';
  return v;
}
const namesPlayer = (res, v) => allOptions(res).some((o) => [...playerTargets(v)].some((id) => String(o.option).includes(id)));

export default {
  module: 'strategic-ai',
  scenarios: [
    // ---------------- SAI-001 Controller role ----------------
    {
      id: 'sai001-deterministic', spec: ['SAI-001'], name: 'Same view, data and seed give the same commands and log',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(12)) {
          const v = randomView(s);
          assert.equal(json(await run(v, s)), json(await run(v, s)), `seed ${s} (${v.faction})`);
        }
      },
    },
    {
      id: 'sai001-pure', spec: ['SAI-001'], name: 'decide works on a deep-frozen view and never changes it',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(6)) {
          const v = randomView(s);
          const before = json(v);
          const res = await run(deepFreeze(v), s);
          assert.equal(json(v), before, `seed ${s}: view changed`);
          assert.ok(Array.isArray(res.commands) && Array.isArray(res.log), 'returns { commands, log }');
        }
      },
    },
    {
      id: 'sai001-no-memory', spec: ['SAI-001', 'SAI-011'], name: 'No memory between calls: A, B, A gives A twice',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const a = randomView(3, { faction: 'ssv', squads: 2 }), b = randomView(4, { faction: 'ssv', squads: 3 });
        const first = json(await run(a, 7));
        await run(b, 8);
        assert.equal(json(await run(a, 7)), first);
      },
    },
    {
      id: 'sai001-schema', spec: ['SAI-001', 'SAI-004', 'SAI-011'], name: 'Output is valid strategic_commands',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(15)) {
          const v = randomView(s);
          const res = await run(v, s);
          const errs = await schemaErrors('strategic_commands', { faction: v.faction, ...res });
          assert.ok(errs.length === 0, `seed ${s}: ${errs.join('; ')}`);
        }
      },
    },

    // ---------------- SAI-002 Invocation ----------------
    {
      id: 'sai002-every-controller', spec: ['SAI-002', 'SAI-010'], name: 'Each AI faction, a resistance group and a rogue PMC get a legal command set',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const views = [
          ...AI_FACTIONS.map((f) => makeView(f)),
          makeView('res-3', { doctrine: 'resistance' }),
          makeView('varyag', { doctrine: 'rogue' }),
        ];
        for (const v of views) {
          const res = await run(v);
          noViolations(assert, v, res, `${v.faction}/${v.doctrine}:`);
          const errs = await schemaErrors('strategic_commands', { faction: v.faction, ...res });
          assert.ok(errs.length === 0, `${v.faction}: ${errs.join('; ')}`);
        }
      },
    },

    // ---------------- SAI-003 Perception view ----------------
    {
      id: 'sai003-test-views-valid', spec: ['SAI-003'], name: 'Test views are valid strategic_perception_view 0.8.0',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const views = [...AI_FACTIONS.map((f) => makeView(f)), ...seeds(20).map((s) => randomView(s))];
        for (const v of views) {
          const errs = await schemaErrors('strategic_perception_view', v);
          assert.ok(errs.length === 0, `${v.faction}: ${errs.join('; ')}`);
        }
      },
    },
    {
      id: 'sai003-minimal-view', spec: ['SAI-003', 'SAI-005'], name: 'A view with only the required fields (plus doctrine) works',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const full = makeView('vdk');
        const v = { faction: 'vdk', time: full.time, doctrine: 'vdk', ownSquads: full.ownSquads, knownRegions: full.knownRegions };
        const res = await run(v);
        noViolations(assert, v, res);
      },
    },
    {
      id: 'sai003-stale-knowledge', spec: ['SAI-003', 'SAI-007'], name: 'Old observations and sightings are used without error',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const v = makeView('ssv', { time: { day: 9, hour: 4 } });
        v.knownSquads[0].seen = { day: 1, hour: 0 };
        const res = await run(v);
        noViolations(assert, v, res);
      },
    },

    // ---------------- SAI-004 Command set ----------------
    {
      id: 'sai004-legal-random', spec: ['SAI-004', 'SAI-005'], name: '40 random views: no illegal command (own squads, adjacency, one action and one assignment per squad, funds, recruit pool)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(40)) {
          const v = randomView(s);
          noViolations(assert, v, await run(v, s), `seed ${s} (${v.faction}):`);
        }
      },
    },
    {
      id: 'sai004-impassable', spec: ['SAI-004'], name: 'Never moves into water (impassable terrain)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const terrain = { r1_0: 'water', r1_1: 'water', r1_2: 'water' };
        const v = makeView('ssv', { knownRegions: grid(5, 3, { terrain, controller: { r0_0: 'ssv', r0_1: 'ssv', r0_2: 'ssv' }, poi: { r2_1: 'capital', r0_1: 'town' } }),
          ownSquads: [{ id: 'ssv-s1', region: 'r0_1', strength: 6, vehicle: null, transit: null }] });
        for (const s of seeds(8)) {
          const res = await run(v, s);
          assert.ok(!cmds(res, 'moveSquad').some((c) => terrain[c.toRegion]), `seed ${s}: moved into water`);
        }
      },
    },

    // ---------------- SAI-005 No hidden information ----------------
    {
      id: 'sai005-hidden-fields-ignored', spec: ['SAI-005'], name: 'Fields outside the view schema do not change the output',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(6)) {
          const v = randomView(s);
          const leaky = structuredClone(v);
          leaky.hiddenSquads = [{ id: 'x-1', faction: 'vdk', region: v.knownRegions[0].id, strength: 99 }];
          leaky.allFunds = { ssv: 1e9, vdk: 0 };
          leaky.knownRegions.forEach((r) => { r.trueController = 'krug'; });
          assert.equal(json(await run(leaky, s)), json(await run(v, s)), `seed ${s}`);
        }
      },
    },
    {
      id: 'sai005-known-targets-only', spec: ['SAI-005', 'SAI-004'], name: 'Targets are known regions, known squads, own squads or the player',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(20)) {
          const v = randomView(s);
          const known = new Set([...v.knownRegions.map((r) => r.id), ...(v.knownSquads ?? []).map((k) => k.id),
            ...v.ownSquads.map((o) => o.id), ...(v.vips ?? []).map((x) => x.id), 'player']);
          for (const c of (await run(v, s)).commands) {
            if (c.target !== undefined) assert.ok(known.has(c.target), `seed ${s}: ${c.type} target ${c.target} unknown`);
            if (c.toRegion !== undefined) assert.ok(known.has(c.toRegion), `seed ${s}: toRegion ${c.toRegion} unknown`);
          }
        }
      },
    },

    // ---------------- SAI-006 Utility scoring ----------------
    {
      id: 'sai006-curve-linear', spec: ['SAI-006'], name: 'Linear response curve interpolates and clamps',
      async run({ assert }) {
        const { responseCurve } = await loadCore();
        const c = { type: 'linear', points: [[0, 0], [10, 1]] };
        assert.ok(near(responseCurve(c, 5), 0.5), 'mid');
        assert.equal(responseCurve(c, -3), 0, 'below');
        assert.equal(responseCurve(c, 99), 1, 'above');
        const tent = { type: 'linear', points: [[0, 0], [5, 1], [10, 0]] };
        assert.ok(near(responseCurve(tent, 7.5), 0.5), 'second segment');
        assert.ok(near(responseCurve(tent, 5), 1), 'at a point');
      },
    },
    {
      id: 'sai006-curve-step', spec: ['SAI-006'], name: 'Step curve: y of the last point whose x ≤ input, clamped outside',
      async run({ assert }) {
        const { responseCurve } = await loadCore();
        const c = { type: 'step', points: [[0, 0.2], [5, 0.6], [10, 1]] };
        assert.equal(responseCurve(c, -1), 0.2, 'below the first x');
        assert.equal(responseCurve(c, 0), 0.2);
        assert.equal(responseCurve(c, 4.9), 0.2);
        assert.equal(responseCurve(c, 5), 0.6);
        assert.equal(responseCurve(c, 9), 0.6);
        assert.equal(responseCurve(c, 50), 1, 'above the last x');
      },
    },
    {
      id: 'sai006-curve-range', spec: ['SAI-006'], name: 'Curve output always lies in 0..1',
      async run({ assert }) {
        const { responseCurve } = await loadCore();
        const wild = { type: 'linear', points: [[0, -1], [1, 2]] };
        assert.equal(responseCurve(wild, 0), 0);
        assert.equal(responseCurve(wild, 1), 1);
        const r = new Rng(5);
        for (let i = 0; i < 200; i++) {
          const y = responseCurve({ type: 'linear', points: [[0, r.next()], [r.int(1, 50), r.next()]] }, r.int(-20, 80));
          assert.ok(y >= 0 && y <= 1, `got ${y}`);
        }
      },
    },
    {
      id: 'sai006-pick-highest', spec: ['SAI-006'], name: 'pickBest takes the highest total',
      async run({ assert }) {
        const { pickBest } = await loadCore();
        const opts = [{ option: 'a', total: 1 }, { option: 'b', total: 3 }, { option: 'c', total: 2 }];
        for (const s of seeds(10)) assert.equal(pickBest(opts, new Rng(s)).option, 'b');
      },
    },
    {
      id: 'sai006-ties-by-rng', spec: ['SAI-006'], name: 'Ties are broken by rng: both tied options occur, never a lower one; same seed, same pick',
      async run({ assert }) {
        const { pickBest } = await loadCore();
        const opts = [{ option: 'a', total: 2 }, { option: 'b', total: 2 }, { option: 'c', total: 1 }];
        const seen = new Set();
        for (const s of seeds(40)) {
          const p = pickBest(opts, new Rng(s)).option;
          seen.add(p);
          assert.equal(pickBest(opts, new Rng(s)).option, p, `seed ${s} not repeatable`);
        }
        assert.ok(seen.has('a') && seen.has('b') && !seen.has('c'), `picked ${[...seen]}`);
      },
    },
    {
      id: 'sai006-logged-scores-in-range', spec: ['SAI-006', 'SAI-011'], name: 'Every logged consideration score is in 0..1',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(15)) {
          for (const o of allOptions(await run(randomView(s), s))) {
            for (const [k, x] of Object.entries(o.considerations ?? {})) assert.ok(x >= 0 && x <= 1, `seed ${s} ${o.option} ${k}=${x}`);
          }
        }
      },
    },

    // ---------------- SAI-007 Situation maps ----------------
    {
      id: 'sai007-layers', spec: ['SAI-007', 'SAI-006'], name: 'One entry per known region with all six layers, each on the 0–1 scale',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const v = makeView('ssv');
        const m = situationMaps(v);
        assert.deepEqual(Object.keys(m).sort(), v.knownRegions.map((r) => r.id).sort());
        for (const [id, l] of Object.entries(m)) {
          for (const k of ['ownStrength', 'enemyStrength', 'economicValue', 'threat', 'frontline', 'supplyReach']) {
            assert.ok(Number.isFinite(l[k]) && l[k] >= 0 && l[k] <= 1, `${id}.${k} = ${l[k]} not on the 0–1 scale`);
          }
        }
      },
    },
    {
      id: 'sai007-own-strength', spec: ['SAI-007'], name: 'Own strength is higher where own squads stand',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const m = situationMaps(makeView('ssv'));
        assert.ok(m.r0_1.ownStrength > m.r4_2.ownStrength, `${m.r0_1.ownStrength} vs ${m.r4_2.ownStrength}`);
      },
    },
    {
      id: 'sai007-enemy-strength', spec: ['SAI-007', 'SAI-005'], name: 'Enemy strength comes only from known squads',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const none = situationMaps(makeView('ssv', { knownSquads: [] }));
        assert.ok(Object.values(none).every((l) => l.enemyStrength === 0), 'no known squads → 0 everywhere');
        const one = situationMaps(makeView('ssv'));
        assert.ok(one.r3_1.enemyStrength > 0, 'known VDK squad on r3_1');
        assert.ok(one.r3_1.enemyStrength >= one.r0_0.enemyStrength);
      },
    },
    {
      id: 'sai007-frontline', spec: ['SAI-007'], name: 'Own tiles next to hostile ground are more frontline than tiles behind',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const m = situationMaps(makeView('ssv'));
        assert.ok(m.r1_1.frontline > m.r0_0.frontline, `${m.r1_1.frontline} vs ${m.r0_0.frontline}`);
      },
    },
    {
      id: 'sai007-economic-value', spec: ['SAI-007'], name: 'An income POI has more economic value than an empty tile',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const m = situationMaps(makeView('ssv'));
        assert.ok(m.r4_1.economicValue > m.r4_2.economicValue, 'oil plant vs empty');
        assert.ok(m.r2_1.economicValue > m.r3_2.economicValue, 'capital vs empty');
      },
    },
    {
      id: 'sai007-stateless', spec: ['SAI-007', 'SAI-005'], name: 'Maps are recomputed from the view only: same view, same maps; frozen view ok',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { situationMaps } = await loadCore();
        const v = makeView('vdk');
        const a = json(situationMaps(deepFreeze(structuredClone(v))));
        const leaky = { ...structuredClone(v), hiddenSquads: [{ faction: 'ssv', region: 'r1_1', strength: 50 }] };
        assert.equal(json(situationMaps(v)), a);
        assert.equal(json(situationMaps(leaky)), a, 'hidden field changed the maps');
      },
    },

    // ---------------- SAI-008 Strategist ----------------
    {
      id: 'sai008-score-sum', spec: ['SAI-008', 'SAI-006'], name: 'Strategist totals = ownGain + damageToRivals − cost − risk + commitmentBonus (weighted)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const views = [...AI_FACTIONS.map((f) => makeView(f)), ...seeds(10).map((s) => randomView(s))];
        for (const v of views) {
          const res = await run(v);
          const entries = strategistEntries(res);
          assert.ok(entries.length > 0, `${v.faction}: no strategist entry`);
          const d = registry.get('ai/doctrines', v.doctrine);
          for (const o of entries.flatMap((e) => e.options)) {
            const exp = expectedTotal(d, o.considerations);
            assert.ok(near(o.total, exp), `${v.faction} ${o.option}: total ${o.total}, sum ${exp}`);
          }
        }
      },
    },
    {
      id: 'sai008-commitment', spec: ['SAI-008'], name: 'commitmentBonus only for objectives already pursued',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const idle = await run(makeView('ssv'));
        assert.ok(!allOptions(idle).some((o) => (o.considerations?.commitmentBonus ?? 0) > 0), 'bonus with no goal set');
        const v = makeView('ssv');
        v.ownSquads[0].goal = 'attackPoi'; v.ownSquads[0].target = 'r2_1';
        const busy = await run(v);
        assert.ok(strategistEntries(busy).flatMap((e) => e.options).some((o) => (o.considerations?.commitmentBonus ?? 0) > 0), 'no bonus for the pursued objective');
      },
    },
    {
      id: 'sai008-ultimate-goals', spec: ['SAI-008', 'SAI-012'], name: 'Candidates follow the ultimate goal: states and rogue PMC eye the capital, the Krug its market',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const d of ['ssv', 'vdk', 'rogue', 'krug']) await patchDoctrine(d, { logTopN: 50 });
        for (const [f, doc] of [['ssv', 'ssv'], ['vdk', 'vdk'], ['varyag', 'rogue']]) {
          const v = makeView(f, { doctrine: doc });
          if (f === 'vdk') v.capital = { tile: 'r2_1', holder: 'ssv', occupant: 'ssv', contestedSince: null };
          const res = await run(v);
          const cap = optionsNaming(res, 'r2_1');
          assert.ok(cap.length > 0, `${f}/${doc}: no capital objective`);
          assert.ok(cap.some((o) => (o.considerations?.capital ?? 0) > 0), `${f}/${doc}: capital gain term not used`);
        }
        const k = await run(makeView('krug'));
        assert.ok(optionsNaming(k, 'r0_1').some((o) => (o.considerations?.tradeRoutes ?? 0) > 0), 'Krug: market not valued by tradeRoutes');
      },
    },

    // ---------------- SAI-009 Operational planner ----------------
    {
      id: 'sai009-idle-assigned', spec: ['SAI-009'], name: 'Idle squads get an objective (setGoal) when objectives exist',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(5)) {
          const v = makeView('ssv');
          assert.ok(cmds(await run(v, s), 'setGoal').length > 0, `seed ${s}: no setGoal`);
        }
      },
    },
    {
      id: 'sai009-move-toward', spec: ['SAI-009', 'SAI-004'], name: 'A moving squad gets closer to its region target',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const v = makeView('ssv');
        v.ownSquads[0].goal = 'attackPoi'; v.ownSquads[0].target = 'r4_1';
        const pos = Object.fromEntries(v.knownRegions.map((r) => [r.id, r]));
        const d = (a, b) => Math.abs(pos[a].x - pos[b].x) + Math.abs(pos[a].y - pos[b].y);
        for (const s of seeds(10)) {
          const res = await run(v, s);
          for (const m of cmds(res, 'moveSquad')) {
            const sq = v.ownSquads.find((x) => x.id === m.squad);
            const g = cmds(res, 'setGoal').find((x) => x.squad === m.squad);
            const goal = g?.goal ?? sq.goal, target = g ? g.target : sq.target;
            if (!pos[target] || ['patrol', 'hunt', 'escort'].includes(goal)) continue;
            assert.ok(d(m.toRegion, target) < d(sq.region, target), `seed ${s}: ${m.squad} ${sq.region}→${m.toRegion} away from ${target}`);
          }
        }
      },
    },

    // ---------------- SAI-010 Doctrines ----------------
    {
      id: 'sai010-view-doctrine', spec: ['SAI-010'], name: 'The view doctrine drives the scores',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const a = await run(makeView('ssv', { doctrine: 'ssv' }));
        const b = await run(makeView('ssv', { doctrine: 'krug' }));
        assert.notEqual(json(a.log), json(b.log));
      },
    },
    {
      id: 'sai010-faction-link', spec: ['SAI-010'], name: 'Without view.doctrine, factions.doctrine is used',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        assert.equal(json(await run(makeView('vdk', { doctrine: null }))), json(await run(makeView('vdk', { doctrine: 'vdk' }))));
      },
    },
    {
      id: 'sai010-unknown-doctrine', spec: ['SAI-010'], name: 'An unknown doctrine is an error, not a silent default',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const { decide } = await loadCore(); // a missing core must not count as the expected error
        let threw = false;
        try { decide(makeView('ssv', { doctrine: 'nope' }), new Rng(1)); } catch { threw = true; }
        assert.ok(threw);
      },
    },
    {
      id: 'sai010-rogue', spec: ['SAI-010', 'SAI-002'], name: 'A rogue PMC keeps its ID but plays its rogue doctrine',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const a = await run(makeView('varyag', { doctrine: 'varyag' }));
        const b = await run(makeView('varyag', { doctrine: 'rogue' }));
        assert.notEqual(json(a.log), json(b.log));
      },
    },
    {
      id: 'sai010-aggression', spec: ['SAI-010'], name: 'Higher aggression never lowers and somewhere raises an attack objective',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const totals = async (aggr) => {
          await patchDoctrine('ssv', { logTopN: 50, personality: { aggression: aggr } });
          return Object.fromEntries(strategistEntries(await run(makeView('ssv'))).flatMap((e) => e.options)
            .filter((o) => /r2_1|r3_1|r4_1|vdk-s9/.test(o.option)).map((o) => [o.option, o.total]));
        };
        const lo = await totals(0), hi = await totals(1);
        const shared = Object.keys(lo).filter((k) => k in hi);
        assert.ok(shared.length > 0, 'no attack objective in both runs');
        assert.ok(shared.every((k) => hi[k] >= lo[k] - 1e-9), 'aggression lowered a score');
        assert.ok(shared.some((k) => hi[k] > lo[k]), 'aggression has no effect');
      },
    },
    {
      id: 'sai010-risk-tolerance', spec: ['SAI-010'], name: 'Higher riskTolerance never lowers and somewhere raises a risky objective',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const totals = async (t) => {
          await patchDoctrine('ssv', { logTopN: 50, personality: { riskTolerance: t } });
          return Object.fromEntries(strategistEntries(await run(makeView('ssv'))).flatMap((e) => e.options)
            .filter((o) => (o.considerations?.risk ?? 0) > 0).map((o) => [o.option, o.total]));
        };
        const lo = await totals(0), hi = await totals(1);
        const shared = Object.keys(lo).filter((k) => k in hi);
        assert.ok(shared.length > 0, 'no risky objective in both runs');
        assert.ok(shared.every((k) => hi[k] >= lo[k] - 1e-9), 'risk tolerance lowered a score');
        assert.ok(shared.some((k) => hi[k] > lo[k]), 'risk tolerance has no effect');
      },
    },
    {
      id: 'sai010-contract-use', spec: ['SAI-010', 'SAI-014'], name: 'Higher contractUse gives at least as many contract offers',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const count = async (cu) => {
          await patchDoctrine('vdk', { personality: { contractUse: cu } });
          let n = 0;
          for (const s of seeds(10)) n += cmds(await run(makeView('vdk', { ownSquads: [] }), s), 'offerContract').length;
          return n;
        };
        const lo = await count(0), hi = await count(1);
        assert.ok(hi >= lo && hi > 0, `contractUse 0: ${lo}, 1: ${hi}`);
      },
    },

    // ---------------- SAI-011 Decision log ----------------
    {
      id: 'sai011-entries', spec: ['SAI-011'], name: 'Log entries carry view time and faction; options best first, ≤ logTopN; chosen is a top option',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(15)) {
          const v = randomView(s);
          const res = await run(v, s);
          const topN = registry.get('ai/doctrines', v.doctrine).logTopN;
          for (const e of res.log) {
            assert.deepEqual(e.time, v.time);
            assert.equal(e.faction, v.faction);
            assert.ok(e.options.length >= 1 && e.options.length <= topN, `${e.options.length} options`);
            for (let i = 1; i < e.options.length; i++) assert.ok(e.options[i - 1].total >= e.options[i].total, 'not sorted');
            const ch = e.options.find((o) => o.option === e.chosen);
            assert.ok(ch && near(ch.total, e.options[0].total), `seed ${s}: chosen ${e.chosen} is not a top option`);
          }
        }
      },
    },
    {
      id: 'sai011-topn', spec: ['SAI-011', 'SAI-010'], name: 'logTopN from the doctrine limits the options kept',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 1 });
        const res = await run(makeView('ssv'));
        assert.ok(res.log.length > 0 && res.log.every((e) => e.options.length === 1));
      },
    },
    {
      id: 'sai011-planner-per-squad', spec: ['SAI-011', 'SAI-009'], name: 'Planner logs a decision for each squad free to act',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const v = makeView('ssv');
        v.ownSquads.push({ id: 'ssv-s3', region: 'r0_0', strength: 4, vehicle: null, transit: { toRegion: 'r1_0', hoursLeft: 2 } });
        const res = await run(v);
        const planner = res.log.filter((e) => e.tier === 'planner');
        for (const id of ['ssv-s1', 'ssv-s2']) assert.ok(planner.some((e) => e.decision.includes(id)), `no planner entry for ${id}`);
      },
    },

    // ---------------- SAI-012 Own goals ----------------
    {
      id: 'sai012-own-goals', spec: ['SAI-012', 'SAI-013'], name: 'Non-hostile factions never target the player (30 random views)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(30)) {
          const v = randomView(s, { standing: ['neutral', 'friendly', 'trusted'][s % 3] });
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s} (${v.faction}):`);
        }
      },
    },

    // ---------------- SAI-013 Hostility toward the player ----------------
    {
      id: 'sai013-neutral', spec: ['SAI-013'], name: 'Neutral standing: no candidate and no command targets the player, even a weak squad next door',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        for (const s of seeds(8)) {
          const v = playerNearby('ssv');
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          assert.ok(!namesPlayer(res, v), `seed ${s}: a candidate targets the player`);
        }
      },
    },
    {
      id: 'sai013-unfriendly-alone', spec: ['SAI-013'], name: 'Unfriendly without a shared objective is not hostile',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const v = playerNearby('ssv', { reputationWithPlayer: { value: -30, standing: 'unfriendly' } });
        const res = await run(v);
        noViolations(assert, v, res);
        assert.ok(!namesPlayer(res, v), 'a candidate targets the player');
      },
    },
    {
      id: 'sai013-hostile-standing', spec: ['SAI-013'], name: 'Hostile standing makes the player a candidate target',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const v = playerNearby('ssv', { reputationWithPlayer: { value: -70, standing: 'hostile' } });
        assert.ok(namesPlayer(await run(v), v), 'no candidate targets the player');
      },
    },
    {
      id: 'sai013-mission-on-player', spec: ['SAI-013'], name: 'A mission targeting the player makes it hostile at neutral standing',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const v = playerNearby('ssv', { contracts: [{ id: 'c-hunt', role: 'employer', employer: 'ssv', contractor: 'varyag', targetFaction: 'player', sourceGoal: 'hunt',
          missions: [{ key: 'm1', missionId: 'hunt_squad', targets: ['player'], location: 'r0_1', status: 'open' }],
          deadline: { day: 6, hour: 0 }, status: 'accepted', counterContractOf: null }] });
        assert.ok(namesPlayer(await run(v), v), 'no candidate targets the player');
      },
    },

    {
      id: 'sai013-shared-objective', spec: ['SAI-013'], name: 'Unfriendly plus the same goal and target (knownGoal/knownTarget) makes it hostile; another target does not',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const build = (knownTarget) => {
          const v = playerNearby('ssv', { reputationWithPlayer: { value: -30, standing: 'unfriendly' } });
          v.ownSquads[1].goal = 'attackPoi'; v.ownSquads[1].target = 'r2_1';
          Object.assign(v.knownSquads.find((k) => k.id === 'player-k1'), { knownGoal: 'attackPoi', knownTarget });
          return v;
        };
        const same = build('r2_1'), other = build('r4_1');
        assert.ok(namesPlayer(await run(same), same), 'same objective: the player is no candidate');
        const res = await run(other);
        noViolations(assert, other, res);
        assert.ok(!namesPlayer(res, other), 'other target: a candidate targets the player');
      },
    },

    // ---------------- SAI-014 Contract offers ----------------
    {
      id: 'sai014-no-squads', spec: ['SAI-014', 'SAI-009'], name: 'Without squads a faction covers objectives by contract or by raising a squad',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { personality: { contractUse: 1 } });
        let offers = 0;
        for (const s of seeds(5)) {
          const v = makeView('ssv', { ownSquads: [] });
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          offers += cmds(res, 'offerContract').length;
          assert.ok(cmds(res, 'offerContract').length + cmds(res, 'recruit').length > 0, `seed ${s}: neither offer nor recruit`);
        }
        assert.ok(offers > 0, 'never offered a contract');
      },
    },
    {
      id: 'sai014-offer-fields', spec: ['SAI-014', 'SAI-004'], name: 'Offers: own employer, missions serving the source goal (MGT-043), future deadline, unique keys and ids',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('vdk', { personality: { contractUse: 1 } });
        let n = 0;
        for (const s of seeds(8)) {
          const v = makeView('vdk', { ownSquads: [] });
          const offers = cmds(await run(v, s), 'offerContract').map((c) => c.contract);
          assert.equal(new Set(offers.map((o) => o.id)).size, offers.length, 'duplicate offer id');
          for (const o of offers) {
            n++;
            assert.equal(o.employer, 'vdk');
            assert.ok(o.missions.length > 0, 'no missions');
            assert.equal(new Set(o.missions.map((m) => m.key)).size, o.missions.length, 'duplicate mission key');
            for (const m of o.missions) {
              const rec = registry.get('missions', m.missionId);
              assert.ok(rec, `unknown mission ${m.missionId}`);
              assert.ok(rec.goals.includes(o.sourceGoal), `${m.missionId} does not serve ${o.sourceGoal}`);
            }
            const t = (x) => x.day * 24 + x.hour;
            assert.ok(o.deadline && t(o.deadline) > t(v.time), 'deadline not in the future');
          }
        }
        assert.ok(n > 0, 'no offers to check');
      },
    },
    {
      id: 'sai014-offer-ids-per-hour', spec: ['SAI-014', 'SAI-001'], name: 'Offer ids from different hours never collide (no memory needed)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('vdk', { personality: { contractUse: 1 } });
        const ids = async (hour) => cmds(await run(makeView('vdk', { ownSquads: [], time: { day: 3, hour } })), 'offerContract').map((c) => c.contract.id);
        const a = await ids(10), b = await ids(11);
        assert.ok(a.length && b.length, 'no offers');
        assert.ok(!a.some((x) => b.includes(x)), `collision ${a} / ${b}`);
      },
    },
    {
      id: 'sai014-cost-is-money', spec: ['SAI-014', 'SAI-006'], name: 'cost is money spent now: 0 for objectives own squads work, > 0 for offers and recruits',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50, personality: { contractUse: 1 } });
        const withSquads = await run(makeView('ssv'));
        for (const o of strategistEntries(withSquads).flatMap((e) => e.options)) {
          assert.ok(!(o.considerations?.cost > 0), `${o.option}: cost ${o.considerations?.cost} for an own-squad objective`);
        }
        const none = allOptions(await run(makeView('ssv', { ownSquads: [] }))).filter((o) => /^(offer|recruit):/.test(o.option));
        assert.ok(none.length > 0, 'no offer or recruit candidate without squads');
        assert.ok(none.every((o) => o.considerations?.cost > 0), 'an offer or recruit has no cost');
      },
    },
    {
      id: 'sai014-recruit-pool', spec: ['SAI-014', 'SAI-009'], name: 'No recruit when recruitsAvailable is below the squad template size',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { personality: { contractUse: 0 } });
        for (const s of seeds(5)) {
          const v = makeView('ssv', { ownSquads: [], recruitsAvailable: 5 }); // template size 6
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          assert.equal(cmds(res, 'recruit').length, 0, `seed ${s}: recruit with 5 of 6 recruits`);
          const ok = await run(makeView('ssv', { ownSquads: [], recruitsAvailable: 6 }), s);
          assert.equal(cmds(ok, 'recruit').length, 1, `seed ${s}: no recruit with 6 recruits and funds`);
        }
      },
    },
    {
      id: 'sai014-hard-limit', spec: ['SAI-014'], name: 'hardLimit: no offer, recruit or escort hire without the funds',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const f of AI_FACTIONS) {
          const v = makeView(f, { ownSquads: [], funds: 0 });
          const res = await run(v);
          for (const t of ['offerContract', 'recruit', 'hireEscort']) assert.equal(cmds(res, t).length, 0, `${f}: ${t} with funds 0`);
        }
        for (const s of seeds(20)) {
          const v = randomView(s, { funds: 500 });
          noViolations(assert, v, await run(v, s), `seed ${s}:`);
        }
      },
    },
    {
      id: 'sai014-score-term', spec: ['SAI-014', 'SAI-006'], name: 'scoreTerm: the overdraft lowers every candidate that costs money (offers, recruits)',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchTable('economy-rules', { fundsMode: 'scoreTerm' });
        await patchDoctrine('ssv', { logTopN: 50, personality: { contractUse: 1 } });
        const byOpt = async (od) => Object.fromEntries(allOptions(await run(makeView('ssv', { ownSquads: [], funds: 0, overdraft: od })))
          .map((o) => [o.option, o]));
        const a = await byOpt(0), b = await byOpt(50000);
        const costly = Object.keys(a).filter((k) => k in b && (a[k].considerations?.cost ?? 0) > 0);
        assert.ok(costly.length > 0, 'no costly candidate');
        for (const k of costly) {
          assert.ok(b[k].total < a[k].total, `${k}: ${b[k].total} not below ${a[k].total}`);
          assert.ok((b[k].considerations?.overdraft ?? 0) > 0, `${k}: no overdraft consideration`);
        }
      },
    },

    // ---------------- SAI-015 Contract offer evaluation ----------------
    {
      id: 'sai015-only-rival-pmcs', spec: ['SAI-015'], name: 'States, the Krug and resistance never take contracts',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const [f, doc] of [['ssv', 'ssv'], ['vdk', 'vdk'], ['krug', 'krug'], ['res-1', 'resistance']]) {
          for (const s of seeds(3)) {
            const v = makeView(f, { doctrine: doc, contractOffers: [offer('vdk', 'off-1', 'r2_1')] });
            assert.equal(cmds(await run(v, s), 'acceptContract').length, 0, `${f} took a contract`);
          }
        }
      },
    },
    {
      id: 'sai015-takes-lucrative', spec: ['SAI-015'], name: 'Varyag takes a lucrative offer from its side with idle squads',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('varyag', { gainTerms: { contractPay: { weight: 20 } } });
        for (const s of seeds(5)) {
          const v = makeView('varyag', { contractOffers: [offer('ssv', 'off-1', 'r2_1')] });
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          const acc = cmds(res, 'acceptContract');
          assert.equal(acc.length, 1, `seed ${s}: ${acc.length} acceptContract`);
          assert.equal(acc[0].contractId, 'off-1');
          assert.ok(acc[0].squads.length > 0, 'no squads assigned');
        }
      },
    },
    {
      id: 'sai015-pay-in-gain', spec: ['SAI-015', 'SAI-008'], name: 'An offer is scored as an objective whose gain includes its pay',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('aegis', { logTopN: 50 });
        const res = await run(makeView('aegis', { contractOffers: [offer('vdk', 'off-7', 'r3_1')] }));
        const o = optionsNaming(res, 'off-7');
        assert.ok(o.length > 0, 'offer not a candidate');
        assert.ok(o.some((x) => (x.considerations?.contractPay ?? 0) > 0), 'pay not in the gain');
      },
    },
    {
      id: 'sai015-taken-contract-commitment', spec: ['SAI-015', 'SAI-008', 'SAI-003'], name: 'A taken contract (role contractor) is pursued with commitmentBonus',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('varyag', { logTopN: 50 });
        const v = makeView('varyag', { contracts: [{ id: 'c-9', role: 'contractor', employer: 'ssv', contractor: 'varyag', targetFaction: 'vdk', sourceGoal: 'attackPoi',
          missions: [{ key: 'm1', missionId: 'assault_poi', targets: ['r2_1'], location: 'r2_1', status: 'open' }],
          deadline: { day: 6, hour: 0 }, status: 'accepted', counterContractOf: null }] });
        const res = await run(v);
        assert.ok(strategistEntries(res).flatMap((e) => e.options).some((o) => (o.considerations?.commitmentBonus ?? 0) > 0), 'no commitment to the taken contract');
        assert.equal(cmds(res, 'acceptContract').length, 0, 'accepted again');
      },
    },

    // ---------------- SAI-016 Desperate measure choice ----------------
    {
      id: 'sai016-none-available', spec: ['SAI-016'], name: 'No pickMeasure when availableMeasures is empty',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(5)) {
          const v = makeView('ssv', { crisisSigns: ['troopLoss', 'littleTerritory', 'areaLoss'], availableMeasures: [] });
          assert.equal(cmds(await run(v, s), 'pickMeasure').length, 0);
        }
      },
    },
    {
      id: 'sai016-at-most-one', spec: ['SAI-016'], name: 'At most one pickMeasure per hour, from availableMeasures',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(10)) {
          const v = makeView('vdk', { crisisSigns: ['troopLoss', 'littleTerritory', 'resistanceGroups', 'areaLoss'], availableMeasures: ['conscription', 'martialLaw'] });
          const p = cmds(await run(v, s), 'pickMeasure');
          assert.ok(p.length <= 1, `${p.length} measures`);
          if (p.length) assert.ok(v.availableMeasures.includes(p[0].measure));
        }
      },
    },
    {
      id: 'sai016-overlap', spec: ['SAI-016'], name: 'The measure whose typical signs match the crisis signs scores higher',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        await patchDoctrine('ssv', { logTopN: 50 });
        const v = makeView('ssv', { crisisSigns: ['troopLoss', 'littleTerritory'], availableMeasures: ['conscription', 'martialLaw'] });
        const res = await run(v);
        const c = optionsNaming(res, 'conscription')[0], m = optionsNaming(res, 'martialLaw')[0];
        assert.ok(c && m, 'measures not scored');
        assert.ok(c.total > m.total, `${c.total} vs ${m.total}`);
        assert.ok((c.considerations?.signOverlap ?? 0) > (m.considerations?.signOverlap ?? 0), 'signOverlap');
        for (const p of cmds(res, 'pickMeasure')) assert.equal(p.measure, 'conscription');
      },
    },
    {
      id: 'sai016-only-available', spec: ['SAI-016'], name: 'A matching measure that is not available is never picked',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        for (const s of seeds(5)) {
          const v = makeView('ssv', { crisisSigns: ['troopLoss', 'littleTerritory'], availableMeasures: ['martialLaw'] });
          assert.ok(!cmds(await run(v, s), 'pickMeasure').some((p) => p.measure === 'conscription'));
        }
      },
    },

    // ---------------- SAI-017 Krug escort evaluation ----------------
    {
      id: 'sai017-only-krug', spec: ['SAI-017'], name: 'Only the Krug answers escort requests',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const req = [{ id: 'e1', requester: 'vdk', convoy: 'vdk-c1', region: 'r0_1', route: ['r0_1', 'r1_1'], priceUsd: 900, relation: 50 }];
        for (const f of ['ssv', 'vdk', 'varyag', 'aegis']) {
          assert.equal(cmds(await run(makeView(f, { escortRequests: req })), 'answerEscort').length, 0, f);
        }
      },
    },
    {
      id: 'sai017-one-answer-each', spec: ['SAI-017'], name: 'Exactly one answerEscort per pending request',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const reqs = [
          { id: 'e1', requester: 'vdk', convoy: 'vdk-c1', region: 'r0_1', route: ['r0_1', 'r1_1'], priceUsd: 900, relation: 60 },
          { id: 'e2', requester: 'player', convoy: 'p-c1', region: 'r0_1', route: ['r0_1', 'r0_2'], priceUsd: 100, reputation: -20 },
        ];
        for (const s of seeds(5)) {
          const v = makeView('krug', { escortRequests: reqs });
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          assert.deepEqual(cmds(res, 'answerEscort').map((a) => a.requestId).sort(), ['e1', 'e2']);
        }
      },
    },
    {
      id: 'sai017-accept-good', spec: ['SAI-017'], name: 'High price, good standing, a free squad and a safe route: accepted with a free squad',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const v = makeView('krug', { knownSquads: [], escortRequests: [{ id: 'e1', requester: 'vdk', convoy: 'vdk-c1', region: 'r0_1', route: ['r0_1', 'r0_2'], priceUsd: 1000, relation: 90 }] });
        for (const s of seeds(5)) {
          const res = await run(v, s);
          const a = cmds(res, 'answerEscort')[0];
          assert.ok(a?.accept === true, `seed ${s}: refused`);
          const sq = v.ownSquads.find((x) => x.id === a.squad);
          assert.ok(sq && !sq.transit && !sq.goal, `seed ${s}: squad ${a.squad} not a free own squad`);
        }
      },
    },
    {
      id: 'sai017-refuse-bad', spec: ['SAI-017'], name: 'Low price, bad standing and no free squad: refused',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const v = makeView('krug', {
          ownSquads: [{ id: 'krug-s1', region: 'r4_2', strength: 3, vehicle: null, goal: 'tradeRoute', target: 'r0_1', transit: { toRegion: 'r3_2', hoursLeft: 3 } }],
          escortRequests: [{ id: 'e1', requester: 'ssv', convoy: 'ssv-c1', region: 'r0_1', route: ['r0_1', 'r1_1', 'r2_1', 'r3_1'], priceUsd: 50, relation: -100 }],
        });
        for (const s of seeds(5)) {
          const a = cmds(await run(v, s), 'answerEscort')[0];
          assert.ok(a && a.accept === false, `seed ${s}: ${json(a)}`);
        }
      },
    },
    {
      id: 'sai017-one-squad-per-convoy', spec: ['SAI-017', 'SAI-004'], name: 'Two good requests, one free squad: at most one accepted with it',
      async run({ assert, ...ctx }) {
        await setup(ctx);
        const good = (id) => ({ id, requester: 'vdk', convoy: `c-${id}`, region: 'r0_1', route: ['r0_1', 'r0_2'], priceUsd: 1000, relation: 90 });
        const v = makeView('krug', { knownSquads: [], ownSquads: [{ id: 'krug-s1', region: 'r0_1', strength: 4, vehicle: null, transit: null }],
          escortRequests: [good('e1'), good('e2')] });
        for (const s of seeds(5)) {
          const res = await run(v, s);
          noViolations(assert, v, res, `seed ${s}:`);
          assert.ok(cmds(res, 'answerEscort').filter((a) => a.accept).length <= 1, `seed ${s}: one squad on two convoys`);
        }
      },
    },
  ],
};
