/**
 * Unit 9 · Bench 2 — Reading the Scale (q2-scale)
 *
 * Verdigris's second bench, on the ph kit (`table/kits/ph.js`: the scale flask and the two meters in `ph-scale.js`). Eight stages and TWO
 * clicks: pH is a linear count, and neutral water is pH 7 whatever its temperature.
 *
 *   1  three hydrochloric acid flasks, one pH meter: how the reading steps with each tenfold dilution          -> pH
 *   2  typed: the pH of a 3.2 × 10⁻⁴ M flask that no meter can read (past the three flasks)
 *   3  the pH and pOH meters on three sodium hydroxide flasks: typed, what the two readings add to              -> pOH
 *   4  typed: the pH of 0.025 M barium hydroxide (no meter), two hydroxides to each unit                        -> strong base
 *   5  a dilution chain of hydrochloric acid to 10⁻⁹ M: does the pH keep rising past 7?                          -> strong acid
 *   6  PREDICT: pure water is warmed to 50 °C; what is its pH?
 *   7  warm the water (a dial of two settings, a meter and a lens counting H₃O⁺ and OH⁻): acidic, neutral or basic?
 *   8  sealed: type the hydronium of a flask from its pH
 *
 * Every figure is `engine/phdata.js` `scaleSolution` (water's own ionization included, Kw at the dial's temperature). This quest pays no
 * XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, note, pieceIn, dialValue, scaleFlask, scaleMeter, scaleWindow, scaleRead, strengthText
} from '../../table/kits/ph.js';
import { scaleSolution, waterIons, sci, fmt, pOf } from '../../engine/phdata.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
  { term: /\bpH\b/, introducedAt: 1 },
  { term: /\bpOH\b/, introducedAt: 4 },
  { term: /\bstrong bases?\b/i, introducedAt: 5 },
  { term: /\bneutral\b/i, introducedAt: 8 }
];

/** The proton words of the first bench (hydronium, acid, base) are used on the flasks. */
export const BUILDS_ON = ['unit09/q1-handover'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q2-scale';
const GUESS = {
  seven: 'The pH is exactly 7.00',
  above: 'The pH is above 7',
  below: 'The pH is below 7',
  zero: 'The pH is 0'
};
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const typed = (entry, value) => ({ type: { entry, value } });

/* ---------------------------------------------------------------- what each stage's flasks hold (inputs only) */

const HCL = c => ({ id: 'hcl', c });
const NAOH = c => ({ id: 'naoh', c });
const S1 = [0.1, 0.01, 0.001].map(HCL);
const S2_POW = [1e-2, 1e-3].map(HCL);
const S2_POW_ASK = HCL(1e-5);
const S3_REF = [1e-3, 1e-4].map(HCL);
const S3_ASK = HCL(3.2e-4);
const S4 = [0.1, 0.01, 0.001].map(NAOH);
const S5_REF = [NAOH(0.1), NAOH(0.01)];
const S5_ASK = { id: 'baoh2', c: 0.025 };
const S6 = [1e-6, 1e-7, 1e-8, 1e-9].map(HCL);
const WATER = { id: 'water', c: 0 };
const TEMPS = [25, 50];
const S9 = HCL(2.4e-3);
const FLASK_X = [24, 70, 116];

const S1_CARDS = {
  rises1: 'Rises by 1',
  falls1: 'Falls by 1',
  halves: 'Halves',
  rises10: 'Rises by 10'
};
const S6_CARDS = {
  past7: 'It keeps rising steadily',
  near7: 'It levels off at one value',
  near14: 'It drops back down'
};

function flaskAt(id, x, top, o) {
  const probe = scaleFlask(id, { x, y: 0 }, o);
  return scaleFlask(id, { x, y: top + probe.size.h / 2 }, o);
}
const ph = s => scaleSolution(s).pH;
const near = (v, x, tol) => Math.abs(v - x) <= tol;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-steps',
    title: 'Reading the Steps',
    briefing: {
      speaker: 'Vess',
      body: 'The pH meter reads how much H₃O⁺ a solution holds. The lower the pH, the more H₃O⁺.'
    },
    prompt: 'What does a tenfold dilution do to the pH of an acid?',
    widget,
    table: (() => {
      const f = flaskAt('f1', 30, 1, { solute: S1[0], label: 'Hydrochloric acid', w: 54, dilute: 3 });
      return phTable({
        pieces: [
          scaleMeter('meter', { x: 74, y: 48 }, 'pH'),
          note('rises1', S1_CARDS.rises1, { x: 118, y: 12 }),
          note('falls1', S1_CARDS.falls1, { x: 162, y: 12 }),
          note('halves', S1_CARDS.halves, { x: 118, y: 32 }),
          note('rises10', S1_CARDS.rises10, { x: 162, y: 32 })
        ],
        fixtures: [f.fixture],
        zones: { slots: [f.slot, { id: 'ans', label: 'My answer', at: { x: 140, y: 56 }, size: { w: 40, h: 14 } }] }
      }, { w: 192, h: 76 });
    })(),
    hints: [
      'Lay the pH meter on the flask, press "Dilute" twice, then place a card in the slot.',
      'Compare the pH reading after each tenfold dilution.',
      'Watch how much the pH changes each time the H₃O⁺ drops by a factor of ten.'
    ],
    check(state) {
      const n = Math.round(dialValue(state.table, 'f1', 'steps'));
      if (n < 2) return { ok: false, notYet: true, msg: 'Dilute the acid at least twice with the pH meter on it.' };
      const card = pieceIn(state.table, 'ans');
      if (!card) return { ok: false, notYet: true, msg: 'Lay an answer card in the slot.' };
      if (card.id === 'rises1') return { ok: true };
      const now = ph({ ...S1[0], c: S1[0].c * Math.pow(0.1, n) });
      return { ok: false, msg: `After ${n} dilutions the flask reads ${fmt(now, 2)}, up from 1.00.` };
    },
    reward: {
      log: 'Each tenfold dilution raised the pH by 1.',
      title: 'The pH Scale',
      body: 'Each tenfold dilution leaves a tenth of the H₃O⁺ and raises the pH by 1. One step on the pH scale is a factor of ten.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-powers',
    title: 'Powers of Ten',
    prompt: 'What is the pH of 1.0 × 10⁻⁵ mol/L hydrochloric acid?',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const ref = S2_POW.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Hydrochloric acid' }));
      const ask = flaskAt('f3', FLASK_X[2], 1, { solute: S2_POW_ASK, label: 'Hydrochloric acid', meter: false });
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...ref.map(x => x.fixture), ask.fixture],
        zones: { slots: ref.map(x => x.slot) }
      }, { w: 184, h: 52 });
    })(),
    hints: [
      'Lay the pH meter on the two flasks with seats, then type the third flask’s pH.',
      'Compare the exponent of each concentration with the pH reading on that flask.',
      'Each tenfold step lowers the concentration by one power of ten and raises the pH by 1.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const x = ph(S2_POW_ASK);
      if (near(v, x, 0.02)) return { ok: true };
      const [hi, lo] = [ph(S2_POW[0]), ph(S2_POW[1])];
      if (v < 0) return { ok: false, msg: `The other two flasks read ${fmt(hi, 2)} and ${fmt(lo, 2)}, both above zero.` };
      if (v <= lo) return { ok: false, msg: `1.0 × 10⁻⁵ mol/L holds less hydronium than 1.0 × 10⁻³ mol/L (pH ${fmt(lo, 2)}), so its pH is higher.` };
      return { ok: false, msg: `Compare 1.0 × 10⁻⁵ mol/L with 1.0 × 10⁻² mol/L (pH ${fmt(hi, 2)}) and 1.0 × 10⁻³ mol/L (pH ${fmt(lo, 2)}).` };
    },
    reward: {
      log: 'For a power of ten, the pH is the exponent with its sign dropped.',
      title: 'Powers of Ten',
      body: '5.00. Hydrochloric acid donates all its protons to water, so its H₃O⁺ concentration is its own concentration, and the pH is the power of ten with its sign dropped.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's2-typed',
    title: 'Between the Flasks',
    briefing: {
      speaker: 'Vess',
      body: 'For a concentration between two powers of ten, the logarithm gives the place between: pH = −log[H₃O⁺]. The log key on the calculator works it out.',
      worked: [
        '[H₃O⁺] = 2.0 × 10⁻³ mol/L',
        'log(2.0 × 10⁻³) = −2.70',
        'pH = 2.70'
      ]
    },
    prompt: 'What is the pH of 3.2 × 10⁻⁴ M hydrochloric acid, to two decimal places?',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const ref = S3_REF.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Hydrochloric acid' }));
      const ask = flaskAt('f3', FLASK_X[2], 1, { solute: S3_ASK, label: 'Hydrochloric acid', meter: false });
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...ref.map(x => x.fixture), ask.fixture],
        zones: { slots: ref.map(x => x.slot) }
      }, { w: 184, h: 52 });
    })(),
    hints: [
      'Lay the pH meter on the two flasks with seats, then use Calc to find the third flask’s pH.',
      'Compare 3.2 × 10⁻⁴ M with the 1.0 × 10⁻³ M and 1.0 × 10⁻⁴ M flasks.',
      'Use pH = −log[H₃O⁺] as shown in the worked example.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const x = ph(S3_ASK);
      if (near(v, x, 0.02)) return { ok: true };
      const [hi, lo] = [ph(S3_REF[0]), ph(S3_REF[1])];
      if (v < 0) return { ok: false, msg: `The meter reads ${fmt(hi, 2)} and ${fmt(lo, 2)} on the flasks beside this one, both above zero.` };
      if (near(v, lo, 0.03)) return { ok: false, msg: `The 1.0 × 10⁻⁴ M flask reads ${fmt(lo, 2)}; this flask holds more hydronium than that one.` };
      if (v < hi || v > lo) return { ok: false, msg: `The meter reads ${fmt(hi, 2)} on the 1.0 × 10⁻³ M flask and ${fmt(lo, 2)} on the 1.0 × 10⁻⁴ M flask; this flask is between them.` };
      return { ok: false, msg: `A pH of ${fmt(v, 2)} stands for ${sci(10 ** -v, 2)} mol/L of hydronium; this flask holds ${sci(S3_ASK.c, 2)} M of acid, all of it ionized in the window.` };
    },
    get reward() {
      const s = scaleSolution(S3_ASK);
      return {
        log: 'A concentration between the flasks gave a pH between their readings.',
        title: 'Reading a Concentration',
        body: `${fmt(s.pH, 2)}, between the readings ${fmt(ph(S3_REF[0]), 2)} and ${fmt(ph(S3_REF[1]), 2)} of the flasks on either side. The logarithm places every concentration on the pH scale.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's3-poh',
    title: 'Two Meters',
    briefing: {
      speaker: 'Vess',
      body: 'The pOH meter counts OH⁻ the way the pH meter counts H₃O⁺.'
    },
    prompt: 'What do the pH and the pOH of a solution add up to?',
    widget,
    entry: { id: 'sum', label: 'pH + pOH', unit: '' },
    table: (() => {
      const f = S4.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Sodium hydroxide' }));
      return phTable({
        pieces: [scaleMeter('meter', { x: 154, y: 9 }, 'pH'), scaleMeter('meterOH', { x: 154, y: 36 }, 'pOH')],
        fixtures: f.map(x => x.fixture),
        zones: { slots: f.map(x => x.slot) }
      }, { w: 184, h: 66 });
    })(),
    hints: [
      'Lay each meter on a flask, then type the sum.',
      'Add the pH and pOH readings on one flask, then check the other two flasks.',
      'Compare the three sums with each other.'
    ],
    check(state) {
      const t = state.table;
      const sampled = ['f1', 'f2', 'f3'].filter(id => t.fixtures[id]?.props?.noted != null).length;
      if (sampled < 2) return { ok: false, notYet: true, msg: 'Sample at least two flasks with the meters first.' };
      const v = entryNumber(t, 'sum');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (near(v, 14, 0.05)) return { ok: true };
      const s = scaleSolution(S4[0]);
      return { ok: false, msg: `On the 0.10 M flask the pH meter reads ${fmt(s.pH, 2)} and the pOH meter reads ${fmt(s.pOH, 2)}; they do not add to ${fmt(v, 2)}.` };
    },
    get reward() {
      const s = scaleSolution(S4[0]);
      return {
        log: 'pH and pOH added to 14 in every flask.',
        title: 'pOH',
        body: `${fmt(s.pH + s.pOH, 0)}. In every flask at 25 °C, pH + pOH = 14.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's4-typed',
    title: 'Two Hydroxides Each',
    prompt: 'What is the pH of 0.025 M barium hydroxide, to two decimal places?',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const ref = S5_REF.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Sodium hydroxide' }));
      const ask = flaskAt('f3', FLASK_X[2], 1, { solute: S5_ASK, label: 'Barium hydroxide', meter: false });
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...ref.map(x => x.fixture), ask.fixture],
        zones: { slots: ref.map(x => x.slot) }
      }, { w: 184, h: 52 });
    })(),
    hints: [
      'Lay the pH meter on the two flasks with seats, then type the third flask’s pH.',
      'Compare the window of barium hydroxide with the windows of the sodium hydroxide flasks.',
      'The pH follows from the OH⁻ actually in the water, which is not the concentration on the label.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = scaleSolution(S5_ASK);
      if (near(v, s.pH, 0.03)) return { ok: true };
      const once = scaleSolution({ id: 'naoh', c: S5_ASK.c });
      if (near(v, s.pOH, 0.05)) return { ok: false, msg: `A pH of ${fmt(v, 2)} would be an acid; the flasks beside this one read ${fmt(ph(S5_REF[1]), 2)} and ${fmt(ph(S5_REF[0]), 2)}.` };
      if (near(v, once.pH, 0.05)) return { ok: false, msg: 'The window shows two OH⁻ for each Ba(OH)₂ formula unit; that figure counts one.' };
      return { ok: false, msg: `The meter reads ${fmt(ph(S5_REF[1]), 2)} on the 0.010 M sodium hydroxide flask and ${fmt(ph(S5_REF[0]), 2)} on the 0.10 M one, and ${fmt(v, 2)} does not fit this flask's window.` };
    },
    get reward() {
      const s = scaleSolution(S5_ASK);
      return {
        log: 'Barium hydroxide gave two hydroxides per formula unit.',
        title: 'Strong Bases',
        body: `0.025 M Ba(OH)₂ gives ${fmt(2 * S5_ASK.c, 3)} M OH⁻: pOH ${fmt(s.pOH, 2)}, pH ${fmt(s.pH, 2)}. A base that releases all of its hydroxide ions is a strong base.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's5-chain',
    title: 'Diluting Again and Again',
    prompt: 'What happens to the pH of hydrochloric acid as it is diluted again and again?',
    widget,
    table: (() => {
      const f = flaskAt('f1', 30, 1, { solute: S6[0], label: 'Hydrochloric acid', w: 54, dilute: 3 });
      return phTable({
        pieces: [
          scaleMeter('meter', { x: 74, y: 48 }, 'pH'),
          note('past7', S6_CARDS.past7, { x: 118, y: 12 }),
          note('near7', S6_CARDS.near7, { x: 162, y: 12 }),
          note('near14', S6_CARDS.near14, { x: 118, y: 32 })
        ],
        fixtures: [f.fixture],
        zones: { slots: [f.slot, { id: 'ans', label: 'My answer', at: { x: 140, y: 56 }, size: { w: 40, h: 14 } }] }
      }, { w: 192, h: 76 });
    })(),
    hints: [
      'Lay the pH meter on the flask, press "Dilute" three times, then place a card in the slot.',
      'Watch how the pH step shrinks at each tenfold dilution.',
      'Ask where the H₃O⁺ in the flask comes from when almost no acid is left.'
    ],
    check(state) {
      const k = Math.round(dialValue(state.table, 'f1', 'steps'));
      if (k < 2) return { ok: false, notYet: true, msg: 'Dilute the acid below 10⁻⁷ M first.' };
      const card = pieceIn(state.table, 'ans');
      if (!card) return { ok: false, notYet: true, msg: 'Lay an answer card in the slot.' };
      if (card.id === 'near7') return { ok: true };
      return { ok: false, msg: `After three dilutions the ${sci(S6[3].c, 2)} M flask reads ${fmt(ph(S6[3]), 2)}, not 9.00.` };
    },
    get reward() {
      return {
        log: 'The pH of diluted acid levelled off at 7.',
        title: 'Strong Acids and the Floor',
        body: `Water supplies ${sci(waterIons({}).h, 2)} mol/L of H₃O⁺ of its own, so the ${sci(S6[3].c, 2)} M flask reads ${fmt(ph(S6[3]), 2)}, not 9.00.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's6-predict',
    title: 'Warm Water',
    predict: true,
    prompt: 'Which best describes the pH of pure water after it is warmed to 50 °C?',
    widget,
    table: phTable({
      pieces: [
        note('seven', GUESS.seven, { x: 30, y: 9 }),
        note('above', GUESS.above, { x: 80, y: 9 }),
        note('below', GUESS.below, { x: 30, y: 30 }),
        note('zero', GUESS.zero, { x: 80, y: 30 })
      ],
      // The lead-in: pure water at 25 °C, a few units handing a proton over and taking it back, with no control.
      fixtures: [flaskAt('clip', 60, 44, { solute: WATER, label: 'Pure water, 25 °C', w: 60, window: 12, meter: false, legend: true }).fixture],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 20 }, size: { w: 36, h: 14 } }] }
    }, { h: 90 }),
    leadIn: true,
    hints: [
      'Place one of the four prediction cards in the slot.',
      'Think about what the pH of pure water counts, and what warming might do to autoionization.',
      'Ask whether warm water still has the same H₃O⁺ concentration as water at 25 °C.'
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
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, the pure water is warmed and read.' }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's7-warm',
    title: 'Warming the Water',
    get prompt() { return guessLine('Is pure water at 50 °C acidic, neutral or basic?', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const f = flaskAt('f1', 32, 1, { solute: WATER, label: 'Pure water', w: 52, window: 16, temps: TEMPS, lens: true });
      return phTable({
        pieces: [scaleMeter('meter', { x: 100, y: 10 }, 'pH')],
        fixtures: [f.fixture, selectorFixture('pick', 'The warm water is', { x: 124, y: 46 }, { options: ['Acidic', 'Neutral', 'Basic', ' '], start: 4, w: 56 })],
        zones: { slots: [f.slot] }
      }, { w: 160, h: 72 });
    })(),
    hints: [
      'Set the "Temperature" dial to 50 °C, lay the pH meter on the flask, then set the answer dial.',
      'Compare the amounts of H₃O⁺ and OH⁻ that the counter shows at 25 °C and 50 °C.',
      'Neutral means equal H₃O⁺ and OH⁻, whatever the pH number reads.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const w = waterIons({ T: 50 });
      return { ok: false, msg: `At 50 °C the counter counts ${sci(w.h, 2)} mol/L of H₃O⁺ and ${sci(w.oh, 2)} mol/L of OH⁻.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const s = scaleSolution({ id: 'water', T: 50 });
      const verdict = g === 'below' ? 'The prediction held. ' : g ? 'Not what you predicted. ' : '';
      return {
        log: 'Warm water is neutral at a pH below 7.',
        title: 'Neutral Is Not Always 7',
        body: `${verdict}At 50 °C pure water reads ${fmt(s.pH, 2)} yet holds equal H₃O⁺ and OH⁻, ${sci(s.h, 2)} mol/L each, so it is neutral. Kw grows with temperature, so neutral is a pH of 7 only at 25 °C.`
      };
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: 's8-sealed',
    title: 'Sealed Flask',
    briefing: {
      speaker: 'Vess',
      body: 'To go from a pH back to a concentration, undo the logarithm with a power of ten: [H₃O⁺] = 10^(−pH).',
      worked: [
        'pH = 3.30',
        '[H₃O⁺] = 10^(−3.30)',
        '= 5.0 × 10⁻⁴ mol/L'
      ]
    },
    prompt: 'What is the concentration of H₃O⁺ in the sealed flask, in mol/L?',
    widget,
    entry: { id: 'h', label: 'H₃O⁺ in mol/L (like 5.0e-4)', unit: 'M' },
    table: (() => {
      const f = flaskAt('f1', 30, 1, { solute: S9, w: 44, sealed: true });
      return phTable({
        pieces: [scaleMeter('meter', { x: 92, y: 12 }, 'pH')],
        fixtures: [f.fixture],
        zones: { slots: [f.slot] }
      }, { w: 124, h: 52 });
    })(),
    hints: [
      'Lay the pH meter on the flask, then use Calc to find [H₃O⁺].',
      'Compare the meter reading with the powers of ten on earlier flasks.',
      'Use [H₃O⁺] = 10^(−pH) as shown in the worked example.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'h');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = scaleSolution(S9);
      if (v > 0 && Math.abs(v / s.h - 1) <= 0.05) return { ok: true };
      if (near(v, s.pH, 0.05)) return { ok: false, msg: `${fmt(s.pH, 2)} is the number the meter shows; the question asks for mol/L of hydronium.` };
      if (v >= 1) return { ok: false, msg: 'That is more hydronium than any flask on this bench holds; the strongest is 0.10 M.' };
      if (v <= 0) return { ok: false, msg: 'A concentration is above zero.' };
      return { ok: false, msg: `${sci(v, 2)} mol/L of hydronium would read a pH of ${fmt(pOf(v), 2)}, and the meter reads ${fmt(s.pH, 2)}.` };
    },
    get reward() {
      const s = scaleSolution(S9);
      return {
        log: 'A pH reading was turned back into a concentration.',
        title: 'Back From the Scale',
        body: `${sci(s.h, 2)} mol/L. A pH of ${fmt(s.pH, 2)} gives [H₃O⁺] = 10^(−${fmt(s.pH, 2)}), the concentration of hydrochloric acid in the sealed flask.`
      };
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Reading the Scale',
  body: 'pH counts hydronium on a log scale, so each step is a factor of ten. Neutral means equal hydronium and hydroxide, which is pH 7 only at 25 °C.'
};

const seat = i => `slot:f${i}.seat`;

export const SOLUTIONS = [
  [put('meter', seat(1)), { run: 'f1' }, { run: 'f1' }, put('rises1', 'slot:ans')],
  [put('meter', seat(1)), typed('ph', '5.00')],
  [put('meter', seat(1)), typed('ph', '3.49')],
  [put('meter', seat(1)), put('meterOH', seat(1)), put('meter', seat(2)), put('meterOH', seat(2)), typed('sum', '14')],
  [put('meter', seat(1)), typed('ph', '12.70')],
  [put('meter', seat(1)), { run: 'f1' }, { run: 'f1' }, { run: 'f1' }, put('near7', 'slot:ans')],
  [put('below', 'slot:guess')],
  [dial('f1', 'T', 2), put('meter', seat(1)), dial('pick', 'value', 2)],
  [put('meter', seat(1)), typed('h', '2.4e-3')]
];

export const MISSES = [
  [{ run: 'f1' }, { run: 'f1' }, put('falls1', 'slot:ans')],
  [typed('ph', '3')],
  [typed('ph', '4')],
  [typed('sum', '7')],
  [typed('ph', '12.40')],
  [{ run: 'f1' }, { run: 'f1' }, put('past7', 'slot:ans')],
  [],
  [dial('pick', 'value', 1)],
  [typed('h', '2.62')]
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

export const CHECKS = { S1, S2_REF: S3_REF, S2_ASK: S3_ASK, S3: S4, S4_REF: S5_REF, S4_ASK: S5_ASK, S5: S6, S8: S9, GUESS, TEMPS, scaleWindow, scaleRead, strengthText };
