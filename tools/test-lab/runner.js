// Test Lab runner: loads each target's test/scenarios.js and test/sim.config.js and runs them.
// Modules define WHAT to test; this file defines HOW tests run. No UI here, so it can also be
// driven from a Web Worker or another page later.
import { assert } from './assert.js';
import { Rng } from '../../shared/rng.js';
import * as registry from '../../shared/registry.js';

// Every test target: the shared code (root session) and each game module.
export const TARGETS = ['shared', 'tactical', 'strategic', 'management', 'strategic-ai', 'tactical-ai'];

const base = (target) => new URL(target === 'shared' ? '../../shared/test/' : `../../modules/${target}/test/`, import.meta.url).href;

export async function loadTarget(target) {
  const out = { target, scenarios: [], sims: [], errors: [] };
  try { out.scenarios = (await import(`${base(target)}scenarios.js`)).default.scenarios ?? []; }
  catch (e) { out.errors.push(`scenarios.js: ${e.message}`); }
  try { out.sims = (await import(`${base(target)}sim.config.js`)).default.sims ?? []; }
  catch (e) { if (target !== 'shared') out.errors.push(`sim.config.js: ${e.message}`); }
  return out;
}

// Run one scenario. Each gets a fresh registry, so no test depends on tables left by another.
export async function runScenario(target, sc, { seed = 1 } = {}) {
  const logs = [];
  const ctx = {
    assert,
    registry,
    rng: (s = seed) => new Rng(s),
    loadFixtures: (names) => registry.loadData(names, `${base(target)}fixtures`),
    log: (...a) => logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')),
  };
  registry.clearData();
  const t0 = performance.now();
  let error = null;
  try { await sc.run(ctx); } catch (e) { error = e; }
  return {
    target, id: sc.id, name: sc.name, spec: sc.spec ?? [], ok: !error, ms: performance.now() - t0, logs,
    error: error ? (error.stack || String(error)) : null, message: error?.message ?? null,
  };
}

// Run a sim over many seeds and every combination of params; returns one row per run.
export async function runSim(target, sim, { seeds = sim.seeds ?? 50, firstSeed = 1, onProgress } = {}) {
  const core = sim.core ?? null; // a sim imports its own core and may expose it here
  const combos = cartesian(sim.params ?? {});
  const rows = [];
  for (const params of combos) {
    for (let s = firstSeed; s < firstSeed + seeds; s++) {
      const metrics = await sim.run(core, registry, s, params);
      rows.push({ seed: s, params, metrics });
    }
    onProgress?.(rows.length, combos.length * seeds);
  }
  return rows;
}

function cartesian(params) {
  const keys = Object.keys(params);
  return keys.reduce((acc, k) => {
    const vals = Array.isArray(params[k]) ? params[k] : [params[k]];
    return acc.flatMap((a) => vals.map((v) => ({ ...a, [k]: v })));
  }, [{}]);
}
