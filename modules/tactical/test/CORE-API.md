# Tactical core — API the tests target

Written with the first `/test` run (2026-11-24, all 96 TAC IDs). Tests come first, so this file fixes the
contract that `core/index.js` must export. Every function reads its constants through `shared/registry.js`
(tables `tactical-rules`, `items`, `terrain`, `management-rules`, `mapgen/tactical`, `strategic-terrain`,
`prefabs`); no value is passed in by the tests except state. Randomness: every function that rolls takes an
`rng` with the `shared/rng.js` `Rng` interface (`next`, `int`, `roll`, `pick`, `normal`, `fork`); tests
pass a seeded `Rng` or a fixed stub.

## Shapes

- **Soldier** — the request's `$defs/unit` (attributes, rank, morale, nerve, perks, zoneHp, conditions,
  stamina, equipment) plus runtime fields: `stance` (`upright|crouched|prone`), `facing` (degrees, 0 = north,
  clockwise, multiples of 45), `x`, `y`, `level`. Missing `zoneHp` = full HP. Missing `stance` = upright.
- **Zones** — `head, thorax, leftArm, rightArm, leftLeg, rightLeg`.
- **Conditions** — `{ type, zone?, turnsLeft? }`, type one of `lightBleeding, heavyBleeding, fracture,
  pain, painMasked, tourniquet, suppressed, stunned, blinded, overEncumbered` (the last is derived, never sent).
- **Equipment instance** — `{ item, condition?, durability?, rounds?, ammo?, contents?: [instance] }`;
  `rounds`/`ammo` on a weapon = loaded magazine; `contents` on vest, belt, backpack.
- **Test map** (passed to `createBattle` as `opts.map`, bypassing generation): `{ width, height, rows:
  [string], legend: { char: terrainId }, edges: [{ x, y, side: n|e|s|w, cover: half|full, material,
  kind: wall|window|fence|door|sandbag, open?, locked? }], ladders: [{ x, y, toLevel }], exits: [{ id,
  tiles: [[x, y]], condition, params? }], containers: [{ id, x, y, contents: [instance] }] }`. x grows east,
  y grows south.
- **Other runtime soldier fields** read by the tests: `reaction` (`fire|takeCover|hold`), `carrying:
  { body, mode: carry|drag }`, `aiming`, `activeSlot`, `restrained`, `maxStamina`. Weapon instance:
  `fireMode` (selected mode), `light` (flashlight on), `jammed`, `mods: [itemId]`. Item instances carry an
  `id` when a command names them.
- **Events** returned by `act`: `round` (one per round, with `aimPoint`), `projectile` (one per traced
  pellet or bullet), `hit` (`target`, `zone`), `jam`, `noise`, `reactionAttempt` (`reactor`, `mover`),
  `reactionFire` (`reactor`, `rounds`, `snapShot`), `neutralReaction` (`unit`, `reaction: flee|takeCover`),
  `objectiveMet` (`objective`), `flee`.

## Formulas (pure)

