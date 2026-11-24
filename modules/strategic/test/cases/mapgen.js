// STR Map generation: STR-082..STR-091. All run on generateMap with the fixture mapgen/strategic.json.
import { setup } from '../helpers.js';

const SEEDS = [1, 2, 3, 4, 5];
const tilesOf = (w) => Object.values(w.tiles);
const cat = (ctx, t) => (t.poi ? ctx.registry.get('poi', t.poi.type)?.category : null);

async function maps(ctx) {
  const core = await setup(ctx);
  return { core, list: SEEDS.map((s) => core.generateMap(s, {})) };
}

export default [
  { id: 'gen-deterministic', spec: ['STR-082'], name: 'Same seed → identical map; another seed → a different map', async run(ctx) {
    const core = await setup(ctx);
    ctx.assert.deepEqual(core.generateMap(7, {}).tiles, core.generateMap(7, {}).tiles);
    ctx.assert.notEqual(JSON.stringify(core.generateMap(7, {}).tiles), JSON.stringify(core.generateMap(8, {}).tiles));
  } },
  { id: 'gen-shape', spec: ['STR-082', 'STR-005'], name: 'Output is a width × height square grid (fixture 24 × 24) of single-terrain tiles', async run(ctx) {
    const { list } = await maps(ctx);
    const terrains = new Set(ctx.registry.all('strategic-terrain').map((t) => t.id));
    for (const w of list) {
      ctx.assert.equal(w.mapShape, 'square');
      ctx.assert.equal(tilesOf(w).length, 24 * 24);
      ctx.assert.ok(tilesOf(w).every((t) => terrains.has(t.terrain)));
    }
  } },
  { id: 'gen-valid', spec: ['STR-082', 'STR-091'], name: 'Every generated map passes validateMap', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) { const v = core.validateMap(w); ctx.assert.ok(v.ok, JSON.stringify(v.errors)); }
  } },
  { id: 'gen-land', spec: ['STR-083'], name: '(open) Land: steppe, woods, mountain and water all appear; rivers and lakes are water', async run(ctx) {
    const { list } = await maps(ctx);
    for (const w of list) {
      const kinds = new Set(tilesOf(w).map((t) => t.terrain));
      for (const k of ['steppe', 'woods', 'mountain', 'water']) ctx.assert.ok(kinds.has(k), k);
    }
  } },
  { id: 'gen-capital', spec: ['STR-084', 'STR-007'], name: 'One capital, a large city next to a water tile, not in mountains', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) {
      const c = w.tiles[w.capital.regionId];
      ctx.assert.equal(cat(ctx, c), 'largeCity');
      ctx.assert.ok(core.neighbours(w, c.id).some((n) => w.tiles[n].terrain === 'water'), 'by a river');
      ctx.assert.ok(['ssv', 'vdk'].includes(w.capital.holder));
      ctx.assert.equal(w.capital.holder, c.controller);
    }
  } },
  { id: 'gen-cities', spec: ['STR-085'], name: '(open) Large and small city counts from data; cities keep minSpacing (4) from each other', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) {
      const cities = tilesOf(w).filter((t) => ['largeCity', 'smallCity'].includes(cat(ctx, t)));
      ctx.assert.equal(cities.filter((t) => cat(ctx, t) === 'largeCity').length, 2 + 1, '2 + capital');
      ctx.assert.equal(cities.filter((t) => cat(ctx, t) === 'smallCity').length, 4);
      for (const a of cities) for (const b of cities) if (a !== b) ctx.assert.ok(core.regionDistance(w, a.id, b.id) >= 4);
    }
  } },
  { id: 'gen-industry', spec: ['STR-086'], name: '(open) Plants placed; at most one POI per tile; oil not on water', async run(ctx) {
    const { list } = await maps(ctx);
    for (const w of list) {
      const plants = tilesOf(w).filter((t) => cat(ctx, t) === 'plant');
      ctx.assert.ok(plants.length >= 4);
      ctx.assert.ok(plants.every((t) => t.terrain !== 'water'));
    }
  } },
  { id: 'gen-gov', spec: ['STR-087'], name: '(open) Every city and the capital have an adjacent governmental institution', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) {
      for (const c of tilesOf(w).filter((t) => ['largeCity', 'smallCity'].includes(cat(ctx, t)))) {
        ctx.assert.ok(core.neighbours(w, c.id).some((n) => cat(ctx, w.tiles[n]) === 'gov'), c.id);
      }
      ctx.assert.ok(tilesOf(w).some((t) => cat(ctx, t) === 'town'));
    }
  } },
  { id: 'gen-roads', spec: ['STR-088'], name: '(open) Roads lie on tiles; a road over water is bridge or ford; gas stations sit on asphalt', async run(ctx) {
    const { list } = await maps(ctx);
    for (const w of list) {
      for (const t of tilesOf(w)) {
        if (t.road && t.terrain === 'water') ctx.assert.ok(['bridge', 'ford'].includes(t.road.crossing), t.id);
        if (t.road) for (const n of t.road.to) ctx.assert.ok(w.tiles[n].road?.to.includes(t.id), `road symmetric ${t.id}-${n}`);
      }
      ctx.assert.ok(tilesOf(w).filter((t) => cat(ctx, t) === 'gasStation').every((t) => t.road?.kind === 'asphalt'));
    }
  } },
  { id: 'gen-war-state', spec: ['STR-089'], name: '(open) SSV and VDK split the map with a front; Krug markets only on town/city tiles in the belt', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) {
      const ctrl = new Set(tilesOf(w).map((t) => t.controller));
      ctx.assert.ok(ctrl.has('ssv') && ctrl.has('vdk'));
      const front = core.frontTiles(w);
      ctx.assert.ok(front.length > 0);
      const km = tilesOf(w).filter((t) => t.krugMarket);
      ctx.assert.equal(km.length, 2, 'fixture count 2');
      for (const t of km) ctx.assert.ok(ctx.registry.get('poi', t.poi.type).krugMarketAllowed, t.id);
    }
  } },
  { id: 'gen-start', spec: ['STR-090', 'STR-016'], name: '(open) The player\'s first FOB is ≥ startFrontDistance (4) from every front tile', async run(ctx) {
    const { core, list } = await maps(ctx);
    for (const w of list) {
      const fobs = Object.values(w.fobs).filter((f) => f.owner === 'pmc');
      ctx.assert.equal(fobs.length, 1);
      for (const f of core.frontTiles(w)) ctx.assert.ok(core.regionDistance(w, f, fobs[0].regionId) >= 4);
    }
  } },
  { id: 'gen-validate-rejects', spec: ['STR-091'], name: 'validateMap rejects a map where SSV holds no oil plant', async run(ctx) {
    const core = await setup(ctx);
    const w = structuredClone(core.generateMap(3, {}));
    for (const t of Object.values(w.tiles)) if (t.poi?.type === 'plant_oil' && t.controller === 'ssv') t.controller = 'vdk';
    ctx.assert.equal(core.validateMap(w).ok, false);
  } },
];
