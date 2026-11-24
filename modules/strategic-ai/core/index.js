// Strategic AI core (SAI-001): a pure faction controller. No DOM, no fetch, no state between calls;
// data through shared/registry.js, randomness only through the passed seeded rng (shared/rng.js).
export { decide } from './decide.js';
export { responseCurve, pickBest } from './scoring.js';
export { situationMaps } from './maps.js';
