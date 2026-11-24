// STR Squads and simulation: STR-017..STR-026, STR-092..STR-094, STR-096, STR-098.
import { setup, makeWorld, addSquad, setPoi, id, T, mgmtView, reqs, soldiers, checkSchema, share } from '../helpers.js';

const cmd = (faction, ...commands) => ({ [faction]: { faction, commands } });

export default [
  // ── STR-017 Squads ──
  { id: 'squad-seats', spec: ['STR-017'], name: 'With a vehicle, soldiers ≤ seats (UAZ 4): a fifth soldier is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.fobs.f = { id: 'f', regionId: id(0, 0), owner: 'pmc' };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0) });
    const out = core.planAction(w, 'p1', { type: 'launchOp', fobId: 'f', soldiers: ['s1', 's2', 's3', 's4', 's5'], vehicleId: 'uaz' }, { mgmt: mgmtView({ n: 5 }) });
    ctx.assert.ok(out.error);
  } },
  { id: 'squad-on-foot', spec: ['STR-017', 'STR-031'], name: 'vehicleId null = on foot: no fuel use, no vehicle storage', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const sq = addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), fuel: 0 });
    const c = core.moveCost(w, sq, id(2, 1));
    ctx.assert.equal(c.fuel, 0);
    ctx.assert.equal(c.hours, 2);
  } },
  { id: 'squad-transit-shape', spec: ['STR-017', 'STR-020'], name: 'A move in progress is transit { toRegion, hoursLeft }', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld({ terrain: 'woods' });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    w = core.resolveHour(w, { commands: cmd('ssv', { type: 'moveSquad', squad: 'a', to: id(2, 1) }) }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    ctx.assert.deepEqual(w.squads.a.transit, { toRegion: id(2, 1), hoursLeft: 2 });
  } },

  // ── STR-018 Goals ──
  { id: 'goal-enum', spec: ['STR-018', 'STR-021'], name: 'setGoal accepts the seven goals; any other goal is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1) });
    const ok = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'setGoal', squad: 'a', goal: { type: 'patrol' } }] }, {});
    ctx.assert.equal(ok.accepted.length, 1);
    const bad = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'setGoal', squad: 'a', goal: { type: 'sightsee' } }] }, {});
    ctx.assert.equal(bad.rejected.length, 1);
  } },
  { id: 'goal-own-faction', spec: ['STR-018'], name: 'A faction can set goals only on its own squads', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(1, 1) });
    const r = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'setGoal', squad: 'b', goal: { type: 'patrol' } }] }, {});
    ctx.assert.equal(r.rejected.length, 1);
  } },

  // ── STR-019 Escalation (open) ──
  { id: 'escalation-validated', spec: ['STR-019'], name: '(open) Escalation commands go through normal validation: a recruit on a tile not held is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'vdk';
    const r = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'recruit', target: id(1, 1) }] }, {});
    ctx.assert.equal(r.rejected.length, 1);
  } },

  // ── STR-020 One action per squad per hour ──
  { id: 'move-origin-until-last-hour', spec: ['STR-020', 'STR-022'], name: 'A 3 h move: on the origin for 2 ticks, on the destination in the last', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld({ terrain: 'woods' });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    const o = { mgmt: mgmtView(), rng: ctx.rng(1) };
    w = core.resolveHour(w, { commands: cmd('ssv', { type: 'moveSquad', squad: 'a', to: id(2, 1) }) }, o).world;
    ctx.assert.equal(w.squads.a.regionId, id(1, 1));
    w = core.resolveHour(w, { commands: {} }, o).world;
    ctx.assert.equal(w.squads.a.regionId, id(1, 1));
    w = core.resolveHour(w, { commands: {} }, o).world;
    ctx.assert.equal(w.squads.a.regionId, id(2, 1));
    ctx.assert.equal(w.squads.a.fuel, 4, 'fuel spent on arrival');
  } },

  // ── STR-021 Controller hand-off ──
  { id: 'view-schema', spec: ['STR-021', 'STR-092'], name: 'factionView matches strategic_perception_view and shows only own funds', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.ssv.funds = 1234;
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1) });
    const v = core.factionView(w, 'ssv', { mgmt: mgmtView() });
    await checkSchema(ctx, 'strategic_perception_view', v);
    ctx.assert.ok(!JSON.stringify(v).includes('"vdk":{"funds"'), 'no other faction funds');
  } },
  { id: 'who-gets-views', spec: ['STR-021'], name: 'Views go to every non-player faction incl. resistance; never civilians or influences', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions['resistance-1'] = { funds: 20000, overdraft: 0, kind: 'resistance' };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const called = [];
    const ctrl = (f) => (v) => { called.push(f); return { faction: f, commands: [{ type: 'pass' }] }; };
    const controllers = {};
    for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug', 'resistance-1', 'civilians', 'east']) controllers[f] = ctrl(f);
    core.commitTurn(w, controllers, { mgmt: mgmtView(), rng: ctx.rng(1) });
    for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug', 'resistance-1']) ctx.assert.ok(called.includes(f), f);
    ctx.assert.ok(!called.includes('civilians') && !called.includes('east'));
  } },
  { id: 'invalid-dropped-with-reason', spec: ['STR-021'], name: 'An invalid command (move to a non-adjacent tile) is dropped with a logged reason', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(0, 0) });
    const out = core.resolveHour(w, { commands: cmd('ssv', { type: 'moveSquad', squad: 'a', to: id(3, 3) }) }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.rejected.length, 1);
    ctx.assert.ok(out.rejected[0].reason, 'has a reason');
    ctx.assert.equal(out.world.squads.a.regionId, id(0, 0));
  } },
  { id: 'one-action-first-wins', spec: ['STR-021'], name: 'One action per squad per set: a later move for the same squad is rejected, the rest stands', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1) });
    const r = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [
      { type: 'moveSquad', squad: 'a', to: id(2, 1) },
      { type: 'hold', squad: 'a' },
      { type: 'setGoal', squad: 'a', goal: { type: 'patrol' } },
    ] }, {});
    ctx.assert.equal(r.accepted.length, 2, 'move + one assignment');
    ctx.assert.equal(r.rejected.length, 1);
    ctx.assert.equal(r.rejected[0].command.type, 'hold');
  } },
  { id: 'no-action-continues', spec: ['STR-021'], name: 'A squad with no action this hour continues its move in progress', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld({ terrain: 'woods' });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5, transit: { toRegion: id(2, 1), hoursLeft: 1 } });
    w = core.resolveHour(w, { commands: cmd('ssv', { type: 'pass' }) }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    ctx.assert.equal(w.squads.a.regionId, id(2, 1));
  } },

  // ── STR-022 Encounters ──
  { id: 'encounter-hostile-ai', spec: ['STR-022', 'STR-051'], name: 'SSV and VDK (−80) on one tile → hostile, offscreen', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2) });
    addSquad(w, { id: 'c', faction: 'krug', regionId: id(3, 3) });
    const e = core.detectEncounters(w, { mgmt: mgmtView() });
    ctx.assert.equal(e.length, 1);
    ctx.assert.ok(e[0].hostile);
    ctx.assert.equal(e[0].mode, 'offscreen');
  } },
  { id: 'encounter-neutral', spec: ['STR-022'], name: 'SSV and Krug (0) on one tile → nothing happens', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'c', faction: 'krug', regionId: id(2, 2) });
    ctx.assert.ok(core.detectEncounters(w, { mgmt: mgmtView() }).every((e) => !e.hostile));
  } },
  { id: 'encounter-player-hostile', spec: ['STR-022'], name: 'Player with Hostile standing toward SSV on one tile → tactical', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    const e = core.detectEncounters(w, { mgmt: mgmtView({ reputation: { ssv: -60 } }) });
    ctx.assert.equal(e.length, 1);
    ctx.assert.ok(e[0].hostile);
    ctx.assert.equal(e[0].mode, 'tactical');
    const calm = core.detectEncounters(w, { mgmt: mgmtView({ reputation: { ssv: 10 } }) });
    ctx.assert.ok(calm.every((x) => !x.hostile));
  } },

  // ── STR-023 Tactical engagement ──
  { id: 'map-request', spec: ['STR-023', 'STR-095'], name: 'tactical_map_request carries tile terrain and its biome and matches the schema', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ terrain: 'woods' });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    const m = mgmtView({ reputation: { ssv: -60 } });
    const [enc] = core.detectEncounters(w, { mgmt: m });
    const req = core.buildMapRequest(w, enc, { mgmt: m, rng: ctx.rng(1) });
    ctx.assert.equal(req.region.terrain, 'woods');
    ctx.assert.equal(req.region.biome, 'forest');
    await checkSchema(ctx, 'tactical_map_request', req);
  } },
  { id: 'battle-takes-one-hour', spec: ['STR-023'], name: 'An engagement takes battleDurationHours (1) of strategic time however long it ran', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    const m = mgmtView({ reputation: { ssv: -60 } });
    const [enc] = core.detectEncounters(w, { mgmt: m });
    const result = { encounterId: 'e1', gameTimeHours: 1, outcome: 'won', soldiers: [], squadMorale: 60 };
    const out = core.applyBattleResult(w, enc, result, { mgmt: m });
    ctx.assert.deepEqual(out.world.clock, T(1, 7));
  } },

  // ── STR-024 Evade ──
  { id: 'evade-formula', spec: ['STR-024'], name: 'Evade = clamp(20 + bestRecon/2 + low bonus 20, 10, 90): steppe recon 40 → 40, woods → 60', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(3, 3)].terrain = 'woods';
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    addSquad(w, { id: 'p2', faction: 'pmc', regionId: id(3, 3) });
    ctx.assert.equal(core.evadeChance(w, 'p1', { mgmt: mgmtView() }), 40);
    ctx.assert.equal(core.evadeChance(w, 'p2', { mgmt: mgmtView() }), 60);
    ctx.assert.equal(core.evadeChance(w, 'p2', { mgmt: mgmtView({ extra: { recon: 100 } }) }), 90, 'clamped to max');
  } },
  { id: 'evade-rate', spec: ['STR-024'], name: 'Seeded evade rolls succeed at about the stated chance (40%)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2) });
    const m = mgmtView({ reputation: { ssv: -60 } });
    const rate = share(400, (s) => {
      const out = core.planAction(w, 'p1', { type: 'evade' }, { mgmt: m, rng: ctx.rng(s) });
      return out.world.squads.p1.evaded === true;
    });
    ctx.assert.ok(rate > 0.33 && rate < 0.47, `rate ${rate}`);
  } },

  // ── STR-025 Krug pass ──
  { id: 'krug-pass-price', spec: ['STR-025'], name: 'Krug pass = $100 × soldiers; payKrugPass request; credited to Krug funds', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'k', faction: 'krug', regionId: id(2, 2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(2, 2), soldiers: soldiers(5) });
    ctx.assert.equal(core.krugPassPrice(w, 'p1'), 500);
    const out = core.planAction(w, 'p1', { type: 'krugPass' }, { mgmt: mgmtView({ n: 5 }), rng: ctx.rng(1) });
    const r = reqs(out, 'payKrugPass');
    ctx.assert.equal(r.length, 1);
    ctx.assert.equal(r[0].amountUsd, 500);
    ctx.assert.equal(out.world.factions.krug.funds, w.factions.krug.funds + 500);
  } },

  // ── STR-026 Off-screen fights ──
  { id: 'autoresolve-odds', spec: ['STR-026'], name: 'Win chance = strengthA / (A + B): 6×2 vs 6×1 on steppe → about 2/3', async run(ctx) {
    const core = await setup(ctx);
    const rate = share(600, (s) => {
      const w = makeWorld();
      addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 2 });
      addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
      const [enc] = core.detectEncounters(w, { mgmt: mgmtView() });
      return core.autoResolve(w, enc, ctx.rng(s)).winner === 'ssv';
    });
    ctx.assert.ok(rate > 0.6 && rate < 0.73, `rate ${rate}`);
  } },
  { id: 'autoresolve-defender', spec: ['STR-026'], name: 'Defender ×1.25 in woods: equal sides, defender wins ≈ 1.25/2.25', async run(ctx) {
    const core = await setup(ctx);
    const rate = share(600, (s) => {
      const w = makeWorld({ terrain: 'woods' });
      w.tiles[id(2, 2)].controller = 'vdk';
      addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
      addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
      const [enc] = core.detectEncounters(w, { mgmt: mgmtView() });
      return core.autoResolve(w, enc, ctx.rng(s)).winner === 'vdk';
    });
    ctx.assert.ok(rate > 0.49 && rate < 0.62, `rate ${rate}`);
  } },
  { id: 'autoresolve-losses', spec: ['STR-026'], name: 'Loser loses 30–60%, winner 10–30% of soldiers; winner holds the tile', async run(ctx) {
    const core = await setup(ctx);
    for (let s = 1; s <= 50; s++) {
      const w = makeWorld();
      addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2), soldiers: soldiers(10), gearTier: 1 });
      addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(10), gearTier: 1 });
      const [enc] = core.detectEncounters(w, { mgmt: mgmtView() });
      const out = core.autoResolve(w, enc, ctx.rng(s));
      const [win, lose] = out.winner === 'ssv' ? ['a', 'b'] : ['b', 'a'];
      ctx.assert.ok(out.losses[lose] >= 3 && out.losses[lose] <= 6, `loser ${out.losses[lose]}`);
      ctx.assert.ok(out.losses[win] >= 1 && out.losses[win] <= 3, `winner ${out.losses[win]}`);
      ctx.assert.equal(out.world.tiles[id(2, 2)].controller, out.winner);
    }
  } },
  { id: 'autoresolve-seeded', spec: ['STR-026'], name: 'Same seed → same outcome', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
    const [enc] = core.detectEncounters(w, { mgmt: mgmtView() });
    ctx.assert.deepEqual(core.autoResolve(w, enc, ctx.rng(7)).losses, core.autoResolve(w, enc, ctx.rng(7)).losses);
  } },

  // ── STR-092 Faction funds ──
  { id: 'funds-hardlimit-offer', spec: ['STR-092', 'STR-044'], name: 'hardLimit: an offerContract the faction cannot fully pay is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.ssv.funds = 1000;
    const offer = { id: 'o1', employer: 'ssv', targetFaction: 'vdk', sourceGoal: 'attackPoi', deadline: T(5, 0),
      missions: [{ key: 'm1', missionId: 'retrieve_deliver', targets: [], location: id(1, 1) }], payInputs: { totalUsd: 4000 },
      intelLevel: 'exact', deniable: false, boardLocation: id(2, 2), counterContractOf: null, reputationGate: { better: false, sensitive: false } };
    const r = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'offerContract', offer }] }, {});
    ctx.assert.equal(r.rejected.length, 1);
  } },
  { id: 'funds-never-negative', spec: ['STR-092'], name: 'scoreTerm: an over-spend sets funds 0 and the rest goes to the hidden overdraft', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'ssv';
    w.factions.ssv.funds = 3000;
    w.factions.ssv.recruits = 10;
    ctx.registry.setData('economy-rules', { startFunds: {}, payIntervalHours: 24, fundsMode: 'scoreTerm' });
    w = core.resolveHour(w, { commands: cmd('ssv', { type: 'recruit', target: id(1, 1) }) }, { mgmt: mgmtView(), rng: ctx.rng(1) }).world;
    ctx.assert.equal(w.factions.ssv.funds, 0);
    ctx.assert.equal(w.factions.ssv.overdraft, 6 * 2000 - 3000);
  } },

  // ── STR-093 Contract payment ──
  { id: 'payment-due', spec: ['STR-093'], name: 'paymentDue is deducted from the employer and sent as contractPayment at the next tick', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    w.factions.vdk.funds = 10000;
    const due = { contractId: 'c1', employer: 'vdk', amountUsd: 4000 };
    const b = core.bookPaymentDue(w, due);
    ctx.assert.ok(b.ok);
    ctx.assert.equal(b.world.factions.vdk.funds, 6000);
    addSquad(b.world, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.resolveHour(b.world, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    const pay = reqs(out, 'contractPayment');
    ctx.assert.equal(pay.length, 1);
    ctx.assert.deepEqual([pay[0].contractId, pay[0].employer, pay[0].amountUsd], ['c1', 'vdk', 4000]);
    ctx.assert.ok(out.world.news.some((n) => n.type === 'payment' || /payment/i.test(n.text)));
  } },
  { id: 'payment-default', spec: ['STR-093'], name: 'Employer cannot cover → nothing deducted, contractEnded employerDefault', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.vdk.funds = 1000;
    const b = core.bookPaymentDue(w, { contractId: 'c1', employer: 'vdk', amountUsd: 4000 });
    ctx.assert.equal(b.ok, false);
    ctx.assert.equal(b.world.factions.vdk.funds, 1000);
    addSquad(b.world, { id: 'p1', faction: 'pmc', regionId: id(0, 0), action: { type: 'standBy', hoursLeft: 1 } });
    const ended = reqs(core.resolveHour(b.world, { commands: {} }, { mgmt: mgmtView(), rng: ctx.rng(1) }), 'contractEnded');
    ctx.assert.equal(ended[0].reason, 'employerDefault');
  } },
  { id: 'payment-ai-ai', spec: ['STR-093'], name: 'AI–AI contract: pay moves from employer to contractor funds inside world', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.ssv.funds = 10000;
    w.factions.varyag.funds = 0;
    w.contracts.c1 = { id: 'c1', employer: 'ssv', contractor: 'varyag', missions: [{ key: 'm1', status: 'open', pay: 3000 }] };
    const out = core.bookPaymentDue(w, { contractId: 'c1', employer: 'ssv', amountUsd: 3000, contractor: 'varyag' });
    ctx.assert.equal(out.world.factions.ssv.funds, 7000);
    ctx.assert.equal(out.world.factions.varyag.funds, 3000);
  } },
  { id: 'accept-needs-advance', spec: ['STR-093', 'STR-040'], name: 'acceptContract is rejected when the employer cannot pay the advance', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    w.factions.vdk.funds = 100;
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1) });
    const m = mgmtView({ contracts: [{ id: 'c1', employer: 'vdk', status: 'offered', pay: { advance: 1000 }, missions: [] }] });
    const out = core.planAction(w, 'p1', { type: 'acceptContract', contractId: 'c1' }, { mgmt: m });
    ctx.assert.ok(out.error);
  } },
  { id: 'rival-takes-offer', spec: ['STR-093'], name: 'A rival PMC taking an unsigned offer sends contractEnded reason taken', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.ssv.funds = 50000;
    addSquad(w, { id: 'v', faction: 'varyag', regionId: id(1, 1) });
    const m = mgmtView({ contracts: [{ id: 'c1', employer: 'ssv', status: 'offered', pay: { advance: 1000 }, missions: [] }] });
    w.contracts.c1 = { id: 'c1', employer: 'ssv', status: 'offered', advance: 1000 };
    const out = core.resolveHour(w, { commands: cmd('varyag', { type: 'acceptContract', contractId: 'c1', squads: ['v'] }) }, { mgmt: m, rng: ctx.rng(1) });
    ctx.assert.equal(reqs(out, 'contractEnded')[0]?.reason, 'taken');
  } },

  // ── STR-094 Krug escorts ──
  { id: 'escort-price', spec: ['STR-094'], name: 'Escort = (200 + 50 × tiles) × 1.5 across a front tile', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 6, height: 1 });
    const route = [id(1, 0), id(2, 0), id(3, 0)];
    ctx.assert.equal(core.krugEscortPrice(w, 'ssv', route, { mgmt: mgmtView() }), 350);
    w.tiles[id(2, 0)].controller = 'ssv';
    w.tiles[id(3, 0)].controller = 'vdk';
    ctx.assert.equal(core.krugEscortPrice(w, 'ssv', route, { mgmt: mgmtView() }), 525);
  } },
  { id: 'escort-only-krug-market', spec: ['STR-094'], name: 'A hire is allowed only on a krugMarket tile before the convoy left', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'c', faction: 'ssv', regionId: id(1, 1) });
    const out = core.requestKrugEscort(w, 'ssv', { escortFor: 'c', route: [id(2, 1)] }, { rng: ctx.rng(1), mgmt: mgmtView() });
    ctx.assert.ok(!out.requestId);
  } },
  { id: 'escort-resentment', spec: ['STR-094'], name: 'A foreign PMC request is refused outright about 20% of the time; SSV never', async run(ctx) {
    const core = await setup(ctx);
    const mk = () => { const w = makeWorld(); setPoi(w, 1, 1, 'town', { krugMarket: true });
      addSquad(w, { id: 'c', faction: 'varyag', regionId: id(1, 1) }); addSquad(w, { id: 'd', faction: 'ssv', regionId: id(1, 1) }); return w; };
    const rate = share(500, (s) => core.requestKrugEscort(mk(), 'varyag', { escortFor: 'c', route: [id(2, 1)] }, { rng: ctx.rng(s), mgmt: mgmtView() }).refused);
    ctx.assert.ok(rate > 0.15 && rate < 0.25, `rate ${rate}`);
    const ssv = share(100, (s) => core.requestKrugEscort(mk(), 'ssv', { escortFor: 'd', route: [id(2, 1)] }, { rng: ctx.rng(s), mgmt: mgmtView() }).refused);
    ctx.assert.equal(ssv, 0);
  } },
  { id: 'escort-answer', spec: ['STR-094', 'STR-021'], name: 'A pending request shows in the Krug view; answerEscort accept moves the price and assigns the squad', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'town', { krugMarket: true });
    addSquad(w, { id: 'c', faction: 'ssv', regionId: id(1, 1) });
    addSquad(w, { id: 'k', faction: 'krug', regionId: id(1, 1) });
    const r = core.requestKrugEscort(w, 'ssv', { escortFor: 'c', route: [id(2, 1)] }, { rng: ctx.rng(1), mgmt: mgmtView() });
    w = r.world;
    const v = core.factionView(w, 'krug', { mgmt: mgmtView() });
    ctx.assert.ok(v.escortRequests.some((e) => e.requestId === r.requestId));
    const before = { ssv: w.factions.ssv.funds, krug: w.factions.krug.funds };
    const out = core.resolveHour(w, { commands: cmd('krug', { type: 'answerEscort', requestId: r.requestId, accept: true, squad: 'k' }) }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    ctx.assert.equal(out.world.factions.ssv.funds, before.ssv - 250);
    ctx.assert.equal(out.world.factions.krug.funds, before.krug + 250);
    ctx.assert.equal(out.world.squads.k.escortOf, 'c');
  } },
  { id: 'escort-one-per-convoy', spec: ['STR-094'], name: 'A second request for a convoy with a pending request is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town', { krugMarket: true });
    addSquad(w, { id: 'c', faction: 'ssv', regionId: id(1, 1) });
    const a = core.requestKrugEscort(w, 'ssv', { escortFor: 'c', route: [id(2, 1)] }, { rng: ctx.rng(1), mgmt: mgmtView() });
    const b = core.requestKrugEscort(a.world, 'ssv', { escortFor: 'c', route: [id(2, 1)] }, { rng: ctx.rng(2), mgmt: mgmtView() });
    ctx.assert.ok(!b.requestId);
  } },
  { id: 'escort-player-debit', spec: ['STR-094'], name: 'Player hire: on accept Strategic sends payKrugEscort (faction krug, squad, amountUsd)', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'town', { krugMarket: true });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1) });
    addSquad(w, { id: 'k', faction: 'krug', regionId: id(1, 1) });
    let refused = true, seed = 0, r;
    while (refused) { seed++; r = core.requestKrugEscort(w, 'pmc', { escortFor: 'p1', route: [id(2, 1)] }, { rng: ctx.rng(seed), mgmt: mgmtView() }); refused = r.refused; }
    const out = core.resolveHour(r.world, { commands: cmd('krug', { type: 'answerEscort', requestId: r.requestId, accept: true, squad: 'k' }) }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    const p = reqs(out, 'payKrugEscort');
    ctx.assert.equal(p.length, 1);
    ctx.assert.equal(p[0].faction, 'krug');
    ctx.assert.equal(p[0].amountUsd, 250);
  } },

  // ── STR-096 Raising a squad ──
  { id: 'recruit-squad', spec: ['STR-096'], name: 'recruit at a held town: squadTemplate size 6, $2000 each, not ready for 12 h', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'ssv';
    w.factions.ssv.funds = 20000;
    w.factions.ssv.recruits = 10;
    const out = core.resolveHour(w, { commands: cmd('ssv', { type: 'recruit', target: id(1, 1) }) }, { mgmt: mgmtView(), rng: ctx.rng(1) });
    const fresh = Object.values(out.world.squads).filter((s) => s.faction === 'ssv');
    ctx.assert.equal(fresh.length, 1);
    ctx.assert.equal(fresh[0].soldiers.length, 6);
    ctx.assert.equal(out.world.factions.ssv.funds, 8000);
    const mv = core.validateCommands(out.world, 'ssv', { faction: 'ssv', commands: [{ type: 'moveSquad', squad: fresh[0].id, to: id(2, 1) }] }, {});
    ctx.assert.equal(mv.rejected.length, 1, 'cannot move before readyHours');
  } },
  { id: 'recruit-needs-recruits', spec: ['STR-096'], name: 'recruit is rejected when too few recruits are available', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'ssv';
    w.factions.ssv.recruits = 2;
    const r = core.validateCommands(w, 'ssv', { faction: 'ssv', commands: [{ type: 'recruit', target: id(1, 1) }] }, {});
    ctx.assert.equal(r.rejected.length, 1);
  } },

  // ── STR-098 Low-risk contract ──
  { id: 'low-risk-posted', spec: ['STR-098'], name: 'No low-risk offer open → one retrieve_deliver contractOffer from SSV/VDK/Krug, targetFaction null', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 3 });
    for (let x = 0; x < 9; x++) for (let y = 0; y < 3; y++) w.tiles[id(x, y)].controller = x < 5 ? 'ssv' : 'vdk';
    const out = core.lowRiskCheck(w, { mgmt: mgmtView(), rng: ctx.rng(3) });
    const offers = reqs(out, 'contractOffer');
    ctx.assert.equal(offers.length, 1);
    const o = offers[0].offer;
    ctx.assert.ok(['ssv', 'vdk', 'krug'].includes(o.employer));
    ctx.assert.equal(o.targetFaction, null);
    ctx.assert.equal(o.missions.length, 1);
    ctx.assert.equal(o.missions[0].missionId, 'retrieve_deliver');
    ctx.assert.equal(o.sourceGoal, 'supplyRun');
    const loc = o.missions[0].location;
    const front = core.frontTiles(w);
    ctx.assert.ok(front.every((f) => core.regionDistance(w, f, loc) >= 3), 'away from the front');
  } },
  { id: 'low-risk-skip', spec: ['STR-098'], name: 'No offer when one is already open; none when no faction can pay', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const open = mgmtView({ contracts: [{ id: 'c', employer: 'ssv', targetFaction: null, status: 'offered', missions: [{ key: 'm', missionId: 'retrieve_deliver', location: id(0, 0) }] }] });
    ctx.assert.equal(reqs(core.lowRiskCheck(w, { mgmt: open, rng: ctx.rng(1) }), 'contractOffer').length, 0);
    for (const f of ['ssv', 'vdk', 'krug']) w.factions[f].funds = 0;
    ctx.assert.equal(reqs(core.lowRiskCheck(w, { mgmt: mgmtView(), rng: ctx.rng(1) }), 'contractOffer').length, 0);
  } },
];
