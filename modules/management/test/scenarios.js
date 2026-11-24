// Management — single-mechanic test cases, run by the Test Lab (tools/test-lab/?module=management).
// Each scenario: { id, spec: ['TAC-001', …], name, run(ctx) }. run may be async and fails by throwing.
// ctx = { assert, rng(seed), loadFixtures(names), registry, log(...args) }
//   assert: ok, equal, notEqual, deepEqual, match, throws
//   loadFixtures(names): loads JSON tables from ./fixtures/ through shared/registry.js
// Import code under test from ../core/ (and ../adapter/ for interface tests) — never from other modules.
//
// ── Core API these tests expect (contract for /apply-spec; core/index.js) ────────────────────────────
// Every function is pure: state in, new state out (the input state is never mutated). Data comes from
// shared/registry.js. Randomness only through the passed shared/rng.js Rng. Time = { day, hour }.
//
// Campaign and requests
//   newCampaign({ seed, balanceUsd = 0, reputation = {}, fobs = [] }) → state
//       reputation: every non-player faction (factions.kind ≠ player) at repStart, overridden by `reputation`.
//   applyRequests(state, { time, requests }, { rng }) → { state, results }
//       management_requests batch → one result per request ({ index, ok, error?, paymentDue?, feesUsd?, premiumUsd? }).
//       Request types used here: the ones whose payload the spec defines (contractOffer, acceptContract,
//       missionOutcome, contractEnded, contractPayment, launchOp, soldierFate, plantOutput, dailyRollover,
//       reputationAct, MGT-076 types). reputationAct: { act, faction, attributed, amountUsd (sellSupplies) }.
//   applyBattleResult(state, battleResult, { time, rng }) → { state }      battle_result 0.4.0
//   buildView(state, time) → { view, state }   management_view 0.3.0; state remembers which ended
//       contracts were already published (MGT-072).
// Direct operations (request payload not defined in the spec yet — see the /test report)
//   addSoldier(state, { rank, attributes, fobId, time, rng, feeDiscount?, nerve?, equipment?, callsign? })
//       → { state, soldier }     test setup: hire without payment or candidate
//   generateCandidate({ tier, pool, krug?, refugee? }, rng) → { tier, pool, attributes, hirePriceUsd, feeDiscount }
//   candidates(state, { fobId, pool }, rng) → [candidate]
//   hire(state, candidate, { fobId, time, rng }) → { state, ok, soldier? }
//   setCallsign(state, soldierId, callsign) → state;  setKitMarks(state, soldierId, marks) → state
//   addSkillUses(state, soldierId, skill, uses, time) → state      (MGT-023 growth, MGT-074, MGT-009)
//   opReturn(state, { squad, soldiers, fobId, loot: [{ item, count, carrier }] }, { time }) → { state }
//   savePreset(state, name, slots) → state;  applyPreset(state, soldierId, name, fobId) → { state, missing }
//   buyScavLoadout(state, fobId, { time }) → { state, ok }
//   buyFob(state, { fobId, size: 'smallCity' | 'largeCity' }, { time }) → { state, ok }
//   buyService(state, { kind: 'hospital' | 'repair' | 'fuel', quantity, region? }, { time }) → { state, ok, priceUsd }
// Pure formulas and lookups
//   standing(value) · missionPay(missionId, payInputs) · missionTypesForGoal(goal) · hirePrice(tier, attributes, { krug })
//   averageAttribute(attributes) · carryCapacity(attributes) · feePerOp(soldier) · squadMorale(state, soldierIds)
//   squadLeader(soldiers) → id · leadershipBonus(rank) · addToContainer(container, instance) → { ok, container }
//   traderPrice(state, traderId, itemId) → number | null · krugPriceStep(current, base, rng) · krugPlayerPrice(price)
//   servicePrice(state, kind, quantity, region?) · fieldRepairCondition(condition, technical, hours, perks)
//   fobPrice(size) · campaignScore(state) · boardOffers(state, boardLocation) → [contractId]
// Accessors
//   soldier(state, id) · roster(state) (living soldiers) · memorial(state) · balance(state) · ledger(state)
//   ([{ time, amountUsd (signed), kind }]) · debts(state) · contract(state, id) · reputation(state, factionId)
//   stashCount(state, fobId, itemId) · dossier(state, soldierId)
// ─────────────────────────────────────────────────────────────────────────────────────────────────────

import { Rng } from '../../../shared/rng.js';
import { validate } from '../../../shared/schema.js';

const FIX = ['management-rules', 'recruitment', 'economy-rules', 'callsigns', 'missions', 'factions', 'events', 'traders', 'items'];
let M;
async function setup(ctx) {
  M ??= await import('../core/index.js');
  await ctx.loadFixtures(FIX);
  return M;
}

const T = (day, hour = 8) => ({ day, hour });
const A = (v, o = {}) => ({ strength: v, endurance: v, agility: v, perception: v, marksmanship: v, recon: v, medical: v, technical: v, ...o });
const rng = (seed = 1) => new Rng(seed);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

function camp(o = {}) { return M.newCampaign({ seed: 1, balanceUsd: 0, fobs: ['fob-a'], ...o }); }
function add(st, o = {}) { return M.addSoldier(st, { rank: 'recruit', attributes: A(30), fobId: 'fob-a', time: T(1), rng: rng(o.seed ?? 1), ...o }); }
function run(st, requests, time = T(1), seed = 1) { return M.applyRequests(st, { time, requests }, { rng: rng(seed) }); }
function br(soldiers, extra = {}) { return { encounterId: 'e1', outcome: 'goalMet', gameTimeHours: 1, soldiers, ...extra }; }
function battle(st, result, time = T(1, 9), seed = 1) { return M.applyBattleResult(st, result, { time, rng: rng(seed) }).state; }

// Contract offers. The default offer pays 9,000 + 13,000 + 22,500 = 44,500 (avg pay input 0.5, MGT-046).
function offer(o = {}) {
  return {
    id: 'c1', employer: 'ssv', targetFaction: 'vdk', sourceGoal: 'holdPoi',
    missions: [
      { key: 'm1', missionId: 'escort_shipment', location: 'r1' },
      { key: 'm2', missionId: 'defend_territory', location: 'r2' },
      { key: 'm3', missionId: 'capture_territory', location: 'r3' },
    ],
    deadline: { day: 10, hour: 0 }, payInputs: { distance: 0.6, danger: 0.3, urgency: 0.6 },
    intelLevel: 'exact', deniable: false, reputationGate: { better: false, sensitive: false },
    boardLocation: 'fob-a', counterContractOf: null, ...o,
  };
}
// Pays 4,667 + 8,000 + 11,333 = 24,000 (avg pay input 1/3): shares of the 18,000 rest are 3,500 / 6,000 / 8,500.
const oddOffer = (o = {}) => offer({
  id: 'c2', payInputs: { distance: 0.2, danger: 0.3, urgency: 0.5 },
  missions: [
    { key: 'a', missionId: 'retrieve_deliver', location: 'r1' },
    { key: 'b', missionId: 'escort_shipment', location: 'r2' },
    { key: 'c', missionId: 'defend_territory', location: 'r3' },
  ], ...o,
});
function signed(st, o = offer()) {
  st = run(st, [{ type: 'contractOffer', offer: o }]).state;
  return run(st, [{ type: 'acceptContract', contractId: o.id }]).state;
}
const outcome = (contractId, missionKey, result, extra = {}) => ({ type: 'missionOutcome', contractId, missionKey, outcome: result, ...extra });
const act = (a, faction, extra = {}) => ({ type: 'reputationAct', act: a, faction, attributed: true, ...extra });
async function withFactions(ctx, patch, fn) {
  const base = { ssv: { id: 'ssv', name: 'SSV', kind: 'employer', disownChance: 0.1 }, vdk: { id: 'vdk', name: 'VDK', kind: 'employer', disownChance: 0.3 }, krug: { id: 'krug', name: 'Krug', kind: 'trader', resentment: { priceMarkup: 0.1 } }, player: { id: 'player', name: 'PMC', kind: 'player' } };
  ctx.registry.setData('factions', { ...base, ...patch });
  try { await fn(); } finally { await ctx.loadFixtures(['factions']); }
}

async function fetchJson(rel) {
  const res = await fetch(new URL(rel, import.meta.url));
  if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);
  return res.json();
}
const schema = (name) => fetchJson(`../../../spec/interfaces/${name}.schema.json`);
function noErrors(assert, errors, what) { assert.equal(errors.length, 0, `${what}: ${JSON.stringify(errors.slice(0, 3))}`); }

