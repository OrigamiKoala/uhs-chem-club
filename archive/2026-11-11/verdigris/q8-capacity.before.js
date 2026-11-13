/**
 * Unit 9 · Bench 8 — pKa, Protonation and Capacity (q8-capacity)
 *
 * Verdigris's last bench, on the ph kit: the fraction strip (`ph-strip.js`, a flat graph painted only over the pH the dial has crossed), the
 * mixing flask of q7 (`ph-buffer.js`) and the beaker with a solid (`ph-solid.js`, `Ksp` from `engine/eqdata.js`). Eight stages, two clicks:
 * that a weak acid is the acid form at every pH, and that a buffer never runs out.
 *
 *   1  PREDICT: which form of acetic acid there is more of at pH 3 and at pH 6
 *   2  TEST: read the strip at both pH                                                              -> protonation state
 *   3  typed: the pH at which the indicator's two colour forms are equal                             -> indicator
 *   4  two buffers of one ratio and different amounts; the same pour of acid; which holds better      -> buffer capacity
 *   5  pour acid into a buffer until it is used up, then type how many pours a larger flask takes
 *   6  three flasks of acid to acetate 1 : 1, 10 : 1 and 100 : 1; the same pour of base; which holds best
 *   7  acid on magnesium hydroxide and on silver chloride: which dissolves more (qualitative)          -> pH and solubility
 *   8  a sealed strip of three acids: which makes the best buffer at pH 4.5
 *
 * Every figure is `engine/phdata.js` (fractions, bufferState) or `eqdata.js` (KSP). Pays no XP; writes no Submission.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, pieceIn, dialValue, note, mixFixture, mixRead, stripFixture, stripRead, solidFixture, solidRead
} from '../../table/kits/ph.js';
import { ACIDS, INDICATORS, bufferState, fractions, fmt, pOf } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bprotonation state\b/i, introducedAt: 2 },
  { term: /\bindicator\b/i, introducedAt: 3 },
  { term: /\bbuffer capacity\b/i, introducedAt: 4 },
  { term: /\bsolubility\b/i, introducedAt: 7 }
];

/** The words of earlier benches this bench uses: pKa and acetic acid (q3-weak), buffer, acetate and conjugate base (q7-buffer). */
export const BUILDS_ON = ['unit09/q3-weak', 'unit09/q7-buffer'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q8-capacity';
const GUESS = {
  acid: 'Acetic acid is the main form at both pH 3 and pH 6',
  right: 'Acetic acid at pH 3 and acetate at pH 6',
  wrong: 'Acetate at pH 3 and acetic acid at pH 6',
  base: 'Acetate is the main form at both pH 3 and pH 6'
};
const S2_OPTIONS = ['Acetic acid at both', 'Acetic acid at 3, acetate at 6', 'Acetate at 3, acetic acid at 6', 'Acetate at both', ' '];

/* ---------------------------------------------------------------- what each stage holds (inputs; every figure shown is the planner's) */

const Ka = ACIDS.acetic.Ka;
const U = 1e-4;
const PKA = pOf(Ka);
const ACETIC = { name: 'Acetic acid', pKa: PKA, HA: 'CH₃COOH', A: 'CH₃COO⁻' };
const RED = INDICATORS.methylRed;
const METHYL_RED = { name: 'Methyl red', pKa: RED.pKa, HA: 'red form', A: 'yellow form' };
/** Stage 8: three sealed acids, from the tables: hydrofluoric acid, acetic acid and hydrocyanic acid. */
const SEALED = [
  { name: 'Acid X', pKa: pOf(ACIDS.hf.Ka), HA: 'HX', A: 'X⁻' },
  { name: 'Acid Y', pKa: PKA, HA: 'HY', A: 'Y⁻' },
  { name: 'Acid Z', pKa: pOf(ACIDS.hcn.Ka), HA: 'HZ', A: 'Z⁻' }
];
const WANTED_PH = 4.5;
/** Stage 4: the same ratio at two strengths; stage 5: the pour that uses up a flask, and the larger flask; stage 6: three ratios. */
const DILUTE = { ha: 10, a: 10 };
const STRONG = { ha: 100, a: 100 };
const SMALL = { ha: 40, a: 40 };
const LARGE = { ha: 120, a: 120 };
const POUR5 = 5;
const RATIOS = [{ id: 'r1', title: '1 : 1', ha: 100, a: 100 }, { id: 'r2', title: '10 : 1', ha: 182, a: 18 }, { id: 'r3', title: '100 : 1', ha: 198, a: 2 }];
const SOLID = 40;
const TOL_PKA = 0.15;

/** The planner's reading of a flask of `ha` acetic acid and `a` acetate spheres after pours. */
function read(ha, a, na = 0, nb = 0, per = 10) {
  return bufferState({ Ka, nHA: ha * U, nA: a * U, V: 0.1, nH: na * per * U, nOH: nb * per * U, vAdd: (na + nb) * 0.01 });
}
const phOf = (...x) => read(...x).pH;
const pct = (acid, pH) => { const f = Math.round(fractions(acid.pKa, pH).HA * 100); return [f, 100 - f]; };

function flaskAt(id, x, top, o, build = mixFixture) {
  const probe = build(id, { x, y: 0 }, o);
  return build(id, { x, y: top + probe.size.h / 2 }, o);
}
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const pour = fixture => ({ run: fixture });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Which Form?',
    predict: true,
    prompt: 'Which form of acetic acid is there more of at pH 3, and which at pH 6?',
    widget,
    table: phTable({
      pieces: [
        note('acid', GUESS.acid, { x: 36, y: 12 }),
        note('right', GUESS.right, { x: 100, y: 12 }),
        note('wrong', GUESS.wrong, { x: 36, y: 33 }),
        note('base', GUESS.base, { x: 100, y: 33 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 168, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { w: 200, h: 46 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture what the pH reading counts, and what the acid does in water that is richer in hydronium.',
      'Ask whether the acid is more likely to keep or to give up its proton when hydronium is plentiful.'
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
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, acetic acid is read on a strip across a range of pH.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-form',
    title: 'Reading the Strip',
    get prompt() { return guessLine('Read the strip at pH 3 and at pH 6 and say which form of acetic acid there is more of at each.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const s = flaskAt('st', 46, 1, { acids: [ACETIC], start: 5, w: 84, title: 'Acetic acid' }, stripFixture);
      return phTable({
        fixtures: [s.fixture, selectorFixture('pick', 'The main form', { x: 132, y: 20 }, { options: S2_OPTIONS, start: 5, w: 56 })]
      }, { w: 170, h: s.size.h + 4 });
    })(),
    hints: [
      'Drag the "pH" dial to 3 and then to 6, then set the answer dial.',
      'Compare the two percentages at the amber line at each pH.',
      'Compare the pH at the line with the pKa of acetic acid, and see which form is larger on each side of it.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const [a3, b3] = pct(ACETIC, 3); const [a6, b6] = pct(ACETIC, 6);
      return { ok: false, msg: `At pH 3.0 the strip reads ${a3} percent acetic acid and ${b3} percent acetate; at pH 6.0 it reads ${a6} and ${b6}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const [a3] = pct(ACETIC, 3); const [, b6] = pct(ACETIC, 6);
      const verdict = g === 'right' ? 'It did, as you predicted. ' : g ? 'It did not match your prediction. ' : '';
      return {
        log: 'Acetic acid was the main form below its pKa and acetate above it.',
        title: 'Protonation State',
        body: `${verdict}The strip read ${a3} percent acetic acid at pH 3 and ${b6} percent acetate at pH 6. Whether an acid holds its proton, its protonation state, depends on the pH: the acid form is the larger below the pKa of ${fmt(PKA, 2)}, and the base form above it.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-indicator',
    title: 'An Indicator',
    prompt: 'Find the pH at which methyl red is half in its red form and half in its yellow form.',
    widget,
    entry: { id: 'pka', label: 'pH', unit: '' },
    table: (() => {
      const s = flaskAt('st', 46, 1, { acids: [METHYL_RED], indicator: true, start: 4, w: 84, title: 'Methyl red' }, stripFixture);
      return phTable({ fixtures: [s.fixture] }, { w: 94, h: s.size.h + 4 });
    })(),
    hints: [
      'Drag the "pH" dial across the strip and type the pH in the field.',
      'Compare the percentages of the red form and the yellow form at the amber line, and the colour of the solution.',
      'Find the pH where the two percentages cross, and use the steps either side of it to place it.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'pka');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (Math.abs(v - RED.pKa) <= TOL_PKA + 1e-9) return { ok: true };
      if (v < 2 || v > 8) return { ok: false, msg: 'The strip runs from pH 2 to pH 8.' };
      const [a, b] = pct(METHYL_RED, v);
      return { ok: false, msg: `At pH ${fmt(v, 1)} the strip reads ${a} percent red form and ${b} percent yellow form.` };
    },
    get reward() {
      return {
        log: 'The two forms were equal at the indicator\'s pKa.',
        title: 'An Indicator',
        body: `The red and yellow forms were equal at pH ${fmt(RED.pKa, 1)}, with red below, yellow above and orange between. An indicator is a weak acid whose acid and base forms have different colours, so it changes colour around its pKa.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-amount',
    title: 'Two Concentrations',
    prompt: 'Pour the same acid into both flasks and say which one holds its pH better.',
    widget,
    table: (() => {
      const a = flaskAt('fd', 26, 1, { title: 'Each 0.010 M', ...DILUTE, acidSph: POUR5 });
      const b = flaskAt('fc', 74, 1, { title: 'Each 0.10 M', ...STRONG, acidSph: POUR5 });
      return phTable({
        fixtures: [a.fixture, b.fixture, selectorFixture('pick', 'Holds its pH better', { x: 130, y: 20 }, { options: ['The 0.010 M flask', 'The 0.10 M flask', 'Both the same', ' '], start: 4, w: 56 })]
      }, { w: 164, h: a.size.h + 4 });
    })(),
    hints: [
      'Press "Pour" on each flask, then set the answer dial.',
      'Compare each flask\'s pH before and after the pour, and the counts of acetic acid and acetate in its window.',
      'Compare how many spheres of acetate each flask holds with how many spheres of acid one pour brings.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      return { ok: false, msg: `After one pour the 0.010 M flask reads ${fmt(phOf(DILUTE.ha, DILUTE.a, 1, 0, POUR5), 2)} and the 0.10 M flask reads ${fmt(phOf(STRONG.ha, STRONG.a, 1, 0, POUR5), 2)}, from ${fmt(phOf(DILUTE.ha, DILUTE.a), 2)} and ${fmt(phOf(STRONG.ha, STRONG.a), 2)}.` };
    },
    get reward() {
      return {
        log: 'The stronger buffer took the same pour with far less change.',
        title: 'Buffer Capacity',
        body: `Both flasks began at the same ratio, yet one pour moved the 0.010 M flask to ${fmt(phOf(DILUTE.ha, DILUTE.a, 1, 0, POUR5), 2)} and the 0.10 M flask only to ${fmt(phOf(STRONG.ha, STRONG.a, 1, 0, POUR5), 2)}. Buffer capacity, the acid or base a buffer can take before its pH changes much, grows with the amount of each member.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-limit',
    title: 'The Limit',
    prompt: 'Find how many pours of acid the second flask can take before its acetate is used up.',
    widget,
    entry: { id: 'n', label: 'Pours', unit: '' },
    table: (() => {
      const a = flaskAt('f1', 26, 1, { title: 'Flask 1', ...SMALL, acidSph: POUR5, rows: 12 });
      const b = flaskAt('f2', 74, 1, { title: 'Flask 2', ...LARGE, rows: 12, pour: false });
      return phTable({ fixtures: [a.fixture, b.fixture] }, { w: 100, h: a.size.h + 4 });
    })(),
    hints: [
      'Press "Pour" on flask 1 until its acetate is gone, and type the pours in the field for flask 2.',
      'Compare the acetate in the window of flask 1 after each pour, and compare the two flasks\' windows.',
      'Flask 2 holds a number of times the acetate of flask 1, so it takes that number of times the pours.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'n');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = LARGE.a / POUR5;
      if (Math.abs(v - want) <= 1) return { ok: true };
      return { ok: false, msg: `${fmt(v, 0)} pours bring ${fmt(v * POUR5, 0)} spheres of acid, and flask 2 holds ${LARGE.a} spheres of acetate against ${SMALL.a} in flask 1.` };
    },
    get reward() {
      const k = SMALL.a / POUR5;
      return {
        log: 'A buffer is spent when the member that takes the pour is gone.',
        title: 'The Limit',
        body: `Flask 1 used up its ${SMALL.a} spheres of acetate in ${k} pours of ${POUR5}, so flask 2, holding ${LARGE.a}, takes ${LARGE.a / POUR5}. A buffer runs out when the member that takes the added acid is used up, and its capacity is set by how much of that member it holds.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-ratio',
    title: 'Three Ratios',
    prompt: 'Pour the same base into each flask and say which one holds its pH best.',
    widget,
    table: (() => {
      const fl = RATIOS.map((r, i) => flaskAt(r.id, 24 + i * 46, 1, { title: r.title, ha: r.ha, a: r.a, reagent: 'base' }));
      return phTable({
        fixtures: [...fl.map(f => f.fixture), selectorFixture('pick', 'Holds best, acid : acetate', { x: 166, y: 20 }, { options: ['1 : 1', '10 : 1', '100 : 1', ' '], start: 4, w: 46 })]
      }, { w: 192, h: fl[0].size.h + 4 });
    })(),
    hints: [
      'Press "Pour" on each flask, then set the answer dial.',
      'Compare how far the pH of each flask moves, and how much acetic acid each window holds to give to the pour.',
      'Compare the sizes of the pH steps, and the counts of acetic acid and acetate before and after.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const s = RATIOS[v - 1];
      return { ok: false, msg: `The ${s.title} flask reads ${fmt(phOf(s.ha, s.a), 2)}, then ${fmt(phOf(s.ha, s.a, 0, 1), 2)} after the pour; the ${RATIOS[0].title} flask reads ${fmt(phOf(RATIOS[0].ha, RATIOS[0].a), 2)}, then ${fmt(phOf(RATIOS[0].ha, RATIOS[0].a, 0, 1), 2)}.` };
    },
    get reward() {
      const mv = r => phOf(r.ha, r.a, 0, 1) - phOf(r.ha, r.a);
      return {
        log: 'The flask with the two members near equal held best.',
        title: 'The Best Ratio',
        body: `The same pour of base moved the 1 : 1 flask by ${fmt(mv(RATIOS[0]), 2)}, the 10 : 1 flask by ${fmt(mv(RATIOS[1]), 2)} and the 100 : 1 flask by ${fmt(mv(RATIOS[2]), 2)}. A buffer holds best when its two members are near equal, within a factor of ten of each other.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-solid',
    title: 'Acid on a Solid',
    prompt: 'Pour acid into each beaker and say which solid dissolves more.',
    widget,
    table: (() => {
      const a = flaskAt('sm', 26, 1, { salt: 'Mg_OH_2', solid: SOLID, basic: true, title: 'Magnesium hydroxide' }, solidFixture);
      const b = flaskAt('sa', 74, 1, { salt: 'AgCl', solid: SOLID, basic: false, title: 'Silver chloride' }, solidFixture);
      return phTable({
        fixtures: [a.fixture, b.fixture, selectorFixture('pick', 'Dissolves more', { x: 130, y: 18 }, { options: ['Magnesium hydroxide', 'Silver chloride', 'Both the same', ' '], start: 4, w: 56 })]
      }, { w: 164, h: a.size.h + 4 });
    })(),
    hints: [
      'Press "Pour acid" on each beaker a few times, then set the answer dial.',
      'Compare the dissolved ions and the squares of solid left in the two windows.',
      'Ask which ion of each salt the added acid could use up, and what that does to the solid.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const m = solidAfterPour('Mg_OH_2', true, 1); const s = solidAfterPour('AgCl', false, 1);
      return { ok: false, msg: `After one pour the magnesium hydroxide beaker shows ${m.cations} dissolved spheres and ${m.left} squares of solid, and the silver chloride beaker shows ${s.cations} and ${s.left}.` };
    },
    get reward() {
      const m = solidAfterPour('Mg_OH_2', true, 1);
      return {
        log: 'Acid dissolved the solid with a basic anion and left the other alone.',
        title: 'pH and Solubility',
        body: `Each pour of acid dissolved ${m.cations} more spheres of magnesium hydroxide, because hydroxide is a base and the acid takes it, while silver chloride was unchanged. The solubility of a salt with a basic anion rises as the pH falls; one with the anion of a strong acid does not. The size of the effect is not worked out here.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-choose',
    title: 'Choosing an Acid',
    prompt: `Find which sealed acid would make the best buffer at pH ${fmt(WANTED_PH, 1)}.`,
    widget,
    table: (() => {
      const s = flaskAt('st', 46, 1, { acids: SEALED, start: 5, w: 84, title: 'Sealed acids' }, stripFixture);
      return phTable({
        fixtures: [s.fixture, selectorFixture('pick', 'Best buffer', { x: 126, y: 20 }, { options: ['Acid X', 'Acid Y', 'Acid Z', ' '], start: 4, w: 46 })]
      }, { w: 156, h: s.size.h + 4 });
    })(),
    hints: [
      'Set the "pH" dial to the wanted pH, step through the three acids with the "Acid" dial, then set the answer dial.',
      'Compare the percentages of the two forms of each acid at that pH.',
      'A buffer needs plenty of both forms, so look for the acid whose two percentages are closest.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const a = SEALED[v - 1]; const y = SEALED[1];
      const [x1, x2] = pct(a, WANTED_PH); const [y1, y2] = pct(y, WANTED_PH);
      return { ok: false, msg: `At pH ${fmt(WANTED_PH, 1)} ${a.name} reads ${x1} percent acid form and ${x2} percent base form; ${y.name} reads ${y1} and ${y2}.` };
    },
    get reward() {
      const [y1, y2] = pct(SEALED[1], WANTED_PH);
      return {
        log: 'The best buffer came from the acid whose pKa was nearest the wanted pH.',
        title: 'Choosing an Acid',
        body: `At pH ${fmt(WANTED_PH, 1)} acid Y was ${y1} percent acid form and ${y2} percent base form, close to equal, while X and Z were nearly all one form. A buffer works best near its acid's pKa, so choose the acid whose pKa is closest to the pH wanted.`
      };
    }
  }
];

/** Stage 7's reading: the beaker after `n` pours. */
function solidAfterPour(salt, basic, n) {
  const probe = solidFixture('x', { x: 0, y: 0 }, { salt, solid: SOLID, basic });
  const state = { fixtures: { x: { props: probe.fixture.props, dials: { n: { value: n } } } } };
  return solidRead(state, 'x');
}

export const DEBRIEF = {
  title: 'pKa, Protonation and Capacity',
  body: 'An acid is mostly in its acid form below its pKa and its base form above it. A buffer holds best near its pKa, and its capacity grows with the amount of each member.'
};

export const SOLUTIONS = [
  [put('right', 'slot:guess')],
  [dial('st', 'ph', 3), dial('st', 'ph', 6), dial('pick', 'value', 2)],
  [dial('st', 'ph', 6), { type: { entry: 'pka', value: '5.1' } }],
  [pour('fd'), pour('fc'), dial('pick', 'value', 2)],
  [pour('f1'), { type: { entry: 'n', value: '24' } }],
  [pour('r1'), pour('r2'), pour('r3'), dial('pick', 'value', 1)],
  [pour('sm'), pour('sa'), dial('pick', 'value', 1)],
  [dial('st', 'ph', 4.5), dial('st', 'acid', 2), dial('pick', 'value', 2)]
];

export const MISSES = [
  [],
  [dial('st', 'ph', 3), dial('pick', 'value', 1)],
  [{ type: { entry: 'pka', value: '5.5' } }],
  [pour('fd'), dial('pick', 'value', 1)],
  [{ type: { entry: 'n', value: '8' } }],
  [pour('r2'), dial('pick', 'value', 2)],
  [pour('sa'), dial('pick', 'value', 2)],
  [dial('st', 'ph', 4.5), dial('pick', 'value', 1)]
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

export const CHECKS = {
  read, phOf, pct, ACETIC, METHYL_RED, SEALED, WANTED_PH, DILUTE, STRONG, SMALL, LARGE, POUR5, RATIOS, SOLID, TOL_PKA, GUESS, S2_OPTIONS, solidAfterPour, mixRead, stripRead
};
