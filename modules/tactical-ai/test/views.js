// Perception-view builders for the tactical-ai tests (shape: spec/interfaces/tactical_perception_view.schema.json).
// Each builder returns a fresh, mutable object; tests change it and then call freeze() before decide().
//
// Grid: the red (AI) squad stands near y = 2, the blue enemy far south near y = 12. "South" cover (cover.s)
// therefore faces the enemy. Exit `exit-n` is at the north edge (5, 0).
//
// blackboard, squadPlan, rejection and the activate entries follow perception view 0.7.0 ($defs.blackboard,
// $defs.squadPlan; TAI-012/TAI-013, cleanup 2026-11-24). Shapes the schema still leaves open (plain `object`)
// and that these tests assume — see the test report:
//   zoneHp:      zone → { hp, max }                       (the view carries no max HP otherwise)
//   equipment:   slot → { item, rounds }                  (item = items.json ID)
//   map.tiles[]: { x, y, level, cost, impassable, obscuring, cover: { n, e, s, w } } ('none' | 'half' | 'full')

export const T = (x, y, level = 0) => ({ x, y, level });

export function freeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) freeze(v);
  }
  return o;
}

const ZONES = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const MAX = { head: 35, thorax: 85, stomach: 70, leftArm: 60, rightArm: 60, leftLeg: 65, rightLeg: 65 };

export function zoneHp(share = 1) {
  return Object.fromEntries(ZONES.map((z) => [z, { hp: Math.round(MAX[z] * share), max: MAX[z] }]));
}
const healthyLimbs = () => ({ leftArm: 'healthy', rightArm: 'healthy', leftLeg: 'healthy', rightLeg: 'healthy' });

export function soldier(id, x, y, extra = {}) {
  return {
    id, position: T(x, y), level: 0, facing: 180, stance: 'crouched', rank: 'regular', morale: 60,
    ap: 25, stamina: 80, staminaMax: 100, zoneHp: zoneHp(1), limbs: healthyLimbs(),
    conditions: [], suppressed: false, overwatch: false, weaponJammed: false, alerted: true,
    reaction: 'fire', carrying: null, equipment: { weapon1: { item: 'akm', rounds: 30 } },
    magazines: [{ id: `${id}-mag1`, item: 'akm-mag30', rounds: 30, slot: 'vest' }], outOfAction: false,
    ...extra,
  };
}

function tile(x, y, cover = {}, extra = {}) {
  return { x, y, level: 0, cost: 1, impassable: false, obscuring: false,
    cover: { n: 'none', e: 'none', s: 'none', w: 'none', ...cover }, ...extra };
}

// Reachable tiles of r1 at (5, 2):
//   (4, 3)  full cover toward the enemy (south)  — the "covered" tile
//   (6, 3)  open                                  — the "open" tile
//   (5, 1)  one step toward the exit, open
//   (5, 4)  one step toward the enemy, open
//   (8, 2)  flank tile, half cover facing south
export const COVERED = T(4, 3);
export const OPEN = T(6, 3);
export const TOWARD_EXIT = T(5, 1);
export const TOWARD_ENEMY = T(5, 4);
export const FLANK = T(8, 2);
export const EXIT_TILE = T(5, 0);

export function shootTarget(unit, hitChance, extra = {}) {
  return { unit, hitChance, zoneShares: { head: 0.05, thorax: 0.45, stomach: 0.2, leftArm: 0.07, rightArm: 0.07, leftLeg: 0.08, rightLeg: 0.08 },
    likelyZone: 'thorax', penetrates: true, concealed: false, ...extra };
}

export function reach(t, apCost, apLeft) { return { tile: t, apCost, apLeft }; }

