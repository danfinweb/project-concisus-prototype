// Strategic Layer — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// Example (tactical): { id: 'duel', run: (core, data, seed, p) => core.resolveBattle(/* … */),
//                       params: { attackerPreset: ['rifleman'], terrain: ['open', 'urban'] },
//                       metrics: ['winner', 'turns', 'casualties'], seeds: 200 }
//
// The AI controllers here are stand-ins written against strategic_commands (the real ones live in
// modules/strategic-ai and are never imported). A "drift" controller sends every idle squad one step
// toward the nearest tile its faction does not control and attacks what it meets.
import { Rng } from '../../../shared/rng.js';

const idleSquads = (view) => (view.ownSquads ?? []).filter((s) => !s.transit);

function driftController(faction, rng) {
  return (view) => {
    const commands = [];
    for (const s of idleSquads(view)) {
      const here = (view.knownRegions ?? []).find((r) => r.id === s.regionId);
      const next = here?.neighbours?.length ? rng.pick(here.neighbours) : null;
      commands.push(next ? { type: 'moveSquad', squad: s.id, to: next } : { type: 'hold', squad: s.id });
    }
    return { faction, commands: commands.length ? commands : [{ type: 'pass' }] };
  };
}

const passController = (faction) => () => ({ faction, commands: [{ type: 'pass' }] });

// Run whole days with only AI factions; the player squad stands by at its FOB.
function runDays(core, seed, days, controllerKind) {
  const rng = new Rng(seed);
  let world = core.generateMap(seed, {});
  const factions = ['ssv', 'vdk', 'varyag', 'aegis', 'krug'];
  const controllers = {};
  for (const f of factions) controllers[f] = controllerKind === 'drift' ? driftController(f, rng.fork(f.length)) : passController(f);
  const fob = Object.values(world.fobs).find((f) => f.owner === 'pmc');
  world.squads.player = { id: 'player', faction: 'pmc', regionId: fob.regionId, vehicleId: null, soldiers: [{ id: 's1' }],
    supplies: 0, fuel: 0, morale: 70, goal: null, transit: null, action: { type: 'standBy', hoursLeft: days * 24 } };
  const mgmt = { time: world.clock, roster: [{ id: 's1', status: 'active', rank: 'regular', morale: 70, attributes: {}, nerve: 50, wounds: [], equipment: {}, perks: [] }],
    reputation: Object.fromEntries(factions.map((f) => [f, { value: 0, standing: 'neutral' }])), contracts: [], funds: { balanceUsd: 0, debtsUsd: 0 } };
  let fights = 0, events = 0;
  for (let h = 0; h < days * 24; h++) {
    const commands = {};
    for (const f of factions) commands[f] = controllers[f](core.factionView(world, f, { mgmt }));
    const out = core.resolveHour(world, { commands }, { mgmt, rng });
    fights += (out.encounters ?? []).filter((e) => e.hostile).length;
    world = out.world;
    events = Math.max(events, world.events.length);
  }
  const tiles = Object.values(world.tiles);
  const share = (f) => tiles.filter((t) => t.controller === f).length / tiles.length;
  return { world, fights, maxConcurrentEvents: events, ssvShare: share('ssv'), vdkShare: share('vdk') };
}

export default {
  module: 'strategic',
  sims: [
    {
      id: 'mapgen-validity', spec: ['STR-082', 'STR-091'], name: 'Generated maps: validity, attempts and key counts',
      run(core, data, seed) {
        const w = core.generateMap(seed, {});
        const tiles = Object.values(w.tiles);
        return {
          valid: core.validateMap(w).ok ? 1 : 0,
          frontTiles: core.frontTiles(w).length,
          waterShare: tiles.filter((t) => t.terrain === 'water').length / tiles.length,
          roadTiles: tiles.filter((t) => t.road).length,
          ssvShare: tiles.filter((t) => t.controller === 'ssv').length / tiles.length,
        };
      },
      params: {}, metrics: ['valid', 'frontTiles', 'waterShare', 'roadTiles', 'ssvShare'], seeds: 100,
    },
    {
      id: 'idle-economy', spec: ['STR-092', 'STR-014', 'STR-007'], name: 'AI faction funds after N days with passive controllers',
      run(core, data, seed, p) {
        const { world } = runDays(core, seed, p.days, 'pass');
        return { ssvFunds: world.factions.ssv.funds, vdkFunds: world.factions.vdk.funds, krugFunds: world.factions.krug.funds };
      },
      params: { days: [7, 30] }, metrics: ['ssvFunds', 'vdkFunds', 'krugFunds'], seeds: 20,
    },
    {
      id: 'front-drift', spec: ['STR-020', 'STR-022', 'STR-026', 'STR-059'], name: 'Drift controllers: fights per day, territory shift, event load',
      run(core, data, seed, p) {
        const r = runDays(core, seed, p.days, 'drift');
        return { fightsPerDay: r.fights / p.days, ssvShare: r.ssvShare, vdkShare: r.vdkShare, maxConcurrentEvents: r.maxConcurrentEvents };
      },
      params: { days: [3, 10] }, metrics: ['fightsPerDay', 'ssvShare', 'vdkShare', 'maxConcurrentEvents'], seeds: 20,
    },
    {
      id: 'auto-resolve-balance', spec: ['STR-026'], name: 'Off-screen fight win rate and losses by strength ratio and terrain',
      run(core, data, seed, p) {
        const rng = new Rng(seed);
        const sol = (n) => Array.from({ length: n }, (_, i) => ({ id: `x${i}`, rank: 'regular', hp: 100, morale: 70 }));
        const w = core.generateMap(1, {});
        const tile = Object.values(w.tiles).find((t) => t.terrain === p.terrain && !t.poi);
        tile.controller = 'vdk';
        w.squads = {
          a: { id: 'a', faction: 'ssv', regionId: tile.id, vehicleId: null, soldiers: sol(p.attackers), gearTier: 1, supplies: 0, fuel: 0, morale: 70, goal: null, transit: null, action: null },
          b: { id: 'b', faction: 'vdk', regionId: tile.id, vehicleId: null, soldiers: sol(6), gearTier: 1, supplies: 0, fuel: 0, morale: 70, goal: null, transit: null, action: null },
        };
        const enc = core.detectEncounters(w, {}).find((e) => e.hostile);
        const out = core.autoResolve(w, enc, rng);
        return { attackerWins: out.winner === 'ssv' ? 1 : 0, attackerLoss: out.losses.a, defenderLoss: out.losses.b };
      },
      params: { attackers: [4, 6, 9, 12], terrain: ['steppe', 'woods'] }, metrics: ['attackerWins', 'attackerLoss', 'defenderLoss'], seeds: 200,
    },
  ],
};
