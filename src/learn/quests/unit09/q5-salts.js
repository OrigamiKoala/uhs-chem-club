/**
 * Unit 9 · Bench 5 — Neutralization and Salts (q5-salts)
 *
 * Verdigris's salt bench, on the ph kit: the MIXING FLASK (`table/kits/ph-mix.js`: a flask, a jug and a window of 100 units that turn
 * green as they are used up), the pH meter and the flask of the first bench. ONE click: "neutralization always ends at pH 7; salts are
 * neutral". Every pH is `phdata.js` (the charge-balance solver for a pour, the exact weak acid and base solutions for a salt flask).
 *
 *   1  strong acid + strong base used up: acidic, neutral or basic?
 *   2  PREDICT: acetic acid + sodium hydroxide, equal amounts
 *   3  TEST: pour in the base until the acid is gone                                        -> salt hydrolysis
 *   4  ammonia + hydrochloric acid used up
 *   5  sort four salt flasks by the meter
 *   6  typed: pH after 30.0 mL of 0.10 M acid meets 20.0 mL of 0.10 M base (no meter)
 *   7  typed: pH of 0.10 M sodium acetate (no meter; Ka on a plate)
 *   8  sealed: three unlabelled salt flasks, which parent is weak
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, plaqueFixture, note, tag, pieceIn, dialValue, flaskFixture, meterPiece, neutParts, mixOf, flaskSol, concText
} from '../../table/kits/ph.js';
import { ACIDS, fmt, sci, titrationPH } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsalt hydrolysis\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit09/q3-weak'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q5-salts';
const GUESS = { seven: 'Exactly 7', above: 'Above 7', below: 'Below 7', fourteen: '14' };
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const TOL_PH = 0.03;
const KINDS = ['Acidic', 'Neutral', 'Basic'];

/* ---------------------------------------------------------------- what each stage's flask holds (inputs; every figure shown is the planner's) */

const MIX = (type, id, c) => ({ type, id, c, V: 50, ct: 0.10, step: 10, max: 6 });
const S1 = { mix: MIX('strongAcid', 'hcl', 0.10), name: 'Hydrochloric acid', reagent: 'sodium hydroxide', kind: 'acid' };
const S3 = { mix: MIX('weakAcid', 'acetic', 0.10), name: 'Acetic acid', reagent: 'sodium hydroxide', kind: 'acid' };
const S4 = { mix: MIX('weakBase', 'nh3', 0.10), name: 'Ammonia', reagent: 'hydrochloric acid', kind: 'base' };
const S6 = { mix: { type: 'strongAcid', id: 'hcl', c: 0.10, V: 30, ct: 0.10, step: 20, max: 1 }, name: 'Hydrochloric acid', reagent: 'sodium hydroxide', kind: 'acid' };
const EQUAL_K = 5;
const SALTS = [
  { key: 'nacl', solute: { id: 'nacl', c: 0.10 }, name: 'Sodium chloride' },
  { key: 'naf', solute: { id: 'fluoride', c: 0.10 }, name: 'Sodium fluoride' },
  { key: 'nh4cl', solute: { id: 'nh4', c: 0.10 }, name: 'Ammonium chloride' },
  { key: 'kno3', solute: { id: 'kno3', c: 0.10 }, name: 'Potassium nitrate' }
];
const ACETATE = { id: 'acetate', c: 0.10 };
const SEALED = [
  { id: 'fx', letter: 'X', solute: { id: 'fluoride', c: 0.10 }, answer: 1 },
  { id: 'fy', letter: 'Y', solute: { id: 'nh4', c: 0.10 }, answer: 2 },
  { id: 'fz', letter: 'Z', solute: { id: 'kno3', c: 0.10 }, answer: 0 }
];
const PARENTS = ['Both strong', 'Weak acid', 'Weak base', ' '];

