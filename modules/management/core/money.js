// Economy ledger, prices and purchases (MGT-036..MGT-040, MGT-066, MGT-067, MGT-070, MGT-071, MGT-076).
import { rules, traderData, item, krugFaction, CONDITION_MAX } from './data.js';
import { clone, ensureFob, stashAdd } from './state.js';
import { standing } from './reputation.js';

// ── Ledger (MGT-070): never below zero; every booking logged with game time ──
export function credit(st, amountUsd, kind, time, extra = {}) {
  st.economy.balanceUsd += amountUsd;
  st.economy.ledger.push({ time, amountUsd, kind, ...extra });
}
export function debit(st, amountUsd, kind, time, extra = {}) {
  if (amountUsd > st.economy.balanceUsd) return false;
  st.economy.balanceUsd -= amountUsd;
  st.economy.ledger.push({ time, amountUsd: -amountUsd, kind, ...extra });
  return true;
}

// ── Price modifiers (MGT-076 priceModifier): fuel → fuel prices, medical → hospital and medical items ──
const SERVICE_TARGET = { fuel: 'fuel', hospital: 'medical' };
function modifierFactor(st, target, region) {
  let f = 1;
  for (const m of st.unlocks.priceModifiers) {
    if (m.target === target && (!m.regions || (region != null && m.regions.includes(region)))) f *= m.factor;
  }
  return f;
}
export function setPriceModifier(st, { modifierId, target, factor, regions }) {
  st.unlocks.priceModifiers = st.unlocks.priceModifiers.filter((m) => m.modifierId !== modifierId);
  if (factor !== 1) st.unlocks.priceModifiers.push({ modifierId, target, factor, ...(regions ? { regions: [...regions] } : {}) });
}

// ── Paid field services (MGT-067) ──
const SERVICE_PRICE_KEY = { hospital: 'hospitalPerWoundUsd', repair: 'repairPerConditionPointUsd', fuel: 'fuelPerUnitUsd' };
export function servicePrice(st, kind, quantity, region) {
  const unit = rules('servicePrices')[SERVICE_PRICE_KEY[kind]];
  const target = SERVICE_TARGET[kind];
  return Math.round(unit * quantity * (target ? modifierFactor(st, target, region) : 1));
}
export function buyService(state, { kind, quantity, region }, { time }) {
  const st = clone(state);
  const priceUsd = servicePrice(st, kind, quantity, region);
  if (!debit(st, priceUsd, kind, time)) return { state, ok: false, priceUsd };
  return { state: st, ok: true, priceUsd };
}
// MGT-067 / DAT-014: field repair by a soldier; Armourer perk × repairFactor.
export function fieldRepairCondition(condition, technical, hours, perks = []) {
  const rate = rules('weaponRepair').conditionPerHourPer10Technical;
  const armourer = (rules('perks') ?? []).find((p) => p.effect?.repairFactor && perks.includes(p.id));
  const gain = rate * Math.floor(technical / 10) * hours * (armourer ? armourer.effect.repairFactor : 1);
  return Math.min(CONDITION_MAX, condition + gain);
}

// ── FOBs (MGT-066) and the scav loadout (MGT-038) ──
export const fobPrice = (size) => rules('fobPrices')[size];
export function buyFob(state, { fobId, size }, { time }) {
  const st = clone(state);
  if (!debit(st, fobPrice(size), 'buyFob', time, { fobId })) return { state, ok: false };
  ensureFob(st, fobId);
  return { state: st, ok: true };
}
export function buyScavLoadout(state, fobId, { time }) {
  const st = clone(state);
  const scav = rules('scavLoadout');
  if (!debit(st, scav.priceUsd, 'scavLoadout', time, { fobId })) return { state, ok: false };
  for (const { item: id, count = 1 } of scav.items) stashAdd(st, fobId, id, count);
  return { state: st, ok: true };
}

// ── Faction traders (MGT-039, MGT-055) ──
const STOCK_BY_STANDING = { hostile: [], unfriendly: ['basic'], neutral: ['basic'], friendly: ['basic', 'military'], trusted: ['basic', 'military', 'best'] };
export function traderPrice(st, traderId, itemId) {
  const t = traderData('traders').find((x) => x.id === traderId);
  if (!t) return null;
  const s = standing(st.reputation[t.faction] ?? 0);
  const allowed = STOCK_BY_STANDING[s].some((tier) => t.stockByStanding?.[tier]?.includes(itemId));
  if (!allowed) return null;
  const base = item(itemId).valueUsd;
  return s === 'unfriendly' ? base * (1 + rules('unfriendlyPriceMarkup')) : base;
}

// ── Krug market prices (MGT-040) ──
export function krugPriceStep(current, base, rng) {
  const f = traderData('krugPriceFluctuation');
  const moved = current * (1 + (rng.next() * 2 - 1) * f.dailyMaxChange);
  return Math.min(base * (1 + f.maxDeviation), Math.max(base * (1 - f.maxDeviation), moved));
}
export const krugPlayerPrice = (price) => price * (1 + (krugFaction()?.resentment?.priceMarkup ?? 0));

// ── Insurance premium (MGT-036): share of the insured items' valueUsd ──
export function insurancePremium(itemIds) {
  const total = itemIds.reduce((a, id) => a + (item(id)?.valueUsd ?? 0), 0);
  return Math.round(total * rules('insurance').premiumFraction);
}

// ── Campaign score (MGT-071) ──
export function campaignScore(st) {
  const w = rules('scoreWeights');
  const rep = Object.values(st.reputation).reduce((a, v) => a + Math.max(0, v), 0);
  const active = st.roster.soldiers.filter((s) => s.status === 'active').length;
  return st.economy.balanceUsd / w.usdPerPoint + rep + w.perSurvivingSoldier * active;
}
