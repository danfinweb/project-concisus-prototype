// Management core: pure rules for roster, unlocks, economy, contracts and reputation.
// No DOM, no fetch, no Math.random(); data through shared/registry.js, randomness through shared/rng.js.
// The API is documented at the top of test/scenarios.js.
export { newCampaign, soldier, roster, memorial, balance, ledger, debts, contract, reputation, stashCount, dossier } from './state.js';
export {
  averageAttribute, carryCapacity, feePerOp, squadMorale, squadLeader, leadershipBonus,
  hirePrice, generateCandidate, candidates, hire, addSoldier, generationCallsign, setCallsign, setKitMarks, addSkillUses,
} from './soldiers.js';
export {
  servicePrice, buyService, fieldRepairCondition, fobPrice, buyFob, buyScavLoadout, traderPrice,
  krugPriceStep, krugPlayerPrice, insurancePremium, campaignScore,
} from './money.js';
export { standing } from './reputation.js';
export { missionPay, missionTypesForGoal, boardOffers } from './contracts.js';
export { applyRequests, applyBattleResult, opReturn, savePreset, applyPreset } from './requests.js';
export { buildView } from './view.js';
export { addToContainer } from './inventory.js';
