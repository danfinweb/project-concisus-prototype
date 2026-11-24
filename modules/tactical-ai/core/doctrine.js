// Doctrine access (TAI-015). Doctrines come from data/ai/doctrines.json through shared/registry.js;
// the view names one per side (`view.doctrine`). All weights and curves of TAI-007..TAI-014 are read here.
import * as registry from '../../../shared/registry.js';
import { curve } from './curve.js';

const TABLE = 'ai/doctrines';

export function doctrineFor(view) {
  const id = view.doctrine;
  if (!id) throw new Error('tactical-ai: the view names no doctrine (TAI-015)');
  const d = registry.get(TABLE, id);
  if (!d) throw new Error(`tactical-ai: unknown doctrine "${id}" (TAI-015)`);
  if (d.layer !== 'tactical') throw new Error(`tactical-ai: doctrine "${id}" is layer "${d.layer}", not tactical (TAI-015)`);
  return d;
}

// The consideration entry { weight, curve } for `name`, or undefined.
export const entry = (d, name) => d.considerations?.[name];

// Required consideration: throws if the doctrine lacks it.
export function need(d, name) {
  const e = entry(d, name);
  if (!e) throw new Error(`tactical-ai: doctrine "${d.id}" lacks consideration "${name}"`);
  return e;
}

// Curve of a consideration applied to x (identity when the entry has no curve).
export function shaped(e, x) {
  return e.curve ? curve(e.curve, x) : x;
}

// Weight of an optional consideration; absent = 0 (the term does not count).
export const weight = (d, name) => entry(d, name)?.weight ?? 0;

export const roles = (d) => d.roles ?? {};