export function baseView() {
  const v = {
    side: 'red', faction: 'f-red', doctrine: 'tac-balanced', turn: 3, timeOfDay: 'day',
    activeUnit: 'r1',
    squad: [
      soldier('r1', 5, 2, { rank: 'elite' }),
      soldier('r2', 3, 2, { rank: 'veteran' }),
      soldier('r3', 7, 2, { rank: 'regular', equipment: { weapon1: { item: 'pkm', rounds: 100 } }, magazines: [] }),
      soldier('r4', 2, 1, { rank: 'recruit' }),
    ],
    squadMorale: 60,
    squadPlan: { leader: 'r1', setBy: 'r1', setTurn: 2, roles: { r1: 'flank', r2: 'flank', r3: 'suppress', r4: 'flank' }, intent: {} },
    blackboard: { requests: [], claims: [] },
    rejection: null,
    knownEnemies: [
      { id: 'b1', position: T(5, 12), level: 0, seenTurn: 3, visibleNow: true, stance: 'upright', facing: 0,
        visibleGear: { weaponType: 'assaultRifle', helmetClass: 2, armourClass: 3 } },
      { id: 'b2', position: T(8, 12), level: 0, seenTurn: 3, visibleNow: true, stance: 'crouched', facing: 0,
        visibleGear: { weaponType: 'assaultRifle', helmetClass: 2, armourClass: 3 } },
    ],
    knownNeutrals: [],
    noises: [],
    map: {
      tiles: [
        tile(5, 2), tile(3, 2), tile(7, 2), tile(5, 0),
        tile(4, 3, { s: 'full' }), tile(6, 3), tile(5, 1), tile(5, 4), tile(8, 2, { s: 'half' }),
        tile(5, 12), tile(8, 12),
      ],
      exits: [{ id: 'exit-n', tile: EXIT_TILE, condition: 'none' }],
      containers: [], bodies: [], smoke: [],
    },
    allowedActions: [
      { type: 'move', reachable: [reach(COVERED, 4, 21), reach(OPEN, 4, 21), reach(TOWARD_EXIT, 2, 23), reach(TOWARD_ENEMY, 4, 21), reach(FLANK, 8, 17)] },
      { type: 'shoot', apCost: 8, targets: [shootTarget('b1', 0.55), shootTarget('b2', 0.55)] },
      { type: 'changeStance', apCost: 2 },
      { type: 'setReaction', apCost: 0 },
      { type: 'holdOverwatch', apCost: 10 },
      { type: 'endActivation', apCost: 0 },
    ],
    battleGoal: { goal: 'attack', targets: ['b1', 'b2'], acceptableLoss: 0.5 },
    objectives: [],
  };
  for (const u of v.squad) u.role = v.squadPlan.roles[u.id] ?? null;
  return v;
}

// Sets a unit's role in both places TAC fills it: squadPlan.roles and squad[].role (null = none).
export function setRole(v, id, role) {
  if (role == null) delete v.squadPlan.roles[id]; else v.squadPlan.roles[id] = role;
  const u = v.squad.find((x) => x.id === id);
  if (u) u.role = role ?? null;
  return v;
}
export function clearRoles(v) {
  v.squadPlan.roles = {};
  for (const u of v.squad) u.role = null;
  return v;
}

// Activation choice: activeUnit null, allowedActions = activate per eligible unit + pass (TAI-002).
export function chooseView(eligible = ['r1', 'r2', 'r3', 'r4']) {
  const v = baseView();
  v.activeUnit = null;
  v.allowedActions = [...eligible.map((unit) => ({ type: 'activate', unit })), { type: 'pass' }];
  return v;
}

// Danger: r1 wounded, shaken, standing upright in the open, three enemies in sight, only a poor shot.
export function dangerView() {
  const v = baseView();
  const r1 = v.squad[0];
  r1.zoneHp = zoneHp(0.3); r1.morale = 10; r1.stance = 'upright'; r1.suppressed = true;
  r1.limbs.leftLeg = 'wounded';
  v.knownEnemies.push({ id: 'b3', position: T(4, 11), level: 0, seenTurn: 3, visibleNow: true, stance: 'upright',
    facing: 0, visibleGear: { weaponType: 'lmg', helmetClass: 2, armourClass: 3 } });
  v.allowedActions = [
    { type: 'move', reachable: [reach(COVERED, 4, 21), reach(OPEN, 4, 21)] },
    { type: 'shoot', apCost: 8, targets: [shootTarget('b1', 0.1)] },
    { type: 'endActivation', apCost: 0 },
  ];
  return v;
}

// Retreat: `lost` of the four red soldiers are out of action; goal attack with acceptableLoss 0.5.
export function retreatView(lost = 2) {
  const v = baseView();
  for (let i = 1; i <= lost; i++) v.squad[i].outOfAction = true;
  v.allowedActions = [
    { type: 'move', reachable: [reach(TOWARD_EXIT, 2, 23), reach(TOWARD_ENEMY, 4, 21), reach(OPEN, 4, 21)] },
    { type: 'shoot', apCost: 8, targets: [shootTarget('b1', 0.3)] },
    { type: 'endActivation', apCost: 0 },
  ];
  return v;
}

export const RANKS = ['recruit', 'regular', 'veteran', 'elite'];
export const ROLES = ['flank', 'suppress', 'retreat'];
