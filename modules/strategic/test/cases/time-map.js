// STR Time and Map: STR-001..STR-016, STR-095.
import { setup, makeWorld, addSquad, setPoi, road, id, T, mgmtView, reqs, soldiers } from '../helpers.js';

export default [
  // ── STR-001 Strategic clock ──
  { id: 'clock-start', spec: ['STR-001'], name: 'New campaign starts Day 1 at startHour 06:00', async run(ctx) {
    const core = await setup(ctx);
    ctx.assert.deepEqual(core.startClock(), T(1, 6));
  } },
  { id: 'clock-rollover', spec: ['STR-001'], name: 'Hour 23 + 1 → hour 0 of the next day; whole hours only', async run(ctx) {
    const core = await setup(ctx);
    ctx.assert.deepEqual(core.advanceClock(T(3, 23), 1), T(4, 0));
    ctx.assert.deepEqual(core.advanceClock(T(1, 6), 50), T(3, 8));
    ctx.assert.throws(() => core.advanceClock(T(1, 6), 1.5));
  } },
  { id: 'clock-format', spec: ['STR-001'], name: 'Timestamps display as "Day D, HH:00"', async run(ctx) {
    const core = await setup(ctx);
    ctx.assert.equal(core.formatTime(T(12, 7)), 'Day 12, 07:00');
  } },

  // ── STR-002 Action duration ──
  { id: 'zero-time-action', spec: ['STR-002', 'STR-039'], name: 'A d = 0 action resolves at once and passes no time', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'small_city');
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    const out = core.planAction(w, 'p1', { type: 'trade', items: [] }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.ok(out.resolved, 'resolved at once');
    ctx.assert.deepEqual(out.world.clock, w.clock);
    ctx.assert.equal(reqs(out, 'trade').length, 1);
  } },
  { id: 'cancel-move-no-fuel', spec: ['STR-002', 'STR-003', 'STR-032'], name: 'A move cancelled before its last hour leaves the squad on its origin and spends no fuel', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld({ terrain: 'woods' });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), vehicleId: 'uaz', fuel: 5 });
    w = core.planAction(w, 'p1', { type: 'move', to: id(2, 1) }, { mgmt: mgmtView() }).world;
    w = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    w = core.cancelAction(w, 'p1');
    ctx.assert.equal(w.squads.p1.regionId, id(1, 1));
    ctx.assert.equal(w.squads.p1.fuel, 5);
    ctx.assert.equal(w.squads.p1.action, null);
  } },

  // ── STR-003 Hour tick ──
  { id: 'tick-views-before-commands', spec: ['STR-003', 'STR-021'], name: 'All views are built from the state at the start of the tick', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(0, 0), soldiers: soldiers(4) });
    addSquad(w, { id: 'b', faction: 'krug', regionId: id(4, 4), soldiers: soldiers(4) });
    const seen = {};
    const controllers = {
      ssv: (v) => { seen.ssv = v.time; return { faction: 'ssv', commands: [{ type: 'moveSquad', squad: 'a', to: id(1, 0) }] }; },
      krug: (v) => { seen.krug = v.time; return { faction: 'krug', commands: [{ type: 'pass' }] }; },
    };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.commitTurn(w, controllers, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.deepEqual(seen.ssv, seen.krug);
    ctx.assert.deepEqual(seen.ssv, T(1, 6));
    ctx.assert.deepEqual(out.world.clock, T(1, 7));
  } },
  { id: 'commit-ends-at-first-finish', spec: ['STR-003'], name: 'A commit runs ticks until the first player squad finishes; longer actions keep running', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 2 } });
    addSquad(w, { id: 'p2', faction: 'pmc', regionId: id(4, 4), action: { type: 'standBy', hoursLeft: 5 } });
    const out = core.commitTurn(w, {}, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.ticks, 2);
    ctx.assert.equal(out.world.squads.p1.action, null);
    ctx.assert.equal(out.world.squads.p2.action.hoursLeft, 3);
  } },
  { id: 'no-time-without-action', spec: ['STR-001', 'STR-003'], name: 'Ending a turn with no action of ≥ 1 h passes no time', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    const out = core.commitTurn(w, {}, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.ticks, 0);
    ctx.assert.deepEqual(out.world.clock, T(1, 6));
  } },
  { id: 'expiry-after-clock', spec: ['STR-003'], name: 'Timed state due at the new time expires in the same tick', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.intel.push({ id: 'i1', faction: 'pmc', vipId: 'v1', regionId: id(1, 1), expires: T(1, 7) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.world.intel.length, 0);
  } },

  // ── STR-004 Daily checks ──
  { id: 'daily-at-midnight', spec: ['STR-004'], name: 'Daily checks run when a tick lands on 00:00 and send dailyRollover with the day', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.clock = T(2, 23);
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    const roll = reqs(out, 'dailyRollover');
    ctx.assert.equal(roll.length, 1);
    ctx.assert.equal(roll[0].day, 3);
  } },
  { id: 'no-daily-other-hours', spec: ['STR-004'], name: 'No daily checks at other hours', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(reqs(out, 'dailyRollover').length, 0);
  } },

  // ── STR-005 Region graph ──
  { id: 'square-adjacency', spec: ['STR-005'], name: 'Square grid: 4 edge neighbours, no diagonals; distance is Manhattan', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    ctx.assert.deepEqual(core.neighbours(w, id(2, 2)).slice().sort(), [id(1, 2), id(2, 1), id(2, 3), id(3, 2)].sort());
    ctx.assert.equal(core.neighbours(w, id(0, 0)).length, 2);
    ctx.assert.equal(core.regionDistance(w, id(0, 0), id(3, 4)), 7);
  } },
  { id: 'hex-adjacency', spec: ['STR-005'], name: 'Hex test option: an inner tile has 6 neighbours', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.mapShape = 'hex';
    ctx.assert.equal(core.neighbours(w, id(2, 2)).length, 6);
  } },

  // ── STR-006 Terrain movement, STR-095 terrain table ──
  { id: 'move-hours-by-terrain', spec: ['STR-006', 'STR-095', 'STR-032'], name: 'Vehicle hours by destination terrain: steppe 2, woods 3 (poor off-road)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'woods';
    const sq = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    ctx.assert.equal(core.moveCost(w, sq, id(1, 2)).hours, 2);
    ctx.assert.equal(core.moveCost(w, sq, id(2, 1)).hours, 3);
  } },
  { id: 'road-overrides-terrain', spec: ['STR-006'], name: 'A road between the two tiles overrides the terrain: vehicle 1 h, foot 2 h, asphalt = dirt', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ terrain: 'woods' });
    road(w, id(1, 1), id(2, 1), 'dirt');
    const car = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    const foot = addSquad(w, { id: 'b', faction: 'ssv', regionId: id(1, 1) });
    ctx.assert.equal(core.moveCost(w, car, id(2, 1)).hours, 1);
    ctx.assert.equal(core.moveCost(w, foot, id(2, 1)).hours, 2);
  } },
  { id: 'road-must-connect', spec: ['STR-006'], name: 'A road on the destination that does not continue from the origin does not apply', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ terrain: 'woods' });
    road(w, id(2, 1), id(3, 1));
    const car = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    ctx.assert.equal(core.moveCost(w, car, id(2, 1)).hours, 3);
  } },
  { id: 'mountain-road-only', spec: ['STR-006', 'STR-032'], name: 'A vehicle enters a mountain tile only along a road', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'mountain';
    w.tiles[id(1, 2)].terrain = 'mountain';
    road(w, id(1, 1), id(1, 2));
    const car = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    ctx.assert.ok(core.moveCost(w, car, id(2, 1)).error, 'off-road mountain rejected');
    ctx.assert.equal(core.moveCost(w, car, id(1, 2)).hours, 1);
  } },
  { id: 'water-bridge-only', spec: ['STR-006', 'STR-031', 'STR-032'], name: 'Water is impassable except along a road over a bridge or ford', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'water';
    w.tiles[id(1, 2)].terrain = 'water';
    road(w, id(1, 1), id(1, 2));
    w.tiles[id(1, 2)].road.crossing = 'bridge';
    const foot = addSquad(w, { id: 'b', faction: 'ssv', regionId: id(1, 1) });
    ctx.assert.ok(core.moveCost(w, foot, id(2, 1)).error);
    ctx.assert.equal(core.moveCost(w, foot, id(1, 2)).hours, 2);
  } },
  { id: 'terrain-visibility-on-roads', spec: ['STR-006', 'STR-095'], name: 'A road tile takes its terrain\'s visibility (woods road → low)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ terrain: 'woods' });
    road(w, id(1, 1), id(2, 1));
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 1) });
    const m = mgmtView();
    // evade bonus for "low" applies on a woods road tile: 20 + 40/2 + 20 = 60
    ctx.assert.equal(core.evadeChance(w, 'p1', { mgmt: m }), 60);
  } },

  // ── STR-007 Capital ──
  { id: 'capital-falls-contested', spec: ['STR-007'], name: 'Holder loses the tile → holder none, contested, timer starts for the occupant', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 2, 2, 'large_city');
    w.capital = { regionId: id(2, 2), holder: 'ssv', contestedSince: null };
    w.tiles[id(2, 2)].controller = 'vdk';
    w.clock = T(5, 23);
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    w = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    ctx.assert.equal(w.capital.holder, 'none');
    ctx.assert.ok(w.capital.contestedSince, 'contested timer set');
  } },
  { id: 'capital-hold-days', spec: ['STR-007'], name: 'Unbroken control for capitalHoldDays (7) makes the occupant the holder', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 2, 2, 'large_city');
    w.tiles[id(2, 2)].controller = 'vdk';
    w.capital = { regionId: id(2, 2), holder: 'none', contestedSince: T(1, 0) };
    w.clock = T(8, 0);
    let out = core.runDailyChecks(w, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.world.capital.holder, 'vdk');
    w.clock = T(7, 0);
    out = core.runDailyChecks(w, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.world.capital.holder, 'none');
  } },
  { id: 'capital-bonus-income', spec: ['STR-007', 'STR-092'], name: 'The holder gets capitalBonusIncomeUsd 3000 per day; for the player a capitalIncome request', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'large_city');
    w.capital = { regionId: id(2, 2), holder: 'ssv', contestedSince: null };
    w.tiles[id(2, 2)].controller = 'ssv';
    w.clock = T(3, 0);
    const before = w.factions.ssv.funds;
    const inc = core.dailyIncome(w, 'ssv');
    const out = core.runDailyChecks(w, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.ok(out.world.factions.ssv.funds - before >= 3000, 'bonus credited');
    ctx.assert.ok(inc >= 3000 + 2000, 'income includes capital bonus and city income');
    const w2 = makeWorld();
    setPoi(w2, 2, 2, 'large_city');
    w2.capital = { regionId: id(2, 2), holder: 'pmc', contestedSince: null };
    w2.tiles[id(2, 2)].controller = 'pmc';
    w2.clock = T(3, 0);
    const r = reqs(core.runDailyChecks(w2, { mgmt: mgmtView(), rng: ctx.rng(1) }), 'capitalIncome');
    ctx.assert.equal(r.length, 1);
    ctx.assert.equal(r[0].amountUsd, 3000);
  } },

  // ── STR-008 Fog of war ──
  { id: 'fog-recon-range', spec: ['STR-008'], name: 'Visible within reconRange of own squads (fixture squad 1) and FOBs (fixture fob 2)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 7, height: 7 });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    w.fobs.f1 = { id: 'f1', regionId: id(6, 6), owner: 'pmc' };
    const vis = core.visibleRegions(w, 'pmc');
    ctx.assert.ok(vis.includes(id(1, 0)) && vis.includes(id(0, 0)));
    ctx.assert.ok(!vis.includes(id(1, 1)), 'distance 2 from squad not visible');
    ctx.assert.ok(vis.includes(id(4, 6)), 'distance 2 from FOB visible');
  } },
  { id: 'fog-noise', spec: ['STR-008'], name: 'A squad outside visibility is noticed within its vehicle\'s noise range (truck high = 3)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 1 });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    addSquad(w, { id: 'loud', faction: 'ssv', regionId: id(3, 0), vehicleId: 'truck', fuel: 5 });
    addSquad(w, { id: 'far', faction: 'ssv', regionId: id(5, 0), vehicleId: 'truck', fuel: 5 });
    const n = core.noticedSquads(w, 'pmc');
    ctx.assert.ok(n.includes('loud'));
    ctx.assert.ok(!n.includes('far'));
  } },
  { id: 'fog-last-known', spec: ['STR-008'], name: 'A region out of sight shows its last known state with a timestamp', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld({ width: 5, height: 1 });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 0), action: { type: 'standBy', hoursLeft: 1 } });
    w = core.resolveHour(w, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    w.squads.p1.regionId = id(4, 0);
    w.tiles[id(0, 0)].controller = 'vdk';
    const lk = core.lastKnown(w, 'pmc', id(0, 0));
    ctx.assert.ok(lk && lk.time, 'has a timestamp');
    ctx.assert.equal(lk.tile.controller, 'none');
  } },

  // ── STR-009 Loyalty ──
  { id: 'loyalty-settlements-only', spec: ['STR-009'], name: 'Loyalty only on settlement tiles, per faction, clamped to −100…100', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'village', { loyalty: { ssv: 95 } });
    setPoi(w, 2, 2, 'plant_oil');
    w = core.adjustLoyalty(w, id(1, 1), 'ssv', 20);
    ctx.assert.equal(w.tiles[id(1, 1)].loyalty.ssv, 100);
    w = core.adjustLoyalty(w, id(1, 1), 'vdk', -150);
    ctx.assert.equal(w.tiles[id(1, 1)].loyalty.vdk, -100);
    ctx.assert.throws(() => core.adjustLoyalty(w, id(2, 2), 'ssv', 5));
  } },

  // ── STR-010 POIs ──
  { id: 'poi-services', spec: ['STR-010'], name: 'Services come from the POI type; a ruined POI offers none; krugMarket adds Krug services', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    setPoi(w, 2, 2, 'small_city');
    w.tiles[id(2, 2)].poi.state = 'ruined';
    setPoi(w, 3, 3, 'town', { krugMarket: true });
    ctx.assert.ok(core.servicesAt(w, id(1, 1)).includes('hospital'));
    ctx.assert.equal(core.servicesAt(w, id(2, 2)).length, 0);
    ctx.assert.ok(core.servicesAt(w, id(3, 3)).includes('krugMarket'));
    ctx.assert.ok(!core.servicesAt(w, id(1, 1)).includes('krugMarket'));
  } },

  // ── STR-011 Mineral modifier ──
  { id: 'mineral-modifier', spec: ['STR-011'], name: 'Output × (1 + min(0.30, 0.10 × mineral plants held))', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 6, height: 1 });
    ctx.assert.equal(core.mineralMultiplier(w, 'ssv'), 1);
    for (let x = 0; x < 2; x++) { setPoi(w, x, 0, 'plant_minerals'); w.tiles[id(x, 0)].controller = 'ssv'; }
    ctx.assert.ok(Math.abs(core.mineralMultiplier(w, 'ssv') - 1.2) < 1e-9);
    for (let x = 2; x < 5; x++) { setPoi(w, x, 0, 'plant_minerals'); w.tiles[id(x, 0)].controller = 'ssv'; }
    ctx.assert.ok(Math.abs(core.mineralMultiplier(w, 'ssv') - 1.3) < 1e-9, 'capped at +30%');
  } },

  // ── STR-012 Krug markets ──
  { id: 'krug-no-fire', spec: ['STR-012', 'STR-022'], name: 'Encounters on a krugMarket tile never turn hostile by faction rules', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'town', { krugMarket: true });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2) });
    const enc = core.detectEncounters(w, { mgmt: mgmtView() });
    ctx.assert.ok(enc.every((e) => !e.hostile));
  } },
  { id: 'krug-fight-turns-hostile', spec: ['STR-012'], name: 'Starting a fight on a Krug market turns the Krug hostile to that faction', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'town', { krugMarket: true });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2) });
    const out = core.resolveHour(w, { commands: { ssv: { faction: 'ssv', commands: [{ type: 'attack', squad: 'a', target: 'b' }] } } }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.ok(out.world.relations.krug.ssv <= -50);
  } },

  // ── STR-013 Hidden cities (optional) ──
  { id: 'hidden-city-heli-only', spec: ['STR-013', 'STR-035'], name: '(optional) A hidden city is entered only by helicopter landing', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 2)].poi = { type: 'hidden', state: 'intact', hidden: true };
    const foot = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 2) });
    ctx.assert.ok(core.moveCost(w, foot, id(2, 2)).error, 'ground entry refused');
  } },

  // ── STR-014 Control, income, supply ──
  { id: 'poi-income-supply', spec: ['STR-014'], name: 'Held POIs yield income, supply and recruits per type (large city 2000 / 20 / 3)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'large_city');
    setPoi(w, 2, 2, 'plant_oil');
    w.tiles[id(1, 1)].controller = 'vdk';
    w.tiles[id(2, 2)].controller = 'vdk';
    ctx.assert.equal(core.dailyIncome(w, 'vdk'), 5000);
    ctx.assert.equal(core.dailySupply(w, 'vdk'), 40);
  } },
  { id: 'supply-short', spec: ['STR-014'], name: 'A faction is short of supply when its daily supply < its soldiers', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'vdk';
    addSquad(w, { id: 'a', faction: 'vdk', regionId: id(1, 1), soldiers: soldiers(4) });
    ctx.assert.equal(core.isSupplyShort(w, 'vdk'), false);
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(1, 1), soldiers: soldiers(2) });
    ctx.assert.equal(core.isSupplyShort(w, 'vdk'), true);
  } },

  // ── STR-015 Station and plant output ──
  { id: 'plant-output', spec: ['STR-015', 'STR-011'], name: 'Daily plantOutput of a stationed plant to the nearest FOB, × mineral bonus, rounded down', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 6, height: 1 });
    setPoi(w, 2, 0, 'plant_arms');
    setPoi(w, 5, 0, 'plant_minerals');
    w.tiles[id(2, 0)].controller = 'vdk';
    w.tiles[id(2, 0)].poi.heldBy = 'pmc';
    w.tiles[id(5, 0)].controller = 'vdk';
    w.tiles[id(5, 0)].poi.heldBy = 'pmc';
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 0), action: { type: 'station' } });
    addSquad(w, { id: 'p2', faction: 'pmc', regionId: id(5, 0), action: { type: 'station' } });
    w.fobs.fa = { id: 'fa', regionId: id(0, 0), owner: 'pmc' };
    w.fobs.fb = { id: 'fb', regionId: id(4, 0), owner: 'pmc' };
    const out = core.plantOutputRequests(w);
    const arms = out.find((r) => r.plantId === id(2, 0));
    ctx.assert.equal(arms.type, 'plantOutput');
    ctx.assert.equal(arms.fobId, 'fa', 'distance 2 each → lowest id');
    ctx.assert.deepEqual(arms.items.map((i) => i.count), [2, 330], '2 × 1.1 → 2, 300 × 1.1 → 330');
    const min = out.find((r) => r.plantId === id(5, 0));
    ctx.assert.equal(min.fobId, 'fb');
    ctx.assert.equal(min.amountUsd, 1500, 'own plant not boosted');
  } },
  { id: 'station-unguarded', spec: ['STR-015'], name: 'With no PMC squad stationed, control returns to the region controller and output stops', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'plant_oil');
    w.tiles[id(2, 2)].controller = 'vdk';
    w.tiles[id(2, 2)].poi.heldBy = 'pmc';
    w.fobs.f = { id: 'f', regionId: id(0, 0), owner: 'pmc' };
    w.clock = T(2, 0);
    const out = core.runDailyChecks(w, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(reqs(out, 'plantOutput').length, 0);
    ctx.assert.ok(!out.world.tiles[id(2, 2)].poi.heldBy, 'plant back with the region controller');
  } },

  // ── STR-016 FOBs ──
  { id: 'fob-entity', spec: ['STR-016'], name: 'An FOB is { id, regionId, owner } and a visibility source; ops start only at a PMC FOB', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.fobs.f = { id: 'f', regionId: id(4, 4), owner: 'pmc' };
    ctx.assert.ok(core.visibleRegions(w, 'pmc').includes(id(4, 4)));
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    const out = core.planAction(w, 'p1', { type: 'launchOp', soldiers: ['s1'], fobId: 'f' }, { mgmt: mgmtView() });
    ctx.assert.ok(out.error, 'launch away from the FOB refused');
  } },
];
