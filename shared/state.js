// The game's changing state: one store split into slices, each written only by its owning module.
// It holds only what differs from the definitions in /data, pointing back by ID.
// Save format: { v, savedAt, slices }. Every SAVE_VERSION bump adds a migration below.

// Slice → owning module (keep in sync with the root CLAUDE.md and each SCOPE.md).
export const OWNERS = Object.freeze({
  world: 'strategic',
  battle: 'tactical',
  roster: 'management',
  unlocks: 'management',
  economy: 'management',
  contracts: 'management',
  reputation: 'management',
});

export const SAVE_VERSION = 1;

// migrations[n] turns a version-n save into a version-(n+1) save.
const migrations = {};

export function createStore(initial = {}) {
  const slices = {};
  for (const name of Object.keys(OWNERS)) slices[name] = structuredClone(initial[name] ?? null);
  const listeners = new Set();
  return {
    // Read any slice. Returns a copy, so readers can't change state behind the owner's back.
    read(name) { check(name); return structuredClone(slices[name]); },
    // Only the owner writes. `owner` is the module name, passed by that module's adapter.
    write(owner, name, value) {
      check(name);
      if (OWNERS[name] !== owner) throw new Error(`state: "${owner}" cannot write slice "${name}" (owner: ${OWNERS[name]})`);
      slices[name] = structuredClone(value);
      for (const fn of listeners) fn(name);
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    serialize(savedAt = {}) { return JSON.stringify({ v: SAVE_VERSION, savedAt, slices }); },
  };
}

function check(name) { if (!(name in OWNERS)) throw new Error(`state: unknown slice "${name}"`); }

// Parse a save, migrate it up to SAVE_VERSION, and return a new store.
export function loadStore(text) {
  let data = JSON.parse(text);
  if (typeof data.v !== 'number' || data.v > SAVE_VERSION) throw new Error(`save version ${data.v} is not supported`);
  while (data.v < SAVE_VERSION) {
    const m = migrations[data.v];
    if (!m) throw new Error(`no migration from save version ${data.v}`);
    data = { ...m(data), v: data.v + 1 };
  }
  return createStore(data.slices);
}

// Browser storage: localStorage for small saves, IndexedDB (native API) for slots and large saves.
export const storage = {
  saveSmall(key, text) { localStorage.setItem(`concisus:${key}`, text); },
  loadSmall(key) { return localStorage.getItem(`concisus:${key}`); },
  async saveSlot(slot, text) { return request('readwrite', (s) => s.put(text, slot)); },
  async loadSlot(slot) { return request('readonly', (s) => s.get(slot)); },
  async listSlots() { return request('readonly', (s) => s.getAllKeys()); },
};

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('concisus', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('saves');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function request(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction('saves', mode).objectStore('saves'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
