// STR VIPs, world events, desperate measures: STR-045..STR-081, STR-097.
import { setup, makeWorld, addSquad, setPoi, id, T, mgmtView, reqs, soldiers, share } from '../helpers.js';

const o = (ctx, extra = {}, seed = 1) => ({ mgmt: mgmtView(extra), rng: ctx.rng(seed) });
const triggers = (core, w, ctx, eventId, extra) => core.eventTriggers(w, o(ctx, extra)).filter((t) => t.eventId === eventId);
// History helper: `lostTilesOn` = days on which the faction lost tiles; fights = [{ day, opponent, outcome, lost, tile, byPlayer }].
const hist = (w, f, h) => { w.history[f] = { startRegions: 10, startKeyPlants: 2, days: [], fights: [], unpaid: [], ...h }; };

export default [
  // ── STR-045 VIP entity ──
  { id: 'vip-hidden', spec: ['STR-045'], name: 'A VIP position is hidden from a faction without intel or sight of its region', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 1 });
    addSquad(w, { id: 'g', faction: 'vdk', regionId: id(8, 0) });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'colonel', regionId: id(8, 0), guardSquadIds: ['g'] };
    addSquad(w, { id: 's', faction: 'ssv', regionId: id(0, 0) });
    const v = core.factionView(w, 'ssv', o(ctx));
    ctx.assert.ok(!(v.vips ?? []).some((x) => x.id === 'v1' && x.regionId));
  } },
  { id: 'vip-travels-with-guard', spec: ['STR-045'], name: 'A non-leader VIP moves with its guard squad', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    addSquad(w, { id: 'g', faction: 'vdk', regionId: id(1, 1), transit: { toRegion: id(2, 1), hoursLeft: 1 } });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'major', regionId: id(1, 1), guardSquadIds: ['g'] };
    w = core.resolveHour(w, { commands: {} }, o(ctx)).world;
    ctx.assert.equal(w.vips.v1.regionId, id(2, 1));
  } },

  // ── STR-046 VIP guard ──
  { id: 'vip-guard-counts', spec: ['STR-046'], name: 'Guard squads per rank: major 1, colonel 1–2, general 2, leader 3 (generated VIPs)', async run(ctx) {
    const core = await setup(ctx);
    const w = core.generateMap(11, {});
    const byRank = {};
    for (const v of Object.values(w.vips)) (byRank[v.rank] ??= []).push(v.guardSquadIds.length);
    const lim = { major: [1, 1], colonel: [1, 2], general: [2, 2], leader: [3, 3] };
    for (const [r, ns] of Object.entries(byRank)) for (const n of ns) ctx.assert.ok(n >= lim[r][0] && n <= lim[r][1], `${r} ${n}`);
    ctx.assert.ok(byRank.leader?.length >= 1, 'leaders exist');
  } },

  // ── STR-047 VIP death morale shock ──
  { id: 'vip-shock-radius', spec: ['STR-047'], name: 'Colonel dies: squads within 3 tiles lose morale by soldier rank (veteran −25); farther squads none', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 1 });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'colonel', regionId: id(0, 0), guardSquadIds: [] };
    addSquad(w, { id: 'near', faction: 'vdk', regionId: id(3, 0), soldiers: soldiers(2, 'veteran') });
    addSquad(w, { id: 'far', faction: 'vdk', regionId: id(4, 0), soldiers: soldiers(2, 'veteran') });
    const out = core.vipDeath(w, 'v1', o(ctx));
    ctx.assert.equal(out.world.squads.near.soldiers[0].morale, 70 - 25);
    ctx.assert.equal(out.world.squads.far.soldiers[0].morale, 70);
  } },
  { id: 'vip-shock-general-all', spec: ['STR-047'], name: 'General dies: every squad of the faction is reached', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 9, height: 1 });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'general', regionId: id(0, 0), guardSquadIds: [] };
    addSquad(w, { id: 'far', faction: 'vdk', regionId: id(8, 0), soldiers: soldiers(1, 'elite') });
    ctx.assert.equal(core.vipDeath(w, 'v1', o(ctx)).world.squads.far.soldiers[0].morale, 30);
  } },
  { id: 'vip-shock-player', spec: ['STR-047'], name: 'Player soldiers in range get a moraleChange request with one { soldier, delta } each', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.vips.v1 = { id: 'v1', faction: 'pmc', rank: 'major', regionId: id(1, 1), guardSquadIds: [] };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), soldiers: soldiers(2) });
    const r = reqs(core.vipDeath(w, 'v1', o(ctx, { n: 2, rank: 'recruit' })), 'moraleChange');
    ctx.assert.equal(r.length, 1);
    ctx.assert.deepEqual(r[0].moraleChanges, [{ soldier: 's1', delta: -5 }, { soldier: 's2', delta: -5 }]);
  } },

  // ── STR-048 VIP intel ──
  { id: 'vip-intel-expiry', spec: ['STR-048'], name: 'VIP intel lasts 72 h, then only the last known state remains', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    w.tiles[id(1, 1)].controller = 'ssv';
    addSquad(w, { id: 'g', faction: 'vdk', regionId: id(4, 4) });
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'major', regionId: id(4, 4), guardSquadIds: ['g'] };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    const out = core.planAction(w, 'p1', { type: 'buyIntel', vipId: 'v1', seller: 'ssv' }, o(ctx, { reputation: { ssv: 25 } }));
    const intel = out.world.intel.find((i) => i.vipId === 'v1');
    ctx.assert.deepEqual(intel.expires, T(4, 6));
    ctx.assert.equal(reqs(out, 'buyIntel')[0].amountUsd, 2000);
  } },
  { id: 'vip-intel-standing', spec: ['STR-048'], name: 'Buying intel needs standing ≥ 20 with the seller (leader ≥ 50)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city');
    w.tiles[id(1, 1)].controller = 'ssv';
    w.vips.v1 = { id: 'v1', faction: 'vdk', rank: 'leader', regionId: id(4, 4), guardSquadIds: [] };
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(1, 1), inPoi: true });
    ctx.assert.ok(core.planAction(w, 'p1', { type: 'buyIntel', vipId: 'v1', seller: 'ssv' }, o(ctx, { reputation: { ssv: 40 } })).error);
  } },

  // ── STR-049 Leader death ──
  { id: 'leader-death-dissolves', spec: ['STR-049', 'STR-007'], name: '(open) Leader death: POIs to none, capital contested, contracts end, no more actions', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'large_city');
    w.tiles[id(2, 2)].controller = 'ssv';
    w.capital = { regionId: id(2, 2), holder: 'ssv', contestedSince: null };
    w.vips.l = { id: 'l', faction: 'ssv', rank: 'leader', regionId: id(2, 2), guardSquadIds: [] };
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 1) });
    w.contracts.c1 = { id: 'c1', employer: 'ssv', status: 'signed' };
    const out = core.vipDeath(w, 'l', o(ctx));
    ctx.assert.equal(out.world.tiles[id(2, 2)].controller, 'none');
    ctx.assert.equal(out.world.capital.holder, 'none');
    ctx.assert.ok(reqs(out, 'contractEnded').some((r) => r.reason === 'factionDissolved'));
    ctx.assert.ok(!Object.values(out.world.squads).some((s) => s.faction === 'ssv'), 'squads scattered');
  } },

  // ── STR-050 Event check ──
  { id: 'event-cap', spec: ['STR-050', 'STR-070'], name: 'At most 3 events and measures run at once', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    for (let i = 0; i < 3; i++) w.events.push({ id: `e${i}`, eventId: 'chemical_leak', subjects: { plant: `x${i}` }, startTime: T(1, 0), endTime: T(9, 0) });
    setPoi(w, 2, 2, 'plant_chemical');
    w.tiles[id(2, 2)].lastFight = T(1, 5);
    w.clock = T(2, 0);
    const out = core.runDailyChecks(w, o(ctx));
    ctx.assert.equal(out.world.events.length, 3);
  } },
  { id: 'event-reverts', spec: ['STR-050'], name: 'When an event ends its temporary effects are reverted (leak hazard flag removed)', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 2, 2, 'plant_chemical');
    let out = core.startEvent(w, 'chemical_leak', { plant: id(2, 2) }, o(ctx));
    ctx.assert.ok(out.world.tiles[id(2, 2)].flags.hazard);
    w = core.endEvent(out.world, out.world.events[0].id);
    ctx.assert.ok(!w.tiles[id(2, 2)].flags.hazard);
  } },

  // ── STR-051 Relations ──
  { id: 'relations-clamp', spec: ['STR-051'], name: 'Relations clamp to −100…100; hostile ≤ −50, allied ≥ 50', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    w = core.shiftRelation(w, 'ssv', 'vdk', -50);
    ctx.assert.equal(core.relation(w, 'ssv', 'vdk'), -100);
    ctx.assert.equal(core.stance(w, 'ssv', 'vdk'), 'hostile');
    ctx.assert.equal(core.stance(w, 'ssv', 'varyag'), 'allied');
    ctx.assert.equal(core.stance(w, 'ssv', 'krug'), 'neutral');
    w = core.shiftRelation(w, 'krug', 'ssv', -50);
    ctx.assert.equal(core.stance(w, 'krug', 'ssv'), 'hostile', '−50 is hostile');
  } },

  // ── STR-052 Warning signs ──
  { id: 'warning-lead', spec: ['STR-052'], name: 'A warned event schedules warning signs 2–3 days before its start', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const out = core.startEvent(w, 'weapon_shipment', { faction: 'vdk' }, o(ctx));
    const ws = out.world.warnings.filter((x) => x.eventId === 'weapon_shipment');
    ctx.assert.ok(ws.length >= 1);
    const ev = out.world.events.find((e) => e.eventId === 'weapon_shipment');
    const lead = ev.startTime.day - ws[0].time.day;
    ctx.assert.ok(lead >= 2 && lead <= 3, `lead ${lead}`);
  } },

  // ── STR-053 Player influence ──
  { id: 'prevented-by', spec: ['STR-053'], name: 'Destroying an event\'s convoy (preventedBy) cancels the pending event', async run(ctx) {
    const core = await setup(ctx);
    let out = core.startEvent(makeWorld(), 'weapon_shipment', { faction: 'vdk' }, o(ctx));
    const convoy = Object.values(out.world.squads).find((s) => s.eventInstance);
    ctx.assert.ok(convoy, 'convoy squad on the map');
    const w = structuredClone(out.world);
    delete w.squads[convoy.id];
    const after = core.resolveHour(w, { commands: {} }, o(ctx)).world;
    ctx.assert.ok(!after.events.some((e) => e.eventId === 'weapon_shipment'));
  } },

  // ── STR-054 News feed ──
  { id: 'news-feed', spec: ['STR-054'], name: 'Event start and end each append { time, type, text, eventId } ordered by time', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    setPoi(w, 2, 2, 'plant_chemical');
    w = core.startEvent(w, 'chemical_leak', { plant: id(2, 2) }, o(ctx)).world;
    w.clock = T(3, 4);
    w = core.endEvent(w, w.events[0].id);
    const n = w.news.filter((x) => x.eventId === 'chemical_leak');
    ctx.assert.equal(n.length, 2);
    ctx.assert.ok(n.every((x) => x.time && x.type && x.text));
    ctx.assert.ok(n[0].time.day <= n[1].time.day);
  } },

  // ── STR-055 Joint assault ──
  { id: 'joint-assault', spec: ['STR-055'], name: '(open) Oil plant held by ≤ 2 squads, both PMCs idle → trigger; afterwards Varyag↔Aegis −30', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'plant_oil');
    w.tiles[id(2, 2)].controller = 'vdk';
    addSquad(w, { id: 'g', faction: 'vdk', regionId: id(2, 2) });
    addSquad(w, { id: 'v', faction: 'varyag', regionId: id(0, 0) });
    addSquad(w, { id: 'a', faction: 'aegis', regionId: id(4, 4) });
    ctx.assert.ok(triggers(core, w, ctx, 'pmc_joint_assault').length >= 1);
    const s = core.startEvent(w, 'pmc_joint_assault', { poi: id(2, 2) }, o(ctx));
    const e = core.endEvent(s.world, s.world.events[0].id);
    ctx.assert.equal(core.relation(e, 'varyag', 'aegis'), -70);
    ctx.assert.equal(core.relation(e, 'aegis', 'varyag'), -70);
  } },

  // ── STR-056 Weapon shipment ──
  { id: 'weapon-shipment', spec: ['STR-056'], name: 'Lost tiles on 3 of the last 5 days → trigger; on arrival new squads get +1 gear tier', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.clock = T(10, 0);
    hist(w, 'vdk', { lostTilesOn: [6, 8, 9] });
    ctx.assert.ok(triggers(core, w, ctx, 'weapon_shipment').some((t) => t.subjects.faction === 'vdk'));
    hist(w, 'vdk', { lostTilesOn: [3, 8, 9] });
    ctx.assert.ok(!triggers(core, w, ctx, 'weapon_shipment').some((t) => t.subjects.faction === 'vdk'));
  } },

  // ── STR-057 Rising hostility ──
  { id: 'rising-hostility', spec: ['STR-057'], name: '3 lost fights vs B in 7 days → A→B −20, recovers +2 per quiet day, ends at the old value', async run(ctx) {
    const core = await setup(ctx);
    let w = makeWorld();
    w.clock = T(10, 0);
    hist(w, 'krug', { fights: [5, 7, 9].map((d) => ({ day: d, opponent: 'ssv', outcome: 'lost', lost: 1 })) });
    ctx.assert.ok(triggers(core, w, ctx, 'rising_hostility').some((t) => t.subjects.a === 'krug' && t.subjects.b === 'ssv'));
    w = core.startEvent(w, 'rising_hostility', { a: 'krug', b: 'ssv' }, o(ctx)).world;
    ctx.assert.equal(core.relation(w, 'krug', 'ssv'), -20);
    w.clock = T(11, 0);
    w = core.runDailyChecks(w, o(ctx)).world;
    ctx.assert.equal(core.relation(w, 'krug', 'ssv'), -18);
  } },

  // ── STR-058 Operation dispute ──
  { id: 'dispute', spec: ['STR-058'], name: '(open) Hurt and blamed collapse by −40 both ways; the lowest standing toward the player is most likely to blame the PMC', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const out = core.startEvent(w, 'operation_dispute', { hurt: 'krug', blamed: 'ssv', killed: 2 }, o(ctx));
    ctx.assert.equal(core.relation(out.world, 'krug', 'ssv'), -40);
    ctx.assert.equal(core.relation(out.world, 'ssv', 'krug'), -40);
    const ev = out.world.events[0];
    const len = ev.endTime.day - ev.startTime.day;
    ctx.assert.ok(len >= 7 && len <= 14, `days ${len}`);
  } },

  // ── STR-059 Front offensive ──
  { id: 'front-tiles', spec: ['STR-059'], name: 'Front tiles are SSV/VDK tiles adjacent to a tile of the other', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 4, height: 1 });
    ['ssv', 'ssv', 'vdk', 'vdk'].forEach((c, x) => { w.tiles[id(x, 0)].controller = c; });
    ctx.assert.deepEqual(core.frontTiles(w).slice().sort(), [id(1, 0), id(2, 0)]);
  } },
  { id: 'front-offensive', spec: ['STR-059'], name: 'Soldiers in a front sector ≥ 1.5 × the enemy\'s → offensive trigger for that side', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 4, height: 1 });
    ['ssv', 'ssv', 'vdk', 'vdk'].forEach((c, x) => { w.tiles[id(x, 0)].controller = c; });
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(1, 0), soldiers: soldiers(9) });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 0), soldiers: soldiers(6) });
    ctx.assert.ok(triggers(core, w, ctx, 'front_offensive').some((t) => t.subjects.faction === 'ssv'));
    w.squads.a.soldiers = soldiers(8);
    ctx.assert.ok(!triggers(core, w, ctx, 'front_offensive').some((t) => t.subjects.faction === 'ssv'));
  } },

  // ── STR-060 Local ceasefire ──
  { id: 'local-ceasefire', spec: ['STR-060'], name: '(open) ≥ 15 losses each in an area in 3 days → ceasefire flag; SSV–VDK encounters there not hostile', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.clock = T(5, 0);
    const f = (opp) => [{ day: 4, opponent: opp, outcome: 'lost', lost: 15, tile: id(2, 2) }];
    hist(w, 'ssv', { fights: f('vdk') });
    hist(w, 'vdk', { fights: f('ssv') });
    ctx.assert.ok(triggers(core, w, ctx, 'local_ceasefire').length >= 1);
    const s = core.startEvent(w, 'local_ceasefire', { center: id(2, 2) }, o(ctx)).world;
    ctx.assert.ok(s.tiles[id(2, 4)].flags.ceasefire, 'radius 2');
    ctx.assert.ok(!s.tiles[id(2, 5)]?.flags?.ceasefire);
    addSquad(s, { id: 'a', faction: 'ssv', regionId: id(2, 2) });
    addSquad(s, { id: 'b', faction: 'vdk', regionId: id(2, 2) });
    ctx.assert.ok(core.detectEncounters(s, o(ctx)).every((e) => !e.hostile));
  } },

  // ── STR-061 Defection ──
  { id: 'defection', spec: ['STR-061'], name: 'Losing faction garrison below 25% supply: joins the last attacker (≈ 60%) or disbands (tile → none)', async run(ctx) {
    const core = await setup(ctx);
    const mk = () => { const w = makeWorld(); w.clock = T(10, 0); setPoi(w, 2, 2, 'town'); w.tiles[id(2, 2)].controller = 'vdk';
      addSquad(w, { id: 'g', faction: 'vdk', regionId: id(2, 2), supplies: 0, fullSupplies: 10, holdPoi: id(2, 2) });
      hist(w, 'vdk', { lostTilesOn: [6, 8, 9], fights: [{ day: 9, opponent: 'ssv', outcome: 'lost', lost: 1, tile: id(2, 3) }] }); return w; };
    ctx.assert.ok(triggers(core, mk(), ctx, 'defection').length >= 1);
    let joined = 0, disbanded = 0;
    for (let s = 1; s <= 300; s++) {
      const out = core.startEvent(mk(), 'defection', { squad: 'g' }, o(ctx, {}, s)).world;
      if (out.tiles[id(2, 2)].controller === 'ssv') joined++;
      else if (out.tiles[id(2, 2)].controller === 'none' && !out.squads.g) disbanded++;
    }
    ctx.assert.equal(joined + disbanded, 300);
    ctx.assert.ok(joined / 300 > 0.5 && joined / 300 < 0.7, `joined ${joined / 300}`);
  } },

  // ── STR-062 Fuel shortage ──
  { id: 'fuel-shortage', spec: ['STR-062'], name: 'Ruined oil plant → priceModifier fuel ×2; movement unchanged', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'plant_oil');
    w.tiles[id(2, 2)].poi.state = 'ruined';
    w.tiles[id(2, 2)].controller = 'ssv';
    ctx.assert.ok(triggers(core, w, ctx, 'fuel_shortage').length >= 1);
    const out = core.startEvent(w, 'fuel_shortage', { plant: id(2, 2) }, o(ctx));
    const pm = reqs(out, 'priceModifier');
    ctx.assert.equal(pm[0].target, 'fuel');
    ctx.assert.equal(pm[0].factor, 2);
    const sq = addSquad(out.world, { id: 'a', faction: 'ssv', regionId: id(1, 1), vehicleId: 'truck', fuel: 5 });
    ctx.assert.equal(core.moveCost(out.world, sq, id(1, 2)).hours, 2);
  } },

  // ── STR-063 Chemical leak ──
  { id: 'chemical-leak', spec: ['STR-063'], name: 'Fight at a chemical plant → hazard on it and its neighbours for 5 days; medical ×1.5', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'plant_chemical');
    const out = core.startEvent(w, 'chemical_leak', { plant: id(2, 2) }, o(ctx));
    for (const t of [id(2, 2), id(1, 2), id(3, 2), id(2, 1), id(2, 3)]) ctx.assert.ok(out.world.tiles[t].flags.hazard, t);
    ctx.assert.ok(!out.world.tiles[id(1, 1)].flags.hazard, 'no diagonal');
    ctx.assert.equal(reqs(out, 'priceModifier')[0].factor, 1.5);
    ctx.assert.equal(out.world.events[0].endTime.day - out.world.events[0].startTime.day, 5);
  } },

  // ── STR-064 Bounty ──
  { id: 'bounty', spec: ['STR-064'], name: 'Reputation ≤ −50 → bounty trigger; 2 hunt squads (3 at ≤ −75) plus 1 per rival PMC', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    ctx.assert.ok(triggers(core, w, ctx, 'bounty', { reputation: { ssv: -55 } }).some((t) => t.subjects.faction === 'ssv'));
    ctx.assert.ok(!triggers(core, w, ctx, 'bounty', { reputation: { ssv: -45 } }).some((t) => t.subjects.faction === 'ssv'));
    const count = (rep) => { const out = core.startEvent(makeWorld(), 'bounty', { faction: 'ssv' }, o(ctx, { reputation: { ssv: rep } }));
      return Object.values(out.world.squads).filter((s) => s.goal?.type === 'hunt' && s.goal?.target === 'pmc'); };
    const lo = count(-60), hi = count(-80);
    ctx.assert.equal(lo.filter((s) => s.faction === 'ssv').length, 2);
    ctx.assert.equal(hi.filter((s) => s.faction === 'ssv').length, 3);
    ctx.assert.equal(lo.filter((s) => s.faction === 'varyag').length, 1);
    ctx.assert.equal(lo.filter((s) => s.faction === 'aegis').length, 1);
  } },

  // ── STR-065 Refugees ──
  { id: 'refugees', spec: ['STR-065'], name: 'City changes controller → neighbouring settlements −10 loyalty toward the new controller; localRecruits at 30% lower fee', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'small_city');
    setPoi(w, 2, 3, 'town', { loyalty: { vdk: 0, ssv: 0 } });
    w.tiles[id(2, 2)].controller = 'vdk';
    const out = core.startEvent(w, 'refugee_movement', { city: id(2, 2), newController: 'vdk' }, o(ctx));
    ctx.assert.equal(out.world.tiles[id(2, 3)].loyalty.vdk, -10);
    w.clock = T(2, 0);
    const day = core.runDailyChecks(out.world, o(ctx));
    const lr = reqs(day, 'localRecruits');
    ctx.assert.ok(lr.some((r) => r.feeDiscount === 0.3 || r.params?.feeDiscount === 0.3 || r.factor === 0.7));
  } },

  // ── STR-066 Rogue PMC ──
  { id: 'rogue-pmc', spec: ['STR-066'], name: 'Varyag goes rogue: relations 0 except hostile to SSV, +20000 funds on top', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.factions.varyag.funds = 5000;
    const out = core.startEvent(w, 'rogue_pmc', { faction: 'varyag' }, o(ctx));
    ctx.assert.equal(core.relation(out.world, 'varyag', 'vdk'), 0);
    ctx.assert.ok(core.relation(out.world, 'varyag', 'ssv') <= -50);
    ctx.assert.equal(out.world.factions.varyag.funds, 25000);
    ctx.assert.ok(core.crisisSigns(out.world, 'ssv', o(ctx)).pmcRogue);
  } },

  // ── STR-067 Resistance ──
  { id: 'resistance-forms', spec: ['STR-067'], name: 'Loyalty ≤ −40 toward the controller → new resistance faction with 1–3 squads of 3–5, its own funds', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'town', { loyalty: { ssv: -45 } });
    w.tiles[id(2, 2)].controller = 'ssv';
    ctx.assert.ok(triggers(core, w, ctx, 'resistance_forms').some((t) => t.subjects.regionId === id(2, 2)));
    const out = core.startEvent(w, 'resistance_forms', { regionId: id(2, 2) }, o(ctx));
    const fid = Object.keys(out.world.factions).find((f) => f.startsWith('resistance'));
    ctx.assert.ok(fid, 'faction created');
    ctx.assert.equal(out.world.factions[fid].funds, 20000);
    const sq = Object.values(out.world.squads).filter((s) => s.faction === fid);
    ctx.assert.ok(sq.length >= 1 && sq.length <= 3);
    ctx.assert.ok(sq.every((s) => s.soldiers.length >= 3 && s.soldiers.length <= 5));
    ctx.assert.equal(core.stance(out.world, fid, 'ssv'), 'hostile');
  } },

  // ── STR-068 History ──
  { id: 'history-recorded', spec: ['STR-068'], name: 'An off-screen fight is recorded in both factions\' history with tile, outcome and losses', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(6), gearTier: 1 });
    const out = core.resolveHour(w, { commands: {} }, o(ctx)).world;
    for (const f of ['ssv', 'vdk']) {
      const fi = out.history[f].fights;
      ctx.assert.equal(fi.length, 1, f);
      ctx.assert.equal(fi[0].tile, id(2, 2));
      ctx.assert.ok(['won', 'lost'].includes(fi[0].outcome));
      ctx.assert.equal(fi[0].byPlayer, false);
    }
  } },

  // ── STR-069 Crisis signs ──
  { id: 'crisis-signs', spec: ['STR-069'], name: 'Signs from thresholds: territory < 30%, troop loss ≥ 30%, isolation ≥ 3 factions ≤ −50 (resistance excluded)', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 10, height: 1 });
    w.clock = T(10, 0);
    for (let x = 0; x < 2; x++) w.tiles[id(x, 0)].controller = 'vdk';
    hist(w, 'vdk', { startRegions: 10, days: [{ day: 3, regions: 2, soldiers: 20 }], soldiersNow: 14 });
    w.relations.varyag.vdk = -60; w.relations.ssv.vdk = -80; w.relations.krug.vdk = -55;
    const s = core.crisisSigns(w, 'vdk', o(ctx));
    ctx.assert.ok(s.littleTerritory, '2/10 < 30%');
    ctx.assert.ok(s.isolation);
    w.relations.krug.vdk = 0;
    w.factions['resistance-1'] = { funds: 0, overdraft: 0, kind: 'resistance' };
    w.relations['resistance-1'] = { vdk: -90 };
    ctx.assert.ok(!core.crisisSigns(w, 'vdk', o(ctx)).isolation, 'resistance not counted');
  } },
  { id: 'crisis-capital-threat', spec: ['STR-069'], name: 'Capital threatened: an enemy squad within 2 tiles of its capital', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 0, 0, 'large_city');
    w.tiles[id(0, 0)].controller = 'ssv';
    w.capital = { regionId: id(0, 0), holder: 'ssv', contestedSince: null };
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(1, 1) });
    ctx.assert.ok(core.crisisSigns(w, 'ssv', o(ctx)).capitalThreatened);
    w.squads.b.regionId = id(2, 1);
    ctx.assert.ok(!core.crisisSigns(w, 'ssv', o(ctx)).capitalThreatened);
  } },

  // ── STR-070 Measure selection ──
  { id: 'measures-available', spec: ['STR-070'], name: '≥ 3 signs and no measure running → matching measures available; nuclear only at ≥ 5 incl. capital threatened', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 10, height: 1 });
    w.clock = T(10, 0);
    w.tiles[id(0, 0)].controller = 'vdk';
    hist(w, 'vdk', { startRegions: 10, startKeyPlants: 2, days: [{ day: 3, regions: 5, soldiers: 20 }], soldiersNow: 10, lostTilesOn: [4, 5, 6] });
    const m = core.availableMeasures(w, 'vdk', o(ctx));
    ctx.assert.ok(m.includes('forced_conscription'));
    ctx.assert.ok(!m.includes('penal_battalions'), 'SSV only');
    ctx.assert.ok(!m.includes('nuclear_strike'));
    w.events.push({ id: 'x', eventId: 'martial_law', subjects: { faction: 'vdk' }, startTime: T(9, 0), endTime: T(19, 0) });
    ctx.assert.deepEqual(core.availableMeasures(w, 'vdk', o(ctx)).filter((x) => x !== 'nuclear_strike'), [], 'one measure at a time');
  } },
  { id: 'pick-measure', spec: ['STR-070', 'STR-021'], name: 'pickMeasure of an unavailable measure is rejected', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    const r = core.validateCommands(w, 'vdk', { faction: 'vdk', commands: [{ type: 'pickMeasure', measureId: 'forced_conscription' }] }, o(ctx));
    ctx.assert.equal(r.rejected.length, 1);
  } },

  // ── STR-071..STR-079 Measures ──
  { id: 'conscription', spec: ['STR-071'], name: '(open) Forced conscription spawns weak squads from held towns and lowers their loyalty', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town', { loyalty: { vdk: 0 } });
    w.tiles[id(1, 1)].controller = 'vdk';
    const out = core.startEvent(w, 'forced_conscription', { faction: 'vdk' }, o(ctx));
    ctx.assert.ok(Object.values(out.world.squads).filter((s) => s.faction === 'vdk').length >= 1);
    ctx.assert.ok(out.world.tiles[id(1, 1)].loyalty.vdk < 0);
  } },
  { id: 'penal', spec: ['STR-072'], name: '(open) Penal battalions (SSV only) spawn assault squads', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town');
    w.tiles[id(1, 1)].controller = 'ssv';
    const out = core.startEvent(w, 'penal_battalions', { faction: 'ssv' }, o(ctx));
    ctx.assert.ok(Object.values(out.world.squads).some((s) => s.faction === 'ssv'));
  } },
  { id: 'open-call', spec: ['STR-073'], name: '(open) Open call for help adds Aegis squads and lowers VDK loyalty', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'town', { loyalty: { vdk: 10 } });
    w.tiles[id(1, 1)].controller = 'vdk';
    const out = core.startEvent(w, 'open_call', { faction: 'vdk' }, o(ctx));
    ctx.assert.ok(Object.values(out.world.squads).some((s) => s.faction === 'aegis'));
    ctx.assert.ok(out.world.tiles[id(1, 1)].loyalty.vdk < 10);
  } },
  { id: 'paying-any-price', spec: ['STR-074'], name: '(open) Paying any price sends a ×2 pay modifier to MGT', async run(ctx) {
    const core = await setup(ctx);
    const out = core.startEvent(makeWorld(), 'paying_any_price', { faction: 'vdk' }, o(ctx));
    ctx.assert.ok(reqs(out, 'priceModifier').some((r) => r.factor === 2));
  } },
  { id: 'scorched-earth', spec: ['STR-075'], name: '(open) Scorched earth ruins plants and removes roads in held tiles with an enemy adjacent', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'plant_oil');
    w.tiles[id(2, 2)].controller = 'vdk';
    w.tiles[id(2, 2)].road = { kind: 'asphalt', to: [id(2, 1)] };
    addSquad(w, { id: 'e', faction: 'ssv', regionId: id(2, 3) });
    const out = core.startEvent(w, 'scorched_earth', { faction: 'vdk' }, o(ctx)).world;
    ctx.assert.equal(out.tiles[id(2, 2)].poi.state, 'ruined');
    ctx.assert.equal(out.tiles[id(2, 2)].road, null);
  } },
  { id: 'mining', spec: ['STR-076'], name: '(open) Mining the roads sets the mined flag on threatened tiles', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 2)].controller = 'vdk';
    w.tiles[id(2, 2)].road = { kind: 'asphalt', to: [id(2, 1)] };
    addSquad(w, { id: 'e', faction: 'ssv', regionId: id(2, 3) });
    const out = core.startEvent(w, 'mining_roads', { faction: 'vdk' }, o(ctx)).world;
    ctx.assert.ok(out.tiles[id(2, 2)].flags.mined);
  } },
  { id: 'martial-law', spec: ['STR-077'], name: '(open) Martial law sets martialLaw on every city the faction holds', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 1, 1, 'small_city'); w.tiles[id(1, 1)].controller = 'ssv';
    setPoi(w, 3, 3, 'small_city'); w.tiles[id(3, 3)].controller = 'vdk';
    const out = core.startEvent(w, 'martial_law', { faction: 'ssv' }, o(ctx)).world;
    ctx.assert.ok(out.tiles[id(1, 1)].flags.martialLaw);
    ctx.assert.ok(!out.tiles[id(3, 3)].flags.martialLaw);
  } },
  { id: 'seize-krug', spec: ['STR-078'], name: 'Seizing Krug stocks turns the Krug hostile toward the faction', async run(ctx) {
    const core = await setup(ctx);
    const out = core.startEvent(makeWorld(), 'seize_krug_stocks', { faction: 'ssv' }, o(ctx)).world;
    ctx.assert.equal(core.stance(out, 'krug', 'ssv'), 'hostile');
  } },
  { id: 'vip-strike', spec: ['STR-079'], name: 'VIP strike creates a hunt goal against a high-ranking enemy VIP', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.vips.v = { id: 'v', faction: 'vdk', rank: 'general', regionId: id(4, 4), guardSquadIds: [] };
    addSquad(w, { id: 'a', faction: 'ssv', regionId: id(0, 0) });
    const out = core.startEvent(w, 'vip_strike', { faction: 'ssv' }, o(ctx)).world;
    ctx.assert.ok(Object.values(out.squads).some((s) => s.faction === 'ssv' && s.goal?.type === 'hunt' && s.goal?.target === 'v'));
  } },

  // ── STR-080 Nuclear strike ──
  { id: 'nuke-effect', spec: ['STR-080', 'STR-097'], name: '(open) Strike: target loses every unit, POI ruined, target and neighbours contaminated; all others hostile to the striker', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    setPoi(w, 2, 2, 'small_city');
    w.tiles[id(2, 2)].controller = 'vdk';
    addSquad(w, { id: 'b', faction: 'vdk', regionId: id(2, 2) });
    const out = core.startEvent(w, 'nuclear_strike', { faction: 'ssv', target: id(2, 2), detonate: true }, o(ctx)).world;
    ctx.assert.ok(!out.squads.b);
    ctx.assert.equal(out.tiles[id(2, 2)].poi.state, 'ruined');
    for (const t of [id(2, 2), id(2, 1), id(3, 2)]) ctx.assert.equal(out.tiles[t].flags.contaminated?.until, 'permanent');
    for (const f of ['vdk', 'varyag', 'aegis', 'krug']) ctx.assert.equal(core.stance(out, f, 'ssv'), 'hostile', f);
  } },
  { id: 'nuke-veto', spec: ['STR-080'], name: 'Patron veto ≈ 50%; at most once per campaign', async run(ctx) {
    const core = await setup(ctx);
    const rate = share(300, (s) => core.startEvent(makeWorld(), 'nuclear_strike', { faction: 'ssv', target: id(2, 2) }, o(ctx, {}, s)).world.events.some((e) => e.eventId === 'nuclear_strike'));
    ctx.assert.ok(rate > 0.4 && rate < 0.6, `rate ${rate}`);
    const w = makeWorld();
    w.usedOnce = ['nuclear_strike'];
    ctx.assert.ok(!core.availableMeasures(w, 'ssv', o(ctx)).includes('nuclear_strike'));
  } },
  { id: 'contamination-hp', spec: ['STR-097'], name: 'Squads on contaminated or hazard tiles lose 2 HP per soldier per hour; player via contaminationTick', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld();
    w.tiles[id(2, 2)].flags.contaminated = { until: 'permanent' };
    w.tiles[id(3, 3)].flags.hazard = { until: T(9, 0) };
    addSquad(w, { id: 'a', faction: 'vdk', regionId: id(2, 2), soldiers: soldiers(2) });
    addSquad(w, { id: 'p1', faction: 'pmc', regionId: id(3, 3), soldiers: soldiers(2), action: { type: 'standBy', hoursLeft: 1 } });
    const out = core.resolveHour(w, { commands: {} }, o(ctx, { n: 2 }));
    ctx.assert.equal(out.world.squads.a.soldiers[0].hp, 98);
    const ct = reqs(out, 'contaminationTick');
    ctx.assert.equal(ct.length, 1);
    ctx.assert.equal(ct[0].hpLost, 2);
    ctx.assert.equal(ct[0].squad, 'p1');
  } },

  // ── STR-081 Flavour ──
  { id: 'flavour', spec: ['STR-081'], name: 'Flavour entries go only to the news feed and change no world state', async run(ctx) {
    const core = await setup(ctx);
    const w = makeWorld({ width: 20, height: 20 });
    w.clock = T(2, 0);
    let entries = 0;
    for (let s = 1; s <= 20; s++) {
      const out = core.runDailyChecks(w, o(ctx, {}, s)).world;
      const fl = out.news.filter((n) => n.type === 'flavour');
      entries += fl.length;
      ctx.assert.deepEqual(out.tiles, w.tiles);
      ctx.assert.equal(out.events.length, 0, 'not an event instance');
    }
    ctx.assert.ok(entries >= 20 * 400 * 0.005 * 0.4 && entries <= 20 * 400 * 0.005 * 1.8, `entries ${entries}`);
  } },
];
