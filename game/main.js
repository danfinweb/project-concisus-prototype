// Game shell: wires module adapters, the renderer and saves. Imports adapters and shared/ only —
// never module cores or tools/. No adapters exist yet (build order step 6).
import { loadData } from '../shared/registry.js';
import { createStore } from '../shared/state.js';

const status = document.getElementById('status');

async function main() {
  const tables = await (await fetch('../data/tables.json')).json();
  await loadData(Object.keys(tables).filter((k) => !k.startsWith('$')));
  const store = createStore();
  window.concisus = { store };
  status.textContent = 'Concisus — shell ready. No module adapters wired yet.';
}

main().catch((e) => { status.textContent = `Failed to start: ${e.message}`; console.error(e); });
