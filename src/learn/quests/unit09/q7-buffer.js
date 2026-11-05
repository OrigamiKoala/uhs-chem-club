/**
 * Unit 9 · Bench 7 — Buffers (q7-buffer)
 *
 * Verdigris's buffer bench, on the ph kit's mixing flask (`table/kits/ph-buffer.js`): a 100 mL flask with a window of spheres (one is
 * 0.1 mmol), a built-in pH meter and a Pour key. A pour is counted from `engine/phdata.js` `bufferState` (exact charge balance), and the
 * window rings the spheres that caught it. Eight stages and ONE click: the belief that acid added to any solution moves its pH, or that a
 * buffer cancels the acid so the pH does not move at all.
 *
 *   1  PREDICT: acid into water and into acetic acid with sodium acetate; which pH moves more?
 *   2  TEST: pour the same acid into both and compare the readings                                        -> buffer
 *   3  BUILD: set what the flask holds so it resists both an acid and a base pour                          -> conjugate base
 *   4  pour acid into the mixture and say which member takes it up (counted from the window)
 *   5  typed: the pH of a flask with no meter from its acetate and acetic acid spheres                      -> Henderson-Hasselbalch
 *   6  typed: the ratio of acetate to acetic acid that gives pH 4.40
 *   7  pour base into the mixture and say how the pH changes (a direction, the size is not worked out)
 *   8  three sealed flasks: pour acid and base into each and name the one that is not a buffer
 *
 * Every figure is the planner's. This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, plaqueFixture, note, pieceIn, dialValue, mixFixture, mixRead
} from '../../table/kits/ph.js';
import { ACIDS, bufferState, fmt, pOf } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bbuffer\b/i, introducedAt: 2 },
  { term: /\bconjugate base\b/i, introducedAt: 3 },
  { term: /\bHenderson.Hasselbalch\b/i, introducedAt: 5 }
];

/** The words of earlier benches this bench uses: acetic acid, Ka, pKa and ionization (q3-weak). */
export const BUILDS_ON = ['unit09/q3-weak'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q7-buffer';
const GUESS = {
  water: 'The water flask moves more',
  mix: 'The acetic acid and sodium acetate flask moves more',
  same: 'Both move the same',
  none: 'Neither flask moves'
};

/* ---------------------------------------------------------------- what each flask holds (inputs; every figure shown is the planner's) */

const Ka = ACIDS.acetic.Ka;
const U = 1e-4;
const V = 0.1;
const PER = 10; // spheres of acid or base one press pours
const PLATE_PKA = pOf(Ka);

/** The planner's reading of a flask of `ha` acetic acid and `a` acetate spheres after `na` acid and `nb` base pours of `per` spheres. */
function read(ha, a, na = 0, nb = 0, { per = PER, Kax = Ka, v = V } = {}) {
  return bufferState({ Ka: Kax, nHA: ha * U, nA: a * U, V: v, nH: na * per * U, nOH: nb * per * U, vAdd: (na + nb) * 0.01 });
}
const ph = (...x) => read(...x).pH;
const MIX = { ha: 100, a: 100 };
const HF = { Ka: ACIDS.hf.Ka };
/** Stage 5 and 6: two reference flasks (1 : 1 and 10 : 1) and, on stage 5, a flask of 3 : 1 that has no meter. */
const REF1 = { ha: 100, a: 100 };
const REF2 = { ha: 10, a: 100 };
const TYPED = { ha: 50, a: 150 };
const TARGET = 4.40;
/** Stage 8: two buffers and acetic acid alone. */
const SEALED = [{ id: 'fx', name: 'Flask X', ha: 100, a: 100 }, { id: 'fy', name: 'Flask Y', ha: 60, a: 60, ...HF }, { id: 'fz', name: 'Flask Z', ha: 100, a: 0 }];
const LEVELS = [0, 25, 50, 100];
const MOVE_OK = 0.5;
const TOL_PH = 0.03;

/** A flask whose top edge stands at `top`: the builder wants its centre, which depends on its height. */
function flaskAt(id, x, top, o) {
  const probe = mixFixture(id, { x, y: 0 }, o);
  return mixFixture(id, { x, y: top + probe.size.h / 2 }, o);
}

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const pour = fixture => ({ run: fixture });

const S2_OPTIONS = ['The water flask', 'The acetic acid and sodium acetate flask', 'Both the same', ' '];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Which Moves More?',
    predict: true,
    prompt: 'Which flask\'s pH moves more when acid is added to water and to acetic acid with sodium acetate?',
    widget,
    table: phTable({
      pieces: [
        note('water', GUESS.water, { x: 34, y: 12 }),
        note('mix', GUESS.mix, { x: 92, y: 12 }),
        note('same', GUESS.same, { x: 34, y: 33 }),
        note('none', GUESS.none, { x: 92, y: 33 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 150, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { w: 184, h: 46 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture what each flask holds before any acid goes in.',
      'Ask what in each flask, if anything, could use up the acid that is added.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, the same acid is poured into both flasks.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-pour',
    title: 'The Same Acid, Two Flasks',
    get prompt() { return guessLine('Add the same acid to both flasks and say which flask\'s pH moves more.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const w = flaskAt('fw', 26, 1, { title: 'Water', ha: 0, a: 0 });
      const m = flaskAt('fm', 74, 1, { title: 'Acetic acid with sodium acetate', ...MIX });
      return phTable({
        fixtures: [w.fixture, m.fixture, selectorFixture('pick', 'The pH that moves more', { x: 130, y: 20 }, { options: S2_OPTIONS, start: 4, w: 56 })]
      }, { w: 164, h: 52 });
    })(),
    hints: [
      'Press "Pour" on each flask, then set the answer dial.',
      'Compare the pH each flask read before the pour with the pH it reads after.',
      'Look at how many spheres change in each window while the acid goes in.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const w = read(0, 0, 1); const m = read(MIX.ha, MIX.a, 1);
      return { ok: false, msg: `After one pour the water reads ${fmt(read(0, 0).pH, 2)} then ${fmt(w.pH, 2)}, and the other flask reads ${fmt(read(MIX.ha, MIX.a).pH, 2)} then ${fmt(m.pH, 2)}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const w = read(0, 0, 1).pH; const m = read(MIX.ha, MIX.a, 1).pH;
      const verdict = g === 'water' ? 'The water did move more, as you predicted. ' : g ? 'The water moved more, not what you predicted. ' : '';
      return {
        log: 'The water flask moved far more than the acetic acid and sodium acetate flask.',
        title: 'A Buffer',
        body: `${verdict}One pour of acid moved the water from ${fmt(read(0, 0).pH, 2)} to ${fmt(w, 2)} and the other flask from ${fmt(read(MIX.ha, MIX.a).pH, 2)} to ${fmt(m, 2)}. A solution whose pH changes little when acid or base is added is a buffer.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-build',
    title: 'Making a Flask That Holds',
    prompt: 'Make a flask that holds its pH when acid is poured in and when base is poured in.',
    widget,
    table: (() => {
      const f = flaskAt('fb', 46, 1, { title: 'Your flask', build: true, levels: LEVELS, reagent: 'dial', rows: 14 });
      return phTable({ fixtures: [f.fixture] }, { w: 96, h: f.size.h + 4 });
    })(),
    hints: [
      'Set the two dials for acetic acid and acetate, then press "Pour" with the "Pour in" dial on acid and again on base.',
      'Compare the pH after each pour with the pH before it, for several settings.',
      'Try a flask with only one of the two substances, then one with both, and see which pours it can take.'
    ],
    check(state) {
      const r = mixRead(state.table, 'fb');
      const acid = ph(r.ha0, r.a0, 1) - ph(r.ha0, r.a0); const base = ph(r.ha0, r.a0, 0, 1) - ph(r.ha0, r.a0);
      if (Math.abs(acid) < MOVE_OK && Math.abs(base) < MOVE_OK && r.ha0 + r.a0 > 0) return { ok: true };
      return { ok: false, msg: `A flask with ${r.ha0} spheres of acetic acid and ${r.a0} of acetate reads ${fmt(ph(r.ha0, r.a0), 2)}, then ${fmt(ph(r.ha0, r.a0, 1), 2)} after a pour of acid and ${fmt(ph(r.ha0, r.a0, 0, 1), 2)} after a pour of base.` };
    },
    get reward() {
      return {
        log: 'Only a flask holding both acetic acid and acetate held its pH against acid and against base.',
        title: 'Both Members',
        body: 'A flask held its pH against both pours only when it held acetic acid and acetate together, in large amounts. Acetate is the conjugate base of acetic acid: the acid takes added base, and the conjugate base takes added acid.'
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-acid',
    title: 'Who Takes the Acid',
    prompt: 'Pour acid into the mixture and say which of acetic acid and acetate takes it up.',
    widget,
    table: (() => {
      const f = flaskAt('fm', 26, 1, { title: 'Acetic acid with sodium acetate', ...MIX });
      return phTable({
        fixtures: [f.fixture, selectorFixture('pick', 'Takes up the acid', { x: 88, y: 20 }, { options: ['Acetic acid', 'Acetate', 'Neither', ' '], start: 4, w: 46 })]
      }, { w: 120, h: 52 });
    })(),
    hints: [
      'Press "Pour", then set the answer dial.',
      'Compare the counts of acetic acid and of acetate in the window before and after the pour.',
      'Match the spheres that were added to the spheres that changed in number.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const m = read(MIX.ha, MIX.a, 1);
      return { ok: false, msg: `After one pour the window holds ${Math.round(m.A / U)} acetate spheres and ${Math.round(m.HA / U)} acetic acid spheres, from ${MIX.a} and ${MIX.ha}.` };
    },
    get reward() {
      const m = read(MIX.ha, MIX.a, 1);
      return {
        log: 'The acetate caught the added acid.',
        title: 'Acid Taken Up',
        body: `Each of the ${PER} spheres of acid poured in was caught by an acetate: acetate fell from ${MIX.a} to ${Math.round(m.A / U)} spheres and acetic acid rose from ${MIX.ha} to ${Math.round(m.HA / U)}. The conjugate base takes up added acid, so the pH barely moves.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-hh',
    title: 'The pH of a Mixture',
    prompt: 'Find the pH of the flask with no meter, to two decimal places.',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const a = flaskAt('f1', 24, 1, { title: '100 acetic acid, 100 acetate', ...REF1, pour: false });
      const b = flaskAt('f2', 70, 1, { title: '10 acetic acid, 100 acetate', ...REF2, pour: false });
      const c = flaskAt('f3', 116, 1, { title: 'No meter', ...TYPED, pour: false, meter: false });
      return phTable({
        fixtures: [a.fixture, b.fixture, c.fixture, plaqueFixture('plate', 'Acetic acid', { x: 164, y: 14 }, [`pKa ${fmt(PLATE_PKA, 2)}`], { w: 36 })]
      }, { w: 186, h: 52 });
    })(),
    hints: [
      'Type the pH in the field; the two meters read the flasks beside it.',
      'Compare each flask\'s number of acetate spheres per acetic acid sphere with the pH it reads.',
      'The pH sits above the pKa by the log of that number of acetate spheres per acetic acid sphere.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = ph(TYPED.ha, TYPED.a);
      if (Math.abs(v - want) <= TOL_PH) return { ok: true };
      const r1 = fmt(ph(REF1.ha, REF1.a), 2); const r2 = fmt(ph(REF2.ha, REF2.a), 2);
      if (Math.abs(v - (2 * PLATE_PKA - want)) <= 0.05) return { ok: false, msg: `${fmt(v, 2)} is below the ${r1} that the 100 and 100 flask reads, and this flask holds ${TYPED.a} acetate spheres against ${TYPED.ha} of acetic acid.` };
      if (Math.abs(v - PLATE_PKA) <= 0.04) return { ok: false, msg: `${fmt(v, 2)} is what the 100 and 100 flask reads; this flask holds ${TYPED.a} acetate spheres and ${TYPED.ha} of acetic acid.` };
      return { ok: false, msg: `The flasks beside it read ${r1} and ${r2}; this flask holds ${TYPED.a} acetate spheres and ${TYPED.ha} of acetic acid, and ${fmt(v, 2)} does not fit them.` };
    },
    get reward() {
      const lg = Math.log10(TYPED.a / TYPED.ha);
      return {
        log: 'The pH is the pKa plus the log of acetate over acetic acid.',
        title: 'Henderson–Hasselbalch',
        body: `Three acetate to one acetic acid puts the pH ${fmt(lg, 2)} above the pKa of ${fmt(PLATE_PKA, 2)}, at ${fmt(ph(TYPED.ha, TYPED.a), 2)}. That rule, pH = pKa + log([A⁻]/[HA]), is the Henderson–Hasselbalch equation.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-target',
    title: 'Making a Target pH',
    prompt: `Find the ratio of acetate to acetic acid that gives a pH of ${fmt(TARGET, 2)}.`,
    widget,
    entry: { id: 'ratio', label: 'Acetate per acetic acid', unit: '' },
    table: (() => {
      const a = flaskAt('f1', 24, 1, { title: '100 acetic acid, 100 acetate', ...REF1, pour: false });
      const b = flaskAt('f2', 70, 1, { title: '10 acetic acid, 100 acetate', ...REF2, pour: false });
      return phTable({
        fixtures: [a.fixture, b.fixture, plaqueFixture('plate', 'Acetic acid', { x: 120, y: 14 }, [`pKa ${fmt(PLATE_PKA, 2)}`, `Target pH ${fmt(TARGET, 2)}`], { w: 40 })]
      }, { w: 150, h: 52 });
    })(),
    hints: [
      'Type the ratio in the field; the plate gives the pKa and the target.',
      'Compare the target with the pKa to see which side of the 100 and 100 flask it lies on.',
      'Find how far the target lies from the pKa and turn that distance back into a ratio with a power of ten.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ratio');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (!(v > 0)) return { ok: false, msg: 'A flask cannot hold zero or a negative number of spheres.' };
      const got = ph(100, 100 * v);
      if (Math.abs(got - TARGET) <= TOL_PH) return { ok: true };
      return { ok: false, msg: `A flask with ${v} acetate spheres for each acetic acid sphere reads ${fmt(got, 2)}, and the target is ${fmt(TARGET, 2)}.` };
    },
    get reward() {
      const r = Math.pow(10, TARGET - PLATE_PKA);
      return {
        log: 'The ratio comes from the distance below the pKa.',
        title: 'Working Backwards',
        body: `A pH of ${fmt(TARGET, 2)} lies ${fmt(PLATE_PKA - TARGET, 2)} below the pKa, so the ratio of acetate to acetic acid is 10 to the power ${fmt(TARGET - PLATE_PKA, 2)}, which is ${fmt(r, 2)}. The Henderson–Hasselbalch equation runs in both directions.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-base',
    title: 'Base Into the Mixture',
    prompt: 'Pour base into the mixture and say how its pH changes.',
    widget,
    table: (() => {
      const f = flaskAt('fm', 26, 1, { title: 'Acetic acid with sodium acetate', ...MIX, reagent: 'base' });
      return phTable({
        fixtures: [f.fixture, selectorFixture('pick', 'The pH', { x: 88, y: 20 }, { options: ['Rises a lot', 'Rises a little', 'Falls', 'Stays the same', ' '], start: 5, w: 46 })]
      }, { w: 120, h: 52 });
    })(),
    hints: [
      'Press "Pour", then set the answer dial.',
      'Compare the pH before the pour with the pH after it, and the counts in the window.',
      'Ask whether the reading is the same to two places, and how it compares with the step the water flask took.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const m = read(MIX.ha, MIX.a, 0, 1);
      return { ok: false, msg: `The meter reads ${fmt(read(MIX.ha, MIX.a).pH, 2)} before the pour and ${fmt(m.pH, 2)} after it.` };
    },
    get reward() {
      const m = read(MIX.ha, MIX.a, 0, 1);
      return {
        log: 'The acetic acid took up the added base and the pH rose a little.',
        title: 'Base Taken Up',
        body: `The acid member takes up added base: acetic acid fell from ${MIX.ha} to ${Math.round(m.HA / U)} spheres and acetate rose to ${Math.round(m.A / U)}. The pH rose from ${fmt(read(MIX.ha, MIX.a).pH, 2)} to ${fmt(m.pH, 2)}, a small change and not none. The exam does not ask for its size.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Sealed Flasks',
    prompt: 'Pour acid and base into each sealed flask and name the one that is not a buffer.',
    widget,
    table: (() => {
      const fl = SEALED.map((s, i) => flaskAt(s.id, 24 + i * 46, 1, { title: s.name, ha: s.ha, a: s.a, ...(s.Ka ? { Ka: s.Ka } : {}), reagent: 'dial', sealed: true, rows: 4 }));
      return phTable({
        fixtures: [...fl.map(f => f.fixture), selectorFixture('pick', 'Not a buffer', { x: 166, y: 20 }, { options: ['Flask X', 'Flask Y', 'Flask Z', ' '], start: 4, w: 40 })]
      }, { w: 190, h: fl[0].size.h + 4 });
    })(),
    hints: [
      'For each flask set the "Pour in" dial, press "Pour", then set the answer dial.',
      'Compare how far each flask\'s pH moves for acid and for base.',
      'A flask that holds its pH against both pours moves by about the same small step for each.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 3) return { ok: true };
      const s = SEALED[v - 1];
      const o = { Kax: s.Ka ?? Ka };
      const z = SEALED[2];
      return { ok: false, msg: `${s.name} reads ${fmt(read(s.ha, s.a, 0, 0, o).pH, 2)}, then ${fmt(read(s.ha, s.a, 1, 0, o).pH, 2)} after acid and ${fmt(read(s.ha, s.a, 0, 1, o).pH, 2)} after base; ${z.name} reads ${fmt(read(z.ha, z.a).pH, 2)}, then ${fmt(read(z.ha, z.a, 1).pH, 2)} and ${fmt(read(z.ha, z.a, 0, 1).pH, 2)}.` };
    },
    get reward() {
      const mv = s => { const o = { Kax: s.Ka ?? Ka }; return [read(s.ha, s.a, 1, 0, o).pH - read(s.ha, s.a, 0, 0, o).pH, read(s.ha, s.a, 0, 1, o).pH - read(s.ha, s.a, 0, 0, o).pH]; };
      const [xa, xb] = mv(SEALED[0]); const [za, zb] = mv(SEALED[2]);
      return {
        log: 'Acetic acid alone is not a buffer.',
        title: 'Telling Buffers Apart',
        body: `Flasks X and Y moved by ${fmt(Math.abs(xa), 2)} for acid and ${fmt(Math.abs(xb), 2)} for base. Flask Z held acetic acid alone and moved by ${fmt(Math.abs(za), 2)} and ${fmt(Math.abs(zb), 2)}, because a buffer needs both members of a pair and Z held only one.`
      };
    }
  }
];

export const DEBRIEF = {
  title: 'Buffers',
  body: 'A weak acid and its conjugate base together take up added acid and added base, so the pH barely moves. The Henderson–Hasselbalch equation gives the pH from their ratio.'
};

export const SOLUTIONS = [
  [put('same', 'slot:guess')],
  [pour('fw'), pour('fm'), dial('pick', 'value', 1)],
  [dial('fb', 'ha', 3), dial('fb', 'a', 3), pour('fb')],
  [pour('fm'), dial('pick', 'value', 2)],
  [{ type: { entry: 'ph', value: '5.22' } }],
  [{ type: { entry: 'ratio', value: '0.45' } }],
  [pour('fm'), dial('pick', 'value', 2)],
  [pour('fx'), pour('fy'), pour('fz'), dial('pick', 'value', 3)]
];

export const MISSES = [
  [],
  [pour('fm'), dial('pick', 'value', 2)],
  [dial('fb', 'ha', 4), pour('fb')],
  [pour('fm'), dial('pick', 'value', 1)],
  [{ type: { entry: 'ph', value: '4.27' } }],
  [{ type: { entry: 'ratio', value: '2.2' } }],
  [pour('fm'), dial('pick', 'value', 4)],
  [pour('fx'), dial('pick', 'value', 1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { read, ph, MIX, REF1, REF2, TYPED, SEALED, TARGET, LEVELS, MOVE_OK, TOL_PH, PER, U, GUESS, S2_OPTIONS };
