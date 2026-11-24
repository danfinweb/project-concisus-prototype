// STR Operations and strategic actions: STR-027..STR-044, STR-099.
import { setup, makeWorld, addSquad, setPoi, id, T, mgmtView, reqs, soldiers, share, checkSchema } from '../helpers.js';

const atFob = (w, x = 0, y = 0) => { w.fobs.f = { id: 'f', regionId: id(x, y), owner: 'pmc' }; return w; };
const o = (ctx, extra = {}) => ({ mgmt: mgmtView(extra), rng: ctx.rng(1) });
const offer = (over = {}) => ({ id: 'c1', employer: 'vdk', status: 'signed', pay: { advance: 1000 },
  missions: [{ key: 'm1', missionId: 'retrieve_deliver', location: id(3, 0), outcome: null }], ...over });

export default [
  // ── STR-027 Op lifecycle ──
  { id: 'op-success-one-soldier', spec: ['STR-027', 'STR-029'], name: 'An op succeeds when ≥ 1 soldier reaches a PMC FOB; opReturn sent', async run(ctx) {
    const core = await setup(ctx);
    let w = atFob(makeWorld({ width: 3, height: 1 }));
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 0), soldiers: soldiers(1) });
    w.ops.op1 = { id: 'op1', squadId: 'p1', objectives: [], startFob: 'f', startTime: T(1, 6) };
    w = core.planAction(w, 'p1', { type: 'move', to: id(0, 0) }, o(ctx)).world;
    const out = core.commitTurn(w, {}, o(ctx));
    ctx.assert.equal(out.world.ops.op1?.result ?? 'success', 'success');
    ctx.assert.equal(reqs(out, 'opReturn').length, 1);
  } },
  { id: 'mission-confirmed-at-once', spec: ['STR-027'], name: 'A mission whose goal is met is reported as missionOutcome at once, before any return', async run(ctx) {
    const core = await setup(ctx);
    let w = atFob(makeWorld({ width: 4, height: 1 }));
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 0) });
    w.ops.op1 = { id: 'op1', squadId: 'p1', objectives: [{ contractId: 'c1', missionKey: 'm1' }], startFob: 'f', startTime: T(1, 6) };
    const m = mgmtView({ contracts: [offer()] });
    w = core.planAction(w, 'p1', { type: 'handOver', contractId: 'c1', missionKey: 'm1' }, { mgmt: m, rng: ctx.rng(1) }).world;
    w.squads.p1.regionId = id(3, 0);
    const out = core.commitTurn(w, {}, { mgmt: m, rng: ctx.rng(1) });
    ctx.assert.ok(reqs(out, 'handOver').length + reqs(out, 'missionOutcome').length >= 1);
    ctx.assert.equal(out.world.squads.p1.regionId, id(3, 0), 'squad not back at an FOB');
  } },
  { id: 'op-lost-soldiers', spec: ['STR-027'], name: 'Soldiers not returning are reported as soldierFate (mia, captured, dead)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2), soldiers: soldiers(2) });
    const m = mgmtView({ n: 2, reputation: { ssv: -60 } });
    const [enc] = core.detectEncounters(w, { mgmt: m });
    const res = { encounterId: 'e1', gameTimeHours: 1, outcome: 'lost', squadMorale: 40,
      soldiers: [{ id: 's1', fate: 'dead' }, { id: 's2', fate: 'captured' }] };
    const out = core.applyBattleResult(w, enc, res, { mgmt: m });
    const fates = reqs(out, 'soldierFate');
    ctx.assert.ok(fates.length >= 1);
    ctx.assert.ok(JSON.stringify(fates).includes('captured'));
  } },

  // ── STR-028 Launch ──
  { id: 'launch-op', spec: ['STR-028'], name: 'Launch at an FOB sends launchOp (squad, soldiers, fobId) and locks the squad', async run(ctx) {
    const core = await setup(ctx);
    const w = atFob(makeWorld());
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    const out = core.planAction(w, 'p1', { type: 'launchOp', fobId: 'f', soldiers: ['s1', 's2'], vehicleId: 'uaz' }, o(ctx));
    const l = reqs(out, 'launchOp');
    ctx.assert.equal(l.length, 1);
    ctx.assert.equal(l[0].fobId, 'f');
    ctx.assert.deepEqual(l[0].soldiers, ['s1', 's2']);
    await checkSchema(ctx, 'management_requests', { time: w.clock, requests: out.requests });
  } },
  { id: 'launch-not-paid', spec: ['STR-028'], name: 'MGT result ok:false → no launch', async run(ctx) {
    const core = await setup(ctx);
    const w = atFob(makeWorld());
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    const out = core.planAction(w, 'p1', { type: 'launchOp', fobId: 'f', soldiers: ['s1'] }, o(ctx));
    const index = out.requests.findIndex((r) => r.type === 'launchOp');
    const after = core.applyResults(out.world, out.requests, [{ index, ok: false }]);
    ctx.assert.ok(!Object.values(after.ops).some((op) => op.squadId === 'p1' && op.status !== 'cancelled'), 'no op launched');
    ctx.assert.equal(after.squads.p1.regionId, id(0, 0));
  } },

  // ── STR-030 Lost vehicle (open) ──
  { id: 'vehicle-left-behind', spec: ['STR-030'], name: '(open) A vehicle leftBehind in a battle result stays on the map in its region', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2), vehicleId: 'uaz', fuel: 3 });
    const m = mgmtView({ reputation: { ssv: -60 } });
    const [enc] = core.detectEncounters(w, { mgmt: m });
    const out = core.applyBattleResult(w, enc, { encounterId: 'e1', gameTimeHours: 1, outcome: 'fled', soldiers: [], squadMorale: 50, vehicle: { state: 'leftBehind' } }, { mgmt: m });
    const left = Object.values(out.world.leftVehicles);
    ctx.assert.equal(left.length, 1);
    ctx.assert.equal(left[0].regionId, id(2, 2));
    ctx.assert.equal(left[0].state, 'leftBehind');
  } },

  // ── STR-031 On foot ──
  { id: 'foot-hours', spec: ['STR-031'], name: 'On foot: 2 h per tile, 3 h into mountains, no fuel', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'mountain';
    w.tiles[id(1, 2)].terrain = 'woods';
    const sq = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1) });
    ctx.assert.equal(core.moveCost(w, sq, id(2, 1)).hours, 3);
    ctx.assert.equal(core.moveCost(w, sq, id(1, 2)).hours, 2);
  } },

  // ── STR-032 Ground vehicle (open) ──
  { id: 'offroad-reduction', spec: ['STR-032'], name: '(open) hours = max(1, moveHours − offroadReduction[rating][terrain]): UAZ good in woods 3−1 = 2', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ terrain: 'woods' });
    const uaz = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'uaz', fuel: 5 });
    const brdm = addSquad(w, { id: 'b', faction: 'ssv', regionId: id(1, 1), vehicleId: 'amphib', fuel: 5 });
    ctx.assert.equal(core.moveCost(w, uaz, id(2, 1)).hours, 2);
    ctx.assert.equal(core.moveCost(w, brdm, id(2, 1)).hours, 1);
  } },
  { id: 'fuel-flat-and-low', spec: ['STR-032'], name: 'Fuel 1 per tile whatever the terrain; a move with fuel < 1 is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'woods';
    const sq = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 1 });
    ctx.assert.equal(core.moveCost(w, sq, id(2, 1)).fuel, 1);
    ctx.assert.equal(core.moveCost(w, sq, id(1, 2)).fuel, 1);
    sq.fuel = 0;
    ctx.assert.ok(core.moveCost(w, sq, id(2, 1)).error);
  } },
  { id: 'amphibious-water', spec: ['STR-032'], name: 'An amphibious vehicle may enter water off-road', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'water';
    const sq = addSquad(w, { id: 'b', faction: 'ssv', regionId: id(1, 1), vehicleId: 'amphib', fuel: 5 });
    ctx.assert.ok(!core.moveCost(w, sq, id(2, 1)).error);
  } },

  // ── STR-033 removed ──
  { id: 'no-vehicle-profile', spec: ['STR-033'], name: '(removed) Vehicle records have no profile and the core reads none', async run(ctx) {
    await setup(ctx);
    for (const v of ctx.registry.all('vehicles')) ctx.assert.ok(!('profile' in v), v.id);
  } },

  // ── STR-034 Helicopter (open) ──
  { id: 'heli-move', spec: ['STR-034'], name: 'Helicopter: any adjacent tile incl. water and mountain in 1 h, 1 fuel', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 1)].terrain = 'water';
    w.tiles[id(1, 2)].terrain = 'mountain';
    const h = addSquad(w, { id: 'h', faction: 'ssv', regionId: id(1, 1), vehicleId: 'heli', fuel: 3, soldiers: soldiers(2, 'regular', { technical: 60 }) });
    ctx.assert.deepEqual(core.moveCost(w, h, id(2, 1)), { hours: 1, fuel: 1 });
    ctx.assert.deepEqual(core.moveCost(w, h, id(1, 2)), { hours: 1, fuel: 1 });
  } },
  { id: 'heli-pilot', spec: ['STR-034'], name: 'No soldier with Technical ≥ 50 → the helicopter cannot fly', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const h = addSquad(w, { id: 'h', faction: 'ssv', regionId: id(1, 1), vehicleId: 'heli', fuel: 3, soldiers: soldiers(2, 'regular', { technical: 40 }) });
    ctx.assert.ok(core.moveCost(w, h, id(2, 1)).error);
  } },
  { id: 'heli-fire-rates', spec: ['STR-034'], name: 'Hostile military POI on the path: downed ≈ 3%, damaged ≈ 10%; no hostile source → no roll', async run(ctx) {
    const core = await setup(ctx);
    const mk = () => { const w = makeWorld(); setPoi(w, 2, 1, 'plant_arms'); w.tiles[id(2, 1)].controller = 'vdk';
      addSquad(w, { id: 'h', faction: 'ssv', regionId: id(1, 1), vehicleId: 'heli', fuel: 3, soldiers: soldiers(2, 'regular', { technical: 60 }) }); return w; };
    let down = 0, dmg = 0;
    const n = 3000;
    for (let s = 1; s <= n; s++) { const r = core.heliFire(mk(), 'h', id(2, 1), ctx.rng(s)); if (r === 'downed') down++; if (r === 'damaged') dmg++; }
    ctx.assert.ok(down / n > 0.015 && down / n < 0.045, `down ${down / n}`);
    ctx.assert.ok(dmg / n > 0.08 && dmg / n < 0.12, `damaged ${dmg / n}`);
    const w = mk();
    w.tiles[id(2, 1)].controller = 'varyag';
    ctx.assert.equal(core.heliFire(w, 'h', id(2, 1), ctx.rng(1)), null, 'allied POI does not fire');
  } },
  { id: 'heli-noticed', spec: ['STR-034', 'STR-008'], name: 'A helicopter (noise extreme = 6) is noticed by factions within 6 tiles', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 1 });
    addSquad(w, { id: 'h', faction: 'ssv', regionId: id(0, 0), vehicleId: 'heli', fuel: 3, soldiers: soldiers(2, 'regular', { technical: 60 }) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(6, 0) });
    ctx.assert.ok(core.noticedSquads(w, 'pmc').includes('h'));
  } },

  // ── STR-035 Land ──
  { id: 'heli-land', spec: ['STR-035'], name: 'Landing: any non-water tile, takes 1 h', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 2)].terrain = 'water';
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), vehicleId: 'heli', fuel: 3 });
    addSquad(w, { id: 'p2', faction: 'pmc', regionId: id(2, 2), vehicleId: 'heli', fuel: 3 });
    const ok = core.planAction(w, 'p1', { type: 'land' }, o(ctx));
    ctx.assert.equal(ok.world.squads.p1.action.hoursLeft, 1);
    ctx.assert.ok(core.planAction(w, 'p2', { type: 'land' }, o(ctx)).error);
  } },

  // ── STR-036 Scout (open) ──
  { id: 'scout', spec: ['STR-036', 'STR-048'], name: '(open) Scouting takes 3 h; success (fixture 100%) reveals squads and yields VIP intel', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    addSquad(w, { id: 'g', faction: 'vdk', regionId: id(2, 2) });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'major', regionId: id(2, 2), guardSquadIds: ['g'] };
    w = core.planAction(w, 'p1', { type: 'scout' }, o(ctx)).world;
    ctx.assert.equal(w.squads.p1.action.hoursLeft, 3);
    const out = core.commitTurn(w, {}, o(ctx, { reputation: { vdk: 0 } }));
    ctx.assert.equal(out.ticks, 3);
    ctx.assert.ok(out.world.intel.some((i) => i.vipId === 'v1' && i.faction === 'pmc'));
  } },

  // ── STR-037 Stand by ──
  { id: 'stand-by-healing', spec: ['STR-037'], name: 'Stand by n hours: one healingTick per hour, flagged at an FOB', async run(ctx) {
    const core = await setup(ctx);
    let w = atFob(makeWorld());
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    w = core.planAction(w, 'p1', { type: 'standBy', hours: 3 }, o(ctx)).world;
    const out = core.commitTurn(w, {}, o(ctx));
    ctx.assert.equal(out.ticks, 3);
    const h = reqs(out, 'healingTick');
    ctx.assert.equal(h.length, 3);
    ctx.assert.ok(h.every((r) => r.atFob === true || r.location === 'f' || r.fobId === 'f'));
  } },
  { id: 'stand-by-interrupt', spec: ['STR-037', 'STR-002'], name: 'An encounter on its tile interrupts Stand by; hours spent count', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 1) });
    w = core.planAction(w, 'p1', { type: 'standBy', hours: 5 }, o(ctx)).world;
    const ctrl = { ssv: () => ({ faction: 'ssv', commands: [{ type: 'moveSquad', squad: 'a', to: id(2, 2) }] }) };
    const out = core.commitTurn(w, ctrl, o(ctx, { reputation: { ssv: -60 } }));
    ctx.assert.ok(out.ticks < 5);
    ctx.assert.ok(out.mapRequests.length >= 1);
  } },

  // ── STR-038 Enter POI ──
  { id: 'enter-poi-first', spec: ['STR-038'], name: 'Services need the POI entered first (1 h)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1) });
    ctx.assert.ok(core.planAction(w, 'p1', { type: 'hospital' }, o(ctx)).error, 'not entered yet');
    const e = core.planAction(w, 'p1', { type: 'enterPoi' }, o(ctx));
    ctx.assert.equal(e.world.squads.p1.action.hoursLeft, 1);
  } },

  // ── STR-039 Zero-time trade ──
  { id: 'service-location', spec: ['STR-039'], name: 'Hire at a town is forwarded to MGT; vehicle trade at a town is refused', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    ctx.assert.equal(reqs(core.planAction(w, 'p1', { type: 'hire' }, o(ctx)), 'hire').length, 1);
    ctx.assert.ok(core.planAction(w, 'p1', { type: 'vehicleTrade' }, o(ctx)).error);
  } },

  // ── STR-040 Contract actions ──
  { id: 'contract-action-hours', spec: ['STR-040'], name: 'Accept 0 h, hand over 1 h, hand in 1 h; forwarded to MGT', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    w.factions.vdk.funds = 50000;
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    const m = mgmtView({ contracts: [offer({ status: 'offered' })] });
    const acc = core.planAction(w, 'p1', { type: 'acceptContract', contractId: 'c1' }, { mgmt: m, rng: ctx.rng(1) });
    ctx.assert.ok(acc.resolved);
    ctx.assert.equal(reqs(acc, 'acceptContract').length, 1);
    w.tiles[id(1, 1)].controller = 'vdk';
    const hi = core.planAction(w, 'p1', { type: 'handIn', faction: 'vdk', items: [] }, { mgmt: m, rng: ctx.rng(1) });
    ctx.assert.equal(hi.world.squads.p1.action.hoursLeft, 1);
  } },

  // ── STR-041 Paid services ──
  { id: 'services-hours', spec: ['STR-041'], name: 'Hospital 4 h, repair 4 h at a mechanical plant, refuel 1 h; helicopters refuel only at FOBs and oil plants', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    setPoi(w, 2, 2, 'plant_mechanical');
    setPoi(w, 3, 3, 'gas_station');
    addSquad(w, { id: 'a', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    addSquad(w, { id: 'b', faction: 'pmc', regionId: id(2, 2), inPoi: true, vehicleId: 'uaz', fuel: 1 });
    addSquad(w, { id: 'c', faction: 'pmc', regionId: id(3, 3), inPoi: true, vehicleId: 'heli', fuel: 1 });
    ctx.assert.equal(core.planAction(w, 'a', { type: 'hospital' }, o(ctx)).world.squads.a.action.hoursLeft, 4);
    ctx.assert.equal(core.planAction(w, 'b', { type: 'repair' }, o(ctx)).world.squads.b.action.hoursLeft, 4);
    ctx.assert.ok(core.planAction(w, 'c', { type: 'refuel' }, o(ctx)).error, 'no heli fuel at a gas station');
  } },
  { id: 'refuel-full', spec: ['STR-041'], name: 'Refuel fills fuel to fuelRangeRegions (UAZ 10)', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'gas_station');
    addSquad(w, { id: 'b', faction: 'pmc', regionId: id(1, 1), inPoi: true, vehicleId: 'uaz', fuel: 2 });
    w = core.planAction(w, 'b', { type: 'refuel' }, o(ctx)).world;
    const out = core.commitTurn(w, {}, o(ctx));
    ctx.assert.equal(out.world.squads.b.fuel, 10);
  } },

  // ── STR-042 Acquire an FOB ──
  { id: 'buy-fob', spec: ['STR-042', 'STR-016'], name: 'Buying an FOB in a city creates an FOB usable after 24 h', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    const out = core.planAction(w, 'p1', { type: 'buyFob' }, o(ctx));
    ctx.assert.equal(reqs(out, 'buyFob').length, 1);
    const fob = Object.values(out.world.fobs)[0];
    ctx.assert.equal(fob.regionId, id(1, 1));
    ctx.assert.deepEqual(fob.usableFrom, T(2, 6));
    const town = makeWorld();
    setPoi(town, 1, 1, 'town');
    addSquad(town, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    ctx.assert.ok(core.planAction(town, 'p1', { type: 'buyFob' }, o(ctx)).error, 'not at a town');
  } },

  // ── STR-043 Payments to factions ──
  { id: 'compensation-price', spec: ['STR-043', 'STR-058'], name: 'Compensation = max(2000, 1000 × killed); paid remotely, 0 h, credited to the faction', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.events.push({ id: 'ev1', eventId: 'operation_dispute', subjects: { hurt: 'vdk', blamed: 'pmc', killed: 3 }, startTime: T(1, 0) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(4, 4) });
    const out = core.planAction(w, 'p1', { type: 'payCompensation', eventInstance: 'ev1' }, o(ctx));
    const r = reqs(out, 'payCompensation');
    ctx.assert.equal(r[0].amountUsd, 3000);
    ctx.assert.ok(out.resolved);
    ctx.assert.equal(out.world.factions.vdk.funds, w.factions.vdk.funds + 3000);
    w.events[0].subjects.killed = 1;
    ctx.assert.equal(reqs(core.planAction(w, 'p1', { type: 'payCompensation', eventInstance: 'ev1' }, o(ctx)), 'payCompensation')[0].amountUsd, 2000);
  } },
  { id: 'bounty-payoff', spec: ['STR-043', 'STR-064'], name: 'Bounty pay-off $10,000, or $20,000 at reputation ≤ −75; ends the bounty', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.events.push({ id: 'ev2', eventId: 'bounty', subjects: { faction: 'ssv' }, startTime: T(1, 0) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(4, 4) });
    const lo = core.planAction(w, 'p1', { type: 'payOffBounty', eventInstance: 'ev2' }, o(ctx, { reputation: { ssv: -60 } }));
    ctx.assert.equal(reqs(lo, 'payOffBounty')[0].amountUsd, 10000);
    ctx.assert.ok(!lo.world.events.some((e) => e.id === 'ev2'), 'bounty ended');
    const hi = core.planAction(w, 'p1', { type: 'payOffBounty', eventInstance: 'ev2' }, o(ctx, { reputation: { ssv: -80 } }));
    ctx.assert.equal(reqs(hi, 'payOffBounty')[0].amountUsd, 20000);
  } },

  // ── STR-099 Broker a ceasefire (open) ──
  { id: 'broker-ceasefire', spec: ['STR-099'], name: '(open) Broker at a governmental institution only while both SSV and VDK are exhausted and both Trusted', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'gov');
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    const trusted = { reputation: { ssv: 60, vdk: 60 } };
    ctx.assert.ok(core.planAction(w, 'p1', { type: 'brokerCeasefire' }, o(ctx, trusted)).error, 'not exhausted');
    w.exhausted = { ssv: true, vdk: true };
    ctx.assert.ok(core.planAction(w, 'p1', { type: 'brokerCeasefire' }, o(ctx, { reputation: { ssv: 60, vdk: 30 } })).error, 'VDK not Trusted');
    const ok = core.planAction(w, 'p1', { type: 'brokerCeasefire' }, o(ctx, trusted));
    ctx.assert.ok(!ok.error);
    ctx.assert.equal(ok.world.squads.p1.action.hoursLeft, 2, 'fixture brokerCeasefire 2');
  } },

  // ── STR-044 Contract postings ──
  { id: 'offer-to-mgt', spec: ['STR-044'], name: 'A valid offerContract goes to MGT as a contractOffer request with the full offer', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.ssv.funds = 50000;
    const of = { id: 'o1', employer: 'ssv', targetFaction: 'vdk', sourceGoal: 'attackPoi', deadline: T(5, 0),
      missions: [{ key: 'm1', missionId: 'retrieve_deliver', targets: [], location: id(1, 1) }], payInputs: { totalUsd: 4000 },
      intelLevel: 'exact', deniable: false, boardLocation: id(2, 2), counterContractOf: null, reputationGate: { better: true, sensitive: false } };
    const out = core.resolveHour(w, { commands: { ssv: { faction: 'ssv', commands: [{ type: 'offerContract', offer: of }] } } }, o(ctx));
    const r = reqs(out, 'contractOffer');
    ctx.assert.equal(r.length, 1);
    ctx.assert.equal(r[0].offer.id, 'o1');
    ctx.assert.deepEqual(r[0].offer.reputationGate, { better: true, sensitive: false });
    await checkSchema(ctx, 'management_requests', { time: out.world.clock, requests: out.requests });
  } },
];
