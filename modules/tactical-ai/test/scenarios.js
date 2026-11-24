// Tactical AI (unit and squad AI) — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=tactical-ai).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
//
// Core API these tests pin down (core/index.js, written by /apply-spec):
//   decide(view, rng)              → { commands, blackboardWrites, log }                   TAI-001
//   candidates(view)               → option[]; option = { commands: [command, …] }        TAI-005, TAI-007
//   score(view, option, doctrine)  → { score, survival, battleGoal, actionFit, coordination } (all 0–1)
//   combine(parts, doctrine)       → survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination)
//   curve(c, x)                    → 0–1; c = { type: 'linear', points: [[x, y], …] }, piecewise linear,
//                                    clamped to the first and last point
//   pickBest(scored, rng)          → the entry with the highest `score`, ties by rng
//   lossShare(view)                → share of the side's soldiers out of action (TAI-009)
//   doctrineFor(view)              → the tactical doctrine record for view.doctrine (TAI-015)
// Interface shapes (blackboard, squadPlan, blackboardWrites, log, rejection) follow perception view 0.7.0 and
// commands 0.6.0 (TAI-012, TAI-013, TAI-016 cleanup 2026-11-24). Other view shapes: see ./views.js.

import { validate } from '../../../shared/schema.js';
import {
  baseView, chooseView, dangerView, retreatView, freeze, zoneHp, shootTarget, reach, T, setRole, clearRoles,
  COVERED, OPEN, TOWARD_EXIT, TOWARD_ENEMY, FLANK, EXIT_TILE, ROLES,
} from './views.js';

const FIX = ['ai/doctrines', 'items'];
const SPEC = new URL('../../../spec/interfaces/', import.meta.url);

async function core() {
  try {
    return await import('../core/index.js');
  } catch (e) {
    throw new Error(`core/index.js is not built yet or fails to load (${e.message})`);
  }
}

async function adapter(ctx) {
  await ctx.loadFixtures([...FIX, 'views']);
  try {
    return await import('../adapter/index.js');
  } catch (e) {
    throw new Error(`adapter/index.js is not built yet or fails to load (${e.message})`);
  }
}
const samples = (ctx) => Object.fromEntries(['attack', 'choose', 'retry'].map((k) => [k, ctx.registry.get('views', k)]));

const schemas = {};
async function schema(name) {
  if (!schemas[name]) {
    const res = await fetch(new URL(`${name}.schema.json`, SPEC));
    if (!res.ok) throw new Error(`schema ${name}: HTTP ${res.status}`);
    schemas[name] = await res.json();
  }
  return schemas[name];
}

async function setup(ctx) {
  await ctx.loadFixtures(FIX);
  return core();
}

const sameTile = (a, b) => a && b && a.x === b.x && a.y === b.y && (a.level ?? 0) === (b.level ?? 0);
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const lastTile = (cmd) => cmd.path?.[cmd.path.length - 1];
const unitOf = (v, id) => v.squad.find((u) => u.id === id);
const in01 = (x) => typeof x === 'number' && x >= 0 && x <= 1;

// Options of a given kind among the core's candidates.
function find(c, v, pred) {
  const opts = c.candidates(v).filter((o) => pred(o.commands[0]));
  if (!opts.length) throw new Error('no candidate matches');
  return opts;
}
const moveTo = (c, v, t) => find(c, v, (cmd) => cmd.type === 'move' && sameTile(lastTile(cmd), t))[0];
const shootAt = (c, v, unit) => find(c, v, (cmd) => cmd.type === 'shoot' && cmd.target === unit)[0];
const firstOf = (c, v, type) => find(c, v, (cmd) => cmd.type === type)[0];

function scoreOf(c, v, option) {
  const f = freeze(v);
  return c.score(f, option, c.doctrineFor(f));
}

async function assertSchema(assert, name, value) {
  const errs = validate(await schema(name), value);
  assert.ok(errs.length === 0, `${name}: ${errs.map((e) => `${e.path} ${e.message}`).join('; ')}`);
}

// Checks one decide() result against what the view allowed (TAI-005, TAI-006).
function assertLegal(assert, view, out) {
  const allowed = new Map(view.allowedActions.map((a) => [a.type, a]));
  for (const cmd of out.commands) {
    assert.notEqual(cmd.type, 'takeCover', 'no takeCover command (TAI-005)');
    const a = allowed.get(cmd.type);
    assert.ok(a || cmd.type === 'endActivation', `command ${cmd.type} not in allowedActions`);
    if (cmd.type === 'activate') {
      assert.ok(view.allowedActions.some((x) => x.type === 'activate' && x.unit === cmd.unit), `activate ${cmd.unit} not allowed`);
    }
    if (cmd.type === 'move') {
      assert.ok(Array.isArray(cmd.path) && cmd.path.length > 0, 'move needs a path');
      assert.ok(a.reachable.some((r) => sameTile(r.tile, lastTile(cmd))), 'move ends on a reachable tile');
    }
    if (cmd.type === 'shoot' && cmd.target) {
      assert.ok(a.targets.some((t) => t.unit === cmd.target), `shoot target ${cmd.target} not in the shot previews`);
    }
  }
}

function knownIds(v) {
  return new Set([
    ...v.squad.map((u) => u.id), ...v.knownEnemies.map((e) => e.id), ...(v.knownNeutrals ?? []).map((n) => n.id),
    ...v.map.exits.map((e) => e.id), ...v.map.containers.map((x) => x.id), ...v.map.bodies.map((b) => b.id),
    ...(v.blackboard?.requests ?? []).map((r) => r.id),
  ]);
}

const planWrites = (out) => out.blackboardWrites.filter((w) => w.op === 'setPlan');
const claimWrites = (out) => out.blackboardWrites.filter((w) => w.op === 'addClaim').map((w) => w.claim);

// Follows relative imports from core/index.js and returns { url → source }.
async function coreSources() {
  const out = {};
  const queue = [new URL('../core/index.js', import.meta.url).href];
  while (queue.length) {
    const url = queue.shift();
    if (out[url]) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    out[url] = await res.text();
    for (const m of out[url].matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? m[2];
      if (spec.startsWith('.')) {
        const next = new URL(spec, url).href;
        if (next.includes('/modules/tactical-ai/core/')) queue.push(next);
      }
    }
  }
  return out;
}

const VIEWS = () => [baseView(), chooseView(), dangerView(), retreatView(2), retreatView(0)];

