// Tests for shared/ (owned by the root session). Run in the Test Lab: tools/test-lab/?module=shared
import { Rng, hashSeed } from '../rng.js';
import { createStore, loadStore, OWNERS, SAVE_VERSION } from '../state.js';
import { validate } from '../schema.js';

export default {
  module: 'shared',
  scenarios: [
    {
      id: 'rng-repeatable', name: 'rng: the same seed gives the same sequence',
      run({ assert }) {
        const a = new Rng(4812), b = new Rng(4812);
        assert.deepEqual([a.next(), a.int(1, 6), a.roll(50)], [b.next(), b.int(1, 6), b.roll(50)]);
        assert.notEqual(new Rng(1).next(), new Rng(2).next());
        assert.equal(hashSeed('battle', 6), hashSeed('battle', 6));
      },
    },
    {
      id: 'registry-fixtures', name: 'registry: loads fixtures, freezes them, reads by ID',
      async run({ assert, loadFixtures, registry }) {
        await loadFixtures(['items']);
        assert.equal(registry.get('items', 'ak74m').name, 'AK-74M');
        assert.equal(registry.all('items').length, 2);
        assert.ok(Object.isFrozen(registry.get('items', 'ak74m')));
        assert.throws(() => registry.get('presets', 'x'), 'unloaded table throws');
      },
    },
    {
      id: 'registry-data', name: 'registry: every table listed in data/tables.json loads from /data',
      async run({ assert, registry }) {
        const tables = await (await fetch(new URL('../../data/tables.json', import.meta.url))).json();
        const names = Object.keys(tables).filter((k) => !k.startsWith('$'));
        await registry.loadData(names);
        assert.deepEqual(registry.loaded().sort(), names.sort());
      },
    },
    {
      id: 'state-ownership', name: 'state: only the owning module writes a slice',
      run({ assert }) {
        const s = createStore();
        s.write('tactical', 'battle', { turn: 1 });
        assert.deepEqual(s.read('battle'), { turn: 1 });
        assert.throws(() => s.write('strategic', 'battle', {}), 'non-owner write throws');
        assert.throws(() => s.read('nope'), 'unknown slice throws');
        const copy = s.read('battle'); copy.turn = 99;
        assert.equal(s.read('battle').turn, 1, 'reads are copies');
        assert.equal(OWNERS.roster, 'management');
      },
    },
    {
      id: 'state-save', name: 'state: save and load round-trip, newer versions refused',
      run({ assert }) {
        const s = createStore();
        s.write('strategic', 'world', { seed: 7, rulesVersion: '0.1.0' });
        const t = loadStore(s.serialize({ hour: 3 }));
        assert.deepEqual(t.read('world'), { seed: 7, rulesVersion: '0.1.0' });
        assert.throws(() => loadStore(JSON.stringify({ v: SAVE_VERSION + 1, slices: {} })));
      },
    },
    {
      id: 'schema-validator', name: 'schema: types, required, ranges, enums, ID references',
      run({ assert }) {
        const schema = {
          type: 'object', required: ['id', 'ap'],
          properties: { id: { type: 'string' }, ap: { type: 'integer', minimum: 25, maximum: 35 },
                        mode: { enum: ['1', 'auto'] }, calibre: { type: 'string', 'x-ref': 'calibres' } },
          additionalProperties: false,
        };
        assert.deepEqual(validate(schema, { id: 'a', ap: 30, mode: 'auto' }), []);
        const errs = validate(schema, { id: 1, ap: 40, mode: 'x', extra: true });
        assert.equal(errs.length, 4);
        assert.equal(validate(schema, { id: 'a' })[0].message, 'missing required "ap"');
        const refs = [];
        validate(schema, { id: 'a', ap: 30, calibre: '545x39' }, { refs });
        assert.deepEqual(refs, [{ path: '/calibre', table: 'calibres', id: '545x39' }]);
      },
    },
  ],
};
