// Tier 3 — operational planner (SAI-009, SAI-014, SAI-015): turn the strategist's objectives into
// commands. Per squad and set at most one assignment (setGoal, acceptContract.squads, answerEscort.squad)
// and one action (moveSquad, hold, scout, attack); squads in transit get none (SAI-004).
// Planner considerations (raw units): progress (1 for a step that brings the squad closer), onTarget
// (1 when on the objective's tile), attackOdds (own share of the strength on the tile), risk (enemy
// share of the strength on the tile entered).
import { data } from './context.js';
import { score, pickBest, logEntry, doctrineLookup } from './scoring.js';
import { offerPay } from './strategist.js';

const RECRUIT_CATEGORIES = new Set(['town', 'smallCity', 'largeCity']); // STR-096
const HOURS_PER_DAY = 24;

export function plan(ctx, maps, doctrine, candidates, rng, pre) {
  const { view, self } = ctx;
  const commands = [], log = [];
  const taken = pre.taken; // squads already assigned this hour (escorts)
  const targetOf = new Map(pre.assigned); // squad → region it works toward
  const free = ctx.ownSquads.filter((s) => !s.transit);
  const positive = candidates.filter((c) => c.kind !== 'measure' && c.total > 0).sort((a, b) => b.total - a.total);
  const unmet = [];

  for (const c of positive) {
    const avail = free.filter((s) => !taken.has(s.id) && Number.isFinite(ctx.stepsBetween(s.region, c.region)));
    if (!avail.length) { if (c.kind === 'objective') unmet.push(c); continue; }
    if (c.kind === 'accept') {
      const s = closest(ctx, avail, c.region);
      taken.add(s.id); targetOf.set(s.id, c.region);
      commands.push({ type: 'acceptContract', contractId: c.offer.id, squads: [s.id] });
      continue;
    }
    const keeper = avail.find((s) => s.goal === c.goal && s.target === c.target);
    const s = keeper ?? closest(ctx, avail, c.region);
    taken.add(s.id); targetOf.set(s.id, c.region);
    if (!keeper) commands.push({ type: 'setGoal', squad: s.id, goal: c.goal, target: c.target });
  }
  // Squads left over keep the goal they have.
  for (const s of free) if (!targetOf.has(s.id) && s.goal) targetOf.set(s.id, ctx.regionOf(s.target));

  // An objective no own squad can take: post it as a contract (as readily as contractUse) or raise a
  // squad; never spend more than the funds under hardLimit (SAI-014, STR-092, STR-096).
  const top = unmet.find((c) => !alreadyPosted(view, c));
  if (top) {
    const spend = coverObjective(ctx, maps, doctrine, top, rng, positive[0].total);
    if (spend) {
      commands.push(spend.command);
      log.push(logEntry(view, 'planner', `cover ${top.label}`, [{ option: spend.label, total: top.total, considerations: {} }],
        { option: spend.label }, doctrine.logTopN));
    }
  }

  // One action per free squad.
  const lookup = doctrineLookup(doctrine);
  for (const s of free) {
    const target = targetOf.get(s.id);
    const options = [];
    options.push({ ...score(`${s.id}:hold`, { onTarget: target === s.region ? 1 : 0 }, lookup), cmd: { type: 'hold', squad: s.id } });
    if (target && target !== s.region) {
      const p = ctx.path(s.region, target);
      if (p && p.length > 1) {
        const next = p[1];
        options.push({ ...score(`${s.id}:move:${next}`, { progress: 1, risk: riskShare(maps, next, s.strength ?? 0) }, lookup),
          cmd: { type: 'moveSquad', squad: s.id, toRegion: next } });
      }
    }
    const own = s.strength ?? 0;
    for (const k of ctx.knownSquads) {
      if (!k.id || k.region !== s.region || !ctx.isEnemy(k.faction)) continue;
      const enemy = k.estimatedStrength ?? 0;
      options.push({ ...score(`${s.id}:attack:${k.id}`, { attackOdds: own + enemy > 0 ? own / (own + enemy) : 0 }, lookup),
        cmd: { type: 'attack', squad: s.id, target: k.id } });
    }
    const here = ctx.regions.get(s.region);
    if (target === s.region && here?.poi && here.controller && ctx.isEnemy(here.controller)) {
      const enemy = maps[s.region]?.enemyStrength ?? 0;
      options.push({ ...score(`${s.id}:attack:${s.region}`, { attackOdds: own + enemy > 0 ? own / (own + enemy) : 0 }, lookup),
        cmd: { type: 'attack', squad: s.id, target: s.region } });
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
function riskShare(maps, region, own) {
  const t = maps[region]?.threat ?? 0;
  return t + own > 0 ? t / (t + own) : 0;
}
function alreadyPosted(view, c) {
  return (view.contracts ?? []).some((k) => k.role === 'employer' && (k.status === 'open' || k.status === 'accepted')
    && k.sourceGoal === c.goal && (k.missions ?? []).some((m) => m.location === c.target || (m.targets ?? []).includes(c.target)));
}

function coverObjective(ctx, maps, doctrine, c, rng, best) {
  const { view, self } = ctx;
  const hardLimit = (data.get('economy-rules', 'fundsMode') ?? 'hardLimit') === 'hardLimit';
  const funds = view.funds ?? 0;
  const affordable = (usd) => !hardLimit || usd <= funds;
  const contractUse = doctrine.personality?.contractUse ?? 0;
  if (rng.next() < contractUse) {
    const offer = buildOffer(ctx, maps, c, best);
    if (offer && affordable(offerPay(offer.missions, offer.payInputs))) {
      return { command: { type: 'offerContract', contract: offer }, label: `offer:${offer.id}` };
    }
  }
  const template = ctx.faction?.squadTemplate;
  const perSoldier = data.get('strategic-rules', 'raiseSquad')?.costPerSoldierUsd;
  if (template?.size && typeof perSoldier === 'number' && affordable(perSoldier * template.size)) {
    const tiles = (view.ownRegions ?? []).filter((r) => RECRUIT_CATEGORIES.has(data.get('poi', r.poi)?.category));
    if (tiles.length) {
      const t = tiles.reduce((a, b) => (ctx.manhattan(b.id, c.region) < ctx.manhattan(a.id, c.region) ? b : a));
      return { command: { type: 'recruit', target: t.id }, label: `recruit:${t.id}` };
    }
  }
  return null;
}

// An offer for one objective (STR-044 fields). Pay inputs are 0..1 shares set by the employer (MGT-046):
// distance relative to the map's span, danger = enemy share around the target, urgency = this
// objective's share of the best score. Deadline: there and back from the board plus one crossing of the
// target tile (the spec sets no deadline rule; see SCOPE open questions).
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
      danger: riskShare(maps, c.region, maps[c.region]?.ownStrength ?? 0),
      urgency: best > 0 ? Math.min(1, c.total / best) : 0,
    },
    intelLevel: observed && observed.day === view.time.day && observed.hour === view.time.hour ? 'exact' : 'lastKnown',
    deniable: false,
    reputationGate: { better: false, sensitive: false },
    boardLocation: board,
    counterContractOf: null,
  };
}