| Function | Spec |
| --- | --- |
| `isNight(hour)` | TAC-003 |
| `sightRange(soldier, { night })` | TAC-004, TAC-081 |
| `concealmentFactor(target, { obscuringTile })` | TAC-081, TAC-082 |
| `spotDistance(spotter, target, { night, obscuringTile })` | TAC-081, TAC-096 |
| `fullAp(soldier)` / `activationAp(soldier)` | TAC-006, TAC-015, TAC-025..TAC-027 |
| `maxStamina(soldier)` | TAC-009 |
| `zoneMaxHp(zone, endurance)` / `limbState(soldier, zone)` → `ok|wounded|disabled` / `worseArm(soldier)` | TAC-057, TAC-058 |
| `carryCapacity(soldier)` / `carriedWeight(soldier)` / `encumbranceApPenalty(soldier)` | TAC-027 |
| `turnCost(fromDeg, toDeg)` | TAC-017 |
| `hearingRange(shot, listener)` → tiles or `Infinity`; `shot = { weapon instance, ammo }` | TAC-018 |
| `reactionChance(reactor, mover, { distance, sprinting, inPlace, leaderBonus })` → percent | TAC-022, TAC-096 |
| `stepCost(soldier, { diagonal, terrain, sprint, carrying, dragging, door })` | TAC-024, TAC-029..TAC-032, TAC-074, TAC-084 |
| `stanceCost(from, to)` / `vaultCost(soldier)` / `climbCost(soldier, levels)` | TAC-033, TAC-034 |
| `canSprint(soldier)` / `canVault(soldier)` / `canClimb(soldier)` | TAC-031, TAC-032, TAC-034, TAC-074 |
| `fireApCost(soldier, weaponInst, mode)` / `roundsForMode(weaponInst, mode)` | TAC-039 |
| `aimCost(soldier, steps)` | TAC-040 |
| `reloadCost(soldier, weaponInst, { fromBackpack, shells })` | TAC-041 |
| `swapCost(soldier, fromSlot, toSlot)` | TAC-042 |
| `throwCost(soldier, { fromBackpack })` / `throwRange(soldier)` / `scatterRadius(soldier, distanceTiles)` | TAC-043 |
| `blastDamage(grenade, distanceTiles, cover)` / `blastZoneSplit(damage)` | TAC-079 |
| `shooterSpread(shooter, { distance, aimSteps, snapShot, weaponInst })` / `totalSpread(shooter, weaponInst, { distance, aimSteps, snapShot })` | TAC-044, TAC-040, TAC-096 |
| `traceShot(geometry, rng)` (see weapons cases) / `previewShot(battle, shooterId, targetId, opts)` | TAC-045, TAC-046 |
| `recoilPerRound(shooter, weaponInst)` | TAC-047, TAC-049 |
| `isConcealed(battle, shooterId, targetId)` | TAC-082 |
| `jamChance(condition)` / `clearJamCost(soldier)` / `wearPerRound(soldier)` | TAC-083, TAC-096 |
| `muzzleDamage(weaponInst)` / `damageAt(weaponInst, distanceTiles)` / `effectiveRecoil(weaponInst)` | TAC-048, TAC-049 |
| `penetrates(ammoId, armourInst, rng)` → boolean | TAC-050 |
| `bluntDamage(damageAtDistance)` / `armourWearAmount(armourInst, damage, penetrated)` | TAC-051 |
| `applyZoneDamage(soldier, zone, damage)` → `{ soldier, died, disabled: [zones] }` | TAC-057, TAC-059 |
| `bleedChance(kind, zone, ammoId, endurance)` / `isHardHit(soldier, zone, damage)` | TAC-060, TAC-061 |
| `fractureChance(soldier, zone, damage, { disables })` | TAC-062 |
| `painFrom(soldier, { hitZone, hitDamage })` → boolean | TAC-063 |
| `canUseMedical(soldier, itemId)` / `medicalCost(soldier, itemId, { self, fromBackpack })` / `hpRestored(soldier, itemId, { poolLeft, missing })` / `applyMedical(target, itemId, zone)` | TAC-064..TAC-068, TAC-096 |
| `actionCost(base, { factors, add, free })` | TAC-024 |
| `hitEffects(target, zone, { damage, blunt, ammo }, rng)` → `{ stunned, bleeding: null\|'light'\|'heavy', fracture, pain }` | TAC-025, TAC-051, TAC-060..TAC-063 |
| `addCondition(soldier, condition)` → soldier (heavy bleeding replaces light in its zone) | TAC-061 |
| `sampleOffset(totalSpreadMoa, rng)` → `{ x, y }` MoA from the aim point | TAC-045 |
| `hitZoneAt(soldier, { x, y, z })` (local frame, metres; x right, y forward, z up) → zone or `null` | TAC-052..TAC-055 |
| `exposedZones(soldier, { cover: none\|half\|full, firing })` → zones not hidden by the edge in front | TAC-054..TAC-056 |
| `bodyHeight(soldier)` → metres | TAC-055 |
| `leaderOf(units)` / `leadershipBonus(units)` | TAC-094 |
| `moraleAfterCasualty(observer, casualty, { killed, sees, sameSquad, ally })` | TAC-095 |
| `hasPerk(soldier, id)` | TAC-096 |
| `materialHp(material)` / `edgeBlastDamage(blastDamage)` | TAC-085 |

## Battle (state machine)

- `createBattle(request, { map, placements: { unitId: { x, y, level, facing, stance } }, rng })` → battle.
  Without `map`, the map is generated from the request (TAC-080).
- `act(battle, faction, command)` → `{ ok, reason?, events: [{ type, … }] }`; `command` per
  `tactical_commands` `$defs/command`.
- `unit(battle, id)` → soldier snapshot incl. `ap`, `stamina`, `status` (`active|leftMap|dead`),
  `suppressed`, `alerted`, `overwatch`, `reaction`, `morale`, `effectiveMorale`.
- `state(battle)` → `{ turn, activeFaction, activeUnit, night, ended, sides: [{ faction, role, hostile, leader }] }`.
- `lineOfSight(battle, aId, bId)`, `spotted(battle, spotterId, targetId)`, `cover(battle, x, y, side)`.
- `previewPath(battle, unitId, { x, y })` → `{ path, cost, apRunsOutAt }`.
- `perceptionView(battle, faction)` (tactical_perception_view) and `battleResult(battle)` (battle_result).
- `objectives(battle)` → `[{ id, met, metTurn }]`.

## Map generation

- `generateMap(request)` → `{ type, size, tiles, edges, buildings, exits, deployment, checks, attempts }`.
- `mapType(region)` (TAC-086), `stageStreams(seed)` → `{ zones, water, roads, … }` (TAC-093),
  `checkMap(map)` → `{ required: { ok, failed: [] }, reported: [...] }` (TAC-089).
