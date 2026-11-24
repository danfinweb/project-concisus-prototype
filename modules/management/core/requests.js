// management_requests, battle_result and op return handling (MGT-005, MGT-006, MGT-008, MGT-010,
// MGT-011, MGT-031, MGT-035..MGT-037, MGT-060, MGT-064, MGT-068, MGT-073, MGT-076).
import { rules, item, SKILLS } from './data.js';
import { clone, findSoldier, stashAdd, stashTake, newInstanceId, ensureFob } from './state.js';
import { credit, debit, setPriceModifier, insurancePremium } from './money.js';
import { feePerOp, growSkill, addNerve, setMorale } from './soldiers.js';
import { applyAct } from './reputation.js';
import { storeOffer, accept, missionOutcome, contractEnded, findContract } from './contracts.js';

const PAYMENTS = new Set(['payCompensation', 'payOffBounty', 'payKrugPass', 'payKrugEscort', 'buyIntel']);
// Types whose payload the spec does not define yet (SCOPE open question 3) or whose rule is blocked
// (Q51 contamination split, Q52 recovery rate). They are refused, so nothing changes silently.
const NOT_HANDLED = {
  hire: 'payload not defined', trade: 'payload not defined', barter: 'payload not defined',
  vehicleTrade: 'payload not defined', handIn: 'payload not defined', hospital: 'payload not defined',
  repair: 'payload not defined', refuel: 'payload not defined', buyFob: 'payload not defined',
  opReturn: 'payload not defined', localRecruits: 'payload not defined', handOver: 'item removal from squad containers not built yet',
  healingTick: 'blocked: recovery rate not set (MGT Q52)', contaminationTick: 'blocked: HP split over zones not set (MGT Q51)',
};

export function applyRequests(state, { time, requests }, { rng }) {
  const st = clone(state);
  const results = requests.map((r, index) => ({ index, ...applyOne(st, r, time, rng) }));
  return { state: st, results };
}

function applyOne(st, r, time, rng) {
  if (PAYMENTS.has(r.type)) return debit(st, r.amountUsd, r.type, time, { faction: r.faction }) ? { ok: true } : { ok: false, error: 'balance too low' };
  switch (r.type) {
    case 'contractOffer': return storeOffer(st, r.offer, rng);
    case 'acceptContract': return accept(st, r.contractId);
    case 'missionOutcome': return missionOutcome(st, r, rng);
    case 'contractEnded': return contractEnded(st, r, rng);
    case 'contractPayment': credit(st, r.amountUsd, 'contractPayment', time, { contractId: r.contractId, employer: r.employer }); return { ok: true };
    case 'launchOp': return launchOp(st, r, time);
    case 'soldierFate': return soldierFate(st, r, time, rng);
    case 'plantOutput': return plantOutput(st, r, time);
    case 'dailyRollover': return dailyRollover(st, r);
    case 'reputationAct':
      if (r.attributed !== false) applyAct(st, r.act, r.faction, { amountUsd: r.amountUsd });
      return { ok: true };
    case 'moraleChange':
      for (const { soldier: id, delta } of r.moraleChanges ?? []) { const s = findSoldier(st, id); if (s) setMorale(s, s.morale + delta); }
      return { ok: true };
    case 'capitalIncome': credit(st, r.amountUsd, 'capitalIncome', time); return { ok: true };
    case 'priceModifier': setPriceModifier(st, r); return { ok: true };
    default: return { ok: false, error: NOT_HANDLED[r.type] ?? `unknown request type ${r.type}` };
  }
}

// ── Launch (MGT-005, MGT-036) ──
function instancesOf(s) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') { if (v.id && v.item) out.push(v); Object.values(v).forEach(walk); }
  };
  walk(s.equipment);
  return out;
}
function launchOp(st, { squad, soldiers, fobId, insuredItems = [] }, time) {
  const list = soldiers.map((id) => findSoldier(st, id));
  if (list.some((s) => !s || s.status !== 'active')) return { ok: false, error: 'soldier not available' };
  const feesUsd = list.reduce((a, s) => a + feePerOp(s), 0);
  const insured = list.flatMap(instancesOf).filter((i) => insuredItems.includes(i.id));
  const premiumUsd = insurancePremium(insured.map((i) => i.item));
  if (!debit(st, feesUsd + premiumUsd, 'launchOp', time, { squad })) return { ok: false, error: 'balance too low' };
  st.unlocks.ops[squad] = { fobId, soldiers: [...soldiers], insured: insured.map((i) => i.id), launchedAt: time };
  for (const s of list) s.serviceRecord.push({ kind: 'deployment', time, event: 'opJoined', squad });
  return { ok: true, feesUsd, premiumUsd };
}
const opOf = (st, soldierId) => Object.entries(st.unlocks.ops).find(([, op]) => op.soldiers.includes(soldierId));

// ── Fates (MGT-011, MGT-012, MGT-036) ──
function soldierFate(st, { soldiers, fate, fobId }, time, rng) {
  for (const id of soldiers) {
    const s = findSoldier(st, id);
    if (!s) continue;
    if (fate === 'returned') {
      if (s.status === 'mia' || s.status === 'captured') {
        s.status = 'active';
        s.fobId = fobId ?? s.fobId;
        s.serviceRecord.push({ kind: 'deployment', time, event: 'returned', fobId: s.fobId });
      }
      continue;
    }
    loseGear(st, s, time, rng);
    if (fate === 'dead') {
      s.status = 'dead';
      const op = opOf(st, id)?.[1];
      for (const mate of op?.soldiers ?? []) {
        const m = findSoldier(st, mate);
        if (m && m.id !== id && m.status !== 'dead') m.serviceRecord.push({ kind: 'comradeLost', time, soldier: id });
      }
      st.roster.soldiers = st.roster.soldiers.filter((x) => x !== s);
      st.roster.memorial.push(s);
    } else s.status = fate;
  }
  return { ok: true };
}
// Gear on a soldier who does not come back stays on the map; insured items may be recovered.
function loseGear(st, s, time, rng) {
  const entry = opOf(st, s.id);
  const ins = rules('insurance');
  for (const inst of instancesOf(s)) {
    if (entry && entry[1].insured.includes(inst.id) && rng.next() < ins.recoveryChance) {
      st.unlocks.recoveries.push({ item: inst.item, fobId: entry[1].fobId, dueDay: time.day + ins.delayDays });
    }
  }
  s.equipment = {};
}

