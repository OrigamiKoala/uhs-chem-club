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
  phTable, selectorFixture, plaqueFixture, note, pieceIn, dialValue, mixFixture, mixRead,
  transferParts, transferRead, H_INK, ACID_INK, BASE_INK
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
/** Stage 4's proton bench: the acid poured in carries a proton; two particles of the buffer could take it. */
const BENCH_BUFFER = { goal: { from: 'h3o', to: 'a' }, mols: [
  { key: 'h3o', label: 'H₃O⁺', ink: H_INK, ink2: '#7d8b97', hs: 3, gives: true, lost: 'H₂O', gained: 'H₃O⁺' },
  { key: 'ha', label: 'CH₃COOH', ink: ACID_INK, ink2: ACID_INK, hs: 4, gives: false, lost: 'CH₃COOH', gained: 'CH₃COOH₂⁺' },
  { key: 'a', label: 'CH₃COO⁻', ink: BASE_INK, ink2: ACID_INK, hs: 3, gives: false, lost: 'CH₃COO⁻', gained: 'CH₃COOH' }] };
/** Stage 5 and 6: two reference flasks (1 : 1 and 10 : 1) and, on stage 5, a flask of 3 : 1 that has no meter. */
const REF1 = { ha: 100, a: 100 };
const REF2 = { ha: 10, a: 100 };
const TYPED = { ha: 50, a: 150 };
const TARGET = 4.40;
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
    get prompt() { return guessLine('Which flask\'s pH moves more when the same acid is poured into each?', recall(QUEST_KEY)); },
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
    prompt: 'What must a flask contain to hold its pH against both added acid and added base?',
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
    title: 'Who Accepts the Acid',
    prompt: 'Which particle in the buffer accepts the protons of the added acid?',
    widget,
    // The graded answer is where the proton is carried on the bench; the flask shows what the pour did.
    table: (() => {
      const f = flaskAt('fm', 26, 1, { title: 'Acetic acid with sodium acetate', ...MIX });
      const b = transferParts('bench', { x: 150, y: 28 }, BENCH_BUFFER);
      return phTable({
        pieces: b.pieces,
        fixtures: [f.fixture, b.fixture],
        zones: { slots: b.slots }
      }, { w: 196, h: 56 });
    })(),
    hints: [
      'Press "Pour" and watch which spheres change in number, then carry the proton on the bench.',
      'Compare the counts of acetic acid and of acetate in the window before and after the pour.',
      'Match the spheres that were added to the spheres that changed in number.'
    ],
    check(state) {
      const r = transferRead(state.table, 'bench');
      if (!r.moved) return { ok: false, notYet: true, msg: 'Carry the proton to a seat.' };
      if (r.right) return { ok: true };
      const m = read(MIX.ha, MIX.a, 1);
      return { ok: false, msg: `After one pour the window holds ${Math.round(m.A / U)} acetate spheres and ${Math.round(m.HA / U)} acetic acid spheres, from ${MIX.a} and ${MIX.ha}; the proton you carried comes straight back.` };
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
    briefing: 'A buffer\'s pH sits at the pKa when its two members are equal, and one unit above for each tenfold excess of the base. In full: pH = pKa + log(base ÷ acid), the Henderson–Hasselbalch equation.',
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
      'Use the equation from the briefing with the counts of acetate and acetic acid spheres in the third flask.'
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
        body: `Three acetate to one acetic acid puts the pH ${fmt(lg, 2)} above the pKa of ${fmt(PLATE_PKA, 2)}, at ${fmt(ph(TYPED.ha, TYPED.a), 2)}. That rule, pH = pKa + log(base ÷ acid), is the Henderson–Hasselbalch equation.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-target',
    title: 'Making a Target pH',
    briefing: {
      intro: 'For a target pH of 5.04:',
      worked: [
        '5.04 − 4.74 = 0.30',
        'ratio = 10^0.30 = 2.0'
      ]
    },
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
    prompt: 'What happens to the buffer\'s pH when base is poured in?',
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
        body: `Acetic acid donated protons to the added base, falling from ${MIX.ha} to ${Math.round(m.HA / U)} while acetate rose to ${Math.round(m.A / U)}. The pH rose only from ${fmt(read(MIX.ha, MIX.a).pH, 2)} to ${fmt(m.pH, 2)}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-half-equiv',
    title: 'Halfway to Equivalence',
    briefing: 'When a weak acid (HA) meets half as many moles of strong base (OH⁻), half the HA becomes its conjugate base A⁻, forming a buffer with [HA] = [A⁻] and pH = pKa. At equal moles (1:1 equivalence), all HA becomes A⁻, so pH > 7.',
    prompt: 'What is the pH after pouring 50 spheres of NaOH into 100 spheres of CH₃COOH (2:1 mole ratio)?',
    widget,
    entry: { id: 'ph', label: 'pH at 2:1 ratio', unit: '' },
    table: (() => {
      const f = flaskAt('fm', 26, 1, { title: 'CH₃COOH (100 spheres)', ha: 100, a: 0, reagent: 'base', meter: false });
      return phTable({
        fixtures: [
          f.fixture,
          plaqueFixture('plate', 'Acetic acid', { x: 86, y: 14 }, [`pKa ${fmt(PLATE_PKA, 2)}`, 'Equivalence (10 pours): pH 8.72'], { w: 54 })
        ]
      }, { w: 124, h: 52 });
    })(),
    hints: [
      'Press "Pour" five times (10 spheres per pour) and read the sphere counts in the window.',
      'Compare the acetic acid and acetate counts in the window with the pKa on the plate.',
      'When [HA] = [A⁻], log([A⁻]/[HA]) = 0, so Henderson–Hasselbalch gives pH = pKa.'
    ],
    check(state) {
      const r = mixRead(state.table, 'fm');
      if (r.nb === 0) return { ok: false, notYet: true, msg: 'Pour 50 spheres of NaOH (5 pours) first.' };
      if (r.nb === 10) return { ok: false, msg: '10 pours is a 1:1 mole ratio (equivalence), where all CH₃COOH becomes CH₃COO⁻ (pH 8.72); the prompt asks for 2:1.' };
      if (r.nb !== 5) return { ok: false, msg: `You poured ${r.nb * PER} spheres of NaOH (${r.nb} pours); 50 spheres (5 pours) gives a 2:1 mole ratio with 100 spheres of CH₃COOH.` };
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the pH in the field.' };
      const want = ph(50, 50);
      if (Math.abs(v - want) <= TOL_PH) return { ok: true };
      if (Math.abs(v - 7) <= 0.1) return { ok: false, msg: 'At 2:1, equal moles of CH₃COOH and CH₃COO⁻ form a buffer; the pH is set by pKa, not 7.00.' };
      if (Math.abs(v - 8.72) <= 0.1) return { ok: false, msg: '8.72 is the pH at equivalence (1:1, all CH₃COO⁻), not at the 2:1 buffer.' };
      return { ok: false, msg: `${fmt(v, 2)} does not match a 50:50 buffer of CH₃COOH and CH₃COO⁻ with pKa ${fmt(PLATE_PKA, 2)}.` };
    },
    get reward() {
      const m = read(50, 50);
      return {
        log: 'A 2:1 weak-acid to strong-base mixture formed a buffer at pH = pKa (4.74).',
        title: 'Weak Acid + Strong Base Regimes',
        body: `With 2:1 CH₃COOH to NaOH, half the acid became CH₃COO⁻, giving [HA] = [A⁻] and pH = pKa = ${fmt(m.pH, 2)}. At 1:1 equivalence, only CH₃COO⁻ remains and pH > 7.`
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
  [pour('fm'), put('bench.h.h3o', 'slot:bench.take.a')],
  [{ type: { entry: 'ph', value: '5.22' } }],
  [{ type: { entry: 'ratio', value: '0.45' } }],
  [pour('fm'), dial('pick', 'value', 2)],
  [pour('fm'), pour('fm'), pour('fm'), pour('fm'), pour('fm'), { type: { entry: 'ph', value: '4.74' } }]
];

export const MISSES = [
  [],
  [pour('fm'), dial('pick', 'value', 2)],
  [dial('fb', 'ha', 4), pour('fb')],
  [pour('fm'), put('bench.h.h3o', 'slot:bench.take.ha')],
  [{ type: { entry: 'ph', value: '4.27' } }],
  [{ type: { entry: 'ratio', value: '2.2' } }],
  [pour('fm'), dial('pick', 'value', 4)],
  [pour('fm'), pour('fm'), pour('fm'), pour('fm'), pour('fm'), { type: { entry: 'ph', value: '7.00' } }]
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

export const CHECKS = { read, ph, MIX, REF1, REF2, TYPED, TARGET, LEVELS, MOVE_OK, TOL_PH, PER, U, GUESS, S2_OPTIONS };
