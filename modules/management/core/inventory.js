// Inventory model (MGT-032): item lists, no grids; a container rejects an item that would exceed its weight limit.
import { item } from './data.js';

const EPS = 1e-9; // float tolerance for summed weights, not a balancing value
const weightOf = (inst) => item(inst.item)?.weightKg ?? 0;

export function containerWeight(container) { return container.items.reduce((a, i) => a + weightOf(i), 0); }

export function addToContainer(container, instance) {
  if (containerWeight(container) + weightOf(instance) > container.capacityKg + EPS) return { ok: false, container };
  return { ok: true, container: { ...container, items: [...container.items, structuredClone(instance)] } };
}
