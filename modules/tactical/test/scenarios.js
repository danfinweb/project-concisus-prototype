// Tactical Layer — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=tactical).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
//
// The cases live in ./cases/ by spec section; the core API they target is ./CORE-API.md. The core is
// imported lazily inside each case (helpers.setup), so a missing core fails every case on its own.
import frame from './cases/frame.js';
import turn from './cases/turn.js';
import vision from './cases/vision.js';
import movement from './cases/movement.js';
import weapons from './cases/weapons.js';
import body from './cases/body.js';
import gear from './cases/gear.js';
import mapgen from './cases/mapgen.js';

export default {
  module: 'tactical',
  scenarios: [...frame, ...turn, ...vision, ...movement, ...weapons, ...body, ...gear, ...mapgen],
};
