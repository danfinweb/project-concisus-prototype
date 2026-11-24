// Tier 3 — operational planner (SAI-009, SAI-014, SAI-015): turn the strategist's objectives into
// commands. Per squad and set at most one assignment (setGoal, acceptContract.squads, answerEscort.squad)
// and one action (moveSquad, hold, scout, attack). Squads in transit keep moving: the spec lets an action
// cancel the move (SAI-004), the planner does not use that yet.
// Action options are worth their objective's strategist score when they advance it (a step toward the
// target; holding on a holdPoi/patrol/tradeRoute/escort target; attacking the objective's squad or POI)
// and 0 otherwise, minus the doctrine's `risk` term on the threat layer of the tile entered (SAI-006).
// Covering an objective no own squad can take (SAI-014): post it as a contract (worth contractUse × its
// score) or raise a squad (worth its score), each minus `cost` (USD spent now) and, under scoreTerm,
// `overdraft`; or do nothing (0). Under hardLimit only what the funds cover is a candidate.
import { data } from './context.js';
import { score, pickBest, logEntry, doctrineLookup } from './scoring.js';
import { offerPay } from './strategist.js';

const RECRUIT_CATEGORIES = new Set(['town', 'smallCity', 'largeCity']); // STR-096
const HOLD_GOALS = new Set(['holdPoi', 'patrol', 'tradeRoute', 'escort', 'supplyRun']);
const HOURS_PER_DAY = 24;

export function plan(ctx, maps, doctrine, candidates, rng, pre) {
  const { view } = ctx;
  const commands = [], log = [];
  const lookup = doctrineLookup(doctrine);
  const taken = pre.taken; // squads already assigned this hour (escorts)
  const job = new Map(); // squad → { region, goal, target, value }
  for (const [sq, a] of pre.assigned) job.set(sq, { region: a.region, goal: 'escort', target: a.region, value: a.value });
  const free = ctx.ownSquads.filter((s) => !s.transit);
  const positive = candidates.filter((c) => c.kind !== 'measure' && c.total > 0).sort((a, b) => b.total - a.total);
  const unmet = [];

  for (const c of positive) {
    const avail = free.filter((s) => !taken.has(s.id) && Number.isFinite(ctx.stepsBetween(s.region, c.region)));
    if (!avail.length) { if (c.kind === 'objective') unmet.push(c); continue; }
    if (c.kind === 'accept') {
      const s = closest(ctx, avail, c.region);
      taken.add(s.id); job.set(s.id, { region: c.region, goal: c.goal, target: c.target, value: c.total });
      commands.push({ type: 'acceptContract', contractId: c.offer.id, squads: [s.id] });
      continue;
    }
    const keeper = avail.find((s) => s.goal === c.goal && s.target === c.target);
    const s = keeper ?? closest(ctx, avail, c.region);
    taken.add(s.id); job.set(s.id, { region: c.region, goal: c.goal, target: c.target, value: c.total });
    if (!keeper) commands.push({ type: 'setGoal', squad: s.id, goal: c.goal, target: c.target });
  }
  // Squads left over keep the goal they have, worth what the strategist scored it.
  for (const s of free) {
    if (job.has(s.id) || !s.goal) continue;
    const c = candidates.find((x) => x.goal === s.goal && x.target === s.target);
    job.set(s.id, { region: ctx.regionOf(s.target), goal: s.goal, target: s.target, value: c ? Math.max(0, c.total) : 0 });
  }

  const top = unmet.find((c) => !alreadyPosted(view, c));
  if (top) {
    const cover = coverOptions(ctx, maps, doctrine, top, positive[0].total, lookup);
    const chosen = pickBest(cover, rng);
    log.push(logEntry(view, 'planner', `cover ${top.label}`, cover, chosen, doctrine.logTopN));
    if (chosen.cmd) commands.push(chosen.cmd);
  }

  for (const s of free) {
    const j = job.get(s.id);
    const options = [];
    const atTarget = j && j.region === s.region;
    options.push({ ...score(`${s.id}:hold`, {}, lookup), cmd: { type: 'hold', squad: s.id } });
    if (atTarget && HOLD_GOALS.has(j.goal)) options[0].total += j.value;
    if (j?.region && !atTarget) {
      const p = ctx.path(s.region, j.region);
      if (p && p.length > 1) {
        const next = p[1];
        const o = score(`${s.id}:move:${next}`, { risk: maps[next]?.threat ?? 0 }, lookup);
        options.push({ ...o, total: o.total + j.value, cmd: { type: 'moveSquad', squad: s.id, toRegion: next } });
      }
    }
    if (j && (j.goal === 'hunt' || j.goal === 'attackPoi')) {
      const here = ctx.regions.get(s.region);
      const targetSquad = j.goal === 'hunt' && ctx.knownSquads.find((k) => k.id === j.target && k.region === s.region);
      const targetPoi = j.goal === 'attackPoi' && atTarget && here?.controller && ctx.isEnemy(here.controller) ? s.region : null;
      const t = targetSquad ? targetSquad.id : targetPoi;
      if (t) {
        const o = score(`${s.id}:attack:${t}`, { risk: maps[s.region]?.threat ?? 0 }, lookup);
        options.push({ ...o, total: o.total + j.value, cmd: { type: 'attack', squad: s.id, target: t } });
      }
    }
    const chosen = pickBest(options, rng);
    commands.push(chosen.cmd);
    log.push(logEntry(view, 'planner', `action ${s.id}`, options, chosen, doctrine.logTopN));
  }
  return { commands, log };
}

