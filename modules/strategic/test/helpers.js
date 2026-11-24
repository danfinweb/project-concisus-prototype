// Strategic Layer — test helpers. Builds plain `world` objects and checks interface output.
// No core logic here: these helpers only write state in the shape core must accept.
//
// ── Core API the scenarios expect (contract for /apply-spec; all named exports of ../core/index.js) ──
// Core functions never mutate their inputs; functions that change state return a new `world`.
// `opts` = { mgmt, rng } — mgmt: a management_view object (MGT-072: roster, reputation, contracts, funds);
// rng: a shared/rng.js Rng. Balancing values come from the registry (fixtures loaded by the scenario).
//
// Clock      startClock() · advanceClock(clock, hours) · formatTime(clock) → "Day D, HH:00"
// Map        neighbours(world, id) · regionDistance(world, a, b) · frontTiles(world)
// Movement   moveCost(world, squad, toId) → { hours, fuel } | { error }
// Actions    planAction(world, squadId, action, opts) → { world, requests, resolved, error? }
//              (d = 0 resolves at once; d ≥ 1 is stored on squad.action)
//            cancelAction(world, squadId) → world
//            applyResults(world, requests, results [{ index, ok, paymentDue?, ... }]) → world
//              (management_requests results, matched to the sent requests by index)
// Turn       resolveHour(world, { commands }, opts) → { world, requests, mapRequests, rejected, encounters, news }
//              commands: { factionId: strategic_commands-shaped set }; the player's planned actions are read from world
//            commitTurn(world, controllers, opts) → { world, ticks, requests, mapRequests }
//              controllers: { factionId: (view) => commandSet }
//            runDailyChecks(world, opts) → { world, requests, news }
// Fog        visibleRegions(world, faction) → ids · noticedSquads(world, faction) → squad ids
//            lastKnown(world, faction, regionId) → { time, tile } | null
// Map state  adjustLoyalty(world, regionId, faction, delta) → world · servicesAt(world, regionId) → names
// Economy    mineralMultiplier(world, faction) · dailyIncome(world, faction) · dailySupply(world, faction)
//            isSupplyShort(world, faction) · plantOutputRequests(world) → requests
// AI         factionView(world, faction, opts) → strategic_perception_view
//            validateCommands(world, faction, commandSet, opts) → { accepted, rejected [{ command, reason }] }
// Encounters detectEncounters(world, opts) → [{ regionId, sides, squadIds, hostile, mode: 'tactical'|'offscreen' }]
//            buildMapRequest(world, encounter, opts) → tactical_map_request
//            applyBattleResult(world, encounter, battleResult, opts) → { world, requests }
//            evadeChance(world, squadId, opts) → pct · krugPassPrice(world, squadId) → USD
//            autoResolve(world, encounter, rng) → { world, winner, losses { squadId: soldiers } }
// Contracts  bookPaymentDue(world, paymentDue) → { world, ok } · lowRiskCheck(world, opts) → { world, requests }
//            krugEscortPrice(world, requester, route, opts) → USD
//            requestKrugEscort(world, requester, { escortFor, route }, opts) → { world, requestId?, refused }
// Helicopter heliFire(world, squadId, toId, rng) → 'downed' | 'damaged' | 'unharmed' | null (no hostile source)
// VIPs       vipDeath(world, vipId, opts) → { world, requests } · dissolveFaction(world, faction, rng) → world
// Relations  relation(world, a, b) · shiftRelation(world, a, b, delta) → world · stance(world, a, b)
// Events     eventTriggers(world, opts) → [{ eventId, subjects }]
//            startEvent(world, eventId, subjects, opts) → { world, requests } · endEvent(world, instanceId) → world
// Crisis     crisisSigns(world, faction, opts) → { littleTerritory, areaLoss, troopLoss, resistance,
//              lowLiquidity, capitalThreatened, keyPlantsLost, isolation, pmcRogue, playerDefeats } (booleans)
//            availableMeasures(world, faction, opts) → event ids
// Mapgen     generateMap(seed, opts) → world · validateMap(world) → { ok, errors }
//
// ── world shape (STR-005, STR-017 and the sections they name) ──
// { seed, clock, mapShape, width, height,
//   tiles { 'x,y': { id, x, y, terrain, poi: null | { type, state, heldBy? }, controller,
//                    road: null | { kind, to: [ids], crossing?: 'bridge' | 'ford' },
//                    loyalty: null | { faction: n }, krugMarket, flags { name: { until } } } },
//   capital { regionId, holder, contestedSince }, factions { id: { funds, overdraft } },
//   relations { a: { b: n } }, squads { id: squad }, fobs { id: { id, regionId, owner, usableFrom } },
//   vips { id: vip }, ops { id: op }, leftVehicles { id }, events [], warnings [], news [], intel [],
//   contracts { id }, escortRequests [], history { faction: {...} }, pendingPayments [] }
// poi.heldBy: a faction holding the POI apart from the tile controller (PMC-stationed plant, STR-015).
// squad: { id, faction, regionId, vehicleId, soldiers [{ id, rank, hp, morale, recon, technical }], supplies,
//          fuel, morale, goal, transit: null | { toRegion, hoursLeft }, action: null | { type, hoursLeft, ... } }
// Player soldiers carry only { id }; their rank, morale and attributes come from opts.mgmt.roster.
// Further fields the scenarios set (test-side choices where the spec names no field; /apply-spec may
// rename them together with the tests):
//   squad.gearTier (STR-026), squad.inPoi (entered, STR-038), squad.escortOf (STR-094),
//   squad.evaded (STR-024), squad.eventInstance (event convoy, STR-053), squad.fullSupplies (STR-061)
//   factions[f].recruits (pool from recruitOutput, STR-096), factions[f].kind ('resistance' for groups)
//   tile.lastFight (STR-063), world.exhausted { faction: bool } (GEN-013, STR-099),
//   world.usedOnce [event ids] (STR-080), world.fundsMode is not used: fundsMode is read from economy-rules
//   history[f] = { startRegions, startKeyPlants, days [{ day, regions, soldiers }], soldiersNow,
//                  lostTilesOn [day], fights [{ day, opponent, outcome, lost, tile, byPlayer }], unpaid [] }

