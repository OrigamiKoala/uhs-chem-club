/**
 * bank-check.mjs — structural and arithmetic checks for the question bank
 * (`src/learn/bank/<world>.json`, see `src/learn/bank.js` for the shape).
 *
 * A worked problem's number steps carry a `calc` field: an arithmetic
 * expression that produces the step's answer. It is never shown to a player; it
 * exists so the checker recomputes every figure and an answer typed in by hand
 * cannot be wrong.
 */

import { BANKS } from '../../src/learn/bank.js';

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const SAFE_CALC = /^[0-9eE+\-*/().,\s^a-zA-Z]*$/;
const MATH_NAMES = new Set(['Math', 'sqrt', 'log', 'ln', 'exp', 'pow', 'abs', 'PI', 'E', 'log10', 'log2', 'e', 'E']);

export const BENCH_PROBLEMS = 2;

function evalCalc(expr) {
  if (!SAFE_CALC.test(expr)) return NaN;
  const names = expr.match(/[A-Za-z_]+/g) || [];
  if (names.some(n => !MATH_NAMES.has(n) && !/^[eE]$/.test(n))) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${expr.replace(/\^/g, '**')});`)();
  } catch { return NaN; }
}

function checkProblem(p, label, fail) {
  let bad = 0;
  const no = msg => { fail(`${label}: ${msg}`); bad++; };
  if (!p.id || typeof p.id !== 'string') no('no id');
  if (!p.question || typeof p.question !== 'string') no('no question');
  if (!p.explanation || p.explanation.length < 20) no('no explanation, or too terse to teach');
  if (!Array.isArray(p.options) || p.options.length < 3) { no(`needs at least three options (got ${p.options?.length ?? 0})`); return bad; }
  const ids = new Set();
  for (const o of p.options) {
    if (!o || !o.id || !o.label) { no('an option has no id or label'); continue; }
    if (ids.has(o.id)) no(`duplicate option id "${o.id}"`);
    ids.add(o.id);
    if (EMOJI.test(o.label)) no('emoji in an option');
  }
  if (!ids.has(p.answer)) no(`answer "${p.answer}" is not one of its own options`);
  if (new Set(p.options.map(o => o.label)).size !== p.options.length) no('two options read the same');
  if (EMOJI.test(p.question) || EMOJI.test(p.explanation)) no('emoji in the text');
  return bad;
}

function checkWorked(w, label, fail) {
  let bad = 0;
  const no = msg => { fail(`${label}: ${msg}`); bad++; };
  if (!w.id || !w.title) no('needs an id and a title');
  if (!w.setup || w.setup.length < 40) no('needs a setup that states the whole problem');
  if (!w.finish) no('needs a finish line');
  if (!Array.isArray(w.steps) || w.steps.length < 4 || w.steps.length > 8) { no(`needs 4 to 8 steps (got ${w.steps?.length ?? 0})`); return bad; }
  w.steps.forEach((s, i) => {
    const at = `step ${i + 1}`;
    if (!s.say || !s.hint || !s.explain) no(`${at}: needs say, hint and explain`);
    if (s.kind === 'choice') {
      if (!Array.isArray(s.options) || s.options.length < 3) { no(`${at}: needs at least three options`); return; }
      if (!s.options.some(o => o.id === s.answer)) no(`${at}: answer is not one of its options`);
      if (new Set(s.options.map(o => o.label)).size !== s.options.length) no(`${at}: two options read the same`);
    } else if (s.kind === 'number') {
      if (typeof s.answer !== 'number' || !isFinite(s.answer)) { no(`${at}: number answer is not a finite number`); return; }
      if (typeof s.calc !== 'string') { no(`${at}: number step has no calc`); return; }
      const got = evalCalc(s.calc);
      const tol = s.tol ?? 0.01;
      if (!isFinite(got)) no(`${at}: calc "${s.calc}" cannot be evaluated`);
      else if (Math.abs(got - s.answer) > Math.abs(s.answer) * tol + 1e-12) no(`${at}: calc gives ${got}, the stored answer is ${s.answer}`);
    } else no(`${at}: kind must be choice or number`);
    if (EMOJI.test([s.say, s.hint, s.explain].join(' '))) no(`${at}: emoji in the text`);
  });
  return bad;
}

/**
 * @param {object[]} worlds the live worlds
 * @param {{ fail: Function, ok: Function }} io
 */
export function checkBanks(worlds, { fail, ok }) {
  for (const w of worlds) {
    const bank = BANKS[w.id];
    if (!bank) { fail(`world ${w.id}: no bank file (src/learn/bank/${w.id}.json)`); continue; }
    if (bank.world !== w.id) fail(`world ${w.id}: its bank file says "${bank.world}"`);
    const live = w.quests.filter(q => q.status === 'live');
    const liveIds = new Set(live.map(q => q.id));
    const seen = new Set();
    let bad = 0;
    let problems = 0;
    let worked = 0;

    for (const p of bank.end || []) {
      problems++;
      if (!liveIds.has(p.quest)) { fail(`${w.id} end ${p.id}: quest "${p.quest}" is not a built quest of this world`); bad++; }
      if (seen.has(p.id)) { fail(`${w.id}: duplicate id ${p.id}`); bad++; }
      seen.add(p.id);
      bad += checkProblem(p, `${w.id} end ${p.id}`, fail);
    }

    for (const key of Object.keys(bank.bench || {})) {
      if (!liveIds.has(key)) { fail(`${w.id}: bench entry "${key}" is not a built quest`); bad++; }
    }
    for (const q of live) {
      const entry = bank.bench?.[q.id];
      const set = entry?.problems || [];
      if (set.length !== BENCH_PROBLEMS) { fail(`${w.id}/${q.id}: ${set.length} bench problems, expected ${BENCH_PROBLEMS}`); bad++; }
      set.forEach((p, n) => {
        problems++;
        if (p.quest !== q.id) { fail(`${w.id}/${q.id} bench ${n + 1}: quest field is "${p.quest}"`); bad++; }
        if (p.id !== `${q.id}#b${n + 1}`) { fail(`${w.id}/${q.id} bench ${n + 1}: id must be ${q.id}#b${n + 1}`); bad++; }
        if (seen.has(p.id)) { fail(`${w.id}: duplicate id ${p.id}`); bad++; }
        seen.add(p.id);
        bad += checkProblem(p, `${w.id} bench ${p.id}`, fail);
      });
      if (entry?.worked) {
        worked++;
        const wk = entry.worked;
        if (wk.id !== `${q.id}#w`) { fail(`${w.id}/${q.id}: worked id must be ${q.id}#w`); bad++; }
        bad += checkWorked(wk, `${w.id} worked ${wk.id}`, fail);
      }
    }
    if (!bad) ok(`${w.id}: question bank holds ${problems} problems and ${worked} worked problem(s), all answerable`);
  }
}
