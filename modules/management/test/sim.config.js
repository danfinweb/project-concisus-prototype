// Management — full-loop simulation runs for the Test Lab's sim runner.
// Each sim: { id, spec: [...], name, run(core, data, seed, params) → { metric: value, … },
//             params: { name: [values…] }, metrics: ['winner', 'turns', …], seeds: 100 }
// Example (tactical): { id: 'duel', run: (core, data, seed, p) => core.resolveBattle(/* … */),
//                       params: { attackerPreset: ['rifleman'], terrain: ['open', 'urban'] },
//                       metrics: ['winner', 'turns', 'casualties'], seeds: 200 }
//
// The sims use the core API documented at the top of scenarios.js. They load the module fixtures
// (test/fixtures/) once, so they run before /data has content.

import { Rng } from '../../../shared/rng.js';
import { loadData } from '../../../shared/registry.js';

const FIX = ['management-rules', 'recruitment', 'economy-rules', 'callsigns', 'missions', 'factions', 'events', 'traders', 'items'];
let loaded;
const fixtures = () => (loaded ??= loadData(FIX, new URL('./fixtures', import.meta.url).href));
const T = (day, hour = 8) => ({ day, hour });
const A = (v) => ({ strength: v, endurance: v, agility: v, perception: v, marksmanship: v, recon: v, medical: v, technical: v });

