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

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bsalt hydrolysis\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit09/q3-weak'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q5-salts';
const GUESS = { seven: 'Exactly 7', above: 'Above 7', below: 'Below 7', fourteen: 'About 4' };
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const TOL_PH = 0.03;
const KINDS = ['Acidic', 'Neutral', 'Basic'];

/* ---------------------------------------------------------------- what each stage's flask holds (inputs; every figure shown is the planner's) */

const MIX = (type, id, c) => ({ type, id, c, V: 50, ct: 0.10, step: 10, max: 6 });
const S1 = { mix: MIX('strongAcid', 'hcl', 0.10), name: 'Hydrochloric acid', reagent: 'sodium hydroxide', kind: 'acid' };
const S3 = { mix: MIX('weakAcid', 'acetic', 0.10), name: 'Acetic acid', reagent: 'sodium hydroxide', kind: 'acid' };
const S4 = { mix: MIX('weakBase', 'nh3', 0.10), name: 'Ammonia', reagent: 'hydrochloric acid', kind: 'base' };
const S6 = { mix: { type: 'strongAcid', id: 'hcl', c: 0.10, V: 30, ct: 0.10, step: 20, max: 1 }, name: '30.0 mL of 0.10 M HCl', reagent: 'sodium hydroxide', kind: 'acid' };
const EQUAL_K = 5;
const SALTS = [
  { key: 'nacl', solute: { id: 'nacl', c: 0.10 }, name: 'Sodium chloride' },
  { key: 'naf', solute: { id: 'fluoride', c: 0.10 }, name: 'Sodium fluoride' },
  { key: 'nh4cl', solute: { id: 'nh4', c: 0.10 }, name: 'Ammonium chloride' },
  { key: 'kno3', solute: { id: 'kno3', c: 0.10 }, name: 'Potassium nitrate' }
];
const ACETATE = { id: 'acetate', c: 0.10 };

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
      fixtures: [m.fixture],
      zones: { slots: [m.slot] }
    }, { w: 184, h: 72 }),
    hints,
    // The graded answer is the flask itself: poured to the first pour at which the window shows none of the analyte left.
    check(state) {
      const k = Math.round(dialValue(state.table, 'mix', 'poured'));
      if (k === 0) return { ok: false, notYet: true, msg: 'Press "Pour" to add reagent first.' };
      if (k === EQUAL_K) return { ok: true };
      const now = mixAfter(spec, k);
      if (k < EQUAL_K) return { ok: false, msg: `After ${now.mL} mL, ${now.left} ${what} units are still left in the flask.` };
      return { ok: false, msg: `All the ${what} was already used up at ${eq.mL} mL; you added ${now.mL - eq.mL} mL of extra ${spec.reagent}.` };
    },
    ...(reward ? { reward } : {})
  };
}

