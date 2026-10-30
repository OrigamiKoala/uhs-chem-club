/**
 * drills.js — the pure half of the Drill Deck.
 *
 * Every practice question in the Learn track lives in the question bank
 * (`learn/bank.js`, one JSON file per world). The Drill Deck
 * (`screens/drills.js`) pools them in one place and turns them into rounds;
 * this file decides WHAT is asked and what a result means, and touches no DOM,
 * so `tools/verify-drills.mjs` can run all of it in Node.
 *
 * NO XP, EVER. A drill moves nothing in Standings and calls nothing that
 * does: its rewards are stars, streaks, mastery tiers and commendations, all
 * cosmetic. `verify:learn` fails the build if anything under `src/learn` calls
 * the XP rails.
 *
 * What is stored (`session.practice`, synced to the Sheet, union-merged — every
 * number only ever grows, so two devices cannot erase each other):
 *
 *   q     { "<questId>#<n>": { c: times right, m: times missed } }
 *   days  ["2026-10-15", ...]  days on which a round was finished (the streak)
 *   runs  rounds finished
 *   stars { "<scope>": 0..3 }  best stars for a ten-question run of that scope
 *   best  { sprint: n }        best timed round
 */

import { WORLDS } from './curriculum.js';
import { worldProblems } from './bank.js';

export const RUN_LENGTH = 10;
export const DAILY_LENGTH = 5;
export const SPRINT_SECONDS = 90;
export const SPRINT_LIVES = 3;

/** Right at least twice, and right more often than wrong. */
export const MASTERY_RIGHT = 2;

export const TIERS = [
  { id: 'gold', label: 'Gold', min: 0.9 },
  { id: 'silver', label: 'Silver', min: 0.6 },
  { id: 'bronze', label: 'Bronze', min: 0.25 }
];

export function newPractice() {
  return { q: {}, days: [], runs: 0, stars: {}, best: {} };
}

/** Coerce whatever was stored into a well-formed record (never throws). */
export function normalizePractice(p) {
  const out = newPractice();
  if (!p || typeof p !== 'object') return out;
  if (p.q && typeof p.q === 'object') out.q = p.q;
  if (Array.isArray(p.days)) out.days = p.days;
  if (typeof p.runs === 'number') out.runs = p.runs;
  if (p.stars && typeof p.stars === 'object') out.stars = p.stars;
  if (p.best && typeof p.best === 'object') out.best = p.best;
  return out;
}

/* ------------------------------------------------------------------
   THE POOL
   ------------------------------------------------------------------ */

const poolCache = new Map();

/** Worlds that have at least one built quest, in road order. */
export function drillWorlds() {
  return WORLDS.filter(w => w.status === 'live');
}

/** Ids of every question a world holds (bench pairs and the end set). */
export function worldQuestionIds(world) {
  return worldProblems(world).map(p => p.id);
}

/** Every problem in a world, bench pairs in road order, then the end set. Never padded. */
export async function loadWorldPractice(world) {
  if (!world) return [];
  if (poolCache.has(world.id)) return poolCache.get(world.id);
  const out = worldProblems(world);
  poolCache.set(world.id, out);
  return out;
}

/** Pool for a scope: one world's id, or 'all'. */
export async function loadPool(scope) {
  const worlds = scope === 'all' ? drillWorlds() : drillWorlds().filter(w => w.id === scope);
  const sets = await Promise.all(worlds.map(loadWorldPractice));
  return sets.flat();
}

/* ------------------------------------------------------------------
   RANDOMNESS THAT IS THE SAME ON EVERY DEVICE WHEN IT SHOULD BE
   ------------------------------------------------------------------ */

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A question with its options in a fresh order. Ids stay, so the key still matches. */
export function withShuffledOptions(q, rng) {
  return { ...q, options: shuffled(q.options, rng) };
}

/* ------------------------------------------------------------------
   DAYS & STREAKS
   ------------------------------------------------------------------ */