const scenarios = [
  // ── Test data ─────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'fixtures-match-data-schemas', spec: ['MGT-002', 'MGT-009', 'MGT-013', 'MGT-046', 'MGT-053'],
    name: 'Every fixture table validates against its data schema',
    async run({ assert }) {
      for (const n of FIX) {
        const errors = validate(await schema(`data/${n}`), await fetchJson(`./fixtures/${n}.json`));
        noErrors(assert, errors, n);
      }
    },
  },

  // ── Soldiers & progression ────────────────────────────────────────────────────────────────────────
  {
    id: 'soldier-record-fields', spec: ['MGT-001', 'MGT-008', 'MGT-031', 'MGT-009', 'MGT-025'],
    name: 'A new soldier has every record field with its start value',
    async run(ctx) {
      await setup(ctx);
      const { soldier: s } = add(camp(), { rank: 'regular', attributes: A(40, { marksmanship: 44, technical: 41 }) });
      for (const k of ['id', 'serviceNumber', 'callsign', 'callsignSource', 'callsignPrestige', 'attributes', 'nerve', 'morale', 'wounds', 'equipment', 'perks', 'skillXp', 'skillIdleDays', 'rank', 'feeDiscount', 'deeds', 'status', 'hiredSkills', 'serviceRecord', 'kitMarks']) {
        ctx.assert.ok(k in s, `missing field ${k}`);
      }
      ctx.assert.equal(s.status, 'active');
      ctx.assert.equal(s.rank, 'regular');
      ctx.assert.equal(s.callsignSource, 'generated');
      ctx.assert.equal(s.callsignPrestige, 0);
      ctx.assert.equal(s.morale, 80);
      ctx.assert.equal(s.nerve, 0);
      ctx.assert.equal(s.feeDiscount, 0);
      ctx.assert.deepEqual(s.perks, []);
      ctx.assert.deepEqual(s.deeds, []);
      ctx.assert.deepEqual(s.hiredSkills, { marksmanship: 44, recon: 40, medical: 40, technical: 41 });
    },
  },
  {
    id: 'service-numbers-unique', spec: ['MGT-001'],
    name: 'Service numbers are unique and never change',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const ids = [];
      for (let i = 0; i < 5; i++) { const r = add(st, { seed: i + 1 }); st = r.state; ids.push(r.soldier.id); }
      const nums = ids.map((id) => M.soldier(st, id).serviceNumber);
      ctx.assert.equal(new Set(nums).size, 5, 'service numbers repeat');
      st = M.setCallsign(st, ids[0], 'Viper');
      st = M.addSkillUses(st, ids[0], 'marksmanship', 40, T(2));
      ctx.assert.equal(M.soldier(st, ids[0]).serviceNumber, nums[0]);
    },
  },
  {
    id: 'no-derived-values-stored', spec: ['MGT-001', 'MGT-026', 'MGT-027', 'MGT-028', 'MGT-029', 'MGT-030'],
    name: 'AP, stamina, zone HP maxima, carry capacity and other derived values are never stored',
    async run(ctx) {
      await setup(ctx);
      const { soldier: s } = add(camp());
      for (const k of ['actionPoints', 'ap', 'stamina', 'staminaMax', 'hpMax', 'zoneHpMax', 'carryCapacity', 'carryCapacityKg', 'spread', 'reactionChance', 'sightRange']) {
        ctx.assert.ok(!(k in s), `derived value stored: ${k}`);
      }
    },
  },
  {
    id: 'leftmap-stays-active', spec: ['MGT-001', 'MGT-011'],
    name: 'battle_result leftMap is stored as active; dead / mia / captured stay provisional until soldierFate',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const a = add(st, { seed: 1 }); st = a.state;
      const b = add(st, { seed: 2 }); st = b.state;
      st = battle(st, br([{ id: a.soldier.id, status: 'leftMap', exitId: 'x1' }, { id: b.soldier.id, status: 'dead' }]));
      ctx.assert.equal(M.soldier(st, a.soldier.id).status, 'active');
      ctx.assert.equal(M.soldier(st, b.soldier.id).status, 'active', 'battle_result dead alone must not set dead');
      st = run(st, [{ type: 'soldierFate', soldiers: [b.soldier.id], fate: 'dead' }], T(1, 12)).state;
      ctx.assert.ok(!M.roster(st).some((s) => s.id === b.soldier.id), 'dead soldier leaves the roster');
      ctx.assert.equal(M.memorial(st).length, 1);
    },
  },
  {
    id: 'tiers-and-hire', spec: ['MGT-002', 'MGT-074'],
    name: 'Hiring debits the candidate price and the soldier starts at the hiring tier as rank',
    async run(ctx) {
      await setup(ctx);
      const c = M.generateCandidate({ tier: 'veteran', pool: 'agency' }, rng(3));
      ctx.assert.equal(c.tier, 'veteran');
      let st = camp({ balanceUsd: 50000 });
      const r = M.hire(st, c, { fobId: 'fob-a', time: T(1), rng: rng(3) });
      ctx.assert.ok(r.ok);
      ctx.assert.equal(M.balance(r.state), 50000 - c.hirePriceUsd);
      ctx.assert.equal(r.soldier.rank, 'veteran');
      st = camp({ balanceUsd: c.hirePriceUsd - 1 });
      const poor = M.hire(st, c, { fobId: 'fob-a', time: T(1), rng: rng(3) });
      ctx.assert.equal(poor.ok, false);
      ctx.assert.equal(M.balance(poor.state), c.hirePriceUsd - 1);
      ctx.assert.equal(M.roster(poor.state).length, 0);
    },
  },
  {
    id: 'candidates-per-pool', spec: ['MGT-002'],
    name: 'A pool offers its candidate count, only from its tiers, and always one affordable candidate',
    async run(ctx) {
      await setup(ctx);
      for (let seed = 1; seed <= 20; seed++) {
        const st = camp({ balanceUsd: 1000 });
        const list = M.candidates(st, { fobId: 'fob-a', pool: 'local' }, rng(seed));
        ctx.assert.equal(list.length, 2, `seed ${seed}: candidate count`);
        ctx.assert.ok(list.every((c) => ['recruit', 'regular'].includes(c.tier)), `seed ${seed}: tier outside the pool`);
        ctx.assert.ok(list.some((c) => c.hirePriceUsd <= 1000), `seed ${seed}: nothing affordable at $1,000`);
      }
    },
  },
  {
    id: 'hire-price-scaling', spec: ['MGT-003'],
    name: 'Hire price: tier price at the middle of the range, more above, less below; Krug +10%',
    async run(ctx) {
      await setup(ctx);
      const mid = A(47, { marksmanship: 48, recon: 48, medical: 48, technical: 48 }); // average 47.5 = middle of 35–60
      ctx.assert.equal(M.hirePrice('regular', mid), 3000);
      ctx.assert.ok(M.hirePrice('regular', A(55)) > 3000, 'better candidate must cost more');
      ctx.assert.ok(M.hirePrice('regular', A(40)) < 3000, 'worse candidate must cost less');
      ctx.assert.ok(near(M.hirePrice('regular', mid, { krug: true }), 3300), 'Krug recruit × 1.10');
    },
  },
  {
    id: 'refugee-fee-discount', spec: ['MGT-003', 'MGT-001', 'MGT-005'],
    name: 'A refugee recruit pays the normal hire price and keeps a 30% lower fee per op',
    async run(ctx) {
      await setup(ctx);
      const c = M.generateCandidate({ tier: 'recruit', pool: 'local', refugee: true }, rng(5));
      ctx.assert.equal(c.feeDiscount, 0.3);
      ctx.assert.equal(c.hirePriceUsd, M.hirePrice('recruit', c.attributes));
      const r = M.hire(camp({ balanceUsd: 10000 }), c, { fobId: 'fob-a', time: T(1), rng: rng(5) });
      ctx.assert.equal(M.feePerOp(r.soldier), 210);
    },
  },
  {
    id: 'player-callsign-and-kit', spec: ['MGT-004'],
    name: 'A player callsign replaces the current one for good; kit marks are cosmetic',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp());
      st = M.setCallsign(st, s.id, 'Viper');
      st = M.setKitMarks(st, s.id, { patch: 'skull', colour: 'olive' });
      const after = M.soldier(st, s.id);
      ctx.assert.equal(after.callsign, 'Viper');
      ctx.assert.equal(after.callsignSource, 'player');
      ctx.assert.equal(after.serviceNumber, s.serviceNumber);
      ctx.assert.deepEqual(after.kitMarks, { patch: 'skull', colour: 'olive' });
      ctx.assert.deepEqual(after.attributes, s.attributes);
    },
  },
  {
    id: 'fee-per-op-at-launch', spec: ['MGT-005', 'MGT-070'],
    name: 'launchOp debits every listed soldier fee by rank × (1 − discount) as one payment',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 5000 });
      const a = add(st, { rank: 'recruit', seed: 1 }); st = a.state;
      const b = add(st, { rank: 'veteran', attributes: A(60), seed: 2 }); st = b.state;
      const c = add(st, { rank: 'regular', attributes: A(45), feeDiscount: 0.3, seed: 3 }); st = c.state;
      const ledgerBefore = M.ledger(st).length;
      const r = run(st, [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id, b.soldier.id, c.soldier.id], fobId: 'fob-a' }]);
      ctx.assert.equal(r.results[0].ok, true);
      ctx.assert.equal(r.results[0].feesUsd, 300 + 1200 + 420);
      ctx.assert.equal(M.balance(r.state), 5000 - 1920);
      ctx.assert.equal(M.ledger(r.state).length, ledgerBefore + 1, 'one payment for the whole launch');
    },
  },
  {
    id: 'no-fee-no-launch', spec: ['MGT-005', 'MGT-070'],
    name: 'If the balance cannot cover all fees nothing is paid and the result is ok:false',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 1000 });
      const a = add(st, { rank: 'veteran', attributes: A(60) }); st = a.state;
      const b = add(st, { rank: 'recruit', seed: 2 }); st = b.state;
      const r = run(st, [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id, b.soldier.id], fobId: 'fob-a' }]);
      ctx.assert.equal(r.results[0].ok, false);
      ctx.assert.equal(M.balance(r.state), 1000);
      ctx.assert.equal(M.ledger(r.state).length, M.ledger(st).length);
    },
  },
  {
    id: 'idle-soldiers-cost-nothing', spec: ['MGT-005', 'MGT-073', 'MGT-066'],
    name: 'Daily rollovers debit nothing: no salaries, no FOB or vehicle upkeep',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 5000, fobs: ['fob-a', 'fob-b'] });
      st = add(st, { rank: 'elite', attributes: A(80) }).state;
      for (let d = 2; d <= 8; d++) st = run(st, [{ type: 'dailyRollover', day: d }], T(d, 0)).state;
      ctx.assert.equal(M.balance(st), 5000);
    },
  },
  {
    id: 'service-record-from-battle', spec: ['MGT-006', 'MGT-010'],
    name: 'Kills and wounds from a battle result are logged with game time; wounds are stored',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp());
      const zoneHp = { head: 35, thorax: 60, leftArm: 20, rightArm: 40, leftLeg: 40, rightLeg: 40 };
      const conditions = [{ type: 'lightBleeding', zone: 'leftArm' }];
      st = battle(st, br([{ id: s.id, status: 'active', zoneHp, conditions, kills: [{ faction: 'vdk', distanceTiles: 12, activation: 1 }, { faction: 'vdk', distanceTiles: 8, activation: 2 }], underFire: true, morale: 70 }]), T(3, 14));
      const rec = M.soldier(st, s.id).serviceRecord;
      const kills = rec.filter((e) => e.kind === 'kill');
      ctx.assert.equal(kills.length, 2);
      ctx.assert.deepEqual(kills[0].time, { day: 3, hour: 14 });
      ctx.assert.ok(rec.some((e) => e.kind === 'wound'), 'wound entry missing');
      ctx.assert.deepEqual(M.soldier(st, s.id).wounds, { zoneHp, conditions });
      st = run(st, [{ type: 'dailyRollover', day: 4 }], T(4, 0)).state;
      ctx.assert.deepEqual(M.soldier(st, s.id).wounds, { zoneHp, conditions }, 'wounds must persist');
    },
  },
  {
    id: 'deployment-entries', spec: ['MGT-006'],
    name: 'Launch and return each log a deployment entry; entries are never removed',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 1000 });
      const a = add(st); st = a.state;
      st = run(st, [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-a' }], T(1, 9)).state;
      const n1 = M.soldier(st, a.soldier.id).serviceRecord.length;
      st = M.opReturn(st, { squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-a', loot: [] }, { time: T(2, 9) }).state;
      const rec = M.soldier(st, a.soldier.id).serviceRecord;
      ctx.assert.equal(rec.filter((e) => e.kind === 'deployment').length, 2);
      ctx.assert.ok(rec.length > n1);
    },
  },
  {
    id: 'dossier-read-only', spec: ['MGT-007'],
    name: 'The dossier is a read-only copy of the soldier record',
    async run(ctx) {
      await setup(ctx);
      const { state: st, soldier: s } = add(camp());
      const d = M.dossier(st, s.id);
      ctx.assert.equal(d.serviceNumber, s.serviceNumber);
      try { d.callsign = 'Hacked'; d.attributes.strength = 99; } catch { /* frozen is fine too */ }
      ctx.assert.equal(M.soldier(st, s.id).callsign, s.callsign);
      ctx.assert.equal(M.soldier(st, s.id).attributes.strength, 30);
    },
  },
  {
    id: 'morale-per-soldier', spec: ['MGT-008'],
    name: 'Morale starts at 80, the squad value is the rounded average, battle results set it per soldier',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const a = add(st, { seed: 1 }); st = a.state;
      const b = add(st, { seed: 2 }); st = b.state;
      const c = add(st, { seed: 3 }); st = c.state;
      ctx.assert.equal(M.squadMorale(st, [a.soldier.id, b.soldier.id, c.soldier.id]), 80);
      st = battle(st, br([{ id: a.soldier.id, status: 'active', morale: 75 }, { id: b.soldier.id, status: 'active', morale: 0 }]));
      ctx.assert.equal(M.soldier(st, a.soldier.id).morale, 75);
      ctx.assert.equal(M.soldier(st, b.soldier.id).morale, 0);
      ctx.assert.equal(M.soldier(st, c.soldier.id).morale, 80, 'soldier not in the battle keeps its morale');
      ctx.assert.equal(M.squadMorale(st, [a.soldier.id, c.soldier.id]), 78, '77.5 rounds to 78');
    },
  },
  {
    id: 'morale-change-request', spec: ['MGT-008', 'MGT-076'],
    name: 'moraleChange adds each delta and clamps to 0–100',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const a = add(st, { seed: 1 }); st = a.state;
      const b = add(st, { seed: 2 }); st = b.state;
      st = run(st, [{ type: 'moraleChange', moraleChanges: [{ soldier: a.soldier.id, delta: -90 }, { soldier: b.soldier.id, delta: 35 }] }]).state;
      ctx.assert.equal(M.soldier(st, a.soldier.id).morale, 0);
      ctx.assert.equal(M.soldier(st, b.soldier.id).morale, 100);
    },
  },
  {
    id: 'perks-at-thresholds', spec: ['MGT-009', 'MGT-023'],
    name: 'A skill reaching 50 unlocks its first perk, 80 its second; perks stay',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp(), { attributes: A(30, { marksmanship: 48, medical: 79 }) });
      st = M.addSkillUses(st, s.id, 'marksmanship', 10, T(2)); // 48 → 50 (5 xp each)
      ctx.assert.ok(M.soldier(st, s.id).perks.includes('steadyAim'), 'marksmanship 50 perk missing');
      ctx.assert.ok(!M.soldier(st, s.id).perks.includes('snapShooter'), 'marksmanship 80 perk too early');
      // Perks for skills already at a threshold when hired: SCOPE open question 6 (not pinned here).
      st = M.addSkillUses(st, s.id, 'medical', 10, T(2)); // 79 → 80 (medium, 10 xp)
      ctx.assert.ok(M.soldier(st, s.id).perks.includes('traumaSurgeon'), 'medical 80 perk missing');
    },
  },
  {
    id: 'death-and-memorial', spec: ['MGT-011', 'MGT-012', 'MGT-020'],
    name: 'soldierFate dead moves the soldier to the memorial with number, last callsign and record',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp());
      st = M.setCallsign(st, s.id, 'Viper');
      st = run(st, [{ type: 'soldierFate', soldiers: [s.id], fate: 'dead' }], T(2, 10)).state;
      ctx.assert.equal(M.roster(st).length, 0);
      const m = M.memorial(st);
      ctx.assert.equal(m.length, 1);
      ctx.assert.equal(m[0].serviceNumber, s.serviceNumber);
      ctx.assert.equal(m[0].callsign, 'Viper');
      ctx.assert.ok(Array.isArray(m[0].serviceRecord));
    },
  },
  {
    id: 'mia-captured-return', spec: ['MGT-011'],
    name: 'mia and captured soldiers come back with soldierFate returned at the named FOB',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ fobs: ['fob-a', 'fob-b'] });
      const a = add(st, { seed: 1 }); st = a.state;
      const b = add(st, { seed: 2 }); st = b.state;
      st = run(st, [{ type: 'soldierFate', soldiers: [a.soldier.id], fate: 'mia' }, { type: 'soldierFate', soldiers: [b.soldier.id], fate: 'captured' }]).state;
      ctx.assert.equal(M.soldier(st, a.soldier.id).status, 'mia');
      ctx.assert.equal(M.soldier(st, b.soldier.id).status, 'captured');
      const n = M.soldier(st, a.soldier.id).serviceRecord.length;
      st = run(st, [{ type: 'soldierFate', soldiers: [a.soldier.id, b.soldier.id], fate: 'returned', fobId: 'fob-b' }], T(5)).state;
      ctx.assert.equal(M.soldier(st, a.soldier.id).status, 'active');
      ctx.assert.equal(M.soldier(st, b.soldier.id).status, 'active');
      ctx.assert.ok(M.soldier(st, a.soldier.id).serviceRecord.length > n, 'the return is logged');
    },
  },

  // ── Callsigns ─────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'callsign-row-and-band', spec: ['MGT-013'],
    name: 'The highest attribute picks the row, its value the band',
    async run(ctx) {
      await setup(ctx);
      for (let seed = 1; seed <= 10; seed++) {
        const s = add(camp(), { attributes: A(30, { marksmanship: 65 }), seed }).soldier;
        ctx.assert.ok(['Deadeye', 'Sights'].includes(s.callsign), `seed ${seed}: ${s.callsign}`);
      }
      ctx.assert.equal(add(camp(), { attributes: A(30, { technical: 80 }) }).soldier.callsign, 'Wizard');
      ctx.assert.equal(add(camp(), { attributes: A(30, { medical: 40 }) }).soldier.callsign, 'Patch');
    },
  },
  {
    id: 'callsign-ties', spec: ['MGT-013'],
    name: 'Every attribute within 5 of the top is a candidate, picked by seed; the band follows the picked value',
    async run(ctx) {
      await setup(ctx);
      const seen = new Set();
      for (let seed = 1; seed <= 80; seed++) {
        seen.add(add(camp(), { attributes: A(30, { strength: 62, marksmanship: 65, recon: 60, perception: 59 }), seed }).soldier.callsign);
      }
      ctx.assert.ok(!seen.has('Owl'), 'perception 59 is more than 5 below 65');
      ctx.assert.ok(seen.has('Bull') && seen.has('Shadow') && (seen.has('Deadeye') || seen.has('Sights')), `candidates seen: ${[...seen]}`);
      const band = new Set();
      for (let seed = 1; seed <= 40; seed++) band.add(add(camp(), { attributes: A(30, { strength: 80, agility: 78 }), seed }).soldier.callsign);
      ctx.assert.deepEqual([...band].sort(), ['Fox', 'Titan']);
      const x = add(camp(), { attributes: A(30, { strength: 62, marksmanship: 65, recon: 60 }), seed: 9 }).soldier.callsign;
      const y = add(camp(), { attributes: A(30, { strength: 62, marksmanship: 65, recon: 60 }), seed: 9 }).soldier.callsign;
      ctx.assert.equal(x, y, 'same seed, same callsign');
    },
  },
  {
    id: 'callsign-generic', spec: ['MGT-014'],
    name: 'No attribute at 40 or above draws from the Generic list',
    async run(ctx) {
      await setup(ctx);
      for (let seed = 1; seed <= 10; seed++) {
        const s = add(camp(), { attributes: A(30, { medical: 39 }), seed }).soldier;
        ctx.assert.ok(['Kid', 'Pup', 'Sparrow', 'Bones', 'Private'].includes(s.callsign), s.callsign);
      }
    },
  },
  {
    id: 'callsign-suffix', spec: ['MGT-015'],
    name: 'A used-up list takes a base name plus the lowest free -N; the dead free their callsign',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const names = [];
      for (let i = 0; i < 3; i++) { const r = add(st, { attributes: A(30, { strength: 70 }), seed: i + 1 }); st = r.state; names.push(r.soldier.callsign); }
      ctx.assert.deepEqual(names, ['Bull', 'Bull-2', 'Bull-3']);
      const titan = add(st, { attributes: A(30, { strength: 85 }) }); st = titan.state;
      ctx.assert.equal(titan.soldier.callsign, 'Titan');
      st = run(st, [{ type: 'soldierFate', soldiers: [titan.soldier.id], fate: 'dead' }]).state;
      ctx.assert.equal(add(st, { attributes: A(30, { strength: 90 }) }).soldier.callsign, 'Titan', 'callsign of the fallen is free again');
    },
  },
  {
    id: 'callsign-assigned-once', spec: ['MGT-016'],
    name: 'Growing into another band never re-rolls the generation callsign',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp(), { attributes: A(30, { marksmanship: 59 }) });
      ctx.assert.equal(s.callsign, 'Plinker');
      st = M.addSkillUses(st, s.id, 'marksmanship', 20, T(2));
      ctx.assert.ok(M.soldier(st, s.id).attributes.marksmanship >= 60);
      ctx.assert.equal(M.soldier(st, s.id).callsign, 'Plinker');
    },
  },

  // ── Soldier attributes ────────────────────────────────────────────────────────────────────────────
  {
    id: 'attributes-in-tier-range', spec: ['MGT-021', 'MGT-022'],
    name: 'Candidates roll eight integer attributes inside the tier range, reproducibly per seed',
    async run(ctx) {
      await setup(ctx);
      const ranges = { recruit: [20, 45], regular: [35, 60], veteran: [50, 75], elite: [65, 90] };
      for (const [tier, [lo, hi]] of Object.entries(ranges)) {
        for (let seed = 1; seed <= 25; seed++) {
          const c = M.generateCandidate({ tier, pool: 'agency' }, rng(seed));
          const vals = Object.values(c.attributes);
          ctx.assert.equal(vals.length, 8);
          ctx.assert.ok(vals.every((v) => Number.isInteger(v) && v >= lo && v <= hi), `${tier} seed ${seed}: ${vals}`);
        }
      }
      ctx.assert.deepEqual(M.generateCandidate({ tier: 'elite', pool: 'agency' }, rng(4)), M.generateCandidate({ tier: 'elite', pool: 'agency' }, rng(4)));
    },
  },
  {
    id: 'skill-growth-bands', spec: ['MGT-023'],
    name: 'Skill xp: 5 per point below 50, 10 from 50 to 80, 20 above 80',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp(), { attributes: A(30, { marksmanship: 48, recon: 80, medical: 100 }) });
      st = M.addSkillUses(st, s.id, 'marksmanship', 15, T(2));
      ctx.assert.equal(M.soldier(st, s.id).attributes.marksmanship, 50, '48 + 5 + 5 xp, then 5 of 10');
      ctx.assert.equal(M.soldier(st, s.id).skillXp.marksmanship, 5);
      st = M.addSkillUses(st, s.id, 'recon', 30, T(2));
      ctx.assert.equal(M.soldier(st, s.id).attributes.recon, 82, '80→81 costs 10, 81→82 costs 20');
      st = M.addSkillUses(st, s.id, 'medical', 50, T(2));
      ctx.assert.equal(M.soldier(st, s.id).attributes.medical, 100, 'capped at attributeMax');
    },
  },
  {
    id: 'physical-attributes-not-by-use', spec: ['MGT-024'],
    name: 'Skill uses never change physical attributes',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp());
      for (const k of ['marksmanship', 'recon', 'medical', 'technical']) st = M.addSkillUses(st, s.id, k, 30, T(2));
      const a = M.soldier(st, s.id).attributes;
      ctx.assert.deepEqual([a.strength, a.endurance, a.agility, a.perception], [30, 30, 30, 30]);
    },
  },
  {
    id: 'carry-capacity', spec: ['MGT-029'],
    name: 'Carry capacity = 15 + 0.3 × Strength + 0.1 × Endurance',
    async run(ctx) {
      await setup(ctx);
      ctx.assert.ok(near(M.carryCapacity(A(30, { strength: 50, endurance: 40 })), 34));
      ctx.assert.ok(near(M.carryCapacity(A(1)), 15.4));
      ctx.assert.ok(near(M.carryCapacity(A(100)), 55));
    },
  },
  {
    id: 'nerve-growth', spec: ['MGT-031'],
    name: 'Nerve +1 per fight under fire, +2 per deployment survived, capped at 100',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      const a = add(st, { seed: 1 }); st = a.state;
      const b = add(st, { seed: 2, nerve: 99 }); st = b.state;
      st = battle(st, br([{ id: a.soldier.id, status: 'leftMap', underFire: true }, { id: b.soldier.id, status: 'leftMap', underFire: false }]));
      ctx.assert.equal(M.soldier(st, a.soldier.id).nerve, 1);
      st = M.opReturn(st, { squad: 'sq1', soldiers: [a.soldier.id, b.soldier.id], fobId: 'fob-a', loot: [] }, { time: T(2) }).state;
      ctx.assert.equal(M.soldier(st, a.soldier.id).nerve, 3);
      ctx.assert.equal(M.soldier(st, b.soldier.id).nerve, 100);
    },
  },
  {
    id: 'promotion-by-average', spec: ['MGT-074', 'MGT-006', 'MGT-005'],
    name: 'Rank rises when the average passes the range top, repeats across ranges, is logged and raises the fee',
    async run(ctx) {
      await setup(ctx);
      let { state: st, soldier: s } = add(camp(), { rank: 'recruit', attributes: A(45) });
      ctx.assert.equal(M.averageAttribute(A(45)), 45);
      ctx.assert.equal(M.soldier(st, s.id).rank, 'recruit', 'average 45 is not above 45');
      st = M.addSkillUses(st, s.id, 'marksmanship', 10, T(2)); // 45 → 47: average 45.25
      ctx.assert.equal(M.soldier(st, s.id).rank, 'regular');
      ctx.assert.ok(M.soldier(st, s.id).serviceRecord.some((e) => e.kind === 'promotion'));
      ctx.assert.equal(M.feePerOp(M.soldier(st, s.id)), 600);
      let j = add(camp(), { rank: 'recruit', attributes: A(61) });
      st = M.addSkillUses(j.state, j.soldier.id, 'recon', 10, T(2));
      ctx.assert.equal(M.soldier(st, j.soldier.id).rank, 'veteran', 'average 61.x passes 45 and 60, not 75');
    },
  },
  {
    id: 'squad-leader', spec: ['MGT-075'],
    name: 'Highest rank leads; ties go to the higher average, then the first listed; bonus by leader rank',
    async run(ctx) {
      await setup(ctx);
      const s = (id, rank, v) => ({ id, rank, attributes: A(v) });
      ctx.assert.equal(M.squadLeader([s('a', 'regular', 50), s('b', 'veteran', 51), s('c', 'regular', 59)]), 'b');
      ctx.assert.equal(M.squadLeader([s('a', 'veteran', 55), s('b', 'veteran', 62)]), 'b');
      ctx.assert.equal(M.squadLeader([s('a', 'veteran', 60), s('b', 'veteran', 60)]), 'a');
      ctx.assert.deepEqual(['recruit', 'regular', 'veteran', 'elite'].map((r) => M.leadershipBonus(r)), [0, 2, 4, 6]);
    },
  },

  // ── Gear, loot & return ───────────────────────────────────────────────────────────────────────────
  {
    id: 'container-weight-limit', spec: ['MGT-032'],
    name: 'A container takes any items up to its weight limit and rejects the one that exceeds it',
    async run(ctx) {
      await setup(ctx);
      let c = { capacityKg: 1, items: [] };
      let r = M.addToContainer(c, { item: 'medkit' }); ctx.assert.ok(r.ok); c = r.container;
      r = M.addToContainer(c, { item: 'medkit' }); ctx.assert.ok(r.ok, 'exactly at the limit is allowed'); c = r.container;
      r = M.addToContainer(c, { item: 'tourniquet' });
      ctx.assert.equal(r.ok, false);
      ctx.assert.equal(r.container.items.length, 2);
    },
  },
  {
    id: 'loot-to-stash', spec: ['MGT-035', 'MGT-006', 'MGT-066'],
    name: 'Loot carried to an FOB goes into its stash and is logged with weight and value',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ fobs: ['fob-a', 'fob-b'] });
      const a = add(st); st = a.state;
      st = M.opReturn(st, { squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-b', loot: [{ item: 'gold-chain', count: 2, carrier: a.soldier.id }] }, { time: T(3) }).state;
      ctx.assert.equal(M.stashCount(st, 'fob-b', 'gold-chain'), 2);
      ctx.assert.equal(M.stashCount(st, 'fob-a', 'gold-chain'), 0, 'stashes are per FOB');
      const e = M.soldier(st, a.soldier.id).serviceRecord.find((x) => x.kind === 'lootCarriedOut');
      ctx.assert.ok(e, 'lootCarriedOut entry missing');
      ctx.assert.ok(near(e.weightKg, 0.2) && e.valueUsd === 3000, JSON.stringify(e));
    },
  },
  {
    id: 'insurance-premium', spec: ['MGT-036', 'MGT-005'],
    name: 'The premium is 10% of the insured items value, paid with the launch fees',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 2000 });
      const a = add(st, { equipment: { weapon1: { id: 'i-ak1', item: 'ak74m', condition: 80 } } }); st = a.state;
      const r = run(st, [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-a', insuredItems: ['i-ak1'] }]);
      ctx.assert.equal(r.results[0].premiumUsd, 80);
      ctx.assert.equal(M.balance(r.state), 2000 - 300 - 80);
    },
  },
  {
    id: 'insurance-recovery', spec: ['MGT-036', 'MGT-011'],
    name: 'A lost insured item comes back by seeded roll to the start FOB after 3 days',
    async run(ctx) {
      await setup(ctx);
      let returned = 0, lost = 0;
      for (let seed = 1; seed <= 40; seed++) {
        let st = camp({ balanceUsd: 2000, fobs: ['fob-a', 'fob-b'] });
        const a = add(st, { equipment: { weapon1: { id: 'i-ak1', item: 'ak74m', condition: 80 } } }); st = a.state;
        st = run(st, [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-b', insuredItems: ['i-ak1'] }], T(1, 8), seed).state;
        st = run(st, [{ type: 'soldierFate', soldiers: [a.soldier.id], fate: 'dead' }], T(1, 12), seed).state;
        for (let d = 2; d <= 3; d++) st = run(st, [{ type: 'dailyRollover', day: d }], T(d, 0), seed).state;
        ctx.assert.equal(M.stashCount(st, 'fob-b', 'ak74m'), 0, `seed ${seed}: back before the delay`);
        st = run(st, [{ type: 'dailyRollover', day: 4 }], T(4, 0), seed).state;
        const n = M.stashCount(st, 'fob-b', 'ak74m');
        ctx.assert.ok(n === 0 || n === 1);
        ctx.assert.equal(M.stashCount(st, 'fob-a', 'ak74m'), 0, 'returns to the start FOB only');
        if (n) returned++; else lost++;
      }
      ctx.assert.ok(returned > 0 && lost > 0, `returned ${returned}, lost ${lost}`);
    },
  },
  {
    id: 'loadout-preset', spec: ['MGT-037'],
    name: 'Applying a preset takes items from the FOB stash; missing ones are reported and left empty',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      st = run(st, [{ type: 'plantOutput', plantId: 'arms-1', fobId: 'fob-a', items: [{ item: 'ak74m', count: 1 }] }]).state;
      const a = add(st); st = a.state;
      st = M.savePreset(st, 'rifleman', { weapon1: 'ak74m', backpack: 'small-backpack' });
      const r = M.applyPreset(st, a.soldier.id, 'rifleman', 'fob-a');
      ctx.assert.deepEqual(r.missing, ['small-backpack']);
      ctx.assert.equal(M.soldier(r.state, a.soldier.id).equipment.weapon1.item, 'ak74m');
      ctx.assert.ok(!M.soldier(r.state, a.soldier.id).equipment.backpack, 'missing slot stays empty');
      ctx.assert.equal(M.stashCount(r.state, 'fob-a', 'ak74m'), 0);
    },
  },
  {
    id: 'scav-loadout', spec: ['MGT-038', 'MGT-070'],
    name: 'The scav loadout costs $500 at any FOB and puts its items into that stash',
    async run(ctx) {
      await setup(ctx);
      const r = M.buyScavLoadout(camp({ balanceUsd: 600, fobs: ['fob-a', 'fob-b'] }), 'fob-b', { time: T(1) });
      ctx.assert.ok(r.ok);
      ctx.assert.equal(M.balance(r.state), 100);
      ctx.assert.deepEqual(['ak74m', 'ak74-mag', 'tourniquet'].map((i) => M.stashCount(r.state, 'fob-b', i)), [1, 2, 1]);
      const poor = M.buyScavLoadout(camp({ balanceUsd: 499 }), 'fob-a', { time: T(1) });
      ctx.assert.equal(poor.ok, false);
      ctx.assert.equal(M.balance(poor.state), 499);
    },
  },
  {
    id: 'trader-standing-gates', spec: ['MGT-039', 'MGT-055'],
    name: 'Traders: none at Hostile, basic +25% at Unfriendly, basic at Neutral, military at Friendly, best at Trusted',
    async run(ctx) {
      await setup(ctx);
      const at = (r) => camp({ reputation: { ssv: r } });
      ctx.assert.equal(M.traderPrice(at(-50), 'ssv-city', 'medkit'), null);
      ctx.assert.ok(near(M.traderPrice(at(-20), 'ssv-city', 'medkit'), 125));
      ctx.assert.equal(M.traderPrice(at(-20), 'ssv-city', 'ak74m'), null);
      ctx.assert.equal(M.traderPrice(at(0), 'ssv-city', 'medkit'), 100);
      ctx.assert.equal(M.traderPrice(at(0), 'ssv-city', 'ak74m'), null);
      ctx.assert.equal(M.traderPrice(at(20), 'ssv-city', 'ak74m'), 800);
      ctx.assert.equal(M.traderPrice(at(49), 'ssv-city', 'gold-chain'), null);
      ctx.assert.equal(M.traderPrice(at(50), 'ssv-city', 'gold-chain'), 1500);
    },
  },
  {
    id: 'krug-price-step', spec: ['MGT-040'],
    name: 'A Krug price moves at most ±10% a day and stays within ±30% of base; the player pays +10%',
    async run(ctx) {
      await setup(ctx);
      for (let seed = 1; seed <= 50; seed++) {
        const p = M.krugPriceStep(100, 100, rng(seed));
        ctx.assert.ok(p >= 90 && p <= 110, `seed ${seed}: ${p}`);
        const hi = M.krugPriceStep(128, 100, rng(seed));
        ctx.assert.ok(hi <= 130 && hi >= 128 * 0.9 - 1e-9, `seed ${seed}: ${hi}`);
        const lo = M.krugPriceStep(72, 100, rng(seed));
        ctx.assert.ok(lo >= 70 && lo <= 72 * 1.1 + 1e-9, `seed ${seed}: ${lo}`);
      }
      ctx.assert.ok(near(M.krugPlayerPrice(110), 121));
    },
  },

  // ── Contracts and missions ────────────────────────────────────────────────────────────────────────
  {
    id: 'offer-stored', spec: ['MGT-041', 'MGT-042', 'MGT-046', 'MGT-047'],
    name: 'A contractOffer is stored as offered with derived pay, mission pays and advance',
    async run(ctx) {
      await setup(ctx);
      const r = run(camp(), [{ type: 'contractOffer', offer: offer() }]);
      ctx.assert.equal(r.results[0].ok, true);
      const c = M.contract(r.state, 'c1');
      ctx.assert.equal(c.status, 'offered');
      ctx.assert.equal(c.employer, 'ssv');
      ctx.assert.equal(c.targetFaction, 'vdk');
      ctx.assert.deepEqual(c.missions.map((m) => m.pay), [9000, 13000, 22500]);
      ctx.assert.equal(c.pay, 44500);
      ctx.assert.equal(c.advance, 11125);
      ctx.assert.equal(c.disowned, false);
    },
  },
  {
    id: 'goal-mission-mapping', spec: ['MGT-043'],
    name: 'Goal → allowed mission types comes from missions.json goals',
    async run(ctx) {
      await setup(ctx);
      ctx.assert.deepEqual(M.missionTypesForGoal('hunt').slice().sort(), ['assassinate_vip', 'capture_vip']);
      ctx.assert.deepEqual(M.missionTypesForGoal('intelNeeds'), ['retrieve_deliver']);
      ctx.assert.deepEqual(M.missionTypesForGoal('holdPoi').slice().sort(), ['capture_territory', 'defend_territory', 'escort_shipment']);
    },
  },
  {
    id: 'mission-pay-formula', spec: ['MGT-046'],
    name: 'missionPay = round(low + (high − low) × average of distance, danger, urgency)',
    async run(ctx) {
      await setup(ctx);
      ctx.assert.equal(M.missionPay('retrieve_deliver', { distance: 0.5, danger: 0.5, urgency: 0.5 }), 5500);
      ctx.assert.equal(M.missionPay('retrieve_deliver', { distance: 1, danger: 0, urgency: 0.5 }), 5500);
      ctx.assert.equal(M.missionPay('escort_vip', { distance: 0, danger: 0, urgency: 0 }), 8000);
      ctx.assert.equal(M.missionPay('escort_vip', { distance: 1, danger: 1, urgency: 1 }), 15000);
      ctx.assert.equal(M.missionPay('defend_territory', { distance: 0.2, danger: 0.3, urgency: 0.5 }), 11333);
      ctx.assert.equal(M.missionPay('retrieve_deliver', { distance: 0.2, danger: 0.3, urgency: 0.5 }), 4667);
    },
  },
  {
    id: 'advance-on-signing', spec: ['MGT-047', 'MGT-070'],
    name: 'Signing names the advance as paymentDue; money arrives only with contractPayment',
    async run(ctx) {
      await setup(ctx);
      let st = run(camp({ balanceUsd: 100 }), [{ type: 'contractOffer', offer: offer() }]).state;
      const r = run(st, [{ type: 'acceptContract', contractId: 'c1' }]);
      ctx.assert.deepEqual(r.results[0].paymentDue, { contractId: 'c1', employer: 'ssv', amountUsd: 11125 });
      ctx.assert.equal(M.contract(r.state, 'c1').status, 'signed');
      ctx.assert.equal(M.balance(r.state), 100, 'not credited before contractPayment');
      st = run(r.state, [{ type: 'contractPayment', contractId: 'c1', employer: 'ssv', amountUsd: 11125 }], T(1, 9)).state;
      ctx.assert.equal(M.balance(st), 11225);
    },
  },
  {
    id: 'mission-shares', spec: ['MGT-047', 'MGT-044'],
    name: 'Each mission met pays its share of the rest in proportion to its pay',
    async run(ctx) {
      await setup(ctx);
      const st = signed(camp());
      const r = run(st, [outcome('c1', 'm1', 'success'), outcome('c1', 'm2', 'success'), outcome('c1', 'm3', 'success')]);
      ctx.assert.deepEqual(r.results.map((x) => x.paymentDue?.amountUsd), [6750, 9750, 16875]);
    },
  },
  {
    id: 'mission-share-rounding', spec: ['MGT-047'],
    name: 'Rounding difference goes to the last mission; shares sum to pay − advance',
    async run(ctx) {
      await setup(ctx);
      const st = signed(camp(), oddOffer());
      const c = M.contract(st, 'c2');
      ctx.assert.equal(c.pay, 24000);
      ctx.assert.equal(c.advance, 6000);
      const r = run(st, [outcome('c2', 'a', 'success'), outcome('c2', 'b', 'success'), outcome('c2', 'c', 'success')]);
      const shares = r.results.map((x) => x.paymentDue.amountUsd);
      ctx.assert.deepEqual(shares, [3500, 6000, 8500]);
      ctx.assert.equal(shares.reduce((a, b) => a + b, 0), 18000);
    },
  },
  {
    id: 'success-is-final', spec: ['MGT-044'],
    name: 'A mission met stays met; a later failure report does not undo it',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [outcome('c1', 'm1', 'success')]).state;
      const rep = M.reputation(st, 'ssv');
      const r = run(st, [outcome('c1', 'm1', 'failure')]);
      ctx.assert.equal(M.reputation(r.state, 'ssv'), rep);
      ctx.assert.equal(r.results[0].paymentDue, undefined);
      const { view } = M.buildView(r.state, T(1));
      ctx.assert.equal(view.contracts.find((c) => c.id === 'c1').missions.find((m) => m.key === 'm1').outcome, 'success');
    },
  },
  {
    id: 'failed-mission', spec: ['MGT-048', 'MGT-056'],
    name: 'A failed mission loses its share and 5 reputation; the contract goes on',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      const r = run(st, [outcome('c1', 'm1', 'failure')]);
      ctx.assert.equal(r.results[0].paymentDue, undefined);
      ctx.assert.equal(M.reputation(r.state, 'ssv'), -5);
      ctx.assert.equal(M.contract(r.state, 'c1').status, 'signed');
      const r2 = run(r.state, [outcome('c1', 'm2', 'success')]);
      ctx.assert.equal(r2.results[0].paymentDue.amountUsd, 9750);
    },
  },
  {
    id: 'all-failed-ends-contract', spec: ['MGT-048', 'MGT-070'],
    name: 'When every mission has failed the contract ends allFailed; the advance is kept, no debt',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [{ type: 'contractPayment', contractId: 'c1', employer: 'ssv', amountUsd: 11125 }]).state;
      st = run(st, [outcome('c1', 'm1', 'failure'), outcome('c1', 'm2', 'failure'), outcome('c1', 'm3', 'failure')]).state;
      const c = M.contract(st, 'c1');
      ctx.assert.equal(c.status, 'ended');
      ctx.assert.equal(c.endReason, 'allFailed');
      ctx.assert.equal(M.balance(st), 11125);
      ctx.assert.deepEqual(M.debts(st), []);
    },
  },
  {
    id: 'completed-contract', spec: ['MGT-048'],
    name: 'One success and no open missions left: the contract is completed',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [outcome('c1', 'm1', 'success'), outcome('c1', 'm2', 'failure'), outcome('c1', 'm3', 'failure')]).state;
      ctx.assert.equal(M.contract(st, 'c1').status, 'ended');
      ctx.assert.equal(M.contract(st, 'c1').endReason, 'completed');
    },
  },
  {
    id: 'deadline-failure', spec: ['MGT-048'],
    name: 'contractEnded deadline: no more pay, advance kept, no debt, reputation with the employer falls',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [outcome('c1', 'm1', 'success')]).state;
      const before = M.reputation(st, 'ssv');
      st = run(st, [{ type: 'contractEnded', contractId: 'c1', reason: 'deadline' }], T(10, 0)).state;
      ctx.assert.equal(M.contract(st, 'c1').endReason, 'deadline');
      ctx.assert.ok(M.reputation(st, 'ssv') < before, 'a failed contract costs reputation');
      ctx.assert.deepEqual(M.debts(st), []);
      const r = run(st, [outcome('c1', 'm2', 'success')]);
      ctx.assert.equal(r.results[0].paymentDue, undefined, 'no pay after the end');
    },
  },
  {
    id: 'employer-default', spec: ['MGT-048'],
    name: 'contractEnded employerDefault: contract over, advance kept, no reputation change',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [{ type: 'contractEnded', contractId: 'c1', reason: 'employerDefault' }]).state;
      ctx.assert.equal(M.contract(st, 'c1').status, 'ended');
      ctx.assert.equal(M.contract(st, 'c1').endReason, 'employerDefault');
      ctx.assert.equal(M.reputation(st, 'ssv'), 0);
      ctx.assert.equal(M.reputation(st, 'vdk'), 0);
      ctx.assert.deepEqual(M.debts(st), []);
    },
  },
  {
    id: 'disown-once', spec: ['MGT-050', 'MGT-056'],
    name: 'A deniable contract is rolled once when it first goes wrong; disowned = paid, no gains, losses stay',
    async run(ctx) {
      await setup(ctx);
      await withFactions(ctx, { ssv: { id: 'ssv', name: 'SSV', kind: 'employer', disownChance: 1 } }, async () => {
        let st = signed(camp(), offer({ deniable: true }));
        st = run(st, [outcome('c1', 'm1', 'failure')]).state;
        ctx.assert.equal(M.contract(st, 'c1').disowned, true);
        ctx.assert.equal(M.reputation(st, 'ssv'), -5, 'loss still applies');
        const r = run(st, [outcome('c1', 'm2', 'success')]);
        ctx.assert.equal(r.results[0].paymentDue.amountUsd, 9750, 'still paid');
        ctx.assert.equal(M.reputation(r.state, 'ssv'), -5, 'no gain while disowned');
      });
      await withFactions(ctx, { ssv: { id: 'ssv', name: 'SSV', kind: 'employer', disownChance: 0 } }, async () => {
        let st = signed(camp(), offer({ deniable: true }));
        st = run(st, [outcome('c1', 'm1', 'failure')]).state;
        ctx.assert.equal(M.contract(st, 'c1').disowned, false);
      });
    },
  },
  {
    id: 'board-by-standing', spec: ['MGT-051', 'MGT-055'],
    name: 'Boards: Hostile none; basic from Neutral, better from Friendly, sensitive from Trusted',
    async run(ctx) {
      await setup(ctx);
      const offers = [offer({ id: 'basic' }), offer({ id: 'better', reputationGate: { better: true, sensitive: false } }), offer({ id: 'sensitive', reputationGate: { better: false, sensitive: true } })];
      const board = (r) => {
        const st = run(camp({ reputation: { ssv: r } }), offers.map((o) => ({ type: 'contractOffer', offer: o }))).state;
        return M.boardOffers(st, 'fob-a').slice().sort();
      };
      ctx.assert.deepEqual(board(-50), []);
      ctx.assert.deepEqual(board(0), ['basic']);
      ctx.assert.deepEqual(board(20), ['basic', 'better']);
      ctx.assert.deepEqual(board(50), ['basic', 'better', 'sensitive']);
    },
  },
  {
    id: 'board-unfriendly-share', spec: ['MGT-051'],
    name: 'At Unfriendly about half the basic offers show, chosen once per offer when it arrives',
    async run(ctx) {
      await setup(ctx);
      const reqs = Array.from({ length: 40 }, (_, i) => ({ type: 'contractOffer', offer: offer({ id: `o${i}` }) }));
      reqs.push({ type: 'contractOffer', offer: offer({ id: 'better', reputationGate: { better: true, sensitive: false } }) });
      const st = run(camp({ reputation: { ssv: -30 } }), reqs, T(1), 11).state;
      const first = M.boardOffers(st, 'fob-a').slice().sort();
      ctx.assert.ok(first.length >= 10 && first.length <= 30, `shown ${first.length} of 40`);
      ctx.assert.ok(!first.includes('better'));
      ctx.assert.deepEqual(M.boardOffers(st, 'fob-a').slice().sort(), first, 'selection is stable between views');
    },
  },
  {
    id: 'rival-takes-offer', spec: ['MGT-052'],
    name: 'contractEnded taken removes an unsigned offer from contracts',
    async run(ctx) {
      await setup(ctx);
      let st = run(camp(), [{ type: 'contractOffer', offer: offer() }]).state;
      st = run(st, [{ type: 'contractEnded', contractId: 'c1', reason: 'taken' }]).state;
      ctx.assert.equal(M.contract(st, 'c1'), undefined);
      ctx.assert.deepEqual(M.boardOffers(st, 'fob-a'), []);
    },
  },
  {
    id: 'rival-first', spec: ['MGT-052', 'MGT-056'],
    name: 'A mission a rival completes first fails with no pay and no reputation loss',
    async run(ctx) {
      await setup(ctx);
      const r = run(signed(camp()), [outcome('c1', 'm1', 'failure', { outcomeReason: 'rivalFirst' })]);
      ctx.assert.equal(r.results[0].paymentDue, undefined);
      ctx.assert.equal(M.reputation(r.state, 'ssv'), 0);
    },
  },

  // ── Reputation ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'reputation-start-and-clamp', spec: ['MGT-053'],
    name: 'Every non-player faction starts at 0; values clamp to −100…100; no drift',
    async run(ctx) {
      await setup(ctx);
      let st = camp();
      for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug']) ctx.assert.equal(M.reputation(st, f), 0, f);
      ctx.assert.equal(M.reputation(st, 'player'), undefined);
      st = run(st, Array.from({ length: 6 }, () => act('warCrime', 'ssv'))).state;
      ctx.assert.equal(M.reputation(st, 'vdk'), -100);
      st = run(camp({ reputation: { ssv: 95 } }), [act('rescue', 'ssv')]).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), 100);
      for (let d = 2; d <= 30; d++) st = run(st, [{ type: 'dailyRollover', day: d }], T(d, 0)).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), 100, 'no drift');
    },
  },
  {
    id: 'standing-thresholds', spec: ['MGT-054'],
    name: 'Standing: ≤ −50 hostile, ≤ −20 unfriendly, ≥ 20 friendly, ≥ 50 trusted, else neutral',
    async run(ctx) {
      await setup(ctx);
      const cases = [[-100, 'hostile'], [-50, 'hostile'], [-49, 'unfriendly'], [-20, 'unfriendly'], [-19, 'neutral'], [0, 'neutral'], [19, 'neutral'], [20, 'friendly'], [49, 'friendly'], [50, 'trusted'], [100, 'trusted']];
      for (const [v, s] of cases) ctx.assert.equal(M.standing(v), s, `${v}`);
    },
  },
  {
    id: 'mission-success-gain-by-pay', spec: ['MGT-056'],
    name: 'Mission success: +5 below $8,000, +10 from $8,000 to $15,000, +15 above',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp(), oddOffer()); // pays 4,667 / 8,000 / 11,333
      st = run(st, [outcome('c2', 'a', 'success')]).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), 5);
      st = run(st, [outcome('c2', 'b', 'success')]).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), 15);
      let s2 = signed(camp()); // 9,000 / 13,000 / 22,500
      s2 = run(s2, [outcome('c1', 'm3', 'success')]).state;
      ctx.assert.equal(M.reputation(s2, 'ssv'), 15);
      const top = offer({ id: 'c15', payInputs: { distance: 1, danger: 1, urgency: 1 }, missions: [{ key: 'x', missionId: 'escort_vip', location: 'r' }] }); // pays exactly 15,000
      const s3 = run(signed(camp(), top), [outcome('c15', 'x', 'success')]).state;
      ctx.assert.equal(M.reputation(s3, 'ssv'), 10, '$15,000 is still in the +10 band');
    },
  },
  {
    id: 'success-no-target-loss', spec: ['MGT-056', 'MGT-064'],
    name: 'Mission success alone changes only the employer; the target loses only through attributed acts',
    async run(ctx) {
      await setup(ctx);
      const st = run(signed(camp()), [outcome('c1', 'm1', 'success')]).state;
      ctx.assert.equal(M.reputation(st, 'vdk'), 0);
    },
  },
  {
    id: 'contract-broken', spec: ['MGT-056'],
    name: 'A broken contract costs 30 with the employer',
    async run(ctx) {
      await setup(ctx);
      const st = run(signed(camp()), [act('contractBroken', 'ssv')]).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), -30);
    },
  },
  {
    id: 'friendly-acts', spec: ['MGT-057'],
    name: 'Join fight +5, rescue +10, supplies +1 per $1,000 (1…3 per sale), Krug deal kept +5',
    async run(ctx) {
      await setup(ctx);
      const one = (a, f, extra) => M.reputation(run(camp(), [act(a, f, extra)]).state, f);
      ctx.assert.equal(one('joinFight', 'vdk'), 5);
      ctx.assert.equal(one('rescue', 'vdk'), 10);
      ctx.assert.equal(one('sellSupplies', 'vdk', { amountUsd: 2500 }), 2);
      ctx.assert.equal(one('sellSupplies', 'vdk', { amountUsd: 500 }), 1);
      ctx.assert.equal(one('sellSupplies', 'vdk', { amountUsd: 9000 }), 3);
      ctx.assert.equal(one('krugKeepDeal', 'krug'), 5);
    },
  },
  {
    id: 'hostile-acts', spec: ['MGT-058'],
    name: 'Hostile acts change only the faction harmed by the drafted amounts',
    async run(ctx) {
      await setup(ctx);
      const cases = [['attackNonHostile', -30], ['cargo', -10], ['captureVip', -20], ['assassinateVip', -30], ['takeRegion', -15]];
      for (const [a, d] of cases) {
        const st = run(camp(), [act(a, 'vdk')]).state;
        ctx.assert.equal(M.reputation(st, 'vdk'), d, a);
        ctx.assert.equal(M.reputation(st, 'ssv'), 0, `${a}: no spill-over`);
      }
      ctx.assert.equal(M.reputation(run(camp(), [act('krugBreak', 'krug')]).state, 'krug'), -50);
    },
  },
  {
    id: 'kill-cap-per-fight', spec: ['MGT-058', 'MGT-064'],
    name: 'Kills from a witnessed battle cost 2 each, at most 20 per fight',
    async run(ctx) {
      await setup(ctx);
      const { state: st0, soldier: s } = add(camp());
      const mk = (count, witnesses) => br([{ id: s.id, status: 'leftMap' }], { acts: [{ type: 'killSoldier', faction: 'vdk', count }], witnesses });
      ctx.assert.equal(M.reputation(battle(st0, mk(4, { vdk: 1 })), 'vdk'), -8);
      ctx.assert.equal(M.reputation(battle(st0, mk(12, { vdk: 2 })), 'vdk'), -20);
      ctx.assert.equal(M.reputation(battle(st0, mk(12, {})), 'vdk'), 0, 'no surviving witness, no change');
    },
  },
  {
    id: 'war-crime-all-factions', spec: ['MGT-059', 'MGT-060'],
    name: 'A war crime costs 20 with every non-player faction',
    async run(ctx) {
      await setup(ctx);
      const st = run(camp(), [act('warCrime', 'vdk')]).state;
      for (const f of ['ssv', 'vdk', 'varyag', 'aegis', 'krug']) ctx.assert.equal(M.reputation(st, f), -20, f);
    },
  },
  {
    id: 'act-order-and-clamp', spec: ['MGT-060'],
    name: 'Acts apply in reported order with a clamp after each',
    async run(ctx) {
      await setup(ctx);
      const st = run(camp({ reputation: { ssv: 95 } }), [act('rescue', 'ssv'), act('attackNonHostile', 'ssv')]).state;
      ctx.assert.equal(M.reputation(st, 'ssv'), 70, '95 +10 → clamp 100, −30 → 70');
      const st2 = run(camp({ reputation: { ssv: 95 } }), [act('attackNonHostile', 'ssv'), act('rescue', 'ssv')]).state;
      ctx.assert.equal(M.reputation(st2, 'ssv'), 75);
    },
  },
  {
    id: 'unattributed-acts', spec: ['MGT-064'],
    name: 'An unattributed act changes nothing',
    async run(ctx) {
      await setup(ctx);
      const st = run(camp(), [act('assassinateVip', 'vdk', { attributed: false }), act('warCrime', 'vdk', { attributed: false })]).state;
      for (const f of ['ssv', 'vdk', 'krug']) ctx.assert.equal(M.reputation(st, f), 0, f);
    },
  },

  // ── Base & meta progression ───────────────────────────────────────────────────────────────────────
  {
    id: 'buy-fob', spec: ['MGT-066', 'MGT-070'],
    name: 'An FOB costs $25,000 (small city) or $50,000 (large); it gets a stash of its own',
    async run(ctx) {
      await setup(ctx);
      ctx.assert.equal(M.fobPrice('smallCity'), 25000);
      ctx.assert.equal(M.fobPrice('largeCity'), 50000);
      let r = M.buyFob(camp({ balanceUsd: 30000 }), { fobId: 'fob-b', size: 'smallCity' }, { time: T(2) });
      ctx.assert.ok(r.ok);
      ctx.assert.equal(M.balance(r.state), 5000);
      ctx.assert.equal(M.stashCount(r.state, 'fob-b', 'medkit'), 0);
      r = M.buyFob(camp({ balanceUsd: 30000 }), { fobId: 'fob-b', size: 'largeCity' }, { time: T(2) });
      ctx.assert.equal(r.ok, false);
      ctx.assert.equal(M.balance(r.state), 30000);
    },
  },
  {
    id: 'service-prices', spec: ['MGT-067', 'MGT-070'],
    name: 'Hospital $300 per wound, repair $20 per condition point, fuel $50 per unit; unaffordable = not given',
    async run(ctx) {
      await setup(ctx);
      const st = camp({ balanceUsd: 1000 });
      ctx.assert.equal(M.servicePrice(st, 'hospital', 3), 900);
      ctx.assert.equal(M.servicePrice(st, 'repair', 40), 800);
      ctx.assert.equal(M.servicePrice(st, 'fuel', 4), 200);
      const ok = M.buyService(st, { kind: 'hospital', quantity: 3 }, { time: T(1) });
      ctx.assert.ok(ok.ok);
      ctx.assert.equal(M.balance(ok.state), 100);
      const no = M.buyService(st, { kind: 'repair', quantity: 60 }, { time: T(1) });
      ctx.assert.equal(no.ok, false);
      ctx.assert.equal(M.balance(no.state), 1000);
    },
  },
  {
    id: 'field-weapon-repair', spec: ['MGT-067', 'MGT-009'],
    name: 'Field repair: +2 condition per hour per 10 Technical, ×1.25 with Armourer, capped at 100',
    async run(ctx) {
      await setup(ctx);
      ctx.assert.equal(M.fieldRepairCondition(60, 45, 2, []), 76);
      ctx.assert.equal(M.fieldRepairCondition(60, 45, 2, ['armourer']), 80);
      ctx.assert.equal(M.fieldRepairCondition(90, 80, 3, []), 100);
    },
  },
  {
    id: 'plant-output', spec: ['MGT-068', 'MGT-070'],
    name: 'plantOutput puts items into the receiving FOB stash and credits money with a ledger entry',
    async run(ctx) {
      await setup(ctx);
      const st = run(camp({ balanceUsd: 100, fobs: ['fob-a', 'fob-b'] }), [{ type: 'plantOutput', plantId: 'chem-1', fobId: 'fob-b', items: [{ item: 'medkit', count: 5 }] }, { type: 'plantOutput', plantId: 'min-1', fobId: 'fob-b', amountUsd: 1500 }], T(2, 0)).state;
      ctx.assert.equal(M.stashCount(st, 'fob-b', 'medkit'), 5);
      ctx.assert.equal(M.stashCount(st, 'fob-a', 'medkit'), 0);
      ctx.assert.equal(M.balance(st), 1600);
      ctx.assert.ok(M.ledger(st).some((e) => e.amountUsd === 1500 && e.time.day === 2));
    },
  },
  {
    id: 'ledger-never-negative', spec: ['MGT-070'],
    name: 'A debit larger than the balance fails whole; every booking is logged with game time',
    async run(ctx) {
      await setup(ctx);
      let r = run(camp({ balanceUsd: 400 }), [{ type: 'payCompensation', faction: 'vdk', amountUsd: 500 }]);
      ctx.assert.equal(r.results[0].ok, false);
      ctx.assert.equal(M.balance(r.state), 400);
      r = run(camp({ balanceUsd: 400 }), [{ type: 'payCompensation', faction: 'vdk', amountUsd: 400 }], T(3, 7));
      ctx.assert.equal(r.results[0].ok, true);
      ctx.assert.equal(M.balance(r.state), 0);
      const e = M.ledger(r.state).at(-1);
      ctx.assert.equal(e.amountUsd, -400);
      ctx.assert.deepEqual(e.time, { day: 3, hour: 7 });
      ctx.assert.deepEqual(M.debts(r.state), []);
    },
  },
  {
    id: 'campaign-score', spec: ['MGT-071'],
    name: 'Score = balance ÷ 1,000 + sum of positive reputations + 50 per active soldier',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 25500, reputation: { ssv: 30, vdk: -40, krug: 10 } });
      const ids = [];
      for (let i = 0; i < 5; i++) { const r = add(st, { seed: i + 1 }); st = r.state; ids.push(r.soldier.id); }
      st = run(st, [{ type: 'soldierFate', soldiers: [ids[3]], fate: 'dead' }, { type: 'soldierFate', soldiers: [ids[4]], fate: 'mia' }]).state;
      ctx.assert.ok(near(M.campaignScore(st), 25.5 + 40 + 150), `${M.campaignScore(st)}`);
    },
  },
  {
    id: 'plant-income-daily', spec: ['MGT-073', 'MGT-068'],
    name: 'Plant income is the only recurring booking; nothing else is booked at the rollover',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 0 });
      st = run(st, [{ type: 'dailyRollover', day: 2 }, { type: 'plantOutput', plantId: 'min-1', fobId: 'fob-a', amountUsd: 1500 }], T(2, 0)).state;
      ctx.assert.equal(M.balance(st), 1500);
      ctx.assert.equal(M.ledger(st).length, 1);
    },
  },

  // ── Interfaces ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'view-matches-schema', spec: ['MGT-072', 'MGT-054'],
    name: 'management_view validates and carries reputation with standing, contracts, funds and roster',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 700, reputation: { ssv: 25, vdk: -60 } });
      const a = add(st, { rank: 'regular', attributes: A(45) }); st = a.state;
      const b = add(st, { seed: 2 }); st = b.state;
      st = run(st, [{ type: 'soldierFate', soldiers: [b.soldier.id], fate: 'dead' }]).state;
      st = signed(st);
      const { view } = M.buildView(st, T(2, 6));
      noErrors(ctx.assert, validate(await schema('management_view'), view), 'management_view');
      ctx.assert.deepEqual(view.time, { day: 2, hour: 6 });
      ctx.assert.deepEqual(view.reputation.ssv, { value: 25, standing: 'friendly' });
      ctx.assert.deepEqual(view.reputation.vdk, { value: -60, standing: 'hostile' });
      ctx.assert.ok(!('player' in view.reputation));
      ctx.assert.deepEqual(view.funds, { balanceUsd: 700, debtsUsd: 0 });
      ctx.assert.deepEqual(view.roster.map((s) => s.id), [a.soldier.id], 'dead soldiers are not listed');
      ctx.assert.equal(view.roster[0].rank, 'regular');
      ctx.assert.ok(!('serviceRecord' in view.roster[0]) && !('callsign' in view.roster[0]) && !('feeDiscount' in view.roster[0]));
      const c = view.contracts.find((x) => x.id === 'c1');
      ctx.assert.equal(c.status, 'signed');
      ctx.assert.deepEqual(c.missions.map((m) => [m.key, m.pay, m.outcome]), [['m1', 9000, 'open'], ['m2', 13000, 'open'], ['m3', 22500, 'open']]);
    },
  },
  {
    id: 'view-ended-once', spec: ['MGT-072'],
    name: 'An ended contract is published in the next view only',
    async run(ctx) {
      await setup(ctx);
      let st = signed(camp());
      st = run(st, [{ type: 'contractEnded', contractId: 'c1', reason: 'employerDefault' }]).state;
      const v1 = M.buildView(st, T(1, 9));
      ctx.assert.equal(v1.view.contracts.find((c) => c.id === 'c1')?.status, 'ended');
      const v2 = M.buildView(v1.state, T(1, 10));
      ctx.assert.equal(v2.view.contracts.find((c) => c.id === 'c1'), undefined);
    },
  },
  {
    id: 'request-batch-matches-schema', spec: ['MGT-076', 'MGT-005', 'MGT-047'],
    name: 'A request batch with Management results validates against management_requests',
    async run(ctx) {
      await setup(ctx);
      let st = camp({ balanceUsd: 3000 });
      const a = add(st); st = a.state;
      const requests = [
        { type: 'contractOffer', offer: offer() },
        { type: 'acceptContract', contractId: 'c1' },
        { type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-a' },
        { type: 'payKrugPass', faction: 'krug', squad: 'sq1', amountUsd: 200 },
      ];
      const r = run(st, requests);
      ctx.assert.equal(r.results.length, 4);
      ctx.assert.deepEqual(r.results.map((x) => x.index), [0, 1, 2, 3]);
      noErrors(ctx.assert, validate(await schema('management_requests'), { time: T(1), requests, results: r.results }), 'management_requests');
    },
  },
  {
    id: 'payments-to-factions', spec: ['MGT-076', 'MGT-070'],
    name: 'payCompensation, payOffBounty, payKrugPass, payKrugEscort, buyIntel debit and leave reputation alone',
    async run(ctx) {
      await setup(ctx);
      const reqs = [
        { type: 'payCompensation', faction: 'vdk', amountUsd: 1000 },
        { type: 'payOffBounty', faction: 'ssv', amountUsd: 2000 },
        { type: 'payKrugPass', faction: 'krug', squad: 'sq1', amountUsd: 300 },
        { type: 'payKrugEscort', faction: 'krug', squad: 'sq1', amountUsd: 700 },
        { type: 'buyIntel', faction: 'vdk', amountUsd: 1500 },
      ];
      const r = run(camp({ balanceUsd: 5500 }), reqs);
      ctx.assert.ok(r.results.every((x) => x.ok), JSON.stringify(r.results));
      ctx.assert.equal(M.balance(r.state), 0);
      for (const f of ['vdk', 'ssv', 'krug']) ctx.assert.equal(M.reputation(r.state, f), 0, f);
      const poor = run(camp({ balanceUsd: 100 }), [{ type: 'buyIntel', faction: 'vdk', amountUsd: 1500 }]);
      ctx.assert.equal(poor.results[0].ok, false);
    },
  },
  {
    id: 'capital-income', spec: ['MGT-076', 'MGT-070'],
    name: 'capitalIncome credits economy',
    async run(ctx) {
      await setup(ctx);
      const r = run(camp({ balanceUsd: 10 }), [{ type: 'capitalIncome', amountUsd: 4000 }]);
      ctx.assert.equal(M.balance(r.state), 4010);
    },
  },
  {
    id: 'price-modifier', spec: ['MGT-076', 'MGT-067'],
    name: 'priceModifier multiplies fuel or medical prices; same ID replaces, factor 1 removes; regions limit it',
    async run(ctx) {
      await setup(ctx);
      let st = run(camp(), [{ type: 'priceModifier', modifierId: 'short-1', target: 'fuel', factor: 2 }]).state;
      ctx.assert.equal(M.servicePrice(st, 'fuel', 4), 400);
      ctx.assert.equal(M.servicePrice(st, 'hospital', 1), 300, 'medical prices untouched by a fuel modifier');
      st = run(st, [{ type: 'priceModifier', modifierId: 'short-1', target: 'fuel', factor: 1.5 }]).state;
      ctx.assert.equal(M.servicePrice(st, 'fuel', 4), 300, 'same ID replaces');
      st = run(st, [{ type: 'priceModifier', modifierId: 'short-1', target: 'fuel', factor: 1 }]).state;
      ctx.assert.equal(M.servicePrice(st, 'fuel', 4), 200, 'factor 1 removes');
      st = run(st, [{ type: 'priceModifier', modifierId: 'leak-1', target: 'medical', factor: 2, regions: ['r7'] }]).state;
      ctx.assert.equal(M.servicePrice(st, 'hospital', 1, 'r7'), 600);
      ctx.assert.equal(M.servicePrice(st, 'hospital', 1, 'r1'), 300);
    },
  },
];

