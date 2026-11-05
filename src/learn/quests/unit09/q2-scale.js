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

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpH\b/, introducedAt: 1 },
  { term: /\bpOH\b/, introducedAt: 3 },
  { term: /\bstrong bases?\b/i, introducedAt: 4 },
  { term: /\bstrong acids?\b/i, introducedAt: 5 },
  { term: /\bneutral\b/i, introducedAt: 7 }
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
const S2_REF = [1e-3, 1e-4].map(HCL);
const S2_ASK = HCL(3.2e-4);
const S3 = [0.1, 0.01, 0.001].map(NAOH);
const S4_REF = [NAOH(0.1), NAOH(0.01)];
const S4_ASK = { id: 'baoh2', c: 0.025 };
const S5 = [1e-6, 1e-7, 1e-8, 1e-9].map(HCL);
const WATER = { id: 'water', c: 0 };
const TEMPS = [25, 50];
const S8 = HCL(2.4e-3);
const FLASK_X = [24, 70, 116];

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
    prompt: 'Read the pH of the three flasks and say how the pH changes with each tenfold dilution.',
    widget,
    table: (() => {
      const f = S1.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Hydrochloric acid' }));
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...f.map(x => x.fixture), selectorFixture('pick', 'With each tenfold dilution the pH', { x: 88, y: 66 }, { options: ['Rises by 1', 'Is multiplied by 10', 'Rises by 0.1', 'Rises by 10', ' '], start: 5, w: 84 })],
        zones: { slots: f.map(x => x.slot) }
      }, { w: 184, h: 78 });
    })(),
    hints: [
      'Use the pH meter on each flask, then set the answer dial.',
      'Compare the pH readings of flasks whose strengths differ by a factor of ten.',
      'Subtract each reading from the next and see whether the difference or the ratio stays the same.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const [a, b] = [ph(S1[0]), ph(S1[1])];
      const to = { 2: a * 10, 3: a + 0.1, 4: a + 10 }[v];
      return { ok: false, msg: `The meter went from ${fmt(a, 2)} to ${fmt(b, 2)}, not from ${fmt(a, 2)} to ${fmt(to, 2)}.` };
    },
    reward: {
      log: 'Each tenfold dilution raised the pH by 1.',
      title: 'The pH Scale',
      body: 'The pH rose by exactly 1 at each tenfold dilution: 1.00, 2.00, 3.00. pH is minus the log of the H₃O⁺ concentration in mol/L, so each step of 1 on the scale is a factor of ten in hydronium.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-typed',
    title: 'Between the Flasks',
    prompt: 'Find the pH of the 3.2 × 10⁻⁴ M hydrochloric acid, to two decimal places.',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const ref = S2_REF.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Hydrochloric acid' }));
      const ask = flaskAt('f3', FLASK_X[2], 1, { solute: S2_ASK, label: 'Hydrochloric acid', meter: false });
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...ref.map(x => x.fixture), ask.fixture],
        zones: { slots: ref.map(x => x.slot) }
      }, { w: 184, h: 52 });
    })(),
    hints: [
      'Type the pH in the field; the meter reads the two flasks that have a seat.',
      'Compare the strength of the third flask with the other two, and what the meter read on each.',
      'Turn the strength into a power of ten and take its negative log.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const x = ph(S2_ASK);
      if (near(v, x, 0.02)) return { ok: true };
      const [hi, lo] = [ph(S2_REF[0]), ph(S2_REF[1])];
      if (v < 0) return { ok: false, msg: `The meter reads ${fmt(hi, 2)} and ${fmt(lo, 2)} on the flasks beside this one, both above zero.` };
      if (near(v, lo, 0.03)) return { ok: false, msg: `The 1.0 × 10⁻⁴ M flask reads ${fmt(lo, 2)}; this flask holds more hydronium than that one.` };
      if (v < hi || v > lo) return { ok: false, msg: `The meter reads ${fmt(hi, 2)} on the 1.0 × 10⁻³ M flask and ${fmt(lo, 2)} on the 1.0 × 10⁻⁴ M flask; this flask is stronger than one and weaker than the other.` };
      return { ok: false, msg: `A pH of ${fmt(v, 2)} stands for ${sci(10 ** -v, 2)} mol/L of hydronium; this flask holds ${sci(S2_ASK.c, 2)} M of acid, all of it come apart in the window.` };
    },
    get reward() {
      const s = scaleSolution(S2_ASK);
      return {
        log: 'A strength between the flasks gave a pH between their readings.',
        title: 'Reading a Concentration',
        body: `A concentration of ${sci(S2_ASK.c, 2)} mol/L gives a pH of ${fmt(s.pH, 2)}, between the readings ${fmt(ph(S2_REF[0]), 2)} and ${fmt(ph(S2_REF[1]), 2)} of the flasks on either side. The log turns every strength into a place on the scale.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-poh',
    title: 'Two Meters',
    prompt: 'Read both meters on the three sodium hydroxide flasks and find what the pH and the pOH add up to.',
    widget,
    entry: { id: 'sum', label: 'pH + pOH', unit: '' },
    table: (() => {
      const f = S3.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Sodium hydroxide' }));
      return phTable({
        pieces: [scaleMeter('meter', { x: 154, y: 9 }, 'pH'), scaleMeter('meterOH', { x: 154, y: 36 }, 'pOH')],
        fixtures: f.map(x => x.fixture),
        zones: { slots: f.map(x => x.slot) }
      }, { w: 184, h: 66 });
    })(),
    hints: [
      'Lay each meter on each flask, then type the sum.',
      'Add the two readings of one flask, then do the same for the other flasks.',
      'Compare the three sums with each other.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'sum');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (near(v, 14, 0.05)) return { ok: true };
      const s = scaleSolution(S3[0]);
      return { ok: false, msg: `On the 0.10 M flask the pH meter reads ${fmt(s.pH, 2)} and the pOH meter reads ${fmt(s.pOH, 2)}; they do not add to ${fmt(v, 2)}.` };
    },
    get reward() {
      const s = scaleSolution(S3[0]);
      return {
        log: 'pH and pOH added to 14 in every flask.',
        title: 'pOH',
        body: `The pOH meter counts hydroxide the way the pH meter counts hydronium. In every flask the two readings added to ${fmt(s.pH + s.pOH, 0)}: at 25 °C, pH + pOH = 14.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-typed',
    title: 'Two Hydroxides Each',
    prompt: 'Find the pH of the 0.025 M barium hydroxide, to two decimal places.',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const ref = S4_REF.map((s, i) => flaskAt(`f${i + 1}`, FLASK_X[i], 1, { solute: s, label: 'Sodium hydroxide' }));
      const ask = flaskAt('f3', FLASK_X[2], 1, { solute: S4_ASK, label: 'Barium hydroxide', meter: false });
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 9 }, 'pH')],
        fixtures: [...ref.map(x => x.fixture), ask.fixture],
        zones: { slots: ref.map(x => x.slot) }
      }, { w: 184, h: 52 });
    })(),
    hints: [
      'Type the pH in the field; the meter reads the two flasks that have a seat.',
      'Compare the window of the barium hydroxide with the windows of the sodium hydroxide flasks.',
      'Find the hydroxide concentration the window stands for, then go from pOH to pH.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = scaleSolution(S4_ASK);
      if (near(v, s.pH, 0.03)) return { ok: true };
      const once = scaleSolution({ id: 'naoh', c: S4_ASK.c });
      if (near(v, s.pOH, 0.05)) return { ok: false, msg: `A pH of ${fmt(v, 2)} would be an acid; the flasks beside this one read ${fmt(ph(S4_REF[1]), 2)} and ${fmt(ph(S4_REF[0]), 2)}.` };
      if (near(v, once.pH, 0.05)) return { ok: false, msg: 'The window shows two OH⁻ for each Ba(OH)₂ unit; that figure counts one.' };
      return { ok: false, msg: `The meter reads ${fmt(ph(S4_REF[1]), 2)} on the 0.010 M sodium hydroxide flask and ${fmt(ph(S4_REF[0]), 2)} on the 0.10 M one, and ${fmt(v, 2)} does not fit this flask's window.` };
    },
    get reward() {
      const s = scaleSolution(S4_ASK);
      return {
        log: 'Barium hydroxide gave two hydroxides to a unit.',
        title: 'Strong Bases',
        body: `Each Ba(OH)₂ comes apart completely into two OH⁻, so 0.025 M holds ${fmt(2 * S4_ASK.c, 3)} M of hydroxide: a pOH of ${fmt(s.pOH, 2)} and a pH of ${fmt(s.pH, 2)}. A base that comes apart completely is a strong base.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-chain',
    title: 'Diluting Again and Again',
    prompt: 'Read the diluted hydrochloric acid flasks and say what the pH does as the dilution continues.',
    widget,
    table: (() => {
      const f = S5.map((s, i) => flaskAt(`f${i + 1}`, 19 + i * 37, 1, { solute: s, label: 'Hydrochloric acid', w: 35, window: 12 }));
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 10 }, 'pH')],
        fixtures: [...f.map(x => x.fixture), selectorFixture('pick', 'As the dilution continues the pH', { x: 92, y: 62 }, { options: ['Keeps rising past 7', 'Levels off near 7', 'Falls again', ' '], start: 4, w: 84 })],
        zones: { slots: f.map(x => x.slot) }
      }, { w: 184, h: 76 });
    })(),
    hints: [
      'Use the pH meter on each flask, then set the answer dial.',
      'Compare how far the reading moves at each tenfold step.',
      'Ask where the hydronium of the last flask comes from, since there is almost no acid left in it.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const r = S5.map(s => fmt(ph(s), 2));
      if (v === 1) return { ok: false, msg: `The meter reads ${r[2]} on the 1.0 × 10⁻⁸ M flask and ${r[3]} on the 1.0 × 10⁻⁹ M flask: the last dilution moved it by ${fmt(ph(S5[3]) - ph(S5[2]), 2)}.` };
      return { ok: false, msg: `The readings are ${r.slice(0, -1).join(', ')} and ${r[r.length - 1]}, each higher than the one before.` };
    },
    get reward() {
      return {
        log: 'The pH of diluted acid levelled off at 7.',
        title: 'Strong Acids and the Floor',
        body: `A strong acid, which is completely ionized, still cannot take the pH past 7: water supplies ${sci(waterIons({}).h, 2)} mol/L of H₃O⁺ of its own. The ${sci(S5[3].c, 2)} M flask reads ${fmt(ph(S5[3]), 2)}, not 9.00.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
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
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 20 }, size: { w: 36, h: 14 } }] }
    }, { h: 50 }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what the pH of pure water counts, and what warming might do to it.',
      'Ask whether warm water can still have the same amount of hydronium as cold water.'
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

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-warm',
    title: 'Warming the Water',
    get prompt() { return guessLine('Warm the pure water to 50 °C and say whether it is acidic, neutral or basic.', recall(QUEST_KEY)); },
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
      'Set the "Temperature" dial, lay the pH meter on the flask, then set the answer dial.',
      'Compare the amounts of H₃O⁺ and OH⁻ that the lens counts at each temperature.',
      'Ask what the amounts of the two ions say about acidic, neutral and basic.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const w = waterIons({ T: 50 });
      return { ok: false, msg: `At 50 °C the lens counts ${sci(w.h, 2)} mol/L of H₃O⁺ and ${sci(w.oh, 2)} mol/L of OH⁻.` };
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

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Sealed Flask',
    prompt: 'Find the concentration of hydronium, in mol/L, in the sealed flask.',
    widget,
    entry: { id: 'h', label: 'H₃O⁺ in mol/L (like 5.0e-4)', unit: 'M' },
    table: (() => {
      const f = flaskAt('f1', 30, 1, { solute: S8, w: 44, sealed: true });
      return phTable({
        pieces: [scaleMeter('meter', { x: 92, y: 12 }, 'pH')],
        fixtures: [f.fixture],
        zones: { slots: [f.slot] }
      }, { w: 124, h: 52 });
    })(),
    hints: [
      'Lay the pH meter on the flask and type the concentration in the field.',
      'Compare the reading with the readings you met on the earlier flasks.',
      'The pH is the negative log of the concentration, so undo the log.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'h');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = scaleSolution(S8);
      if (v > 0 && Math.abs(v / s.h - 1) <= 0.05) return { ok: true };
      if (near(v, s.pH, 0.05)) return { ok: false, msg: `${fmt(s.pH, 2)} is the number the meter shows; the question asks for mol/L of hydronium.` };
      if (v >= 1) return { ok: false, msg: 'That is more hydronium than any flask on this bench holds; the strongest is 0.10 M.' };
      if (v <= 0) return { ok: false, msg: 'A concentration is above zero.' };
      return { ok: false, msg: `${sci(v, 2)} mol/L of hydronium would read a pH of ${fmt(pOf(v), 2)}, and the meter reads ${fmt(s.pH, 2)}.` };
    },
    get reward() {
      const s = scaleSolution(S8);
      return {
        log: 'A pH reading was turned back into a concentration.',
        title: 'Back From the Scale',
        body: `A pH of ${fmt(s.pH, 2)} means [H₃O⁺] = 10 to the power −${fmt(s.pH, 2)}, which is ${sci(s.h, 2)} mol/L. The sealed flask held ${sci(S8.c, 2)} M hydrochloric acid, all of it ionized.`
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
  [put('meter', seat(1)), put('meter', seat(2)), put('meter', seat(3)), dial('pick', 'value', 1)],
  [put('meter', seat(1)), typed('ph', '3.49')],
  [put('meter', seat(1)), put('meterOH', seat(1)), typed('sum', '14')],
  [put('meter', seat(1)), typed('ph', '12.70')],
  [put('meter', seat(1)), put('meter', seat(4)), dial('pick', 'value', 2)],
  [put('below', 'slot:guess')],
  [dial('f1', 'T', 2), put('meter', seat(1)), dial('pick', 'value', 2)],
  [put('meter', seat(1)), typed('h', '2.4e-3')]
];

export const MISSES = [
  [dial('pick', 'value', 2)],
  [typed('ph', '4')],
  [typed('sum', '7')],
  [typed('ph', '12.40')],
  [dial('pick', 'value', 1)],
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

export const CHECKS = { S1, S2_REF, S2_ASK, S3, S4_REF, S4_ASK, S5, S8, GUESS, TEMPS, scaleWindow, scaleRead, strengthText };