export function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function dayNumber(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Consecutive days with a finished round, ending today or yesterday. Kept for
 * reference: the Drill Deck shows the weekly streak (`weekStreakOf`), because a
 * daily streak turns study into grinding (engagement pass §7.1, §13).
 */
export function streakOf(days, today = localDay()) {
  const set = new Set((days || []).map(dayNumber).filter(n => isFinite(n)));
  let cursor = dayNumber(today);
  if (!set.has(cursor)) cursor -= 1;
  let n = 0;
  while (set.has(cursor)) { n++; cursor--; }
  return n;
}

/** The Monday that starts the week a day falls in, as a day number. */
function weekStart(n) {
  // Day 0 (1970-01-01) was a Thursday, so (n + 3) % 7 is 0 on Mondays.
  return n - (((n + 3) % 7) + 7) % 7;
}

/**
 * Consecutive weeks (Monday to Sunday) with at least one finished round, ending
 * this week or last week (a streak is not lost until a whole week has been missed).
 */
export function weekStreakOf(days, today = localDay()) {
  const weeks = new Set((days || []).map(dayNumber).filter(n => isFinite(n)).map(weekStart));
  let cursor = weekStart(dayNumber(today));
  if (!weeks.has(cursor)) cursor -= 7;
  let n = 0;
  while (weeks.has(cursor)) { n++; cursor -= 7; }
  return n;
}

export function doneToday(practice, today = localDay()) {
  return (practice.days || []).includes(today);
}

/* ------------------------------------------------------------------
   MASTERY
   ------------------------------------------------------------------ */

export function isMastered(stat) {
  return Boolean(stat) && (stat.c || 0) >= MASTERY_RIGHT && (stat.c || 0) > (stat.m || 0);
}

export function isWeak(stat) {
  return Boolean(stat) && (stat.m || 0) > 0 && (stat.m || 0) >= (stat.c || 0);
}

export function masteredCount(practice, ids) {
  return ids.filter(id => isMastered(practice.q[id])).length;
}

export function weakIds(practice) {
  return Object.keys(practice.q).filter(id => isWeak(practice.q[id]));
}

export function tierFor(fraction) {
  return TIERS.find(t => fraction >= t.min) || null;
}

export function worldMastery(world, practice) {
  const ids = worldQuestionIds(world);
  const mastered = masteredCount(practice, ids);
  const fraction = ids.length ? mastered / ids.length : 0;
  return { total: ids.length, mastered, fraction, tier: tierFor(fraction) };
}

/** Across every built world. */
export function overallMastery(practice) {
  let total = 0;
  let mastered = 0;
  for (const w of drillWorlds()) {
    const m = worldMastery(w, practice);
    total += m.total;
    mastered += m.mastered;
  }
  return { total, mastered, fraction: total ? mastered / total : 0 };
}

/* ------------------------------------------------------------------
   ROUNDS
   ------------------------------------------------------------------ */

export function starsFor(correct, total) {
  if (!total) return 0;
  const f = correct / total;
  if (f >= 0.9) return 3;
  if (f >= 0.7) return 2;
  if (f >= 0.4) return 1;
  return 0;
}

/**
 * Draw `n` questions without repeats. Weak spots are likeliest, unseen next,
 * and mastered ones least — so a round keeps returning to what is shaky without
 * ever becoming the same ten questions.
 */
export function pickRun(pool, n, rng, practice) {
  const left = pool.map(q => {
    const stat = practice.q[q.id];
    const weight = !stat ? 2 : isWeak(stat) ? 6 : isMastered(stat) ? 0.35 : 1;
    return { q, weight };
  });
  const out = [];
  while (out.length < n && left.length) {
    const total = left.reduce((s, x) => s + x.weight, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < left.length - 1; idx++) {
      r -= left[idx].weight;
      if (r <= 0) break;
    }
    out.push(left.splice(idx, 1)[0].q);
  }
  return out;
}

/** The same five for everyone on a given day. */
export function pickDaily(pool, day = localDay(), n = DAILY_LENGTH) {
  const sorted = pool.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return shuffled(sorted, mulberry32(hashString(`daily:${day}`))).slice(0, n);
}

/** Weak questions first, topped up from anything unseen, to a round of `n`. */
export function pickWeak(pool, n, rng, practice) {
  const weak = pool.filter(q => isWeak(practice.q[q.id]));
  const rest = pool.filter(q => !isWeak(practice.q[q.id]) && !isMastered(practice.q[q.id]));
  return shuffled(weak, rng).concat(shuffled(rest, rng)).slice(0, n);
}

/* ------------------------------------------------------------------
   RECORDING (mutates the record the session owns)
   ------------------------------------------------------------------ */

export function recordAnswer(practice, id, correct) {
  const stat = practice.q[id] || { c: 0, m: 0 };
  if (correct) stat.c = (stat.c || 0) + 1;
  else stat.m = (stat.m || 0) + 1;
  practice.q[id] = stat;
  return stat;
}

/** A round was finished (not abandoned): count it, stamp the day, keep the best. */
export function recordRun(practice, { scope, correct, total, day = localDay() }) {
  practice.runs = (practice.runs || 0) + 1;
  if (!practice.days.includes(day)) practice.days.push(day);
  const stars = starsFor(correct, total);
  if (scope && stars > (practice.stars[scope] || 0)) practice.stars[scope] = stars;
  return stars;
}

export function recordSprint(practice, score, day = localDay()) {
  practice.runs = (practice.runs || 0) + 1;
  if (!practice.days.includes(day)) practice.days.push(day);
  const isBest = score > (practice.best.sprint || 0);
  if (isBest) practice.best.sprint = score;
  return isBest;
}

/** Shape the commendations read (kept here so the registry never learns the storage layout). */
export function practiceFacts(practice) {
  const p = normalizePractice(practice);
  const worlds = drillWorlds();
  return {
    runs: p.runs || 0,
    streak: weekStreakOf(p.days),
    bestSprint: p.best.sprint || 0,
    perfectRun: Object.values(p.stars).some(n => n >= 3),
    goldWorld: worlds.some(w => worldMastery(w, p).tier?.id === 'gold'),
    mastered: overallMastery(p).mastered
  };
}
