// management_view (MGT-072): the only way other modules read Management-owned slices.
import { clone } from './state.js';
import { standing } from './reputation.js';

const VIEW_SOLDIER_FIELDS = ['id', 'status', 'rank', 'morale', 'attributes', 'nerve', 'wounds', 'equipment', 'perks'];

export function buildView(state, time) {
  const st = clone(state);
  const reputation = {};
  for (const [f, value] of Object.entries(st.reputation)) reputation[f] = { value, standing: standing(value) };
  const published = new Set(st.contracts.publishedEnded);
  const contracts = [];
  for (const c of st.contracts.list) {
    if (c.status === 'ended') {
      if (published.has(c.id)) continue;
      st.contracts.publishedEnded.push(c.id);
    }
    contracts.push(contractView(c));
  }
  const roster = st.roster.soldiers.filter((s) => s.status !== 'dead').map((s) => Object.fromEntries(VIEW_SOLDIER_FIELDS.map((k) => [k, structuredClone(s[k])])));
  const funds = { balanceUsd: st.economy.balanceUsd, debtsUsd: st.economy.debts.reduce((a, d) => a + d.amountUsd, 0) };
  return { view: { time: { day: time.day, hour: time.hour }, reputation, contracts, funds, roster }, state: st };
}

function contractView(c) {
  const v = {
    id: c.id, employer: c.employer, targetFaction: c.targetFaction ?? null, status: c.status, disowned: c.disowned,
    pay: c.pay, advance: c.advance,
    missions: c.missions.map((m) => ({ key: m.key, missionId: m.missionId, pay: m.pay, ...(m.location != null ? { location: m.location } : {}), outcome: m.outcome })),
  };
  if (c.deadline) v.deadline = { day: c.deadline.day, hour: c.deadline.hour };
  if (c.status === 'ended' && c.endReason) v.endReason = c.endReason;
  return v;
}
