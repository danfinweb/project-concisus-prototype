// Read-only access to the static definitions in /data. The only way modules read /data.
// Tables are frozen at load. Tests and the Test Lab pass a fixtures folder as `base`, so they use the
// same code path as the game.
const tables = {};

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

// names: table paths relative to base, without .json (e.g. 'items', 'mapgen/tactical').
// base: URL of the data folder; defaults to the repo's /data.
export async function loadData(names, base = new URL('../data', import.meta.url).href) {
  for (const n of names) {
    const res = await fetch(`${base}/${n}.json`);
    if (!res.ok) throw new Error(`loadData: ${base}/${n}.json → HTTP ${res.status}`);
    tables[n] = deepFreeze(await res.json());
  }
}

// Load a table from a plain object (small inline test datasets).
export function setData(name, records) { tables[name] = deepFreeze(structuredClone(records)); }

function table(name) {
  const t = tables[name];
  if (!t) throw new Error(`registry: table "${name}" is not loaded`);
  return t;
}

export const get = (name, id) => table(name)[id];
export const all = (name) => Object.values(table(name));
export const has = (name, id) => Object.prototype.hasOwnProperty.call(table(name), id);
export const loaded = () => Object.keys(tables);
export function clearData() { for (const k of Object.keys(tables)) delete tables[k]; }