export default {
  module: 'management',
  sims: [
    {
      id: 'candidate-attributes', spec: ['MGT-022', 'MGT-002', 'MGT-003'],
      name: 'Generated candidates per tier: attribute spread and hire price (expect mean ≈ range middle, price ≈ tier price)',
      async run(core, data, seed, p) {
        await fixtures();
        const c = core.generateCandidate({ tier: p.tier, pool: 'agency' }, new Rng(seed));
        const vals = Object.values(c.attributes);
        return {
          meanAttribute: vals.reduce((a, b) => a + b, 0) / vals.length,
          minAttribute: Math.min(...vals),
          maxAttribute: Math.max(...vals),
          hirePriceUsd: c.hirePriceUsd,
        };
      },
      params: { tier: ['recruit', 'regular', 'veteran', 'elite'] },
      metrics: ['meanAttribute', 'minAttribute', 'maxAttribute', 'hirePriceUsd'],
      seeds: 200,
    },
    {
      id: 'callsign-spread', spec: ['MGT-013', 'MGT-014', 'MGT-015'],
      name: 'Callsigns for a roster of fresh hires: share from the Generic list and share needing a -N suffix',
      async run(core, data, seed, p) {
        await fixtures();
        const rng = new Rng(seed);
        let st = core.newCampaign({ seed, balanceUsd: 0, fobs: ['fob-a'] });
        let generic = 0, suffixed = 0;
        const genericNames = ['Kid', 'Pup', 'Sparrow', 'Bones', 'Private'];
        for (let i = 0; i < p.rosterSize; i++) {
          const c = core.generateCandidate({ tier: p.tier, pool: 'agency' }, rng);
          const r = core.addSoldier(st, { rank: c.tier, attributes: c.attributes, fobId: 'fob-a', time: T(1), rng });
          st = r.state;
          const base = r.soldier.callsign.replace(/-\d+$/, '');
          if (genericNames.includes(base)) generic++;
          if (/-\d+$/.test(r.soldier.callsign)) suffixed++;
        }
        return { genericShare: generic / p.rosterSize, suffixedShare: suffixed / p.rosterSize };
      },
      params: { tier: ['recruit', 'veteran'], rosterSize: [10, 30] },
      metrics: ['genericShare', 'suffixedShare'],
      seeds: 50,
    },
    {
      id: 'krug-price-walk', spec: ['MGT-040'],
      name: 'A Krug price over a campaign year: largest deviation from base (must stay ≤ 0.30) and final ratio',
      async run(core, data, seed, p) {
        await fixtures();
        const rng = new Rng(seed);
        const base = 1000;
        let price = base, maxDev = 0;
        for (let d = 0; d < p.days; d++) {
          price = core.krugPriceStep(price, base, rng);
          maxDev = Math.max(maxDev, Math.abs(price / base - 1));
        }
        return { maxDeviation: maxDev, finalRatio: price / base };
      },
      params: { days: [30, 365] },
      metrics: ['maxDeviation', 'finalRatio'],
      seeds: 100,
    },
    {
      id: 'insurance-recovery', spec: ['MGT-036', 'MGT-011'],
      name: 'Insured rifle lost with its carrier: recovered share (expect ≈ 0.5) and cost per op',
      async run(core, data, seed) {
        await fixtures();
        let st = core.newCampaign({ seed, balanceUsd: 5000, fobs: ['fob-a'] });
        const a = core.addSoldier(st, { rank: 'recruit', attributes: A(30), fobId: 'fob-a', time: T(1), rng: new Rng(seed), equipment: { weapon1: { id: 'i-ak', item: 'ak74m', condition: 80 } } });
        st = a.state;
        const req = (time, requests) => core.applyRequests(st, { time, requests }, { rng: new Rng(seed + time.day * 100 + time.hour) });
        const launch = req(T(1, 8), [{ type: 'launchOp', squad: 'sq1', soldiers: [a.soldier.id], fobId: 'fob-a', insuredItems: ['i-ak'] }]);
        st = launch.state;
        st = req(T(1, 12), [{ type: 'soldierFate', soldiers: [a.soldier.id], fate: 'dead' }]).state;
        for (let d = 2; d <= 5; d++) st = req(T(d, 0), [{ type: 'dailyRollover', day: d }]).state;
        return { recovered: core.stashCount(st, 'fob-a', 'ak74m'), premiumUsd: launch.results[0].premiumUsd ?? 0 };
      },
      params: {},
      metrics: ['recovered', 'premiumUsd'],
      seeds: 400,
    },
    {
      id: 'disown-rate', spec: ['MGT-050'],
      name: 'Deniable contracts that go wrong once: disowned share by employer (expect VDK ≈ 0.30, SSV ≈ 0.10)',
      async run(core, data, seed, p) {
        await fixtures();
        const rng = () => new Rng(seed);
        const offer = {
          id: 'c1', employer: p.employer, targetFaction: null, sourceGoal: 'supplyRun',
          missions: [{ key: 'm1', missionId: 'retrieve_deliver', location: 'r1' }, { key: 'm2', missionId: 'retrieve_deliver', location: 'r2' }],
          deadline: { day: 10, hour: 0 }, payInputs: { distance: 0.5, danger: 0.5, urgency: 0.5 },
          intelLevel: 'exact', deniable: true, reputationGate: { better: false, sensitive: false }, boardLocation: 'fob-a', counterContractOf: null,
        };
        let st = core.newCampaign({ seed, balanceUsd: 0, fobs: ['fob-a'] });
        st = core.applyRequests(st, { time: T(1), requests: [{ type: 'contractOffer', offer }, { type: 'acceptContract', contractId: 'c1' }] }, { rng: rng() }).state;
        st = core.applyRequests(st, { time: T(2), requests: [{ type: 'missionOutcome', contractId: 'c1', missionKey: 'm1', outcome: 'failure' }] }, { rng: rng() }).state;
        const first = core.contract(st, 'c1').disowned;
        st = core.applyRequests(st, { time: T(3), requests: [{ type: 'missionOutcome', contractId: 'c1', missionKey: 'm2', outcome: 'failure' }] }, { rng: new Rng(seed + 7) }).state;
        return { disowned: first ? 1 : 0, changedOnSecondFailure: core.contract(st, 'c1').disowned !== first ? 1 : 0 };
      },
      params: { employer: ['vdk', 'ssv'] },
      metrics: ['disowned', 'changedOnSecondFailure'],
      seeds: 300,
    },
    {
      id: 'promotion-pace', spec: ['MGT-023', 'MGT-074', 'MGT-009'],
      name: 'Ops until a recruit at average 40 reaches regular and gains its first perk, by skill uses per op',
      async run(core, data, seed, p) {
        await fixtures();
        const rng = new Rng(seed);
        const c = core.generateCandidate({ tier: 'recruit', pool: 'agency' }, rng);
        let { state: st, soldier: s } = core.addSoldier(core.newCampaign({ seed, fobs: ['fob-a'] }), { rank: 'recruit', attributes: c.attributes, fobId: 'fob-a', time: T(1), rng });
        const skills = ['marksmanship', 'recon', 'medical', 'technical'];
        let opsToRegular = null, opsToPerk = null;
        for (let op = 1; op <= 200 && (opsToRegular === null || opsToPerk === null); op++) {
          for (let u = 0; u < p.usesPerOp; u++) st = core.addSkillUses(st, s.id, skills[rng.int(0, 3)], 1, T(op));
          const now = core.soldier(st, s.id);
          if (opsToRegular === null && now.rank !== 'recruit') opsToRegular = op;
          if (opsToPerk === null && now.perks.length > 0) opsToPerk = op;
        }
        return { opsToRegular: opsToRegular ?? 200, opsToPerk: opsToPerk ?? 200 };
      },
      params: { usesPerOp: [5, 15, 40] },
      metrics: ['opsToRegular', 'opsToPerk'],
      seeds: 100,
    },
  ],
};
