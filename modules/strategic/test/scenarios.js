// Strategic Layer — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=strategic).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
//
// The core API and the `world` shape these cases expect are listed at the top of ./helpers.js.
// Fixtures in ./fixtures/ hold the design drafts; values the spec leaves unset are fixture choices
// (reconRange, offroadReduction, loyaltyStart, scoutSuccess, scatterShares, brokerCeasefire 2 h,
// lowRiskContract.minFrontDistance 3, mapgen counts and distances, measure effect sizes).
import timeMap from './cases/time-map.js';
import squads from './cases/squads.js';
import ops from './cases/ops.js';
import events from './cases/events.js';
import mapgen from './cases/mapgen.js';

export default {
  module: 'strategic',
  scenarios: [...timeMap, ...squads, ...ops, ...events, ...mapgen],
};
