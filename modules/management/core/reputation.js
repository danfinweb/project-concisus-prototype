// Reputation and standing (MGT-053..MGT-060, MGT-064).
import { rules } from './data.js';
import { clampRep } from './state.js';

// MGT-054
export function standing(r) {
  const t = rules('standingThresholds');
  if (r <= t.hostile) return 'hostile';
  if (r <= t.unfriendly) return 'unfriendly';
  if (r >= t.trusted) return 'trusted';
  if (r >= t.friendly) return 'friendly';
  return 'neutral';
}

// Change one faction and clamp (MGT-060).
export function changeRep(st, factionId, delta) {
  if (!(factionId in st.reputation) || !delta) return;
  st.reputation[factionId] = clampRep(st.reputation[factionId] + delta);
}

// The change of one repActs act. `count` for killSoldier (capped per fight), `amountUsd` for sellSupplies.
export function actDelta(act, { count = 1, amountUsd = 0 } = {}) {
  const r = rules('repActs');
  if (act === 'killSoldier') return Math.max(r.killCapPerFight, r.killSoldier * count);
  if (act === 'sellSupplies') {
    const pts = Math.floor(amountUsd / r.sellSuppliesUsdPerPoint);
    return Math.max(r.sellSupplies.min, Math.min(r.sellSupplies.max, pts));
  }
  return r[act] ?? 0;
}

// Apply one attributed act (MGT-060): to the faction it directly affects; a war crime to every faction (MGT-059).
export function applyAct(st, act, factionId, opts) {
  const d = actDelta(act, opts);
  if (act === 'warCrime') { for (const f of Object.keys(st.reputation)) changeRep(st, f, d); return; }
  changeRep(st, factionId, d);
}

// MGT-056: gain by the mission's pay band (highest band with minUsd ≤ pay).
export function missionSuccessGain(pay) {
  let gain = 0, best = -Infinity;
  for (const b of rules('repActs').missionSuccessByPay) if (b.minUsd <= pay && b.minUsd > best) { best = b.minUsd; gain = b.gain; }
  return gain;
}