function closest(ctx, squads, region) {
  return squads.reduce((a, b) => (ctx.stepsBetween(b.region, region) < ctx.stepsBetween(a.region, region) ? b : a));
}
function alreadyPosted(view, c) {
  return (view.contracts ?? []).some((k) => k.role === 'employer' && (k.status === 'open' || k.status === 'accepted')
    && k.sourceGoal === c.goal && (k.missions ?? []).some((m) => m.location === c.target || (m.targets ?? []).includes(c.target)));
}

function coverOptions(ctx, maps, doctrine, c, best, lookup) {
  const { view } = ctx;
  const hardLimit = (data.get('economy-rules', 'fundsMode') ?? 'hardLimit') === 'hardLimit';
  const funds = view.funds ?? 0;
  const affordable = (usd) => !hardLimit || usd <= funds;
  const money = (usd) => (typeof view.overdraft === 'number' && usd > 0 ? { cost: usd, overdraft: view.overdraft } : { cost: usd });
  const options = [{ option: 'none', total: 0, considerations: {}, cmd: null }];

  const offer = buildOffer(ctx, maps, c, best);
  if (offer) {
    const pay = offerPay(offer.missions, offer.payInputs);
    if (affordable(pay)) {
      const o = score(`offer:${offer.id}`, money(pay), lookup);
      options.push({ ...o, total: o.total + (doctrine.personality?.contractUse ?? 0) * c.total, cmd: { type: 'offerContract', contract: offer } });
    }
  }
  const size = ctx.faction?.squadTemplate?.size;
  const perSoldier = data.get('strategic-rules', 'raiseSquad')?.costPerSoldierUsd;
  if (size && typeof perSoldier === 'number' && (view.recruitsAvailable ?? 0) >= size && affordable(perSoldier * size)) {
    const tiles = (view.ownRegions ?? []).filter((r) => RECRUIT_CATEGORIES.has(data.get('poi', r.poi)?.category));
    if (tiles.length) {
      const t = tiles.reduce((a, b) => (ctx.manhattan(b.id, c.region) < ctx.manhattan(a.id, c.region) ? b : a));
      const o = score(`recruit:${t.id}`, money(perSoldier * size), lookup);
      options.push({ ...o, total: o.total + c.total, cmd: { type: 'recruit', target: t.id } });
    }
  }
  return options;
}

// An offer for one objective (STR-044 fields). Pay inputs are 0..1 shares set by the employer (MGT-046):
// distance relative to the map's span, danger = threat layer at the target, urgency = this objective's
// share of the best score. Deadline: there and back from the board plus one crossing of the target tile
// (the spec sets no deadline rule; SCOPE open question 6).
function buildOffer(ctx, maps, c, best) {
  const { view, self } = ctx;
  const mission = data.all('missions').find((m) => (m.goals ?? []).includes(c.goal));
  if (!mission) return null;
  const boards = (view.ownRegions ?? []).filter((r) => r.poi).map((r) => r.id);
  const board = boards.length ? boards.reduce((a, b) => (ctx.manhattan(b, c.region) < ctx.manhattan(a, c.region) ? b : a)) : c.region;
  const p = ctx.path(board, c.region) ?? [board, c.region];
  const span = Math.max(1, ...ctx.regionList.map((r) => ctx.manhattan(board, r.id)).filter(Number.isFinite));
  const hours = 2 * ctx.pathHours(p) + (ctx.terrain(c.region)?.moveHours ?? 0);
  const t = view.time.day * HOURS_PER_DAY + view.time.hour + Math.max(1, hours);
  const observed = ctx.regions.get(c.region)?.observed;
  const owner = ctx.regions.get(c.region)?.controller;
  return {
    id: `${self}-d${view.time.day}h${view.time.hour}-${c.goal}-${c.target}`,
    employer: self,
    targetFaction: owner && owner !== self ? owner : null,
    sourceGoal: c.goal,
    missions: [{ key: 'm1', missionId: mission.id, targets: [c.target], location: c.region }],
    deadline: { day: Math.floor(t / HOURS_PER_DAY), hour: t % HOURS_PER_DAY },
    payInputs: {
      distance: Math.min(1, (p.length - 1) / span),
      danger: maps[c.region]?.threat ?? 0,
      urgency: best > 0 ? Math.min(1, c.total / best) : 0,
    },
    intelLevel: observed && observed.day === view.time.day && observed.hour === view.time.hour ? 'exact' : 'lastKnown',
    deniable: false,
    reputationGate: { better: false, sensitive: false },
    boardLocation: board,
    counterContractOf: null,
  };
}
