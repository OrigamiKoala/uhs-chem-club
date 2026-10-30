/**
 * verify-drills.mjs — the Drill Deck's pure half, run in Node.
 *
 * Checks that every built world's questions pool with stable unique ids, that
 * rounds draw without repeats and lean toward weak spots, that the Daily Set is
 * the same for everyone on a day, that streaks and mastery count the way the
 * screen says they do, and that the deck can never pay XP.
 *
 * Run with `npm run verify:drills`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = m => { console.error(`  FAIL ${m}`); failures++; };
const ok = m => console.log(`  ok   ${m}`);

const memory = new Map();
globalThis.localStorage = {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear()
};
const noop = () => {};
globalThis.window = globalThis.window || { addEventListener: noop, removeEventListener: noop, location: { hash: '' }, matchMedia: () => ({ matches: false }) };

const D = await import('../src/learn/drills.js');

/* ---- the pool ---- */
const worlds = D.drillWorlds();
const all = await D.loadPool('all');
{
  const ids = new Set(all.map(q => q.id));
  ids.size === all.length ? ok(`${all.length} questions across ${worlds.length} worlds, every id unique`) : fail('duplicate question ids in the pool');
  let expected = 0;
  for (const w of worlds) expected += D.worldQuestionIds(w).length;
  all.length === expected ? ok(`the pool matches what the mastery map expects (${expected})`) : fail(`pool has ${all.length}, mastery map expects ${expected}`);

  let bad = 0;
  for (const q of all) {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) bad++;
    else if (!q.options.some(o => o.id === q.answer)) bad++;
    else if (!q.explanation) bad++;
    else if (!q.worldName || !q.questTitle) bad++;
  }
  bad ? fail(`${bad} malformed question(s)`) : ok('every question has options, a keyed answer, an explanation and a source');

  for (const w of worlds) {
    const ids = D.worldQuestionIds(w);
    const pool = await D.loadPool(w.id);
    if (pool.length !== ids.length || !pool.every(q => ids.includes(q.id))) fail(`world ${w.id}: loaded ids differ from worldQuestionIds`);
  }
  ok('every world\'s loaded questions are exactly the ids the mastery map counts');
}

/* ---- rounds ---- */
{
  const p = D.newPractice();
  const rng = D.mulberry32(7);
  const run = D.pickRun(all, D.RUN_LENGTH, rng, p);
  new Set(run.map(q => q.id)).size === D.RUN_LENGTH ? ok(`a Quick Run is ${D.RUN_LENGTH} distinct questions`) : fail('a run repeated a question');

  // Weak spots are favoured.
  const weakId = all[0].id;
  p.q[weakId] = { c: 0, m: 4 };
  for (const q of all.slice(1, 40)) p.q[q.id] = { c: 5, m: 0 }; // mastered
  let hits = 0;
  for (let i = 0; i < 300; i++) {
    if (D.pickRun(all, D.RUN_LENGTH, D.mulberry32(1000 + i), p).some(q => q.id === weakId)) hits++;
  }
  // Uniform would put it in 10/all.length of runs.
  const uniform = (D.RUN_LENGTH / all.length) * 300;
  hits > uniform * 2 ? ok(`a weak question turns up ${hits}/300 runs (uniform would be ~${Math.round(uniform)})`) : fail(`weak questions are not favoured: ${hits}/300`);

  const weak = D.pickWeak(all, D.RUN_LENGTH, D.mulberry32(3), p);
  weak[0].id === weakId ? ok('Weak Spots leads with what has been missed') : fail('Weak Spots did not lead with the weak question');

  const d1 = D.pickDaily(all, '2026-10-15').map(q => q.id).join();
  const d2 = D.pickDaily(all.slice().reverse(), '2026-10-15').map(q => q.id).join();
  const d3 = D.pickDaily(all, '2026-10-16').map(q => q.id).join();
  d1 === d2 && d1 !== d3 && D.pickDaily(all, '2026-10-15').length === D.DAILY_LENGTH
    ? ok('the Daily Set is the same for everyone on a day and changes the next') : fail('Daily Set is not stable');

  const q0 = D.withShuffledOptions(all[0], D.mulberry32(5));
  q0.options.length === all[0].options.length && q0.options.some(o => o.id === all[0].answer) ? ok('shuffled options keep their ids, so the key still matches') : fail('shuffle broke the key');
}

