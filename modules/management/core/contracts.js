// Contracts and missions (MGT-041..MGT-052, MGT-056).
import { rules, mission, allMissions, faction } from './data.js';
import { standing, changeRep, missionSuccessGain } from './reputation.js';

// MGT-046
export function missionPay(missionId, payInputs = {}) {
  const [low, high] = mission(missionId).payBand;
  const score = ((payInputs.distance ?? 0) + (payInputs.danger ?? 0) + (payInputs.urgency ?? 0)) / 3;
  return Math.round(low + (high - low) * score);
}
// MGT-043
export const missionTypesForGoal = (goal) => allMissions().filter((m) => m.goals?.includes(goal)).map((m) => m.id);

export const findContract = (st, id) => st.contracts.list.find((c) => c.id === id);

// MGT-041 / MGT-042: store the offer with derived pay, advance and status. The board roll for the
// Unfriendly share is drawn once on arrival (MGT-051).
export function storeOffer(st, offer, rng) {
  if (findContract(st, offer.id)) return { ok: false, error: 'duplicate contract id' };
  const missions = offer.missions.map((m) => ({ ...m, pay: missionPay(m.missionId, offer.payInputs), outcome: 'open' }));
  const pay = missions.reduce((a, m) => a + m.pay, 0);
  st.contracts.list.push({
    ...structuredClone(offer), missions, pay,
    advance: Math.round(pay * rules('advanceFraction')),
    status: 'offered', disowned: false, disownRolled: false, boardRoll: rng.next(),
  });
  return { ok: true };
}

export function accept(st, id) {
  const c = findContract(st, id);
  if (!c || c.status !== 'offered') return { ok: false, error: 'no open offer with that id' };
  c.status = 'signed';
  return { ok: true, paymentDue: { contractId: c.id, employer: c.employer, amountUsd: c.advance } };
}

// MGT-047: the rest split in proportion to mission pay; the rounding difference goes to the last mission.
export function missionShare(c, key) {
  const rest = c.pay - c.advance;
  const idx = c.missions.findIndex((m) => m.key === key);
  if (idx < c.missions.length - 1) return Math.round((rest * c.missions[idx].pay) / c.pay);
  let others = 0;
  for (let i = 0; i < c.missions.length - 1; i++) others += Math.round((rest * c.missions[i].pay) / c.pay);
  return rest - others;
}

// MGT-050: one disown roll per deniable contract, when it first goes wrong.
function maybeDisown(c, rng) {
  if (!c.deniable || c.disownRolled) return;
  c.disownRolled = true;
  if (rng.next() < (faction(c.employer)?.disownChance ?? 0)) c.disowned = true;
}

function endIfSettled(c) {
  if (c.missions.some((m) => m.outcome === 'open')) return;
  c.status = 'ended';
  c.endReason = c.missions.some((m) => m.outcome === 'success') ? 'completed' : 'allFailed';
}

// MGT-044, MGT-048, MGT-052, MGT-056
export function missionOutcome(st, { contractId, missionKey, outcome, outcomeReason }, rng) {
  const c = findContract(st, contractId);
  const m = c?.missions.find((x) => x.key === missionKey);
  if (!c || c.status !== 'signed' || !m) return { ok: false, error: 'no signed contract with that mission' };
  if (m.outcome !== 'open') return { ok: false, error: 'mission already resolved' };
  m.outcome = outcome;
  let result = { ok: true };
  if (outcome === 'success') {
    result.paymentDue = { contractId: c.id, employer: c.employer, amountUsd: missionShare(c, m.key) };
    if (!c.disowned) changeRep(st, c.employer, missionSuccessGain(m.pay));
  } else if (outcomeReason !== 'rivalFirst') {
    maybeDisown(c, rng);
    changeRep(st, c.employer, rules('repActs').missionFailed);
  }
  endIfSettled(c);
  return result;
}

// contractEnded (MGT-048, MGT-052). A deadline fails every mission still open, each costing
// repActs.missionFailed with the employer (spec reading: SCOPE open question 5).
export function contractEnded(st, { contractId, reason }, rng) {
  const c = findContract(st, contractId);
  if (!c) return { ok: false, error: 'unknown contract' };
  if (reason === 'taken') {
    if (c.status === 'offered') st.contracts.list = st.contracts.list.filter((x) => x !== c);
    return { ok: true };
  }
  if (c.status === 'ended') return { ok: true };
  if (reason === 'deadline' && c.status === 'signed') {
    const open = c.missions.filter((m) => m.outcome === 'open');
    if (open.length) maybeDisown(c, rng);
    for (const m of open) { m.outcome = 'failure'; changeRep(st, c.employer, rules('repActs').missionFailed); }
  }
  c.status = 'ended';
  c.endReason = reason;
  return { ok: true };
}

// MGT-051 / MGT-055: what a board shows, by the employer's standing.
export function boardOffers(st, boardLocation) {
  return st.contracts.list.filter((c) => c.status === 'offered' && c.boardLocation === boardLocation && visible(st, c)).map((c) => c.id);
}
function visible(st, c) {
  const s = standing(st.reputation[c.employer] ?? 0);
  const gate = c.reputationGate ?? {};
  if (s === 'hostile') return false;
  if (gate.sensitive && s !== 'trusted') return false;
  if (gate.better && s !== 'friendly' && s !== 'trusted') return false;
  if (s === 'unfriendly') return !gate.better && !gate.sensitive && c.boardRoll < rules('unfriendlyContractShare');
  return true;
}
