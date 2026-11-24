// Strategic AI adapter: the pluggable faction controller of SAI-002 / STR-021.
// strategic_perception_view in → core.decide → strategic_commands out, both checked against their
// interface schemas with shared/schema.js. Imports only its own core/, shared/ and the interface schemas.
//
//   const ctl = await createController();            // loads the two schemas once
//   const out = ctl.decide(view, seedOrRng);         // { faction, commands, log }
//
// The caller (game shell, Test Lab, cross-sim) loads /data first: requiredTables lists what core reads.
import { decide as coreDecide } from '../core/index.js';
import { validate } from '../../../shared/schema.js';
import { Rng } from '../../../shared/rng.js';

// Interface versions this adapter is built against (SCOPE.md › Interfaces).
export const interfaceVersions = Object.freeze({
  strategic_perception_view: '0.9.0',
  strategic_commands: '0.8.0',
});

// /data tables core reads through shared/registry.js (SCOPE.md › Data tables).
export const requiredTables = Object.freeze(['ai/doctrines', 'factions', 'strategic-rules', 'strategic-terrain',
  'economy-rules', 'poi', 'events', 'missions']);

const schemaUrl = (name) => new URL(`../../../spec/interfaces/${name}.schema.json`, import.meta.url);

export async function loadSchemas() {
  const out = {};
  for (const name of Object.keys(interfaceVersions)) {
    const res = await fetch(schemaUrl(name));
    if (!res.ok) throw new Error(`strategic-ai adapter: ${name} schema → HTTP ${res.status}`);
    out[name] = await res.json();
  }
  return out;
}

// Same major and minor as pinned; a different patch is compatible (semver, CHANGELOG rule).
export function checkVersions(schemas) {
  const problems = [];
  for (const [name, want] of Object.entries(interfaceVersions)) {
    const have = schemas[name]?.version;
    const [a, b] = [want, have ?? ''].map((v) => v.split('.').slice(0, 2).join('.'));
    if (a !== b) problems.push(`${name}: adapter built for ${want}, schema is ${have ?? 'missing'}`);
  }
  return problems;
}

export class InterfaceError extends Error {
  constructor(message, errors) { super(message); this.name = 'InterfaceError'; this.errors = errors; }
}

const fmt = (errs) => errs.slice(0, 8).map((e) => `${e.path || '/'}: ${e.message}`).join('; ');

// options:
//   schemas        preloaded schemas (else fetched)
//   onInvalidView  'throw' (default) or 'pass': an invalid view yields a valid { pass } command set
//   checkOutput    true (default): validate what core returns
export async function createController(options = {}) {
  const schemas = options.schemas ?? await loadSchemas();
  const drift = checkVersions(schemas);
  if (drift.length) throw new InterfaceError(`strategic-ai adapter: interface version mismatch — ${drift.join('; ')}`, drift);
  const onInvalidView = options.onInvalidView ?? 'throw';
  const checkOutput = options.checkOutput ?? true;

  function decide(view, seedOrRng = 1) {
    const inErrs = validate(schemas.strategic_perception_view, view);
    if (inErrs.length) {
      if (onInvalidView === 'pass' && typeof view?.faction === 'string') {
        return { faction: view.faction, commands: [{ type: 'pass' }], log: [] };
      }
      throw new InterfaceError(`strategic-ai adapter: invalid strategic_perception_view — ${fmt(inErrs)}`, inErrs);
    }
    const rng = typeof seedOrRng === 'number' ? new Rng(seedOrRng) : seedOrRng;
    const { commands, log } = coreDecide(view, rng);
    const out = { faction: view.faction, commands, log };
    if (checkOutput) {
      const outErrs = validate(schemas.strategic_commands, out);
      if (outErrs.length) throw new InterfaceError(`strategic-ai adapter: invalid strategic_commands — ${fmt(outErrs)}`, outErrs);
    }
    return out;
  }

  return { id: 'strategic-ai', interfaceVersions, requiredTables, decide };
}