// ── Daily rollover (STR-004): deliveries due, idle-day counts. No salaries or upkeep (MGT-073). ──
function dailyRollover(st, { day }) {
  const due = st.unlocks.recoveries.filter((r) => r.dueDay <= day);
  st.unlocks.recoveries = st.unlocks.recoveries.filter((r) => r.dueDay > day);
  for (const r of due) stashAdd(st, r.fobId, r.item, 1);
  for (const s of st.roster.soldiers) for (const k of SKILLS) s.skillIdleDays[k] += 1;
  return { ok: true };
}

// ── Plant output (MGT-068) ──
function plantOutput(st, { plantId, fobId, items = [], amountUsd }, time) {
  ensureFob(st, fobId);
  for (const { item: id, count = 1 } of items) stashAdd(st, fobId, id, count);
  if (amountUsd) credit(st, amountUsd, 'plantOutput', time, { plantId });
  return { ok: true };
}

// ── Battle results (MGT-006, MGT-008, MGT-010, MGT-023, MGT-031, MGT-058, MGT-064) ──
export function applyBattleResult(state, br, { time, rng }) {
  const st = clone(state);
  for (const r of br.soldiers ?? []) {
    const s = findSoldier(st, r.id);
    if (!s) continue;
    // leftMap and active stay active; dead / mia / captured are provisional until soldierFate (MGT-001).
    if (r.zoneHp || r.conditions) s.wounds = { zoneHp: structuredClone(r.zoneHp ?? s.wounds.zoneHp), conditions: structuredClone(r.conditions ?? []) };
    if (r.conditions?.length) s.serviceRecord.push({ kind: 'wound', time, conditions: structuredClone(r.conditions) });
    if (r.equipment) s.equipment = structuredClone(r.equipment);
    if (typeof r.morale === 'number') setMorale(s, r.morale);
    for (const k of r.kills ?? []) s.serviceRecord.push({ kind: 'kill', time, faction: k.faction, distanceTiles: k.distanceTiles });
    if (r.underFire) addNerve(s, rules('nerve').perFightUnderFire);
    // skillUse items are not typed in battle_result; { skill, uses } is read when present.
    for (const u of r.skillUse ?? []) if (SKILLS.includes(u.skill)) growSkill(s, u.skill, u.uses ?? 1, time);
  }
  // Acts: one total per act and faction per fight (the kill cap is per fight); only witnessed acts count.
  const totals = new Map();
  for (const a of br.acts ?? []) {
    const key = `${a.type}|${a.faction ?? ''}`;
    totals.set(key, { act: a.type, faction: a.faction, count: (totals.get(key)?.count ?? 0) + (a.count ?? 1) });
  }
  for (const a of totals.values()) {
    if ((br.witnesses?.[a.faction] ?? 0) > 0) applyAct(st, a.act, a.faction, { count: a.count });
  }
  return { state: st };
}

// ── Op return (MGT-006, MGT-031, MGT-035) ──
export function opReturn(state, { squad, soldiers, fobId, loot = [] }, { time }) {
  const st = clone(state);
  ensureFob(st, fobId);
  for (const id of soldiers) {
    const s = findSoldier(st, id);
    if (!s || s.status !== 'active') continue;
    s.fobId = fobId;
    s.serviceRecord.push({ kind: 'deployment', time, event: 'opReturned', squad });
    addNerve(s, rules('nerve').perDeployment);
  }
  const byCarrier = new Map();
  for (const { item: id, count = 1, carrier } of loot) {
    stashAdd(st, fobId, id, count);
    const def = item(id) ?? {};
    const c = byCarrier.get(carrier) ?? { weightKg: 0, valueUsd: 0 };
    c.weightKg += (def.weightKg ?? 0) * count;
    c.valueUsd += (def.valueUsd ?? 0) * count;
    byCarrier.set(carrier, c);
  }
  for (const [carrier, c] of byCarrier) findSoldier(st, carrier)?.serviceRecord.push({ kind: 'lootCarriedOut', time, ...c });
  delete st.unlocks.ops[squad]; // insurance covers one op (MGT-036)
  return { state: st };
}

// ── Loadout presets (MGT-037) ──
export function savePreset(state, name, slots) {
  const st = clone(state);
  st.roster.presets[name] = structuredClone(slots);
  return st;
}
export function applyPreset(state, soldierId, name, fobId) {
  const st = clone(state);
  const s = findSoldier(st, soldierId);
  const preset = st.roster.presets[name] ?? {};
  const missing = [];
  for (const [slot, id] of Object.entries(preset)) {
    if (!stashTake(st, fobId, id)) { missing.push(id); continue; }
    if (s.equipment[slot]) stashAdd(st, fobId, s.equipment[slot].item, 1);
    s.equipment[slot] = { id: newInstanceId(st), item: id };
  }
  return { state: st, missing };
}

export { findContract };
