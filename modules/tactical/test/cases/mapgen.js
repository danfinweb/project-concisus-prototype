// Tactical map generation: TAC-086..TAC-093.
import { setup, request } from '../helpers.js';

const region = (o = {}) => ({ id: 'r1', terrain: 'steppe', biome: 'steppe', roads: [], neighbours: {}, settlement: null, crossing: false, poi: null, ...o });
const gen = (c, o = {}, seed = 21) => c.generateMap(request({ seed, region: region(o.region), exits: o.exits }));
const edgeOf = (x, y, n) => (y === 0 ? 'n' : y === n - 1 ? 's' : x === 0 ? 'w' : x === n - 1 ? 'e' : null);

export default [
  // TAC-086
  {
    id: 'tac-086-map-type-order', spec: ['TAC-086'],
    name: 'Map type: plant, then crossing, then settlement, then the tile\'s terrain',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.equal(c.mapType(region({ poi: { id: 'p', type: 'plant' }, settlement: 'town', crossing: true })), 'plant');
      ctx.assert.equal(c.mapType(region({ settlement: 'town', crossing: true })), 'crossing');
      ctx.assert.equal(c.mapType(region({ settlement: 'town' })), 'town');
      for (const s of ['smallCity', 'largeCity', 'capital']) ctx.assert.equal(c.mapType(region({ settlement: s })), 'city', s);
      ctx.assert.equal(c.mapType(region({ terrain: 'steppe' })), 'open');
      ctx.assert.equal(c.mapType(region({ terrain: 'farmland' })), 'open');
      ctx.assert.equal(c.mapType(region({ terrain: 'woods', biome: 'forest' })), 'woods');
    },
  },
  {
    id: 'tac-086-size-and-buildings', spec: ['TAC-086'],
    name: 'The type sets the square size; buildings only with a road, settlement, plant or crossing',
    async run(ctx) {
      const c = await setup(ctx);
      const open = gen(c);
      ctx.assert.equal(open.size, 80);
      ctx.assert.equal(open.tiles.length, 80);
      ctx.assert.equal(open.tiles[0].length, 80);
      ctx.assert.equal(open.buildings.length, 0, 'no road, no settlement: no buildings');
      ctx.assert.equal(gen(c, { region: { settlement: 'smallCity', biome: 'urban', terrain: 'urban' } }).size, 80, 'small city 80');
      ctx.assert.equal(gen(c, { region: { settlement: 'capital', biome: 'urban', terrain: 'urban' } }).size, 96);
    },
  },
  // TAC-087
  {
    id: 'tac-087-stage-order', spec: ['TAC-087'],
    name: 'The generator runs its nine stages in order',
    async run(ctx) {
      const c = await setup(ctx);
      ctx.assert.deepEqual(gen(c).stages, ['zones', 'water', 'roads', 'structures', 'parcels', 'groundFill', 'details', 'exits', 'checks']);
    },
  },
  {
    id: 'tac-087-roads-enter-at-edges', spec: ['TAC-087'],
    name: 'A road enters at its matching edge with its width (road = 3 tiles)',
    async run(ctx) {
      const c = await setup(ctx);
      const m = gen(c, { region: { roads: [{ kind: 'road', edges: ['n', 's'] }] } });
      const north = m.tiles[0].filter((t) => t === 'road').length;
      const south = m.tiles[m.size - 1].filter((t) => t === 'road').length;
      ctx.assert.equal(north, 3);
      ctx.assert.equal(south, 3);
    },
  },
  {
    id: 'tac-087-deep-water', spec: ['TAC-087', 'TAC-029'],
    name: 'A sea or lake neighbour makes a shore; water beyond deepFromShoreTiles is deep',
    async run(ctx) {
      const c = await setup(ctx);
      const m = gen(c, { region: { neighbours: { n: 'water' } } });
      ctx.assert.equal(m.tiles[0][Math.floor(m.size / 2)], 'deepWater', 'the far edge of the water is deep');
      ctx.assert.ok(m.tiles.flat().includes('shallowWater'), 'a shallow strip along the shore');
    },
  },
  {
    id: 'tac-087-exits-and-deployment', spec: ['TAC-087', 'TAC-038'],
    name: 'Exits on the map edge at least 20 tiles apart; player zone on the approach edge',
    async run(ctx) {
      const c = await setup(ctx);
      const m = gen(c, { region: { approachSide: 's', roads: [{ kind: 'track', edges: ['s', 'e'] }] } });
      for (const e of m.exits) for (const [x, y] of e.tiles) ctx.assert.ok(edgeOf(x, y, m.size), `exit ${e.id} tile on the edge`);
      const centre = (e) => e.tiles.reduce(([sx, sy], [x, y]) => [sx + x / e.tiles.length, sy + y / e.tiles.length], [0, 0]);
      for (let i = 0; i < m.exits.length; i++) for (let j = i + 1; j < m.exits.length; j++) {
        const [ax, ay] = centre(m.exits[i]); const [bx, by] = centre(m.exits[j]);
        ctx.assert.ok(Math.max(Math.abs(ax - bx), Math.abs(ay - by)) >= 20, 'exit spacing');
      }
      ctx.assert.ok(m.deployment.player.every(([, y]) => y >= m.size / 2), 'player zone in the southern half');
      ctx.assert.ok(m.exits.some((e) => e.condition === 'fuel'), 'a road exit needs vehicle fuel');
    },
  },
  // TAC-088
  {
    id: 'tac-088-levels-and-doors', spec: ['TAC-088', 'TAC-084'],
    name: 'Large buildings have a playable roof; interior doors are never locked',
    async run(ctx) {
      const c = await setup(ctx);
      const m = gen(c, { region: { settlement: 'largeCity', biome: 'urban', terrain: 'urban', roads: [{ kind: 'road', edges: ['w', 'e'] }] } });
      ctx.assert.ok(m.buildings.length > 0);
      const large = ['apartment', 'khrushchyovka', 'office', 'school', 'hospital', 'landmark', 'warehouse', 'plantHall'];
      for (const bld of m.buildings) {
        ctx.assert.ok(bld.levels.includes('ground'), `${bld.kind} has a ground floor`);
        ctx.assert.equal(bld.levels.includes('roof'), large.includes(bld.kind), `${bld.kind}: roof playable only if large`);
        ctx.assert.equal(bld.levels.includes('second'), false, 'second floor is optional, not built');
      }
      const interiorLocked = m.edges.filter((e) => e.kind === 'door' && e.interior && e.locked);
      ctx.assert.equal(interiorLocked.length, 0);
    },
  },
  // TAC-089
  {
    id: 'tac-089-required-checks', spec: ['TAC-089'],
    name: 'Generated maps pass the required checks (2–4 exits, connected zones and exits, enterable buildings)',
    async run(ctx) {
      const c = await setup(ctx);
      for (const seed of [1, 2, 3, 4, 5]) {
        const m = gen(c, { region: { roads: [{ kind: 'road', edges: ['n', 's'] }] } }, seed);
        ctx.assert.ok(m.attempts >= 1 && m.attempts <= 6, `seed ${seed}: attempts ${m.attempts}`);
        ctx.assert.equal(m.checks.required.ok, true, `seed ${seed}: ${JSON.stringify(m.checks.required.failed)}`);
        ctx.assert.ok(Array.isArray(m.checks.reported), 'reported checks are logged');
      }
    },
  },
  {
    id: 'tac-089-check-detects-failure', spec: ['TAC-089'],
    name: 'checkMap fails a layout whose exit is walled off',
    async run(ctx) {
      const c = await setup(ctx);
      const m = gen(c);
      const exitTiles = m.exits[0].tiles;
      const isExit = (x, y) => exitTiles.some(([ex, ey]) => ex === x && ey === y);
      const nearExit = (x, y) => exitTiles.some(([ex, ey]) => Math.max(Math.abs(x - ex), Math.abs(y - ey)) <= 2);
      const walled = { ...m, tiles: m.tiles.map((row, y) => row.map((t, x) => (nearExit(x, y) && !isExit(x, y) ? 'rock' : t))) };
      const r = c.checkMap(walled);
      ctx.assert.equal(r.required.ok, false);
      ctx.assert.ok(r.required.failed.includes('connected'));
    },
  },
  // TAC-090..TAC-092 (optional)
  {
    id: 'tac-090-092-optional-not-built', spec: ['TAC-090', 'TAC-091', 'TAC-092'],
    name: '(optional) No tall crops, no loot containers, no landmarks in the first build',
    async run(ctx) {
      const c = await setup(ctx);
      const farm = gen(c, { region: { terrain: 'farmland', roads: [{ kind: 'track', edges: ['w', 'e'] }] } });
      ctx.assert.equal(farm.tiles.flat().some((t) => t === 'tallCrops'), false);
      ctx.assert.equal((farm.containers || []).length, 0);
      const city = gen(c, { region: { settlement: 'largeCity', biome: 'urban', terrain: 'urban' } });
      ctx.assert.equal(city.buildings.some((b) => b.kind === 'landmark'), false);
    },
  },
  // TAC-093
  {
    id: 'tac-093-stage-streams', spec: ['TAC-093'],
    name: 'One random stream per stage from the map seed: drawing from one stage never shifts another',
    async run(ctx) {
      const c = await setup(ctx);
      const a = c.stageStreams(77); const b = c.stageStreams(77);
      for (let i = 0; i < 50; i++) a.water.next();
      ctx.assert.equal(a.roads.next(), b.roads.next());
      ctx.assert.equal(a.groundFill.next(), b.groundFill.next());
      ctx.assert.notEqual(c.stageStreams(78).roads.next(), c.stageStreams(77).roads.next());
    },
  },
];