/* ---- streaks, mastery, stars ---- */
{
  D.streakOf(['2026-10-13', '2026-10-14', '2026-10-15'], '2026-10-15') === 3 ? ok('a streak counts consecutive days') : fail('streak miscounted');
  D.streakOf(['2026-10-13', '2026-10-14'], '2026-10-15') === 2 ? ok('a streak survives until a whole day is missed') : fail('streak lost too early');
  D.streakOf(['2026-10-12', '2026-10-14'], '2026-10-15') === 1 ? ok('a gap ends the streak') : fail('gap did not break the streak');
  D.streakOf(['2026-10-10'], '2026-10-15') === 0 ? ok('a stale streak is zero') : fail('stale streak not zero');
  D.streakOf(['2026-02-28', '2026-03-01'], '2026-03-01') === 2 ? ok('streaks cross month ends') : fail('streak broke at a month end');
  // 2026-10-12 is a Monday, so 10-12..10-18 is one week.
  D.weekStreakOf(['2026-10-05', '2026-10-14'], '2026-10-16') === 2 ? ok('a weekly streak counts consecutive weeks, any day of the week') : fail('weekly streak miscounted');
  D.weekStreakOf(['2026-10-05'], '2026-10-16') === 1 ? ok('a weekly streak survives until a whole week is missed') : fail('weekly streak lost too early');
  D.weekStreakOf(['2026-09-28', '2026-10-14'], '2026-10-16') === 1 ? ok('a missed week ends the weekly streak') : fail('missed week did not break the weekly streak');
  D.weekStreakOf(['2026-10-04', '2026-10-05'], '2026-10-05') === 2 ? ok('Sunday and Monday are different weeks') : fail('week boundary wrong');
  D.weekStreakOf(['2026-09-20'], '2026-10-16') === 0 ? ok('a stale weekly streak is zero') : fail('stale weekly streak not zero');

  D.isMastered({ c: 2, m: 0 }) && !D.isMastered({ c: 2, m: 2 }) && !D.isMastered({ c: 1, m: 0 }) ? ok('mastered = right twice and right more often than wrong') : fail('mastery rule wrong');
  D.isWeak({ c: 0, m: 1 }) && D.isWeak({ c: 1, m: 1 }) && !D.isWeak({ c: 2, m: 1 }) && !D.isWeak({ c: 3, m: 0 }) ? ok('weak = missed at least as often as got right') : fail('weak rule wrong');
  D.starsFor(10, 10) === 3 && D.starsFor(9, 10) === 3 && D.starsFor(7, 10) === 2 && D.starsFor(4, 10) === 1 && D.starsFor(3, 10) === 0
    ? ok('stars: 90% three, 70% two, 40% one') : fail('star thresholds wrong');

  const p = D.newPractice();
  D.recordAnswer(p, 'a#0', true); D.recordAnswer(p, 'a#0', true); D.recordAnswer(p, 'a#1', false);
  p.q['a#0'].c === 2 && p.q['a#1'].m === 1 ? ok('answers are tallied per question') : fail('recordAnswer wrong');
  const s1 = D.recordRun(p, { scope: 'all', correct: 9, total: 10, day: '2026-10-15' });
  D.recordRun(p, { scope: 'all', correct: 2, total: 10, day: '2026-10-15' });
  s1 === 3 && p.stars.all === 3 && p.runs === 2 && p.days.length === 1 ? ok('a worse run never lowers the best stars; a day is stamped once') : fail('recordRun wrong');
  D.recordSprint(p, 12) && !D.recordSprint(p, 5) && p.best.sprint === 12 ? ok('timed round keeps the best') : fail('recordSprint wrong');

  const n = D.normalizePractice(null);
  n.q && Array.isArray(n.days) ? ok('a missing or corrupt record normalises to an empty one') : fail('normalizePractice wrong');

  const w = worlds[0];
  const prac = D.newPractice();
  for (const id of D.worldQuestionIds(w).slice(0, 5)) prac.q[id] = { c: 3, m: 0 };
  const m = D.worldMastery(w, prac);
  m.mastered === 5 && m.fraction === 5 / m.total ? ok('worldMastery counts only that world\'s ids') : fail('worldMastery wrong');
  D.tierFor(0.95).id === 'gold' && D.tierFor(0.6).id === 'silver' && D.tierFor(0.3).id === 'bronze' && D.tierFor(0.1) === null ? ok('tiers: gold 90, silver 60, bronze 25') : fail('tier thresholds wrong');
}

