// Tactical core: the API in test/CORE-API.md. Pure rules; no DOM, no Three.js, no fetch.
export { fullAp, activationAp, maxStamina, zoneMaxHp, limbState, worseArm, carryCapacity, carriedWeight,
  encumbranceApPenalty, hasPerk, leaderOf, leadershipBonus, moraleAfterCasualty, addCondition } from './soldier.js';
export { actionCost, stepCost, turnCost, stanceCost, vaultCost, climbCost, canSprint, canVault, canClimb, fireApCost,
  roundsForMode, aimCost, reloadCost, swapCost, throwCost, throwRange, scatterRadius, clearJamCost, canUseMedical,
  medicalCost } from './costs.js';
export { isNight, sightRange, concealmentFactor, spotDistance, hearingRange, reactionChance, shooterSpread, totalSpread,
  recoilPerRound, effectiveRecoil, sampleOffset, jamChance, wearPerRound, muzzleDamage, damageAt, penetrates, bluntDamage,
  armourWearAmount, hitZoneAt, exposedZones, bodyHeight, applyZoneDamage, isHardHit, bleedChance, fractureChance, painFrom,
  hitEffects, hpRestored, applyMedical, blastDamage, blastZoneSplit, materialHp, edgeBlastDamage } from './combat.js';
export { createBattle, act, unit, state, lineOfSight, spotted, cover, isConcealed, previewPath, previewShot,
  perceptionView, battleResult, objectives } from './battle.js';
export { generateMap, mapType, stageStreams, checkMap } from './mapgen.js';