export default {
  module: 'tactical-ai',
  scenarios: [
    // ---------------------------------------------------------------- TAI-001 Controller role
    {
      id: 'tai001-output-shape', spec: ['TAI-001', 'TAI-005'], name: 'decide returns commands, blackboardWrites and log; output matches tactical_commands',
      async run(ctx) {
        const c = await setup(ctx);
        for (const v of VIEWS()) {
          const out = c.decide(freeze(v), ctx.rng(7));
          ctx.assert.ok(Array.isArray(out.commands) && out.commands.length > 0, 'commands non-empty');
          ctx.assert.ok(Array.isArray(out.blackboardWrites), 'blackboardWrites array');
          ctx.assert.ok(Array.isArray(out.log), 'log array');
          await assertSchema(ctx.assert, 'tactical_commands', out);
        }
      },
    },
    {
      id: 'tai001-deterministic', spec: ['TAI-001', 'TEC-015'], name: 'same view, data and seed give the same output',
      async run(ctx) {
        const c = await setup(ctx);
        for (const make of [baseView, chooseView, dangerView]) {
          for (const seed of [1, 42, 4812]) {
            const a = c.decide(freeze(make()), ctx.rng(seed));
            const b = c.decide(freeze(make()), ctx.rng(seed));
            ctx.assert.deepEqual(a, b, `${make.name} seed ${seed}`);
          }
        }
      },
    },
    {
      id: 'tai001-view-untouched', spec: ['TAI-001', 'TAI-012'], name: 'decide works on a deep-frozen view and does not change it',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        const copy = structuredClone(v);
        c.decide(freeze(v), ctx.rng(3));
        ctx.assert.deepEqual(v, copy);
      },
    },
    {
      id: 'tai001-two-arguments', spec: ['TAI-001'], name: 'decide takes (view, rng) only — no query functions',
      async run(ctx) {
        const c = await setup(ctx);
        ctx.assert.equal(typeof c.decide, 'function');
        ctx.assert.ok(c.decide.length <= 2, `decide declares ${c.decide.length} parameters`);
      },
    },
    {
      id: 'tai001-core-pure', spec: ['TAI-001', 'TEC-012', 'TEC-015'], name: 'core imports only shared/ and itself; no DOM, fetch, Three.js or Math.random',
      async run(ctx) {
        await core();
        const src = await coreSources();
        for (const [url, text] of Object.entries(src)) {
          const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
          for (const bad of [/Math\.random/, /\bdocument\./, /\bwindow\./, /\bfetch\s*\(/, /\blocalStorage\b/, /from\s*['"]three['"]/]) {
            ctx.assert.ok(!bad.test(code), `${url}: ${bad}`);
          }
          for (const m of code.matchAll(/from\s*['"]([^'"]+)['"]/g)) {
            const target = new URL(m[1], url).href;
            ctx.assert.ok(target.includes('/modules/tactical-ai/core/') || target.includes('/shared/'), `${url} imports ${m[1]}`);
          }
        }
      },
    },

    // ---------------------------------------------------------------- TAI-002 Invocation
    {
      id: 'tai002-choose-unit', spec: ['TAI-002', 'TAC-005'], name: 'activeUnit null → exactly one activate (an offered unit) or pass',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 20; seed++) {
          const v = chooseView(['r1', 'r2']);
          const out = c.decide(freeze(v), ctx.rng(seed));
          ctx.assert.equal(out.commands.length, 1, 'one command');
          ctx.assert.ok(['activate', 'pass'].includes(out.commands[0].type), out.commands[0].type);
          assertLegal(ctx.assert, v, out);
        }
      },
    },
    {
      id: 'tai002-skip-ineligible', spec: ['TAI-002', 'TAC-008'], name: 'never activates a unit that is out of action or not offered',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 20; seed++) {
          const v = chooseView(['r1', 'r4']);
          v.squad[1].outOfAction = true;
          const out = c.decide(freeze(v), ctx.rng(seed));
          const cmd = out.commands[0];
          if (cmd.type === 'activate') ctx.assert.ok(['r1', 'r4'].includes(cmd.unit), `activated ${cmd.unit}`);
        }
      },
    },
    {
      id: 'tai002-pass-when-none', spec: ['TAI-002', 'TAC-010'], name: 'no unit may activate → pass',
      async run(ctx) {
        const c = await setup(ctx);
        const out = c.decide(freeze(chooseView([])), ctx.rng(1));
        ctx.assert.deepEqual(out.commands.map((x) => x.type), ['pass']);
      },
    },
    {
      id: 'tai002-no-activate-mid-activation', spec: ['TAI-002'], name: 'with an active unit the AI never answers activate or pass',
      async run(ctx) {
        const c = await setup(ctx);
        for (const make of [baseView, dangerView, retreatView]) {
          const out = c.decide(freeze(make()), ctx.rng(5));
          ctx.assert.ok(out.commands.every((x) => x.type !== 'activate' && x.type !== 'pass'), make.name);
        }
      },
    },

    // ---------------------------------------------------------------- TAI-003 Pluggable controller
    {
      id: 'tai003-any-side', spec: ['TAI-003', 'TAI-018'], name: 'the same decide serves an allied AI unit on the player side',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.side = 'player'; v.faction = 'player';
        v.battleGoal = { goal: 'escort', targets: ['r2'], acceptableLoss: 1 };
        const out = c.decide(freeze(v), ctx.rng(9));
        await assertSchema(ctx.assert, 'tactical_commands', out);
        assertLegal(ctx.assert, v, out);
      },
    },

    // ---------------------------------------------------------------- TAI-004 Perception view
    {
      id: 'tai004-fixture-views-valid', spec: ['TAI-004'], name: 'every test view matches tactical_perception_view (fixture sanity)',
      async run(ctx) {
        for (const v of VIEWS()) await assertSchema(ctx.assert, 'tactical_perception_view', v);
      },
    },
    {
      id: 'tai004-last-known-not-shot', spec: ['TAI-004', 'TAI-006'], name: 'an enemy only known by its last position is never a shoot target',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 20; seed++) {
          const v = baseView();
          v.knownEnemies[1].visibleNow = false; v.knownEnemies[1].seenTurn = 1;
          delete v.knownEnemies[1].stance; delete v.knownEnemies[1].facing; delete v.knownEnemies[1].visibleGear;
          v.allowedActions[1].targets = [shootTarget('b1', 0.3)];
          const out = c.decide(freeze(v), ctx.rng(seed));
          ctx.assert.ok(out.commands.every((x) => !(x.type === 'shoot' && x.target === 'b2')), `seed ${seed}`);
        }
      },
    },

    // ---------------------------------------------------------------- TAI-005 Command set
    {
      id: 'tai005-only-allowed-commands', spec: ['TAI-005', 'TAI-006'], name: 'every command is an allowed type; moves end on reachable tiles, shots hit previewed targets',
      async run(ctx) {
        const c = await setup(ctx);
        for (const make of [baseView, chooseView, dangerView, retreatView]) {
          for (let seed = 1; seed <= 10; seed++) {
            const v = make();
            assertLegal(ctx.assert, v, c.decide(freeze(v), ctx.rng(seed)));
          }
        }
      },
    },
    {
      id: 'tai005-candidates-legal', spec: ['TAI-005'], name: 'every candidate the core considers is legal for the view',
      async run(ctx) {
        const c = await setup(ctx);
        for (const v of VIEWS()) {
          const opts = c.candidates(freeze(v));
          ctx.assert.ok(opts.length > 0, 'some candidates');
          for (const o of opts) assertLegal(ctx.assert, v, { commands: o.commands });
        }
      },
    },
    {
      id: 'tai005-endActivation-last', spec: ['TAI-005', 'TAC-007'], name: 'endActivation, if returned, is the last command',
      async run(ctx) {
        const c = await setup(ctx);
        for (const make of [baseView, dangerView, retreatView]) {
          const out = c.decide(freeze(make()), ctx.rng(2));
          const i = out.commands.findIndex((x) => x.type === 'endActivation');
          ctx.assert.ok(i === -1 || i === out.commands.length - 1, make.name);
        }
      },
    },

    {
      id: 'tai005-retry-not-repeated', spec: ['TAI-005'], name: 'on a retry call the AI does not send the rejected command again',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 10; seed++) {
          const v = baseView();
          v.allowedActions = v.allowedActions.filter((a) => a.type === 'shoot' || a.type === 'move' || a.type === 'endActivation');
          v.allowedActions.find((a) => a.type === 'shoot').targets = [shootTarget('b1', 0.9), shootTarget('b2', 0.2)];
          const rejected = { type: 'shoot', target: 'b1', fireMode: 1, aimSteps: 0 };
          v.rejection = { command: rejected, reason: 'noLineOfSight' };
          const out = c.decide(freeze(v), ctx.rng(seed));
          ctx.assert.ok(out.commands.every((x) => !(x.type === 'shoot' && x.target === 'b1')), `seed ${seed}: repeated ${JSON.stringify(out.commands[0])}`);
          assertLegal(ctx.assert, v, out);
        }
      },
    },
    {
      id: 'tai005-retry-logged', spec: ['TAI-005', 'TAI-016'], name: 'the log entry of a retry call carries the rejection it answers',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.rejection = { command: { type: 'move', path: [OPEN] }, reason: 'invalidPath' };
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.deepEqual(out.log[0].rejection, v.rejection);
        const plain = c.decide(freeze(baseView()), ctx.rng(1));
        ctx.assert.ok(plain.log[0].rejection == null, 'no rejection on a normal call');
      },
    },

    // ---------------------------------------------------------------- TAI-006 No hidden information
    {
      id: 'tai006-only-known-ids', spec: ['TAI-006'], name: 'commands and writes reference only IDs present in the view',
      async run(ctx) {
        const c = await setup(ctx);
        for (const make of [baseView, chooseView, dangerView, retreatView]) {
          const v = make();
          const ids = knownIds(v);
          const out = c.decide(freeze(v), ctx.rng(11));
          for (const cmd of out.commands) {
            for (const k of ['unit', 'target', 'exit']) if (cmd[k] !== undefined) ctx.assert.ok(ids.has(cmd[k]), `${cmd.type}.${k} = ${cmd[k]}`);
          }
          for (const w of out.blackboardWrites) {
            for (const [k, val] of [['claim.unit', w.claim?.unit], ['claim.target', w.claim?.target], ['request.by', w.request?.by], ['request.target', w.request?.target]]) {
              if (typeof val === 'string') ctx.assert.ok(ids.has(val), `write ${k} = ${val}`);
            }
            for (const id of Object.keys(w.plan?.roles ?? {})) ctx.assert.ok(ids.has(id), `setPlan role for ${id}`);
          }
        }
      },
    },

    // ---------------------------------------------------------------- TAI-007 Utility score
    {
      id: 'tai007-combine-example', spec: ['TAI-007'], name: 'score = survival × (wGoal·goal + wFit·fit + wCoord·coord): 0.5 × (0.4·1 + 0.4·0.5 + 0.2·0) = 0.3',
      async run(ctx) {
        const c = await setup(ctx);
        const d = ctx.registry.get('ai/doctrines', 'tac-balanced');
        const s = c.combine({ survival: 0.5, battleGoal: 1, actionFit: 0.5, coordination: 0 }, d);
        ctx.assert.ok(Math.abs(s - 0.3) < 1e-9, `got ${s}`);
        const g = c.combine({ survival: 1, battleGoal: 0.5, actionFit: 1, coordination: 1 }, ctx.registry.get('ai/doctrines', 'tac-goal'));
        ctx.assert.ok(Math.abs(g - (0.8 * 0.5 + 0.1 + 0.1)) < 1e-9, `tac-goal got ${g}`);
      },
    },
    {
      id: 'tai007-survival-multiplies', spec: ['TAI-007', 'TAI-008'], name: 'survival 0 gives 0, survival 1 leaves the weighted sum unchanged',
      async run(ctx) {
        const c = await setup(ctx);
        const d = ctx.registry.get('ai/doctrines', 'tac-balanced');
        ctx.assert.equal(c.combine({ survival: 0, battleGoal: 1, actionFit: 1, coordination: 1 }, d), 0);
        const full = c.combine({ survival: 1, battleGoal: 1, actionFit: 1, coordination: 1 }, d);
        ctx.assert.ok(Math.abs(full - 1) < 1e-9, `got ${full}`);
      },
    },
    {
      id: 'tai007-curve-linear', spec: ['TAI-007', 'TAI-015'], name: 'linear curve interpolates and clamps to its end points',
      async run(ctx) {
        const c = await core();
        const up = { type: 'linear', points: [[0, 0], [1, 1]] };
        const down = { type: 'linear', points: [[0, 1], [1, 0]] };
        const knee = { type: 'linear', points: [[0, 1], [0.3, 0.95], [1, 0.1]] };
        const near = (a, b) => Math.abs(a - b) < 1e-9;
        ctx.assert.ok(near(c.curve(up, 0.25), 0.25));
        ctx.assert.ok(near(c.curve(down, 0.25), 0.75));
        ctx.assert.ok(near(c.curve(down, -1), 1), 'clamped below');
        ctx.assert.ok(near(c.curve(down, 2), 0), 'clamped above');
        ctx.assert.ok(near(c.curve(knee, 0.15), 0.975), `knee 0.15 → ${c.curve(knee, 0.15)}`);
        ctx.assert.ok(near(c.curve(knee, 0.65), 0.525), `knee 0.65 → ${c.curve(knee, 0.65)}`);
        ctx.assert.ok(near(c.curve({ type: 'linear', points: [[0, 1], [100, 0]] }, 60), 0.4), 'morale-scale x');
      },
    },
    {
      id: 'tai007-highest-wins', spec: ['TAI-007'], name: 'pickBest returns the highest score',
      async run(ctx) {
        const c = await core();
        const best = c.pickBest([{ id: 'a', score: 0.2 }, { id: 'b', score: 0.7 }, { id: 'c', score: 0.5 }], ctx.rng(1));
        ctx.assert.equal(best.id, 'b');
      },
    },
    {
      id: 'tai007-ties-by-rng', spec: ['TAI-007', 'TEC-015'], name: 'equal scores: the seed decides, both options occur, same seed same pick',
      async run(ctx) {
        const c = await core();
        const opts = [{ id: 'a', score: 0.6 }, { id: 'b', score: 0.6 }, { id: 'c', score: 0.1 }];
        const seen = new Set();
        for (let seed = 1; seed <= 50; seed++) {
          const p = c.pickBest(opts, ctx.rng(seed)).id;
          ctx.assert.ok(p === 'a' || p === 'b', `seed ${seed} picked ${p}`);
          ctx.assert.equal(c.pickBest(opts, ctx.rng(seed)).id, p, 'repeatable');
          seen.add(p);
        }
        ctx.assert.equal(seen.size, 2, 'both tied options occur');
      },
    },
    {
      id: 'tai007-score-parts', spec: ['TAI-007'], name: 'every candidate has four parts in 0–1 and score = combine(parts)',
      async run(ctx) {
        const c = await setup(ctx);
        for (const v of VIEWS().filter((x) => x.activeUnit)) {
          const f = freeze(v);
          const d = c.doctrineFor(f);
          for (const o of c.candidates(f)) {
            const s = c.score(f, o, d);
            for (const k of ['survival', 'battleGoal', 'actionFit', 'coordination', 'score']) ctx.assert.ok(in01(s[k]), `${o.commands[0].type} ${k} = ${s[k]}`);
            ctx.assert.ok(Math.abs(s.score - c.combine(s, d)) < 1e-9, 'score = combine(parts)');
          }
        }
      },
    },
    {
      id: 'tai007-decide-picks-best', spec: ['TAI-007', 'TAI-016'], name: 'the chosen command is the top-scored candidate',
      async run(ctx) {
        const c = await setup(ctx);
        const v = freeze(baseView());
        const d = c.doctrineFor(v);
        const top = Math.max(...c.candidates(v).map((o) => c.score(v, o, d).score));
        const out = c.decide(v, ctx.rng(4));
        const chosen = c.candidates(v).find((o) => JSON.stringify(o.commands[0]) === JSON.stringify(out.commands[0]));
        ctx.assert.ok(chosen, 'chosen command is a candidate');
        ctx.assert.ok(Math.abs(c.score(v, chosen, d).score - top) < 1e-9, 'chosen has the top score');
      },
    },

    // ---------------------------------------------------------------- TAI-008 Survival
    {
      id: 'tai008-low-danger-near-one', spec: ['TAI-008'], name: 'no known enemies, healthy, steady → survival ≥ 0.9 for every option',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.knownEnemies = []; v.allowedActions = v.allowedActions.filter((a) => a.type !== 'shoot');
        const f = freeze(v);
        for (const o of c.candidates(f)) {
          const s = c.score(f, o, c.doctrineFor(f)).survival;
          ctx.assert.ok(s >= 0.9, `${o.commands[0].type}: ${s}`);
        }
      },
    },
    {
      id: 'tai008-cover-beats-open', spec: ['TAI-008', 'TAC-035'], name: 'moving to a tile with full cover toward the enemy scores higher survival than an open tile',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        const sc = scoreOf(c, v, moveTo(c, v, COVERED)).survival;
        const so = scoreOf(c, baseView(), moveTo(c, baseView(), OPEN)).survival;
        ctx.assert.ok(sc > so, `covered ${sc} vs open ${so}`);
      },
    },
    {
      id: 'tai008-hp-and-morale', spec: ['TAI-008', 'TAC-095'], name: 'lower HP or lower morale lowers survival for the same option',
      async run(ctx) {
        const c = await setup(ctx);
        const at = (mut) => { const v = baseView(); mut(v.squad[0]); return scoreOf(c, v, moveTo(c, v, OPEN)).survival; };
        const healthy = at(() => {});
        const hurt = at((u) => { u.zoneHp = zoneHp(0.3); });
        const shaken = at((u) => { u.morale = 5; });
        ctx.assert.ok(hurt < healthy, `hp: ${hurt} < ${healthy}`);
        ctx.assert.ok(shaken < healthy, `morale: ${shaken} < ${healthy}`);
      },
    },
    {
      id: 'tai008-more-threat', spec: ['TAI-008'], name: 'more enemies in sight lower survival for the same option',
      async run(ctx) {
        const c = await setup(ctx);
        const one = baseView(); one.knownEnemies = one.knownEnemies.slice(0, 1);
        const two = baseView();
        const s1 = scoreOf(c, one, moveTo(c, one, OPEN)).survival;
        const s2 = scoreOf(c, two, moveTo(c, two, OPEN)).survival;
        ctx.assert.ok(s2 < s1, `${s2} < ${s1}`);
      },
    },
    {
      id: 'tai008-never-blocks', spec: ['TAI-008'], name: 'even in the worst case survival stays above 0',
      async run(ctx) {
        const c = await setup(ctx);
        const v = dangerView();
        v.squad[0].morale = 0; v.squad[0].zoneHp = zoneHp(0.05);
        const f = freeze(v);
        for (const o of c.candidates(f)) {
          const s = c.score(f, o, c.doctrineFor(f)).survival;
          ctx.assert.ok(s > 0, `${o.commands[0].type}: ${s}`);
        }
      },
    },
    {
      id: 'tai008-prefers-safety', spec: ['TAI-008', 'TAI-005'], name: 'an exposed, wounded, shaken unit with a poor shot takes cover instead of shooting',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 10; seed++) {
          const out = c.decide(freeze(dangerView()), ctx.rng(seed));
          const cmd = out.commands[0];
          ctx.assert.equal(cmd.type, 'move', `seed ${seed}: ${cmd.type}`);
          ctx.assert.ok(sameTile(lastTile(cmd), COVERED), `seed ${seed}: moved to ${JSON.stringify(lastTile(cmd))}`);
        }
      },
    },

    // ---------------------------------------------------------------- TAI-009 Battle goal
    {
      id: 'tai009-progress-to-target', spec: ['TAI-009'], name: 'goal reachExit: a move toward the exit scores more goal than a move away',
      async run(ctx) {
        const c = await setup(ctx);
        const make = () => { const v = baseView(); v.battleGoal = { goal: 'reachExit', targets: ['exit-n'], acceptableLoss: 0.5 }; return v; };
        const toward = scoreOf(c, make(), moveTo(c, make(), TOWARD_EXIT)).battleGoal;
        const away = scoreOf(c, make(), moveTo(c, make(), TOWARD_ENEMY)).battleGoal;
        ctx.assert.ok(toward > away, `${toward} > ${away}`);
      },
    },
    {
      id: 'tai009-attack-progress', spec: ['TAI-009'], name: 'goal attack: shooting a target scores more goal than moving away from it',
      async run(ctx) {
        const c = await setup(ctx);
        const shoot = scoreOf(c, baseView(), shootAt(c, baseView(), 'b1')).battleGoal;
        const away = scoreOf(c, baseView(), moveTo(c, baseView(), TOWARD_EXIT)).battleGoal;
        ctx.assert.ok(shoot > away, `${shoot} > ${away}`);
      },
    },
    {
      id: 'tai009-loss-share', spec: ['TAI-009', 'TAC-059'], name: 'loss share counts out-of-action soldiers only; disabled limbs do not count',
      async run(ctx) {
        const c = await setup(ctx);
        ctx.assert.equal(c.lossShare(freeze(retreatView(1))), 0.25);
        ctx.assert.equal(c.lossShare(freeze(retreatView(2))), 0.5);
        const v = retreatView(0);
        v.squad[1].limbs.leftLeg = 'disabled'; v.squad[2].zoneHp = zoneHp(0.1);
        ctx.assert.equal(c.lossShare(freeze(v)), 0);
      },
    },
    {
      id: 'tai009-retreat-at-threshold', spec: ['TAI-009', 'TAC-038'], name: 'share reached → the unit moves toward an exit; below it, it does not',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 10; seed++) {
          const out = c.decide(freeze(retreatView(2)), ctx.rng(seed));
          const cmd = out.commands[0];
          ctx.assert.ok(cmd.type === 'leaveMap' || (cmd.type === 'move' && sameTile(lastTile(cmd), TOWARD_EXIT)), `seed ${seed}: ${JSON.stringify(cmd)}`);
        }
        const before = scoreOf(c, retreatView(1), moveTo(c, retreatView(1), TOWARD_EXIT)).battleGoal;
        const after = scoreOf(c, retreatView(2), moveTo(c, retreatView(2), TOWARD_EXIT)).battleGoal;
        ctx.assert.ok(after > before, `exit-ward goal ${after} (retreat) > ${before} (attack)`);
      },
    },
    {
      id: 'tai009-retreat-leaves-map', spec: ['TAI-009', 'TAC-038'], name: 'a retreating unit on an exit tile leaves the map there',
      async run(ctx) {
        const c = await setup(ctx);
        const v = retreatView(2);
        v.squad[0].position = EXIT_TILE;
        v.allowedActions.push({ type: 'leaveMap', apCost: 0 });
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.equal(out.commands[0].type, 'leaveMap');
        ctx.assert.equal(out.commands[0].exit, 'exit-n');
      },
    },
    {
      id: 'tai009-retreat-still-fires', spec: ['TAI-009'], name: 'while retreating, shooting still has a score above 0',
      async run(ctx) {
        const c = await setup(ctx);
        const s = scoreOf(c, retreatView(2), shootAt(c, retreatView(2), 'b1'));
        ctx.assert.ok(s.score > 0, `total ${s.score}`);
      },
    },

    // ---------------------------------------------------------------- TAI-010 Action fit
    {
      id: 'tai010-hit-chance', spec: ['TAI-010', 'TAC-046'], name: 'a better shot preview gives a higher action fit',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.allowedActions[1].targets = [shootTarget('b1', 0.8), shootTarget('b2', 0.1)];
        const good = scoreOf(c, v, shootAt(c, v, 'b1')).actionFit;
        const poor = scoreOf(c, v, shootAt(c, v, 'b2')).actionFit;
        ctx.assert.ok(good > poor, `${good} > ${poor}`);
      },
    },
    {
      id: 'tai010-no-penetration', spec: ['TAI-010', 'TAC-046'], name: 'a shot that does not penetrate fits worse than one that does',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.allowedActions[1].targets = [shootTarget('b1', 0.5), shootTarget('b2', 0.5, { penetrates: false })];
        const pen = scoreOf(c, v, shootAt(c, v, 'b1')).actionFit;
        const no = scoreOf(c, v, shootAt(c, v, 'b2')).actionFit;
        ctx.assert.ok(pen > no, `${pen} > ${no}`);
      },
    },
    {
      id: 'tai010-reload-when-empty', spec: ['TAI-010', 'TAC-041'], name: 'reload fits better with an empty weapon than with a full one',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (rounds) => {
          const v = baseView();
          v.squad[0].equipment.weapon1.rounds = rounds;
          v.allowedActions.push({ type: 'reload', apCost: 6 });
          if (rounds === 0) v.allowedActions = v.allowedActions.filter((a) => a.type !== 'shoot');
          return v;
        };
        const empty = scoreOf(c, make(0), firstOf(c, make(0), 'reload')).actionFit;
        const full = scoreOf(c, make(30), firstOf(c, make(30), 'reload')).actionFit;
        ctx.assert.ok(empty > full, `${empty} > ${full}`);
      },
    },
    {
      id: 'tai010-weapon-type-role', spec: ['TAI-010', 'TAI-014', 'DAT-011'], name: 'with no assigned role, an LMG gunner fits suppressive fire better than a rifleman',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (item) => {
          const v = clearRoles(baseView());
          v.squad[0].equipment.weapon1 = { item, rounds: 30 };
          v.allowedActions[1].targets = [shootTarget('b1', 0.35)];
          return v;
        };
        const lmg = scoreOf(c, make('pkm'), shootAt(c, make('pkm'), 'b1')).actionFit;
        const rifle = scoreOf(c, make('akm'), shootAt(c, make('akm'), 'b1')).actionFit;
        ctx.assert.ok(lmg > rifle, `${lmg} > ${rifle}`);
      },
    },
    {
      id: 'tai010-jammed', spec: ['TAI-010', 'TAC-083'], name: 'a jammed weapon makes clearJam the best-fitting action when offered',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.squad[0].weaponJammed = true;
        v.allowedActions = v.allowedActions.filter((a) => a.type !== 'shoot');
        v.allowedActions.push({ type: 'clearJam', apCost: 4 });
        const f = freeze(v);
        const d = c.doctrineFor(f);
        const fits = c.candidates(f).map((o) => [o.commands[0].type, c.score(f, o, d).actionFit]);
        const best = fits.reduce((a, b) => (b[1] > a[1] ? b : a));
        ctx.assert.equal(best[0], 'clearJam', JSON.stringify(fits));
      },
    },

    // ---------------------------------------------------------------- TAI-011 Coordination
    {
      id: 'tai011-request-bonus', spec: ['TAI-011', 'TAI-012'], name: 'shooting the target of an open suppress request scores more coordination',
      async run(ctx) {
        const c = await setup(ctx);
        const make = () => {
          const v = baseView();
          v.blackboard.requests.push({ id: 'q1', type: 'suppress', target: 'b1', by: 'r2', untilTurn: 4 });
          return v;
        };
        const asked = scoreOf(c, make(), shootAt(c, make(), 'b1')).coordination;
        const other = scoreOf(c, make(), shootAt(c, make(), 'b2')).coordination;
        ctx.assert.ok(asked > other, `${asked} > ${other}`);
      },
    },
    {
      id: 'tai011-claim-penalty', spec: ['TAI-011', 'TAI-012'], name: "a target claimed by a squadmate scores less coordination; one's own claim does not",
      async run(ctx) {
        const c = await setup(ctx);
        const make = (unit) => {
          const v = baseView();
          v.blackboard.claims.push({ id: 'k1', unit, kind: 'target', target: 'b1', untilTurn: 4 });
          return v;
        };
        const claimed = scoreOf(c, make('r2'), shootAt(c, make('r2'), 'b1')).coordination;
        const free = scoreOf(c, make('r2'), shootAt(c, make('r2'), 'b2')).coordination;
        const own = scoreOf(c, make('r1'), shootAt(c, make('r1'), 'b1')).coordination;
        ctx.assert.ok(claimed < free, `${claimed} < ${free}`);
        ctx.assert.ok(Math.abs(own - free) < 1e-9, `own claim ${own} = unclaimed ${free}`);
      },
    },
    {
      id: 'tai011-expired-claim', spec: ['TAI-011', 'TAI-012'], name: 'a claim whose untilTurn has passed carries no penalty (TAC may not have dropped it yet)',
      async run(ctx) {
        const c = await setup(ctx);
        const make = () => {
          const v = baseView();
          v.blackboard.claims.push({ id: 'k1', unit: 'r2', kind: 'target', target: 'b1', untilTurn: 2 });
          return v;
        };
        const b1 = scoreOf(c, make(), shootAt(c, make(), 'b1')).coordination;
        const b2 = scoreOf(c, make(), shootAt(c, make(), 'b2')).coordination;
        ctx.assert.ok(Math.abs(b1 - b2) < 1e-9, `${b1} = ${b2}`);
      },
    },
    {
      id: 'tai011-tile-claim', spec: ['TAI-011', 'TAI-012'], name: 'a tile claimed by a squadmate scores less coordination as a move destination',
      async run(ctx) {
        const c = await setup(ctx);
        const make = () => {
          const v = baseView();
          v.blackboard.claims.push({ id: 'k1', unit: 'r3', kind: 'tile', tile: COVERED, untilTurn: 3 });
          return v;
        };
        const claimed = scoreOf(c, make(), moveTo(c, make(), COVERED)).coordination;
        const free = scoreOf(c, make(), moveTo(c, make(), OPEN)).coordination;
        ctx.assert.ok(claimed < free, `${claimed} < ${free}`);
      },
    },
    {
      id: 'tai011-claimed-request', spec: ['TAI-011', 'TAI-012'], name: 'a request a squadmate already claimed gives no bonus',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (claimed) => {
          const v = baseView();
          v.blackboard.requests.push({ id: 'q1', type: 'suppress', target: 'b1', by: 'r2' });
          if (claimed) v.blackboard.claims.push({ id: 'k1', unit: 'r3', kind: 'request', request: 'q1', untilTurn: 3 });
          return v;
        };
        const open = scoreOf(c, make(false), shootAt(c, make(false), 'b1')).coordination;
        const taken = scoreOf(c, make(true), shootAt(c, make(true), 'b1')).coordination;
        ctx.assert.ok(taken < open, `${taken} < ${open}`);
      },
    },

    // ---------------------------------------------------------------- TAI-012 Squad blackboard
    {
      id: 'tai012-write-ops', spec: ['TAI-012', 'TAI-013'], name: 'writes use the five ops with their payload; setPlan only from the current leader',
      async run(ctx) {
        const c = await setup(ctx);
        const need = { addRequest: 'request', addClaim: 'claim', removeRequest: 'id', removeClaim: 'id', setPlan: 'plan' };
        for (const make of [baseView, dangerView, retreatView]) {
          for (const active of ['r1', 'r2']) {
            for (let seed = 1; seed <= 5; seed++) {
              const v = make();
              v.activeUnit = active;
              if (active !== 'r1') v.allowedActions[0].reachable = [reach(T(3, 3), 4, 21)];
              const out = c.decide(freeze(v), ctx.rng(seed));
              for (const w of out.blackboardWrites) {
                ctx.assert.ok(w.op in need, `op ${w.op}`);
                ctx.assert.ok(w[need[w.op]] !== undefined, `${w.op} carries ${need[w.op]}`);
                if (w.op === 'setPlan') ctx.assert.equal(active, v.squadPlan.leader, 'setPlan from a non-leader');
                if (w.op === 'addClaim') ctx.assert.equal(w.claim.unit, active, 'claims are made by the active unit');
                if (w.op === 'addRequest') ctx.assert.equal(w.request.by, active, 'requests are posted by the active unit');
              }
            }
          }
        }
      },
    },
    {
      id: 'tai012-claims-chosen-target', spec: ['TAI-012', 'TAI-011'], name: 'shooting a target writes a target claim by the active unit, valid at least this turn',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.allowedActions = v.allowedActions.filter((a) => a.type === 'shoot' || a.type === 'endActivation');
        v.allowedActions[0].targets = [shootTarget('b1', 0.9)];
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.equal(out.commands[0].type, 'shoot');
        const claim = claimWrites(out).find((k) => k.kind === 'target' && k.target === 'b1');
        ctx.assert.ok(claim, 'claim written');
        ctx.assert.equal(claim.unit, 'r1');
        ctx.assert.ok(typeof claim.untilTurn === 'number' && claim.untilTurn >= v.turn, `untilTurn ${claim.untilTurn}`);
      },
    },
    {
      id: 'tai012-answered-request-claimed', spec: ['TAI-012', 'TAI-011'], name: 'answering a request claims it so squadmates do not double up',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.blackboard.requests.push({ id: 'q1', type: 'suppress', target: 'b1', by: 'r2' });
        v.allowedActions = v.allowedActions.filter((a) => a.type === 'shoot' || a.type === 'endActivation');
        v.allowedActions[0].targets = [shootTarget('b1', 0.6), shootTarget('b2', 0.6)];
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.equal(out.commands[0].target, 'b1', 'answers the request');
        ctx.assert.ok(claimWrites(out).some((k) => k.kind === 'request' && k.request === 'q1'), 'request claimed');
      },
    },
    {
      id: 'tai012-writes-validate', spec: ['TAI-012', 'TAI-016'], name: 'writes and log validate against tactical_commands $defs',
      async run(ctx) {
        const c = await setup(ctx);
        for (const v of VIEWS()) {
          const out = c.decide(freeze(v), ctx.rng(13));
          await assertSchema(ctx.assert, 'tactical_commands', out);
        }
      },
    },

    // ---------------------------------------------------------------- TAI-013 Squad leader plan
    {
      id: 'tai013-leader-sets-roles', spec: ['TAI-013', 'TAI-014'], name: "the leader's activation sets a plan with a role for every living squad unit",
      async run(ctx) {
        const c = await setup(ctx);
        const v = clearRoles(baseView());
        v.squad[3].outOfAction = true;
        const out = c.decide(freeze(v), ctx.rng(1));
        const plans = planWrites(out);
        ctx.assert.equal(plans.length, 1, 'one setPlan');
        const roles = plans[0].plan.roles ?? {};
        for (const id of ['r1', 'r2', 'r3']) ctx.assert.ok(ROLES.includes(roles[id]), `${id}: ${roles[id]}`);
        ctx.assert.ok(!('r4' in roles), 'no role for an out-of-action unit');
      },
    },
    {
      id: 'tai013-non-leader-no-plan', spec: ['TAI-013'], name: 'a non-leader never writes setPlan',
      async run(ctx) {
        const c = await setup(ctx);
        for (const id of ['r2', 'r3']) {
          const v = clearRoles(baseView());
          v.activeUnit = id;
          v.allowedActions[0].reachable = [reach(T(3, 3), 4, 21)];
          const out = c.decide(freeze(v), ctx.rng(1));
          ctx.assert.equal(planWrites(out).length, 0, `${id}: ${JSON.stringify(out.blackboardWrites)}`);
        }
      },
    },
    {
      id: 'tai013-follows-view-leader', spec: ['TAI-013', 'TAC-094'], name: 'the AI takes the leader from squadPlan.leader (set by TAC), not from its own rank check',
      async run(ctx) {
        const c = await setup(ctx);
        const v = clearRoles(baseView());
        v.squadPlan.leader = 'r3';
        v.activeUnit = 'r3';
        v.allowedActions[0].reachable = [reach(T(7, 3), 4, 21)];
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.equal(planWrites(out).length, 1, 'r3 leads per the view');
        const v2 = clearRoles(baseView());
        v2.squadPlan.leader = 'r3';
        ctx.assert.equal(planWrites(c.decide(freeze(v2), ctx.rng(1))).length, 0, 'r1 (elite) does not plan while r3 is leader');
      },
    },
    {
      id: 'tai013-successor-keeps-plan', spec: ['TAI-013'], name: "the successor's first activation keeps the current roles of the living units",
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        v.squad[0].outOfAction = true;
        v.squadPlan.leader = 'r2';
        v.activeUnit = 'r2';
        v.allowedActions[0].reachable = [reach(T(3, 3), 4, 21)];
        const out = c.decide(freeze(v), ctx.rng(1));
        for (const w of planWrites(out)) {
          for (const id of ['r2', 'r3', 'r4']) ctx.assert.equal(w.plan.roles?.[id], v.squadPlan.roles[id], `role of ${id}`);
        }
      },
    },

    // ---------------------------------------------------------------- TAI-014 Squad roles
    {
      id: 'tai014-suppress-role', spec: ['TAI-014'], name: 'role suppress raises the fit of shooting compared with role flank',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (role) => setRole(baseView(), 'r1', role);
        const sup = scoreOf(c, make('suppress'), shootAt(c, make('suppress'), 'b1')).actionFit;
        const fl = scoreOf(c, make('flank'), shootAt(c, make('flank'), 'b1')).actionFit;
        ctx.assert.ok(sup > fl, `${sup} > ${fl}`);
      },
    },
    {
      id: 'tai014-flank-role', spec: ['TAI-014'], name: 'role flank raises the fit of a move to the flank tile compared with role suppress',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (role) => setRole(baseView(), 'r1', role);
        const fl = scoreOf(c, make('flank'), moveTo(c, make('flank'), FLANK)).actionFit;
        const sup = scoreOf(c, make('suppress'), moveTo(c, make('suppress'), FLANK)).actionFit;
        ctx.assert.ok(fl > sup, `${fl} > ${sup}`);
      },
    },
    {
      id: 'tai014-retreat-role', spec: ['TAI-014'], name: 'role retreat makes a move toward the exit fit better than a move toward the enemy',
      async run(ctx) {
        const c = await setup(ctx);
        const make = () => setRole(baseView(), 'r1', 'retreat');
        const toward = scoreOf(c, make(), moveTo(c, make(), TOWARD_EXIT)).actionFit;
        const away = scoreOf(c, make(), moveTo(c, make(), TOWARD_ENEMY)).actionFit;
        ctx.assert.ok(toward > away, `${toward} > ${away}`);
      },
    },
    {
      id: 'tai014-no-role-works', spec: ['TAI-014', 'TAI-010'], name: 'a unit with role null still gets fits in 0–1 for every candidate',
      async run(ctx) {
        const c = await setup(ctx);
        const v = setRole(baseView(), 'r1', null);
        v.squadPlan.leader = 'r2';
        const f = freeze(v);
        for (const o of c.candidates(f)) ctx.assert.ok(in01(c.score(f, o, c.doctrineFor(f)).actionFit), o.commands[0].type);
      },
    },
    {
      id: 'tai014-no-reinforcements', spec: ['TAI-014'], name: 'callReinforcements is never assigned (optional, not built)',
      async run(ctx) {
        const c = await setup(ctx);
        for (let seed = 1; seed <= 20; seed++) {
          const out = c.decide(freeze(clearRoles(baseView())), ctx.rng(seed));
          for (const w of planWrites(out)) {
            ctx.assert.ok(!Object.values(w.plan.roles ?? {}).includes('callReinforcements'), `seed ${seed}`);
          }
        }
      },
    },

    // ---------------------------------------------------------------- TAI-015 Doctrines
    {
      id: 'tai015-doctrine-from-view', spec: ['TAI-015'], name: "doctrineFor reads the view's doctrine through the registry",
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView(); v.doctrine = 'tac-goal';
        const d = c.doctrineFor(freeze(v));
        ctx.assert.equal(d.id, 'tac-goal');
        ctx.assert.equal(d.layer, 'tactical');
        ctx.assert.ok(Object.isFrozen(d), 'registry record (frozen)');
      },
    },
    {
      id: 'tai015-weights-change-choice', spec: ['TAI-015', 'TAI-007'], name: 'a goal-heavy doctrine moves toward the exit target, a fit-heavy one takes the good shot',
      async run(ctx) {
        const c = await setup(ctx);
        const make = (doctrine) => {
          const v = baseView();
          v.doctrine = doctrine;
          v.knownEnemies = v.knownEnemies.slice(0, 1);
          v.battleGoal = { goal: 'reachExit', targets: ['exit-n'], acceptableLoss: 0.5 };
          v.allowedActions = [
            { type: 'move', reachable: [reach(TOWARD_EXIT, 2, 23)] },
            { type: 'shoot', apCost: 8, targets: [shootTarget('b1', 0.9)] },
            { type: 'endActivation', apCost: 0 },
          ];
          return v;
        };
        const g = c.decide(freeze(make('tac-goal')), ctx.rng(1)).commands[0];
        const f = c.decide(freeze(make('tac-fit')), ctx.rng(1)).commands[0];
        ctx.assert.equal(g.type, 'move', `tac-goal chose ${g.type}`);
        ctx.assert.equal(f.type, 'shoot', `tac-fit chose ${f.type}`);
      },
    },
    {
      id: 'tai015-unknown-doctrine', spec: ['TAI-015'], name: 'an unknown doctrine ID fails loudly',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView(); v.doctrine = 'no-such-doctrine';
        ctx.assert.throws(() => c.decide(freeze(v), ctx.rng(1)));
      },
    },
    {
      id: 'tai015-strategic-rejected', spec: ['TAI-015'], name: 'a strategic-layer doctrine is not accepted for a battle',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView(); v.doctrine = 'str-generic';
        ctx.assert.throws(() => c.doctrineFor(freeze(v)));
      },
    },

    // ---------------------------------------------------------------- TAI-016 Decision log
    {
      id: 'tai016-log-entry', spec: ['TAI-016'], name: 'log: turn, unit, chosen command, ≤ logTopN options sorted by score with four parts',
      async run(ctx) {
        const c = await setup(ctx);
        const v = baseView();
        const out = c.decide(freeze(v), ctx.rng(1));
        ctx.assert.ok(out.log.length >= 1, 'one entry or more');
        const e = out.log[0];
        ctx.assert.equal(e.turn, 3);
        ctx.assert.equal(e.unit, 'r1');
        ctx.assert.deepEqual(e.chosen, out.commands[0]);
        const n = ctx.registry.get('ai/doctrines', 'tac-balanced').logTopN;
        ctx.assert.ok(Array.isArray(e.options) && e.options.length >= 1 && e.options.length <= n, `options ${e.options?.length} ≤ ${n}`);
        for (let i = 0; i < e.options.length; i++) {
          const o = e.options[i];
          for (const k of ['score', 'survival', 'battleGoal', 'actionFit', 'coordination']) ctx.assert.ok(in01(o[k]), `option ${i} ${k} = ${o[k]}`);
          ctx.assert.ok(o.command && o.command.type, 'option names its command');
          if (i > 0) ctx.assert.ok(e.options[i - 1].score >= o.score, 'sorted by score');
        }
        ctx.assert.deepEqual(e.options[0].command, e.chosen, 'top option is the chosen one');
      },
    },
    {
      id: 'tai016-log-on-choose', spec: ['TAI-016', 'TAI-002'], name: 'the activation-choice call is logged too (unit null)',
      async run(ctx) {
        const c = await setup(ctx);
        const out = c.decide(freeze(chooseView(['r1', 'r2'])), ctx.rng(1));
        ctx.assert.ok(out.log.length >= 1);
        ctx.assert.equal(out.log[0].unit, null);
        ctx.assert.deepEqual(out.log[0].chosen, out.commands[0]);
      },
    },
    {
      id: 'tai016-ai-keeps-no-log', spec: ['TAI-016', 'TAI-001'], name: 'the AI keeps no log between calls (second call has only its own entries)',
      async run(ctx) {
        const c = await setup(ctx);
        const a = c.decide(freeze(baseView()), ctx.rng(1));
        const b = c.decide(freeze(baseView()), ctx.rng(1));
        ctx.assert.equal(b.log.length, a.log.length);
      },
    },

    // ---------------------------------------------------------------- Adapter / interfaces (/integrate)
    {
      id: 'int-samples-accepted', spec: ['TAI-003', 'TAI-004', 'TAI-005'], name: 'adapter: every sample view in fixtures/views.json is accepted and answered with valid commands',
      async run(ctx) {
        const a = await adapter(ctx);
        const ctl = await a.createController();
        for (const [name, v] of Object.entries(samples(ctx))) {
          await assertSchema(ctx.assert, 'tactical_perception_view', v);
          const out = ctl.decide(v, ctx.rng(17));
          await assertSchema(ctx.assert, 'tactical_commands', out);
          assertLegal(ctx.assert, v, out);
          ctx.log(name, JSON.stringify(out.commands));
        }
      },
    },
    {
      id: 'int-same-as-core', spec: ['TAI-001', 'TAI-003'], name: 'adapter: output equals core.decide for the same view and seed',
      async run(ctx) {
        const a = await adapter(ctx);
        const c = await core();
        const ctl = await a.createController();
        for (const v of [...Object.values(samples(ctx)), ...VIEWS().map(freeze)]) {
          ctx.assert.deepEqual(ctl.decide(v, ctx.rng(5)), c.decide(v, ctx.rng(5)));
        }
      },
    },
    {
      id: 'int-rejects-bad-view', spec: ['TAI-004', 'TAI-006'], name: 'adapter: a view that breaks the schema fails with an InterfaceError naming the path',
      async run(ctx) {
        const a = await adapter(ctx);
        const ctl = await a.createController();
        const v = baseView();
        delete v.squad;
        v.squadPlan.roles.r1 = 'charge';
        let err = null;
        try { ctl.decide(freeze(v), ctx.rng(1)); } catch (e) { err = e; }
        ctx.assert.ok(err instanceof a.InterfaceError, `got ${err}`);
        ctx.assert.equal(err.iface, 'tactical_perception_view');
        ctx.assert.ok(err.errors.some((e) => e.path.includes('squadPlan')), JSON.stringify(err.errors));
        ctx.assert.ok(err.errors.some((e) => /squad/.test(e.message) || e.path === '/'), JSON.stringify(err.errors));
      },
    },
    {
      id: 'int-validation-off', spec: ['TAI-003'], name: 'adapter: with validation off it passes the view straight to core',
      async run(ctx) {
        const a = await adapter(ctx);
        const ctl = await a.createController({ validateInput: false, validateOutput: false });
        const v = baseView();
        v.squadPlan.roles.r1 = 'charge';
        const out = ctl.decide(freeze(v), ctx.rng(1));
        ctx.assert.ok(out.commands.length > 0);
      },
    },
    {
      id: 'int-versions', spec: ['TAI-001'], name: 'adapter: built for the interface versions in spec/interfaces',
      async run(ctx) {
        const a = await adapter(ctx);
        for (const [name, want] of Object.entries(a.INTERFACES)) {
          ctx.assert.equal((await schema(name)).version, want, name);
        }
        const ctl = await a.createController();
        ctx.assert.deepEqual(ctl.interfaces, a.INTERFACES);
        ctx.assert.equal(ctl.name, 'tactical-ai');
      },
    },
    {
      id: 'int-on-log', spec: ['TAI-016'], name: 'adapter: onLog receives each call\'s decision log',
      async run(ctx) {
        const a = await adapter(ctx);
        const seen = [];
        const ctl = await a.createController({ onLog: (entries) => seen.push(...entries) });
        const out1 = ctl.decide(samples(ctx).attack, ctx.rng(1));
        const out2 = ctl.decide(samples(ctx).choose, ctx.rng(1));
        ctx.assert.deepEqual(seen, [...out1.log, ...out2.log]);
      },
    },
    {
      id: 'int-retry-sample', spec: ['TAI-005', 'TAI-016', 'TAI-018'], name: 'adapter: retry sample (allied VIP) avoids the rejected move and logs the rejection',
      async run(ctx) {
        const a = await adapter(ctx);
        const ctl = await a.createController();
        const v = samples(ctx).retry;
        const out = ctl.decide(v, ctx.rng(1));
        const cmd = out.commands[0];
        ctx.assert.ok(!(cmd.type === 'move' && cmd.path.at(-1).x === 1 && cmd.path.at(-1).y === 0), JSON.stringify(cmd));
        ctx.assert.deepEqual(out.log[0].rejection, v.rejection);
        ctx.assert.ok(out.blackboardWrites.every((w) => w.op !== 'setPlan'), 'no leader on this side → no plan');
      },
    },
    {
      id: 'int-load-tables', spec: ['TAI-015'], name: 'adapter: loadTables loads only the tables that are missing',
      async run(ctx) {
        const a = await adapter(ctx);
        await a.loadTables(new URL('./fixtures', import.meta.url).href);
        for (const t of a.TABLES) ctx.assert.ok(ctx.registry.loaded().includes(t), t);
      },
    },
    {
      id: 'int-adapter-imports', spec: ['TAI-001'], name: 'adapter imports only its own core, shared/ and nothing from other modules or tools/',
      async run(ctx) {
        await adapter(ctx);
        const url = new URL('../adapter/index.js', import.meta.url).href;
        const code = (await (await fetch(url)).text()).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        for (const m of code.matchAll(/from\s*['"]([^'"]+)['"]/g)) {
          const target = new URL(m[1], url).href;
          ctx.assert.ok(target.includes('/modules/tactical-ai/core/') || target.includes('/shared/'), `imports ${m[1]}`);
        }
        ctx.assert.ok(!/\bMath\.random\b/.test(code), 'no Math.random');
      },
    },
  ],
};