// ── Adapter interface tests (/integrate) ───────────────────────────────────────────────────────────
// The adapter validates every input and output against spec/interfaces/ and keeps the five owned slices
// in a shared/state.js store.
let AD, SCH;
async function adapterSetup(ctx, { balanceUsd = 10000 } = {}) {
  await setup(ctx);
  AD ??= await import('../adapter/index.js');
  SCH ??= await AD.loadSchemas();
  const { createStore } = await import('../../../shared/state.js');
  let st = camp({ seed: 42, balanceUsd });
  st = add(st, { seed: 1, equipment: { weapon1: { id: 'i-ak1', item: 'ak74m', condition: 80 } } }).state; // s1
  st = add(st, { seed: 2 }).state; // s2
  const store = createStore(AD.toSlices(st));
  return { store, ad: AD.createManagementAdapter({ store, schemas: SCH }) };
}
const sample = (name) => fetchJson(`./fixtures/interfaces/${name}.sample.json`);

scenarios.push(
  {
    id: 'adapter-requests-sample', spec: ['MGT-076', 'MGT-005', 'MGT-036', 'MGT-047'],
    name: 'Adapter: the sample management_requests batch is accepted and answered with valid results',
    async run(ctx) {
      const { store, ad } = await adapterSetup(ctx);
      const batch = await sample('management_requests');
      const out = ad.handleRequests(batch); // validates input and output
      ctx.assert.equal(out.results.length, batch.requests.length);
      const byType = Object.fromEntries(batch.requests.map((r, i) => [r.type, out.results[i]]));
      ctx.assert.equal(byType.acceptContract.paymentDue.contractId, 'c-sample');
      ctx.assert.equal(byType.launchOp.feesUsd, 600);
      ctx.assert.equal(byType.launchOp.premiumUsd, 80);
      ctx.assert.equal(byType.healingTick.ok, false, 'blocked by Q52, refused with a reason');
      ctx.assert.ok(byType.healingTick.error);
      ctx.assert.equal(store.read('economy').balanceUsd, 10000 - 600 - 80 - 200);
      ctx.assert.equal(store.read('reputation').ssv, 5 + 5, 'joinFight +5, retrieve_deliver success +5');
    },
  },
  {
    id: 'adapter-battle-sample', spec: ['MGT-006', 'MGT-008', 'MGT-010', 'MGT-058', 'MGT-064'],
    name: 'Adapter: the sample battle_result is accepted and lands in the roster and reputation slices',
    async run(ctx) {
      const { store, ad } = await adapterSetup(ctx);
      ad.handleBattleResult(await sample('battle_result'), T(2, 10));
      const s1 = store.read('roster').soldiers.find((s) => s.id === 's1');
      ctx.assert.equal(s1.morale, 66);
      ctx.assert.equal(s1.wounds.zoneHp.leftArm, 12);
      ctx.assert.equal(s1.equipment.weapon1.condition, 74);
      ctx.assert.equal(s1.nerve, 1);
      ctx.assert.equal(store.read('roster').soldiers.find((s) => s.id === 's2').status, 'active', 'dead stays provisional until soldierFate');
      ctx.assert.equal(store.read('reputation').vdk, -6);
    },
  },
  {
    id: 'adapter-view-valid', spec: ['MGT-072'],
    name: 'Adapter: management_view validates on load, after requests and after a battle',
    async run(ctx) {
      const { ad } = await adapterSetup(ctx);
      let v = ad.view(T(1, 0));
      ctx.assert.deepEqual(v.roster.map((s) => s.id), ['s1', 's2']);
      ad.handleRequests(await sample('management_requests'));
      ad.handleBattleResult(await sample('battle_result'), T(2, 10));
      ad.handleRequests({ time: T(2, 11), requests: [{ type: 'soldierFate', soldiers: ['s2'], fate: 'dead' }] });
      v = ad.view(T(2, 11));
      ctx.assert.deepEqual(v.roster.map((s) => s.id), ['s1']);
      ctx.assert.equal(v.contracts.find((c) => c.id === 'c-sample').status, 'signed');
      ctx.assert.equal(v.funds.balanceUsd, 10000 - 880);
    },
  },
  {
    id: 'adapter-rejects-invalid', spec: ['MGT-076'],
    name: 'Adapter: input that breaks the interface schema is rejected and changes nothing',
    async run(ctx) {
      const { store, ad } = await adapterSetup(ctx);
      const before = store.serialize();
      let err = null;
      try { ad.handleRequests({ time: { day: 0, hour: 30 }, requests: [{ type: 'notAType' }] }); } catch (e) { err = e; }
      ctx.assert.ok(err instanceof AD.InterfaceError, `expected InterfaceError, got ${err}`);
      err = null;
      try { ad.handleBattleResult({ encounterId: 'x', outcome: 'won', gameTimeHours: 2, soldiers: [] }, T(1)); } catch (e) { err = e; }
      ctx.assert.ok(err instanceof AD.InterfaceError);
      ctx.assert.equal(store.serialize(), before);
    },
  },
  {
    id: 'adapter-slices-and-replay', spec: ['MGT-072'],
    name: 'Adapter: writes only Management slices, and the same save plus the same inputs gives the same result',
    async run(ctx) {
      const a = await adapterSetup(ctx);
      const b = await adapterSetup(ctx);
      const batch = await sample('management_requests');
      const offers = { time: T(2, 9), requests: Array.from({ length: 12 }, (_, i) => ({ type: 'contractOffer', offer: { ...batch.requests[0].offer, id: `u${i}`, deniable: true } })) };
      ctx.assert.deepEqual(a.ad.handleRequests(offers), b.ad.handleRequests(offers));
      ctx.assert.equal(a.store.serialize(), b.store.serialize());
      for (const k of ['world', 'battle']) ctx.assert.equal(a.store.read(k), null, `${k} touched`);
      let err = null;
      try { a.store.write('management', 'world', {}); } catch (e) { err = e; }
      ctx.assert.ok(err, 'store must refuse a management write to world');
    },
  },
  {
    id: 'adapter-new-campaign', spec: ['MGT-053', 'MGT-066', 'MGT-072'],
    name: 'Adapter: a new campaign writes all five slices and returns a valid view',
    async run(ctx) {
      await setup(ctx);
      AD ??= await import('../adapter/index.js');
      SCH ??= await AD.loadSchemas();
      const { createStore } = await import('../../../shared/state.js');
      const store = createStore();
      const ad = AD.createManagementAdapter({ store, schemas: SCH });
      const v = ad.newCampaign({ seed: 7, balanceUsd: 20000, fobs: ['fob-start'] });
      ctx.assert.deepEqual(v.funds, { balanceUsd: 20000, debtsUsd: 0 });
      ctx.assert.equal(v.reputation.krug.standing, 'neutral');
      for (const k of ['roster', 'unlocks', 'economy', 'contracts', 'reputation']) ctx.assert.ok(store.read(k), `${k} not written`);
      ctx.assert.equal(store.read('unlocks').campaignSeed, 7);
    },
  },
);

export default {
  module: 'management',
  scenarios,
};
