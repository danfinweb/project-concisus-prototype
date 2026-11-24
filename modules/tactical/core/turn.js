// Turn and activation (spec TAC-005..TAC-014). Pure logic: no DOM, no Three.js, no fetch, no Math.random().
// R is the rules accessor from ./rules.js. A battle is a plain object owned by the `battle` state slice.
//
// Unit input (from the tactical map request): { id, attributes: { agility, endurance, … },
//   zones: { leftLeg: { hp, max }, rightLeg: { hp, max }, … }, conditions?: { … } }.
// conditions (set by other rules, read here for the AP pool, TAC-006):
//   suppressed, stunned, pain, painMasked (booleans), encumbrance ('none' | 'over' | 'heavy').

const LEGS = ['leftLeg', 'rightLeg'];
const FACINGS = 8; // TAC-007: one of 8 directions (0–7)

// TAC-006: full AP = apBase + floor(Agility ÷ apAgilityDivisor).
export function fullAp(R, unit) {
  return R.apBase + Math.floor(unit.attributes.agility / R.apAgilityDivisor);
}

// TAC-006: AP for this activation = full AP − the four AP modifiers (never below 0). Wounds are not one of them.
export function activationAp(R, unit, cond = unit.conditions ?? {}) {
  let ap = fullAp(R, unit);
  if (cond.suppressed) ap -= R.suppressionAp;      // TAC-015
  if (cond.stunned) ap -= R.stunApLoss;            // TAC-025
  if (cond.pain && !cond.painMasked) ap -= R.painApLoss; // TAC-026
  if (cond.encumbrance === 'heavy') ap -= R.heavyEncumbranceApPenalty; // TAC-027, replaces the lower step
  else if (cond.encumbrance === 'over') ap -= R.encumbranceApPenalty;
  return Math.max(0, ap);
}

// TAC-062 / TAC-009: a leg below woundedThreshold of its max HP is wounded; at 0 HP it is disabled, which counts too.
const legWounded = (R, z) => z.hp < R.woundedThreshold * z.max;

// TAC-009: max stamina = staminaBase + floor(Endurance ÷ divisor) − staminaPerWoundedLeg per wounded leg, ≥ 0.
export function maxStamina(R, unit) {
  const wounded = LEGS.filter((l) => unit.zones?.[l] && legWounded(R, unit.zones[l])).length;
  return Math.max(0, R.staminaBase + Math.floor(unit.attributes.endurance / R.staminaEnduranceDivisor)
    - R.staminaPerWoundedLeg * wounded);
}

export const canActivate = (R, unit) => unit.stamina >= R.activationCost; // TAC-012
export const canReact = (unit) => unit.stamina > 0;                       // TAC-012

// sides: [{ id, units: [unit…] }] in turn order (player first, then opponent; a hostile neutral side third).
export function createBattle(R, { sides }) {
  const b = {
    turn: 1, slot: 0, order: sides.map((s) => s.id),
    sides: Object.fromEntries(sides.map((s) => [s.id, { units: s.units.map((u) => u.id) }])),
    units: {}, active: null, activated: [],
    acted: false, contact: false, quietTurns: 0, autoAdvance: false, effects: [],
  };
  Object.defineProperty(b, 'R', { value: R, enumerable: false });
  for (const s of sides) {
    for (const u of s.units) {
      const unit = { ...structuredClone(u), side: s.id, ap: 0, facing: u.facing ?? 0 };
      unit.stamina = maxStamina(R, unit); // TAC-009: enter at max
      b.units[u.id] = unit;
    }
  }
  return b;
}

export const soldier = (b, id) => b.units[id];
export const currentSide = (b) => b.order[b.slot];
export const mustPass = (b, side) => !b.sides[side].units.some((id) => canActivate(b.R, b.units[id])); // TAC-010

function checkSlot(b, side) {
  if (b.active) throw new Error(`an activation (${b.active}) is still running`);
  if (side !== currentSide(b)) throw new Error(`not ${side}'s activation: it is ${currentSide(b)}'s`);
}

// TAC-005 / TAC-008: start an activation — any soldier of the side with enough stamina, the last one included.
export function activate(b, side, id) {
  checkSlot(b, side);
  const u = b.units[id];
  if (!u || u.side !== side) throw new Error(`${id} is not a soldier of ${side}`);
  if (!canActivate(b.R, u)) throw new Error(`${id} has ${u.stamina} stamina, needs ${b.R.activationCost}`);
  u.stamina -= b.R.activationCost;
  u.ap = activationAp(b.R, u); // AP refill to the full pool (TAC-005)
  b.active = id;
  if (!b.activated.includes(id)) b.activated.push(id);
  b.acted = true;
  b.autoAdvance = false; // TAC-013: activating a soldier stops the automatic advance
  b.quietTurns = 0;
}

// TAC-007 / TAC-008: end the activation — free final facing; surcharge after a sprint or over capacity, floored at 0.
export function endActivation(b, { facing, sprinted = false, overCapacity = false } = {}) {
  const u = b.units[b.active];
  if (!u) throw new Error('no activation is running');
  if (facing !== undefined) {
    if (!Number.isInteger(facing) || facing < 0 || facing >= FACINGS) throw new Error(`facing must be 0–${FACINGS - 1}`);
    u.facing = facing;
  }
  if (sprinted || overCapacity) u.stamina = Math.max(0, u.stamina - b.R.activationSurcharge);
  u.ap = 0; // unspent AP are lost (TAC-005)
  b.active = null;
  nextSlot(b);
}

// TAC-010: pass — free, uses the side's slot.
export function pass(b, side) {
  checkSlot(b, side);
  nextSlot(b);
}

// TAC-013: a soldier saw or heard an enemy this turn.
export function noteContact(b) {
  b.contact = true;
  b.autoAdvance = false;
  b.quietTurns = 0;
}

// TAC-014: an effect with a duration in turns (null = until removed); onTurnEnd(b, effect) runs once per turn end.
export function addEffect(b, effect) {
  b.effects.push({ ...effect, turnsLeft: effect.turns ?? null });
}

function nextSlot(b) {
  b.slot += 1;
  if (b.slot >= b.order.length) endTurn(b);
}

function endTurn(b) {
  const R = b.R;
  for (const u of Object.values(b.units)) {
    const max = maxStamina(R, u);
    if (!b.activated.includes(u.id)) u.stamina += R.staminaRecovery; // TAC-011: reacting does not count
    u.stamina = Math.min(u.stamina, max);                             // TAC-009: clamp to the current max
    u.reactedThisTurn = false;
  }
  for (const e of b.effects) e.onTurnEnd?.(b, e); // TAC-014: per-turn effects once, at the end of the turn
  for (const e of b.effects) if (e.turnsLeft !== null) e.turnsLeft -= 1;
  b.effects = b.effects.filter((e) => e.turnsLeft === null || e.turnsLeft > 0);
  // TAC-013: count turns in which every side passed and nobody saw or heard an enemy.
  b.quietTurns = !b.acted && !b.contact ? b.quietTurns + 1 : 0;
  if (b.quietTurns >= R.stallTurns) b.autoAdvance = true;
  b.acted = false; b.contact = false; b.activated = [];
  b.turn += 1; b.slot = 0;
}
