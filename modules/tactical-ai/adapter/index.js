// Tactical AI adapter (TAI-001, TAI-003). Wraps core.decide as a pluggable tactical controller:
// tactical_perception_view in → core → tactical_commands out, both checked against their schemas.
// The shell (game/) or the Test Lab creates one controller and plugs it in per unit (TAI-003); TAC calls
// controller.decide(view, rng) with its own seeded rng. The AI owns no state, so no store slice is used.
// Imports only its own core/, shared/ and the interface schemas (fetched as JSON).
import * as core from '../core/index.js';
import { validate } from '../../../shared/schema.js';
import { loadData, loaded } from '../../../shared/registry.js';

export const NAME = 'tactical-ai';

// The data tables core reads through shared/registry.js (SCOPE.md › Data tables).
export const TABLES = ['ai/doctrines', 'items'];

// Interface versions this adapter is built against (SCOPE.md › Interfaces). A different major.minor
// (0.x: minor bumps may break) fails loudly at createController.
export const INTERFACES = Object.freeze({
  tactical_perception_view: '0.7.0',
  tactical_commands: '0.6.0',
});

const SPEC = new URL('../../../spec/interfaces/', import.meta.url);

export class InterfaceError extends Error {
  constructor(iface, errors) {
    super(`${NAME}: ${iface} is invalid: ${errors.slice(0, 5).map((e) => `${e.path} ${e.message}`).join('; ')}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ''}`);
    this.name = 'InterfaceError';
    this.iface = iface;
    this.errors = errors;
  }
}

let schemasPromise = null;
export function loadSchemas() {
  schemasPromise ??= Promise.all(Object.keys(INTERFACES).map(async (name) => {
    const res = await fetch(new URL(`${name}.schema.json`, SPEC));
    if (!res.ok) throw new Error(`${NAME}: schema ${name}: HTTP ${res.status}`);
    return [name, await res.json()];
  })).then(Object.fromEntries);
  return schemasPromise;
}

const minor = (v) => String(v).split('.').slice(0, 2).join('.');

function checkVersions(schemas) {
  for (const [name, want] of Object.entries(INTERFACES)) {
    const got = schemas[name]?.version;
    if (minor(got) !== minor(want)) {
      throw new Error(`${NAME}: built for ${name} ${want}, spec has ${got} — run /integrate in modules/tactical-ai`);
    }
  }
}

// Loads the tables core needs that are not loaded yet (base: data folder URL; default the repo's /data).
export async function loadTables(base) {
  const have = new Set(loaded());
  const missing = TABLES.filter((t) => !have.has(t));
  if (missing.length) await loadData(missing, base);
}

function check(schemas, name, value) {
  const errors = validate(schemas[name], value);
  if (errors.length) throw new InterfaceError(name, errors);
}

// options: validateInput / validateOutput (default true; the shell may switch them off in release builds),
// onLog(entries) — receives each call's decision log for the debug overlay or the Test Lab (TAI-016).
export async function createController({ validateInput = true, validateOutput = true, onLog } = {}) {
  const schemas = await loadSchemas();
  checkVersions(schemas);
  return Object.freeze({
    name: NAME,
    interfaces: INTERFACES,
    decide(view, rng) {
      if (validateInput) check(schemas, 'tactical_perception_view', view);
      const out = core.decide(view, rng);
      if (validateOutput) check(schemas, 'tactical_commands', out);
      if (onLog) onLog(out.log);
      return out;
    },
  });
}