/* ---- commendations ---- */
{
  const { ALL_COMMENDATIONS } = await import('../src/progression/commendations.js');
  const get = id => ALL_COMMENDATIONS.find(c => c.id === id);
  const need = ['first_drill', 'drill_perfect', 'drill_streak_7', 'drill_sprint_15', 'drill_gold_world'];
  need.every(id => get(id)) ? ok('the five drill plates are registered') : fail('a drill commendation is missing');
  const empty = { practice: D.newPractice() };
  need.some(id => get(id).earnedBy(empty)) ? fail('a drill plate is earned with no practice') : ok('no drill plate is earned by an empty record');
  const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return D.localDay(d); };
  const rich = D.newPractice();
  rich.runs = 3; rich.stars.all = 3; rich.best.sprint = 16; rich.days = Array.from({ length: 4 }, (_, i) => day(i * 7));
  for (const id of D.worldQuestionIds(worlds[0])) rich.q[id] = { c: 3, m: 0 };
  need.every(id => get(id).earnedBy({ practice: rich })) ? ok('each plate is earned when its condition is met') : fail(`a drill plate was not earned: ${need.filter(id => !get(id).earnedBy({ practice: rich }))}`);
  need.some(id => 'xp' in get(id) || 'xp_bonus' in get(id)) ? fail('a drill plate carries XP') : ok('drill plates carry no XP');
}

/* ---- worked problems ---- */
{
  const W = await import('../src/learn/worked.js');
  const B = await import('../src/learn/bank.js');
  const nums = [['1,660', 1660], ['1.66e3', 1660], ['1.66 x 10^3', 1660], ['\u22125.2', -5.2], ['  0.25 ', 0.25]];
  nums.every(([t, v]) => Math.abs(W.parseNumber(t) - v) < 1e-9) ? ok('typed figures parse: commas, e-notation, x 10^n, minus sign') : fail('parseNumber misread a figure');
  ['', 'abc', '1.2.3', '12 g'].every(t => Number.isNaN(W.parseNumber(t))) ? ok('anything that is not a figure is refused, not guessed') : fail('parseNumber accepted junk');
  const step = { kind: 'number', answer: 100, tol: 0.01 };
  W.checkStep(step, '100.9').ok && !W.checkStep(step, '102').ok && W.checkStep(step, '').empty && !W.checkStep(step, 'x').empty
    ? ok('a step takes its tolerance, and a blank is never a miss') : fail('checkStep wrong');
  const choice = { kind: 'choice', answer: 'b', options: [{ id: 'a', label: 'x' }, { id: 'b', label: 'y' }, { id: 'c', label: 'z' }] };
  W.checkStep(choice, 'b').ok && !W.checkStep(choice, 'a').ok && W.checkStep(choice, '').empty && W.answerText(choice) === 'y' ? ok('choice steps judge by option id') : fail('choice step wrong');
  let benchWorlds = 0;
  for (const w of worlds) {
    const quests = w.quests.filter(q => q.status === 'live');
    const withPair = quests.filter(q => B.benchProblems(w, q.id).length === 2).length;
    withPair === quests.length ? benchWorlds++ : fail(`world ${w.id}: ${quests.length - withPair} bench(es) without two problems`);
  }
  benchWorlds === worlds.length ? ok(`every built bench in ${benchWorlds} worlds has its two problems in the pool`) : null;
  const ids = D.worldQuestionIds(worlds[0]);
  ids.some(id => /#b[12]$/.test(id)) && ids.some(id => /#\d+$/.test(id)) ? ok('the pool holds both bench problems and the end set') : fail('pool is missing bench or end ids');
}

/* ---- no XP rails ---- */
for (const f of ['src/learn/drills.js', 'src/screens/drills.js']) {
  const src = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  /addXp|gradeStage|completeQuest|recordProgress|api\./.test(src) ? fail(`${f} touches the XP rails or the network`) : ok(`${f} never touches the XP rails`);
}

if (failures) { console.log(`\nDRILLS FAILED (${failures})`); process.exit(1); }
console.log('\nDRILLS OK');
process.exit(0);
