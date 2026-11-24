// Management-owned slices: roster, unlocks, economy, contracts, reputation (one plain object each).
// Public functions copy the state first and never change their input.
import { allFactions, rules } from './data.js';

export const clone = (state) => structuredClone(state);

// MGT-053: every non-player faction starts at repStart; MGT-066: one stash per FOB.
export function newCampaign({ seed = 1, balanceUsd = 0, reputation = {}, fobs = [] } = {}) {
  const rep = {};
  for (const f of allFactions()) if (f.kind !== 'player') rep[f.id] = clampRep(reputation[f.id] ?? rules('repStart'));
  const fobMap = {};
  for (const id of fobs) fobMap[id] = { stash: {} };
  return {
    seed,
    roster: { soldiers: [], memorial: [], nextId: 1, nextServiceNumber: 1, presets: {} },
    unlocks: { fobs: fobMap, ops: {}, recoveries: [], priceModifiers: [], nextInstance: 1 },
    economy: { balanceUsd, debts: [], ledger: [] },
    contracts: { list: [], publishedEnded: [] },
    reputation: rep,
  };
}

export function clampRep(v) { return Math.max(rules('repMin'), Math.min(rules('repMax'), v)); }
export const clampMorale = (v) => Math.max(0, Math.min(100, v)); // morale is a 0..100 scale (MGT-008)

// ── Accessors (copies, so callers can't change state behind the owner's back) ──
export const findSoldier = (st, id) => st.roster.soldiers.find((s) => s.id === id);
export const soldier = (st, id) => { const s = findSoldier(st, id); return s && structuredClone(s); };
export const roster = (st) => structuredClone(st.roster.soldiers);
export const memorial = (st) => structuredClone(st.roster.memorial);
export const balance = (st) => st.economy.balanceUsd;
export const ledger = (st) => structuredClone(st.economy.ledger);
export const debts = (st) => structuredClone(st.economy.debts);
export const contract = (st, id) => { const c = st.contracts.list.find((x) => x.id === id); return c && structuredClone(c); };
export const reputation = (st, factionId) => st.reputation[factionId];
export const stashCount = (st, fobId, itemId) => st.unlocks.fobs[fobId]?.stash[itemId] ?? 0;

function deepFreeze(o) {
  if (o && typeof o === 'object') { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
}
// MGT-007: read-only view of one soldier's record.
export const dossier = (st, id) => deepFreeze(soldier(st, id));

// ── Stash helpers (mutate the given, already copied state) ──
export function ensureFob(st, fobId) { st.unlocks.fobs[fobId] ??= { stash: {} }; return st.unlocks.fobs[fobId]; }
export function stashAdd(st, fobId, itemId, count = 1) {
  const s = ensureFob(st, fobId).stash;
  s[itemId] = (s[itemId] ?? 0) + count;
}
export function stashTake(st, fobId, itemId) {
  const s = st.unlocks.fobs[fobId]?.stash;
  if (!s || !s[itemId]) return false;
  s[itemId] -= 1;
  if (s[itemId] === 0) delete s[itemId];
  return true;
}
export function newInstanceId(st) { return `i${st.unlocks.nextInstance++}`; }