const POUR_HINT = 'Put the pH meter on the flask and press "Pour".';

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  pourStage({
    id: 's1-strong', title: 'Acid Used Up', spec: S1, wantKind: 1,
    prompt: 'Find the exact pour where sodium hydroxide completely neutralizes the hydrochloric acid.',
    hints: [POUR_HINT, 'Watch the window and the pH meter after each pour.', 'Stop at the first pour where the window shows no acid left.'],
    reward: {
      log: 'The flask read 7.00 with the acid used up.',
      title: 'Strong Acid, Strong Base',
      get body() { return `pH ${fmt(mixAfter(S1, EQUAL_K).pH, 2)} — Na⁺ and Cl⁻ do not react with water, so the solution is neutral. When acid and base use each other up, that is neutralization.`; }
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Will It Read?',
    predict: true,
    prompt: 'What will the pH be when acetic acid and sodium hydroxide are mixed in equal amounts, with none left over?',
    widget,
    table: (() => {
      const preview = neut(S3, { x: 46, y: 82 }, { meter: false, pour: false, title: 'Acetic acid + NaOH jug' });
      return phTable({
        pieces: [
          note('seven', GUESS.seven, { x: 26, y: 12 }),
          note('above', GUESS.above, { x: 76, y: 12 }),
          note('below', GUESS.below, { x: 26, y: 34 }),
          note('fourteen', GUESS.fourteen, { x: 76, y: 34 })
        ],
        fixtures: [preview.fixture],
        zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 138, y: 24 }, size: { w: 46, h: 18 } }] }
      }, { w: 170, h: 114 });
    })(),
    hints: [
      'Place one of the four prediction cards in the slot.',
      'Think about what the flask holds once the acid and base are both used up.',
      'Think about whether the ions left behind can react with water.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, pour sodium hydroxide into acetic acid until all the acid is used up.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const st = pourStage({
      id: 's3-weak-acid', title: 'Acetic Acid Used Up', spec: S3, wantKind: 2,
      prompt: 'Find the exact pour where sodium hydroxide completely neutralizes the acetic acid.',
      hints: [POUR_HINT, 'Check the pH meter when the window shows no acid left—compare it with pH 7.', 'Think about what the acetate ion left behind does in water.']
    });
    Object.defineProperty(st, 'prompt', { get() { return guessLine('Find the exact pour where sodium hydroxide completely neutralizes the acetic acid.', recall(QUEST_KEY)); }, enumerable: true });
    Object.defineProperty(st, 'reward', {
      enumerable: true,
      get() {
        const g = recall(QUEST_KEY); const pH = fmt(mixAfter(S3, EQUAL_K).pH, 2);
        const v = g === 'above' ? `You predicted above 7, and the meter read ${pH}. ` : g ? `The meter read ${pH}, not what you predicted. ` : '';
        return {
          log: 'The flask read 8.72 with the acid used up.',
          title: 'Salt Hydrolysis',
          body: `${v}Acetate is a weak base: it takes protons from water, making the salt basic (salt hydrolysis).`
        };
      }
    });
    return st;
  })(),

  /* ---------------------------------------------------------------- 4 */
  pourStage({
    id: 's4-weak-base', title: 'Ammonia Used Up', spec: S4, wantKind: 0,
    prompt: 'Find the exact pour where hydrochloric acid completely neutralizes the ammonia.',
    hints: [POUR_HINT, 'Check the pH meter when the window shows no base left—compare it with pH 7.', 'Think about what the ammonium ion formed from ammonia does in water.'],
    reward: {
      log: 'The flask read 5.28 with the base used up.',
      title: 'Acidic Salt',
      get body() { return `Ammonium (NH₄⁺) donates a proton back to water, making the solution acidic at pH ${fmt(mixAfter(S4, EQUAL_K).pH, 2)}.`; }
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const X = [20, 58, 96, 134];
    const probe = flaskFixture('f0', { x: 0, y: 0 }, { solute: SALTS[0].solute, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12 });
    const fl = SALTS.map((s, i) => flaskFixture(`f${i + 1}`, { x: X[i], y: 1 + probe.size.h / 2 }, { solute: s.solute, label: s.name, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12, meter: i < 2 }));
    const trays = [['acidic', 'Acidic', 26], ['neutral', 'Neutral', 78], ['basic', 'Basic', 130]].map(([id, label, x]) => ({ id, label, at: { x, y: 88 }, size: { w: 48, h: 30 }, cell: 26, cellH: 13 }));
    return {
      id: 's5-sort',
      title: 'Four Salts',
      prompt: 'Which salt solutions are acidic, which neutral and which basic?',
      widget,
      table: phTable({
        pieces: [meterPiece('meter', { x: 172, y: 10 }), ...SALTS.map((s, i) => tag(`c-${s.key}`, s.name, { x: 172, y: 34 + i * 20 }))],
        fixtures: [...fl.map(f => f.fixture), plaqueFixture('parents', 'Strong parents', { x: 76, y: 58 }, ['HCl, HNO₃ · NaOH, KOH', 'A salt takes after its stronger parent'], { w: 108 })],
        zones: { trays, slots: fl.filter(f => f.slot).map(f => f.slot) }
      }, { w: 196, h: 112 }),
      hints: [
        'Put the pH meter on sodium chloride and sodium fluoride, and read the strong-parents plate.',
        'Compare the two flasks you measured with the other two using the ions on the plate.',
        'Ions from strong parents leave water neutral; an ion from a weak parent shifts the pH.'
      ],
      check(state) {
        const t = state.table;
        const where = Object.fromEntries(SALTS.map(s => [s.key, t.pieces[`c-${s.key}`].zone]));
        if (Object.values(where).some(z => !z || !z.startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Drag every card into a tray.' };
        for (let i = 0; i < SALTS.length; i++) {
          const s = SALTS[i];
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
          body: `NaCl and KNO₃ are neutral (${p.nacl}); NaF is basic (${p.naf}) and NH₄Cl is acidic (${p.nh4cl}). Ions from weak acids or bases react with water.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const m = neut(S6, { x: 46, y: 34 }, { poured: 1, meter: false, pour: false });
    return {
      id: 's6-excess',
      title: 'Acid Left Over',
      prompt: 'After 20 mL of 0.10 M NaOH is added to 30 mL of 0.10 M HCl, what is the pH?',
      widget,
      entry: { id: 'ph', label: 'pH', unit: '' },
      table: phTable({ fixtures: [m.fixture] }, { w: 130, h: 68 }),
      hints: [
        'Type the pH in the field; the window shows the flask after the pour.',
        'Compare the acid units still grey in the window with the ones that were used up.',
        'Find the moles of acid left over, divide by the total volume (50 mL), and take −log[H₃O⁺].'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ph');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
        const r = mixAfter(S6, 1);
        if (Math.abs(v - r.pH) <= TOL_PH) return { ok: true };
        const win = `The window shows ${r.left} of 100 acid units left`;
        if (Math.abs(v - 7) <= 0.1) return { ok: false, msg: `${win}; a pH of 7.00 would mean none was left.` };
        if (Math.abs(v - 1) <= 0.05) return { ok: false, msg: `${win}; pH 1.00 is for undiluted 0.10 M HCl before neutralization.` };
        return { ok: false, msg: `${win}, which does not give pH ${fmt(v, 2)}.` };
      },
      get reward() {
        const r = mixAfter(S6, 1);
        return {
          log: 'The acid left over decided the pH.',
          title: 'Excess Decides',
          body: `10 mL of 0.10 M HCl is left over in 50.0 mL total (0.020 M H₃O⁺), giving pH ${fmt(r.pH, 2)}. Excess acid or base sets the pH.`
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
      title: 'Finding a Salt’s pH',
      briefing: {
        intro: 'Use Kb of acetate to find [OH⁻], then pOH, then pH = 14 − pOH.'
      },
      prompt: 'What is the pH of 0.10 M sodium acetate (to two decimal places)?',
      widget,
      entry: { id: 'ph', label: 'pH', unit: '' },
      table: phTable({ fixtures: [f2.fixture, plaqueFixture('plate', 'Acetate (CH₃COO⁻)', { x: 110, y: 18 }, [`Acetic acid Ka = ${sci(ACIDS.acetic.Ka, 2)}`, `Acetate Kb = Kw ÷ Ka = 5.6 × 10⁻¹⁰`], { w: 56 })] }, { w: 146, h: 52 }),
      hints: [
        'Use Calc with Kb from the plate to find [OH⁻], then pOH, then pH.',
        'With [OH⁻] = √(Kb × 0.10), take −log to get pOH.',
        'Subtract pOH from 14 to get pH.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ph');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
        const s = flaskSol({ solute: ACETATE });
        if (Math.abs(v - s.pH) <= TOL_PH) return { ok: true };
        if (Math.abs(v - s.pOH) <= 0.05) return { ok: false, msg: 'That number is the pOH; subtract it from 14 to get pH.' };
        if (Math.abs(v - 7) <= 0.1) return { ok: false, msg: `Sodium acetate is basic (0.050 M read ${fmt(mixAfter(S3, EQUAL_K).pH, 2)} earlier), not neutral.` };
        return { ok: false, msg: `pH ${fmt(v, 2)} does not match 0.10 M sodium acetate.` };
      },
      get reward() {
        const s = flaskSol({ solute: ACETATE });
        return {
          log: 'The constant for acetate gave the pH of the salt.',
          title: 'pH of a Salt',
          body: `Using [OH⁻] = √(Kb × 0.10) gives ${sci(s.oh, 2)} M OH⁻, pOH ${fmt(s.pOH, 2)}, and pH ${fmt(s.pH, 2)}.`
        };
      }
    };
  })()
];

export const DEBRIEF = {
  title: 'Neutralization and Salts',
  body: 'Neutralizing an acid and base does not always end at pH 7. If either parent is weak, its leftover ion reacts with water to make the salt acidic or basic.'
};

const put = (piece, to) => ({ place: { piece, to } });
const pours = n => Array.from({ length: n }, () => ({ run: 'mix' }));
const seat = 'slot:mix.seat';

export const SOLUTIONS = [
  [put('meter', seat), ...pours(EQUAL_K)],
  [put('seven', 'slot:guess')],
  [put('meter', seat), ...pours(EQUAL_K)],
  [put('meter', seat), ...pours(EQUAL_K)],
  [put('c-nacl', 'tray:neutral'), put('c-naf', 'tray:basic'), put('c-nh4cl', 'tray:acidic'), put('c-kno3', 'tray:neutral')],
  [{ type: { entry: 'ph', value: '1.70' } }],
  [{ type: { entry: 'ph', value: '8.87' } }]
];

export const MISSES = [
  [...pours(EQUAL_K + 1)],
  [],
  [...pours(EQUAL_K - 1)],
  [...pours(EQUAL_K + 1)],
  [put('c-nacl', 'tray:neutral'), put('c-naf', 'tray:neutral'), put('c-nh4cl', 'tray:acidic'), put('c-kno3', 'tray:neutral')],
  [{ type: { entry: 'ph', value: '7' } }],
  [{ type: { entry: 'ph', value: '5.13' } }]
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

export const CHECKS = { S1, S3, S4, S6, SALTS, ACETATE, EQUAL_K, mixAfter, TOL_PH, titrationPH, concText };
