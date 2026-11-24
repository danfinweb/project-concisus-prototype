// Management adapter: interface data in, core/ rules, interface data out (MGT-072, MGT-076).
//   in:  management_requests (from strategic), battle_result (from tactical)
//   out: management_requests with results, management_view (to strategic)
// It owns the slices roster, unlocks, economy, contracts and reputation in the shared store
// (shared/state.js) and writes them as 'management'. Imports: own core/, shared/, interface schemas.
import * as core from '../core/index.js';
import { validate } from '../../../shared/schema.js';
import { Rng, hashSeed } from '../../../shared/rng.js';

export const OWNER = 'management';
export const SLICES = Object.freeze(['roster', 'unlocks', 'economy', 'contracts', 'reputation']);
const SCHEMAS = ['management_requests', 'battle_result', 'management_view'];

// Interface schemas are fetched once (the adapter does IO; core never does).
export async function loadSchemas(base = new URL('../../../spec/interfaces/', import.meta.url).href) {
  const out = {};
  for (const name of SCHEMAS) {
    const res = await fetch(new URL(`${name}.schema.json`, base.endsWith('/') ? base : `${base}/`));
    if (!res.ok) throw new Error(`management adapter: ${name}.schema.json → HTTP ${res.status}`);
    out[name] = await res.json();
  }
  return out;
}

// Core state → store slices (the shape write() uses), e.g. to seed a store from a prepared campaign.
export function toSlices(st) {
  const { seed, unlocks, ...rest } = st;
  return { ...Object.fromEntries(SLICES.filter((k) => k !== 'unlocks').map((k) => [k, rest[k]])), unlocks: { ...unlocks, campaignSeed: seed } };
}

export class InterfaceError extends Error {
  constructor(name, errors) {
    super(`${name}: ${errors.slice(0, 3).map((e) => `${e.path} ${e.message}`).join('; ')}`);
    this.interface = name;
    this.errors = errors;
  }
}

export function createManagementAdapter({ store, schemas }) {
  if (!store) throw new Error('management adapter: store required');
  if (!schemas) throw new Error('management adapter: schemas required (loadSchemas())');

  const check = (name, value) => {
    const errors = validate(schemas[name], value);
    if (errors.length) throw new InterfaceError(name, errors);
    return value;
  };

  // Store slices ↔ core state. The campaign seed lives in unlocks.
  const read = () => {
    const s = Object.fromEntries(SLICES.map((k) => [k, store.read(k)]));
    if (!s.roster) throw new Error('management adapter: no campaign (call newCampaign first)');
    const { campaignSeed, ...unlocks } = s.unlocks;
    return { seed: campaignSeed, ...s, unlocks };
  };
  const write = (st) => {
    const { seed, unlocks, ...rest } = st;
    for (const k of SLICES) if (k !== 'unlocks') store.write(OWNER, k, rest[k]);
    store.write(OWNER, 'unlocks', { ...unlocks, campaignSeed: seed });
  };
  // Seeded stream per call, derived from the campaign seed, the game time and the state's counters,
  // so a replay of the same inputs from the same save gives the same rolls.
  const rngFor = (st, label, time) => new Rng(hashSeed(st.seed, label, time.day, time.hour, st.economy.ledger.length, st.contracts.list.length, st.roster.nextId, st.unlocks.recoveries.length));

  return {
    newCampaign(opts) { write(core.newCampaign(opts)); return this.view({ day: 1, hour: 0 }); },

    // management_requests → the same batch with results (MGT-076).
    handleRequests(batch) {
      check('management_requests', batch);
      const st = read();
      const { state, results } = core.applyRequests(st, { time: batch.time, requests: batch.requests }, { rng: rngFor(st, 'requests', batch.time) });
      write(state);
      return check('management_requests', { ...batch, results });
    },

    // battle_result (one engagement; it always takes one hour, TAC-003).
    handleBattleResult(result, time) {
      check('battle_result', result);
      const st = read();
      write(core.applyBattleResult(st, result, { time, rng: rngFor(st, 'battle', time) }).state);
    },

    // management_view (MGT-072): after each batch and on load.
    view(time) {
      const { view, state } = core.buildView(read(), time);
      write(state);
      return check('management_view', view);
    },

    // Read-only views for the game shell (MGT-007, MGT-012, MGT-051): plain copies of core state.
    dossier(soldierId) { return core.dossier(read(), soldierId); },
    memorial() { return core.memorial(read()); },
    board(boardLocation) { const st = read(); return core.boardOffers(st, boardLocation).map((id) => core.contract(st, id)); },
  };
}