const flaskPHOf = solute => flaskSol({ solute }).pH;
const kindOf = pH => (pH < 6.995 ? 0 : pH > 7.005 ? 2 : 1);
/** The mix fixture's reading after `k` pours. */
const mixAfter = (spec, k) => mixOf({ props: { neut: spec.mix }, dials: { poured: { value: k } } });

function neut(spec, at, o = {}) {
  return neutParts('mix', at, { ...spec, ...o });
}

/* ---------------------------------------------------------------- the three "pour until nothing is left" stages */

function pourStage({ id, title, spec, prompt, hints, wantKind, reward }) {
  const m = neut(spec, { x: 46, y: 36 });
  const eq = mixAfter(spec, EQUAL_K);
  const what = spec.kind === 'base' ? 'base' : 'acid';
  return {
    id, title, prompt, widget,
    table: phTable({
      pieces: [meterPiece('meter', { x: 132, y: 12 })],
      fixtures: [m.fixture, selectorFixture('pick', 'The flask is', { x: 138, y: 50 }, { options: [...KINDS, ' '], start: 4, w: 56 })],
      zones: { slots: [m.slot] }
    }, { w: 184, h: 72 }),
    hints,
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v - 1 === wantKind) return { ok: true };
      return { ok: false, msg: `With ${eq.mL} mL poured the window shows no ${what} left, and the meter reads ${fmt(eq.pH, 2)}.` };
    },
    ...(reward ? { reward } : {})
  };
}