export const STR_TABLES = ['strategic-rules', 'strategic-terrain', 'poi', 'factions', 'events', 'economy-rules',
  'vehicles', 'missions', 'management-rules', 'tactical-rules', 'mapgen/strategic'];

const CORE_URL = new URL('../core/index.js', import.meta.url).href;
export async function loadCore() {
  try { return await import(CORE_URL); } catch (e) { throw new Error(`core/index.js not loadable yet: ${e.message}`); }
}

export async function setup(ctx) {
  await ctx.loadFixtures(STR_TABLES);
  return loadCore();
}

export const id = (x, y) => `${x},${y}`;
export const T = (d, h) => ({ day: d, hour: h });

// A width × height square grid of one terrain, nobody in control, Day 1 at 06:00.
export function makeWorld({ width = 5, height = 5, terrain = 'steppe', controller = 'none', seed = 1 } = {}) {
  const tiles = {};
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    tiles[id(x, y)] = { id: id(x, y), x, y, terrain, poi: null, controller, road: null, loyalty: null,
      krugMarket: false, flags: {} };
  }
  const factions = {};
  for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug']) factions[f] = { funds: 100000, overdraft: 0 };
  const relations = {
    ssv: { vdk: -80, varyag: 60, aegis: -60, krug: 0 }, vdk: { ssv: -80, varyag: -60, aegis: 60, krug: 0 },
    varyag: { ssv: 60, vdk: -60, aegis: -40, krug: 0 }, aegis: { ssv: -60, vdk: 60, varyag: -40, krug: 0 },
    krug: { ssv: 0, vdk: 0, varyag: 0, aegis: 0 },
  };
  return { seed, clock: T(1, 6), mapShape: 'square', width, height, tiles,
    capital: { regionId: null, holder: null, contestedSince: null }, factions, relations,
    squads: {}, fobs: {}, vips: {}, ops: {}, leftVehicles: {}, events: [], warnings: [], news: [], intel: [],
    contracts: {}, escortRequests: [], history: {}, pendingPayments: [] };
}

export function soldiers(n, rank = 'regular', extra = {}) {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, rank, hp: 100, morale: 70, recon: 30, technical: 30, ...extra }));
}

export function addSquad(world, sq) {
  const squad = { vehicleId: null, soldiers: soldiers(4), supplies: 0, fuel: 0, morale: 70, goal: null, transit: null,
    action: null, ...sq };
  if (squad.faction === 'pmc') squad.soldiers = squad.soldiers.map((s) => ({ id: s.id }));
  world.squads[squad.id] = squad;
  return squad;
}

export function setPoi(world, x, y, type, extra = {}) {
  const t = world.tiles[id(x, y)];
  t.poi = { type, state: 'intact' };
  Object.assign(t, extra);
  return t;
}

export function road(world, a, b, kind = 'asphalt') {
  for (const [p, q] of [[a, b], [b, a]]) {
    const t = world.tiles[p];
    t.road = t.road ?? { kind, to: [] };
    if (!t.road.to.includes(q)) t.road.to.push(q);
  }
}

// A management_view (MGT-072) with player soldiers s1..sN.
export function mgmtView({ n = 4, rank = 'regular', reputation = {}, balanceUsd = 50000, contracts = [], extra = {} } = {}) {
  const roster = Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, status: 'active', rank, morale: 70,
    attributes: { strength: 50, endurance: 50, agility: 50, marksmanship: 50, medical: 30, technical: 30, recon: 40, leadership: 30, ...extra }, nerve: 50, wounds: [], equipment: {}, perks: [] }));
  const rep = {};
  for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug']) {
    const value = reputation[f] ?? 0;
    rep[f] = { value, standing: value <= -50 ? 'hostile' : value <= -20 ? 'unfriendly' : value >= 50 ? 'trusted' : value >= 20 ? 'friendly' : 'neutral' };
  }
  return { time: T(1, 6), roster, reputation: rep, contracts, funds: { balanceUsd, debtsUsd: 0 } };
}

export const reqs = (out, type) => (out.requests ?? []).filter((r) => r.type === type);

const schemaCache = {};
export async function checkSchema(ctx, name, value) {
  if (!schemaCache[name]) {
    const url = new URL(`../../../spec/interfaces/${name}.schema.json`, import.meta.url).href;
    schemaCache[name] = await (await fetch(url)).json();
  }
  const { validate } = await import(new URL('../../../shared/schema.js', import.meta.url).href);
  const errors = validate(schemaCache[name], value);
  ctx.assert.equal(errors.length, 0, `${name}: ${JSON.stringify(errors.slice(0, 3))}`);
}

// Run `fn(seed)` for many seeds and return the share that returned true.
export function share(n, fn) {
  let hits = 0;
  for (let s = 1; s <= n; s++) if (fn(s)) hits++;
  return hits / n;
}