const POUR_HINT = 'Use "Pour", the pH meter on its seat, and the answer dial.';

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  pourStage({
    id: 's1-strong', title: 'Acid Used Up', spec: S1, wantKind: 1,
    prompt: 'Pour in sodium hydroxide until no hydrochloric acid is left, then say whether the flask is acidic, neutral or basic.',
    hints: [POUR_HINT, 'Compare the window and the meter after each pour.', 'Read the flask at the pour where the window shows no acid left.'],
    reward: {
      log: 'The flask read 7.00 with the acid used up.',
      title: 'Strong Acid, Strong Base',
      get body() { return `With the acid used up the flask read ${fmt(mixAfter(S1, EQUAL_K).pH, 2)}. Sodium and chloride ions leave the water alone, so a strong acid and a strong base used up exactly give a pH of 7.`; }
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Will It Read?',
    predict: true,
    prompt: 'What will the pH be when acetic acid and sodium hydroxide are mixed in equal amounts, with none of either left over?',
    widget,
    table: phTable({
      pieces: [
        note('seven', GUESS.seven, { x: 30, y: 12 }),
        note('above', GUESS.above, { x: 80, y: 12 }),
        note('below', GUESS.below, { x: 30, y: 33 }),
        note('fourteen', GUESS.fourteen, { x: 80, y: 33 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 23 }, size: { w: 36, h: 14 } }] }
    }, { h: 50 }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what the flask holds once the acid and the base are both used up.',
      'Ask whether the ions left in the water can do anything to it.'
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
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Your prediction is locked in. Next, sodium hydroxide is poured into acetic acid until none of the acid is left.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const st = pourStage({
      id: 's3-weak-acid', title: 'Acetic Acid Used Up', spec: S3, wantKind: 2,
      prompt: 'Pour in sodium hydroxide until no acetic acid is left, then say whether the flask is acidic, neutral or basic.',
      hints: [POUR_HINT, 'Compare the meter at the pour where the window shows no acid left with the 7 you expected.', 'Ask what the acid left behind does when it meets water.']
    });
    Object.defineProperty(st, 'prompt', { get() { return guessLine('Pour in sodium hydroxide until no acetic acid is left, then say whether the flask is acidic, neutral or basic.', recall(QUEST_KEY)); }, enumerable: true });
    Object.defineProperty(st, 'reward', {
      enumerable: true,
      get() {
        const g = recall(QUEST_KEY); const pH = fmt(mixAfter(S3, EQUAL_K).pH, 2);
        const v = g === 'above' ? `You predicted above 7, and the meter read ${pH}. ` : g ? `The meter read ${pH}, not what you predicted. ` : '';
        return {
          log: 'The flask read 8.72 with the acid used up.',
          title: 'Salt Hydrolysis',
          body: `${v}Acetate, the base left behind by acetic acid, takes protons from water and leaves hydroxide, so the flask is basic. A salt's ion reacting with water like this is salt hydrolysis.`
        };
      }
    });
    return st;
  })(),

  /* ---------------------------------------------------------------- 4 */
  pourStage({
    id: 's4-weak-base', title: 'Ammonia Used Up', spec: S4, wantKind: 0,
    prompt: 'Pour in hydrochloric acid until no ammonia is left, then say whether the flask is acidic, neutral or basic.',
    hints: [POUR_HINT, 'Compare the meter at the pour where the window shows no base left with 7.', 'Ask what the base left behind by ammonia does when it meets water.'],
    reward: {
      log: 'The flask read 5.28 with the base used up.',
      title: 'Acidic Salt',
      get body() { return `Ammonium, the acid left behind by ammonia, gives protons to water, so the flask read ${fmt(mixAfter(S4, EQUAL_K).pH, 2)} and is acidic. Equal amounts of an acid and a base can leave a flask that is not neutral.`; }
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const X = [20, 58, 96, 134];
    const probe = flaskFixture('f0', { x: 0, y: 0 }, { solute: SALTS[0].solute, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12 });
    const fl = SALTS.map((s, i) => flaskFixture(`f${i + 1}`, { x: X[i], y: 1 + probe.size.h / 2 }, { solute: s.solute, label: s.name, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12 }));
    const trays = [['acidic', 'Acidic', 24], ['neutral', 'Neutral', 72], ['basic', 'Basic', 120]].map(([id, label, x]) => ({ id, label, at: { x, y: 76 }, size: { w: 44, h: 26 }, cell: 22, cellH: 12 }));
    return {
      id: 's5-sort',
      title: 'Four Salts',
      prompt: 'Sort the four salt solutions into acidic, neutral and basic.',
      widget,
      table: phTable({
        pieces: [meterPiece('meter', { x: 156, y: 12 }), ...SALTS.map((s, i) => tag(`c-${s.key}`, s.name, { x: 160, y: 30 + i * 20 }))],
        fixtures: fl.map(f => f.fixture),
        zones: { trays, slots: fl.map(f => f.slot) }
      }, { w: 184, h: 104 }),
      hints: [
        'Use the pH meter on each flask, then drag the cards into the trays.',
        'Compare the readings of the four flasks with 7.',
        'Place each card by whether its flask reads below, at or above 7.'
      ],
      check(state) {
        const t = state.table;
        const where = Object.fromEntries(SALTS.map(s => [s.key, t.pieces[`c-${s.key}`].zone]));
        if (Object.values(where).some(z => !z || !z.startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Drag every card into a tray.' };
        for (const s of SALTS) {
          const pH = flaskPHOf(s.solute);
          if (where[s.key] === `tray:${['acidic', 'neutral', 'basic'][kindOf(pH)]}`) continue;
          return { ok: false, msg: `The meter on ${s.name.toLowerCase()} reads ${fmt(pH, 2)}.` };
        }
        return { ok: true };
      },
      get reward() {
        const p = Object.fromEntries(SALTS.map(s => [s.key, fmt(flaskPHOf(s.solute), 2)]));
        return {
          log: 'Sodium fluoride read basic and ammonium chloride read acidic.',
          title: 'Which Ions React',
          body: `Sodium chloride and potassium nitrate read ${p.nacl}; sodium fluoride read ${p.naf} and ammonium chloride ${p.nh4cl}. An ion from a strong acid or a strong base does nothing to the pH; an ion from a weak one reacts with water.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const m = neut(S6, { x: 46, y: 34 }, { poured: 1, meter: false });
    return {
      id: 's6-excess',
      title: 'Acid Left Over',
      prompt: 'Find the pH of the flask after 20.0 mL of 0.10 M sodium hydroxide has been poured into 30.0 mL of 0.10 M hydrochloric acid.',
      widget,
      entry: { id: 'ph', label: 'pH', unit: '' },
      table: phTable({ fixtures: [m.fixture] }, { w: 130, h: 68 }),
      hints: [
        'Type the pH in the field; the window shows the flask after the pour.',
        'Compare the units still grey in the window with the units that were used up.',
        'Find the moles of acid that are left over, then divide by the total volume of liquid in the flask.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ph');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
        const r = mixAfter(S6, 1);
        if (Math.abs(v - r.pH) <= TOL_PH) return { ok: true };
        const win = `The window shows ${r.left} of 100 acid units left`;
        if (Math.abs(v - 7) <= 0.1) return { ok: false, msg: `${win}; a pH of 7.00 would need none left.` };
        if (Math.abs(v - 1) <= 0.05) return { ok: false, msg: `${win}; a pH of 1.00 is what 0.10 M acid alone reads.` };
        return { ok: false, msg: `${win}, and that does not give a pH of ${fmt(v, 2)}.` };
      },
      get reward() {
        const r = mixAfter(S6, 1);
        return {
          log: 'The acid left over decided the pH.',
          title: 'Excess Decides',
          body: `${r.left} of 100 units of acid were left. Those left-over moles, spread through 50.0 mL, set the pH at ${fmt(r.pH, 2)}: when one reagent is in excess, it decides the pH.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const f = flaskFixture('f1', { x: 40, y: 0 }, { solute: ACETATE, label: 'Sodium acetate', w: 64, window: 24, meter: false });
    const f2 = flaskFixture('f1', { x: 40, y: 1 + f.size.h / 2 }, { solute: ACETATE, label: 'Sodium acetate', w: 64, window: 24, meter: false });
    return {
      id: 's7-acetate',
      title: 'A Salt Between the Flasks',
      prompt: 'Find the pH of 0.10 M sodium acetate, to two decimal places.',
      widget,
      entry: { id: 'ph', label: 'pH', unit: '' },
      table: phTable({ fixtures: [f2.fixture, plaqueFixture('plate', 'Acetic acid', { x: 108, y: 16 }, ['Ka', sci(ACIDS.acetic.Ka, 2)], { w: 44 })] }, { w: 140, h: 50 }),
      hints: [
        'Type the pH in the field; the constant is printed on the plate.',
        'Compare this flask with the 0.050 M acetate flask you poured, and ask which ion is reacting.',
        'Turn the plate\'s constant into the constant for acetate, then find the hydroxide it makes.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ph');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
        const s = flaskSol({ solute: ACETATE });
        if (Math.abs(v - s.pH) <= TOL_PH) return { ok: true };
        if (Math.abs(v - s.pOH) <= 0.05) return { ok: false, msg: `${fmt(s.pOH, 2)} is the pOH of this flask; the question asks for its pH.` };
        if (Math.abs(v - 7) <= 0.1) return { ok: false, msg: `The 0.050 M acetate flask read ${fmt(mixAfter(S3, EQUAL_K).pH, 2)} in the pour, not 7.00.` };
        return { ok: false, msg: `A pH of ${fmt(v, 2)} is not what 0.10 M sodium acetate reads.` };
      },
      get reward() {
        const s = flaskSol({ solute: ACETATE });
        return {
          log: 'The constant for acetate gave the pH of the salt.',
          title: 'pH of a Salt',
          body: `Acetate makes hydroxide equal to the acetic acid it forms, ${sci(s.oh, 2)} mol/L here, so the pOH is ${fmt(s.pOH, 2)} and the pH ${fmt(s.pH, 2)}.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const probe = flaskFixture('p', { x: 0, y: 0 }, { solute: SEALED[0].solute, w: 44, window: 12, legend: false, waterNote: false, units: 120, cols: 12 });
    const fl = SEALED.map((s, i) => flaskFixture(s.id, { x: 24 + i * 46, y: 1 + probe.size.h / 2 }, { solute: s.solute, label: `Flask ${s.letter}`, w: 44, window: 12, legend: false, waterNote: false, units: 120, cols: 12 }));
    return {
      id: 's8-sealed',
      title: 'Three Unlabelled Salts',
      prompt: 'For each unlabelled salt flask, say which of its parent acid and parent base is weak.',
      widget,
      table: phTable({
        pieces: [meterPiece('meter', { x: 160, y: 10 })],
        fixtures: [...fl.map(f => f.fixture), ...SEALED.map((s, i) => selectorFixture(`d${s.id}`, `Flask ${s.letter}`, { x: 24 + i * 46, y: 62 }, { options: PARENTS, start: 4, w: 44 }))],
        zones: { slots: fl.map(f => f.slot) }
      }, { w: 184, h: 76 }),
      hints: [
        'Use the pH meter on each flask and set each dial.',
        'Compare each reading with 7.',
        'A reading at 7 means neither parent is weak; above or below 7 points to the weak one.'
      ],
      check(state) {
        const t = state.table;
        const vals = SEALED.map(s => dialValue(t, `d${s.id}`));
        if (vals.some(v => v === 4)) return { ok: false, notYet: true, msg: 'Set all three dials.' };
        for (const [i, s] of SEALED.entries()) {
          if (vals[i] - 1 === s.answer) continue;
          return { ok: false, msg: `Flask ${s.letter} reads ${fmt(flaskPHOf(s.solute), 2)} on the meter.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'A salt reads as its weak parent does.',
        title: 'Reading a Salt',
        body: 'A salt of a weak acid and a strong base reads basic, a salt of a strong acid and a weak base reads acidic, and a salt of two strong parents reads 7. The weak parent\'s ion is the one that reacts with water.'
      }
    };
  })()
];

export const DEBRIEF = {
  title: 'Neutralization and Salts',
  body: 'Used-up acid and base do not always leave pH 7. The ion of a weak parent reacts with water, so the salt reads basic or acidic.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, value) => ({ setDial: { fixture, dial: 'value', value } });
const pours = n => Array.from({ length: n }, () => ({ run: 'mix' }));
const seat = 'slot:mix.seat';

export const SOLUTIONS = [
  [put('meter', seat), ...pours(EQUAL_K), dial('pick', 2)],
  [put('seven', 'slot:guess')],
  [put('meter', seat), ...pours(EQUAL_K), dial('pick', 3)],
  [put('meter', seat), ...pours(EQUAL_K), dial('pick', 1)],
  [put('c-nacl', 'tray:neutral'), put('c-naf', 'tray:basic'), put('c-nh4cl', 'tray:acidic'), put('c-kno3', 'tray:neutral')],
  [{ type: { entry: 'ph', value: '1.70' } }],
  [{ type: { entry: 'ph', value: '8.87' } }],
  [dial('dfx', 2), dial('dfy', 3), dial('dfz', 1)]
];

export const MISSES = [
  [...pours(EQUAL_K), dial('pick', 1)],
  [],
  [...pours(EQUAL_K), dial('pick', 2)],
  [...pours(EQUAL_K), dial('pick', 2)],
  [put('c-nacl', 'tray:neutral'), put('c-naf', 'tray:neutral'), put('c-nh4cl', 'tray:acidic'), put('c-kno3', 'tray:neutral')],
  [{ type: { entry: 'ph', value: '7' } }],
  [{ type: { entry: 'ph', value: '5.13' } }],
  [dial('dfx', 1), dial('dfy', 3), dial('dfz', 1)]
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

export const CHECKS = { S1, S3, S4, S6, SALTS, ACETATE, SEALED, EQUAL_K, mixAfter, TOL_PH, titrationPH, concText };
