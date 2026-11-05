/**
 * Unit 9 · Bench 6 — Titration Curves (q6-titrate)
 *
 * Verdigris's titration bench, on the ph kit: a burette of sodium hydroxide over one or two flasks (`table/kits/ph-burette.js`: pour 5 mL,
 * 1 mL or 0.1 mL; the flask's pH display; a rack of dyes) and a flat curve plotter that draws only the volumes that were poured
 * (`ph-curve.js`). Eight stages and ONE click: "the equivalence point is always pH 7".
 *
 *   1  mark the volume that uses up 25.0 mL of 0.100 M hydrochloric acid                           -> titration curve, equivalence point
 *   2  PREDICT: the pH at the equivalence point of acetic acid
 *   3  hydrochloric and acetic acid poured together: compare the two readings at equivalence
 *   4  acetic and formic acid poured together: compare the readings half way to equivalence with the flasks' Ka     -> half-equivalence point
 *   5  four dyes in a rack over a flask of acetic acid: which one turns over with the steep rise                    -> indicator
 *   6  sulfurous acid: how many protons does one molecule give up                                                    -> polyprotic acid
 *   7  typed: the strength of 25.00 mL of hydrochloric acid, from the volume at which a dye turns (no meter)
 *   8  typed: Ka of a sealed weak acid of unknown strength (find the equivalence volume, then read half way)
 *
 * Every pH is `engine/phdata.js` (`titrationML`, charge balance with water, no approximation); every volume a dye turns at is the planner's
 * too. The marker on the volume axis is the player's own setting, never a printed number. This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, note, tag, pieceIn, dialValue, concText, buretteFixture, curveFixture
} from '../../table/kits/ph.js';
import {
  ACIDS, INDICATORS, TITRATION_UNKNOWNS, fmt, sci, pOf, titrationML, equivalenceML, indicatorWindowML, indicatorEndsAtEquivalence
} from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\btitration curve\b/i, introducedAt: 1 },
  { term: /\bequivalence point\b/i, introducedAt: 1 },
  { term: /\bhalf-equivalence point\b/i, introducedAt: 4 },
  { term: /\bindicators?\b/i, introducedAt: 5 },
  { term: /\bpolyprotic\b/i, introducedAt: 6 }
];

/** Words used from `q3-weak` (Ka, pKa, weak acid). The others it leans on (`q1`, `q2`, `q5`) are charted and not built yet. */
export const BUILDS_ON = ['unit09/q3-weak'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q6-titrate';
const GUESS = { seven: 'Exactly 7', above: 'Above 7', below: 'Below 7', thirteen: 'About 13' };

/* ---------------------------------------------------------------- what each stage's flasks hold (inputs; every figure shown is the planner's) */

const CT = 0.100;
const strong = (c0, V0 = 25) => ({ analyte: { type: 'strongAcid' }, c0, V0, ct: CT });
const weak = (Ka, c0, V0 = 25) => ({ analyte: { type: 'weakAcid', Ka }, c0, V0, ct: CT });
const HCL = strong(0.100);
const ACETIC = weak(ACIDS.acetic.Ka, 0.100);
const FORMIC = weak(ACIDS.formic.Ka, 0.100, 20);
const ACETIC_DYES = weak(ACIDS.acetic.Ka, 0.150, 20);
const SULFUROUS = { analyte: { type: 'diprotic', Ka: ACIDS.sulfurous.Ka }, c0: 0.0500, V0: 20, ct: CT };
const UNKNOWN_STRONG = strong(TITRATION_UNKNOWNS.strong.c);
const UNKNOWN_WEAK = weak(TITRATION_UNKNOWNS.weak.Ka, TITRATION_UNKNOWNS.weak.c);
const DYES = ['methylOrange', 'methylRed', 'bromothymol', 'phenolphthalein'];
const RIGHT_DYE = DYES.filter(id => indicatorEndsAtEquivalence(ACETIC_DYES, INDICATORS[id]));

const sub = s => `${s.V0.toFixed(1)} mL, ${concText(s.c0)}`;
const sample = (title, spec, o = {}) => ({ title, sub: sub(spec), ...spec, meter: true, ...o });
const eq = spec => equivalenceML(spec);
const mL1 = v => (Math.round(v * 10) / 10).toFixed(1);

const TOL_MARK = 0.5 + 1e-6;
const TOL_C = 0.025;
const TOL_KA = 0.12;

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const place = (piece, to) => ({ place: { piece, to } });

/** The burette and the plotter for a stage; positions are table units. */
const buretteAt = (spec, x = 40) => buretteFixture('bur', { x, y: 46 }, spec);

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-curve',
    title: 'Using Up the Acid',
    prompt: 'Mark the volume of sodium hydroxide that has just used up all the hydrochloric acid in the flask.',
    widget,
    table: phTable({
      fixtures: [
        buretteAt({ samples: [sample('Hydrochloric acid', HCL)], cap: 50 }, 24),
        curveFixture('curve', { x: 100, y: 38 }, { burette: 'bur', series: [{ sample: 0, name: 'Hydrochloric acid' }], xMax: 50, mark: true, w: 100, h: 68 })
      ]
    }, { w: 156, h: 96 }),
    hints: [
      'Use "Pour size" and "Pour" to add the base, and set the mark on the plot.',
      'Compare the curve before and after the part where the pH changes fastest.',
      'Find the volume at which the amount of base poured equals the amount of acid in the flask.'
    ],
    check(state) {
      const m = dialValue(state.table, 'curve', 'mark');
      if (!(m > 0)) return { ok: false, notYet: true, msg: 'Set the mark on the plot.' };
      if (Math.abs(m - eq(HCL)) <= TOL_MARK) return { ok: true };
      return { ok: false, msg: `The meter reads ${fmt(titrationML(HCL, m), 2)} at ${mL1(m)} mL.` };
    },
    get reward() {
      return {
        log: 'The pH rose steeply at 25.0 mL.',
        title: 'The Titration Curve',
        body: `A graph of pH against the volume of base poured is a titration curve. Its steep rise, here at ${mL1(eq(HCL))} mL where the pH read ${fmt(titrationML(HCL, eq(HCL)), 2)}, is the equivalence point: the acid has just been used up.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'The Next Acid',
    predict: true,
    prompt: 'What will the pH be at the equivalence point when 0.100 M acetic acid is titrated with 0.100 M sodium hydroxide?',
    widget,
    table: phTable({
      pieces: [
        note('seven', GUESS.seven, { x: 30, y: 12 }),
        note('above', GUESS.above, { x: 80, y: 12 }),
        note('below', GUESS.below, { x: 30, y: 33 }),
        note('thirteen', GUESS.thirteen, { x: 80, y: 33 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { w: 156, h: 48 }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what is left in the flask once all the acid has been used up.',
      'Ask whether what remains in the flask could change the pH by itself.'
    ],
    check(state) {
      if (!pieceIn(state.table, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, acetic acid is titrated beside hydrochloric acid.' }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-compare',
    title: 'Two Acids, One Burette',
    get prompt() { return guessLine('Find how the pH at the equivalence point of acetic acid compares with 7.', recall(QUEST_KEY)); },
    widget,
    table: phTable({
      fixtures: [
        buretteAt({ samples: [sample('Hydrochloric acid', HCL), sample('Acetic acid', ACETIC)], cap: 50 }, 40),
        curveFixture('curve', { x: 128, y: 36 }, { burette: 'bur', series: [{ sample: 0, name: 'Hydrochloric' }, { sample: 1, name: 'Acetic' }], xMax: 50, w: 100, h: 62 }),
        selectorFixture('pick', 'Acetic acid at its equivalence point', { x: 128, y: 80 }, { options: ['Below 7', 'Exactly 7', 'Above 7', ' '], start: 4, w: 64 })
      ]
    }, { w: 184, h: 96 }),
    hints: [
      'Use "Pour" for both flasks together, read the displays and set the answer dial.',
      'Compare the two curves, and the two displays, at the volume where the steep rise of each one is.',
      'Find the equivalence volume for these flasks, then compare the acetic acid display with the hydrochloric acid display there.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 3) return { ok: true };
      const e = eq(ACETIC);
      return { ok: false, msg: `At ${mL1(e)} mL the hydrochloric acid display reads ${fmt(titrationML(HCL, e), 2)} and the acetic acid display ${fmt(titrationML(ACETIC, e), 2)}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const e = eq(ACETIC);
      const ph = fmt(titrationML(ACETIC, e), 2);
      const verdict = g === 'above' ? `Above 7, as you predicted: ` : g ? `Not what you predicted: ` : '';
      return {
        log: 'Acetic acid reached its equivalence point above pH 7.',
        title: 'Not Always 7',
        body: `${verdict}hydrochloric acid read ${fmt(titrationML(HCL, e), 2)} at ${mL1(e)} mL and acetic acid ${ph}. The acetate left when the acid is used up is a weak base, so the equivalence point of a weak acid is above 7.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-half',
    title: 'Half Way',
    prompt: 'Read each flask when half the sodium hydroxide needed to use up its acid has been poured, and say what that reading equals.',
    widget,
    table: phTable({
      fixtures: [
        buretteAt({
          samples: [
            sample('Acetic acid', ACETIC, { sub: [sub(ACETIC), `Ka ${sci(ACIDS.acetic.Ka, 2)}`] }),
            sample('Formic acid', FORMIC, { sub: [sub(FORMIC), `Ka ${sci(ACIDS.formic.Ka, 2)}`] })
          ], cap: 40
        }, 40),
        curveFixture('curve', { x: 142, y: 40 }, { burette: 'bur', series: [{ sample: 0, name: 'Acetic', short: 'Ac' }, { sample: 1, name: 'Formic', short: 'Fo' }], xMax: 40, log: true, w: 124, h: 70 }),
        selectorFixture('pick', 'The reading half way equals', { x: 142, y: 84 }, { options: ['The pKa of the acid', 'The Ka of the acid', 'The pH at equivalence', 'Exactly 7', ' '], start: 5, w: 72 })
      ]
    }, { w: 206, h: 100 }),
    hints: [
      'Use "Pour size" to land on the volume you want, read the displays and the list, and set the answer dial.',
      'Compare each reading with the Ka printed under its flask.',
      'Find each flask\'s equivalence volume from its amount of acid, halve it, then compare the two readings with the two acids\' Ka.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const h1 = eq(ACETIC) / 2; const h2 = eq(FORMIC) / 2;
      return { ok: false, msg: `Half way, the acetic acid display reads ${fmt(titrationML(ACETIC, h1), 2)} at ${mL1(h1)} mL and the formic acid display ${fmt(titrationML(FORMIC, h2), 2)} at ${mL1(h2)} mL; at the equivalence volumes they read ${fmt(titrationML(ACETIC, eq(ACETIC)), 2)} and ${fmt(titrationML(FORMIC, eq(FORMIC)), 2)}.` };
    },
    get reward() {
      const h1 = eq(ACETIC) / 2; const h2 = eq(FORMIC) / 2;
      return {
        log: 'Half way to equivalence the pH matched the pKa.',
        title: 'The Half-Equivalence Point',
        body: `Half way, acetic acid read ${fmt(titrationML(ACETIC, h1), 2)} and formic acid ${fmt(titrationML(FORMIC, h2), 2)}, within 0.01 of their pKa values, ${fmt(pOf(ACIDS.acetic.Ka), 2)} and ${fmt(pOf(ACIDS.formic.Ka), 2)}. At the half-equivalence point half the acid has become its base, so the pH equals the pKa.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-dye',
    title: 'The Right Dye',
    prompt: 'Pick the dye that changes colour at the equivalence point of this titration.',
    widget,
    table: phTable({
      pieces: DYES.map((id, i) => tag(`c-${id}`, INDICATORS[id].name[0].toUpperCase() + INDICATORS[id].name.slice(1), { x: 112, y: 12 + i * 17 })),
      fixtures: [
        buretteFixture('bur', { x: 48, y: 46 }, { samples: [{ title: 'Acetic acid', sub: sub(ACETIC_DYES), ...ACETIC_DYES, meter: false }], cap: 40, rack: DYES })
      ],
      zones: { slots: [{ id: 'dye', label: 'My dye', at: { x: 158, y: 38 }, size: { w: 36, h: 14 } }] }
    }, { w: 180, h: 96 }),
    hints: [
      'Use "Pour size" and "Pour" and watch the four tubes, then lay a card in the slot.',
      'Compare the volume at which each tube changes colour with the volume the flask needs.',
      'Work out the volume that uses up the acid, then look for the tube that is still unchanged just before it and changed just after.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'dye');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      const id = card.id.slice(2);
      if (RIGHT_DYE.includes(id)) return { ok: true };
      const w = indicatorWindowML(ACETIC_DYES, INDICATORS[id]);
      return { ok: false, msg: `The ${INDICATORS[id].name} tube changed colour between ${mL1(w.from)} mL and ${mL1(w.to)} mL.` };
    },
    get reward() {
      const w = Object.fromEntries(DYES.map(id => [id, indicatorWindowML(ACETIC_DYES, INDICATORS[id])]));
      const pp = w.phenolphthalein; const bt = w.bromothymol;
      return {
        log: 'Only phenolphthalein turned over at the steep rise.',
        title: 'Indicators',
        body: `A dye whose colour depends on the pH is an indicator. Phenolphthalein changed between ${fmt(pp.from, 2)} and ${fmt(pp.to, 2)} mL, inside the steep rise; bromothymol blue took from ${mL1(bt.from)} to ${mL1(bt.to)} mL. The right indicator changes colour near the equivalence pH.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-two',
    title: 'More Than One Rise',
    prompt: 'Titrate the sulfurous acid and say how many protons one molecule of it gives up.',
    widget,
    table: phTable({
      fixtures: [
        buretteAt({ samples: [{ title: 'Sulfurous acid', sub: sub(SULFUROUS), ...SULFUROUS, meter: true }], cap: 30 }, 24),
        curveFixture('curve', { x: 112, y: 40 }, { burette: 'bur', series: [{ sample: 0, name: 'Sulfurous acid', short: 'pH' }], xMax: 30, xTick: 5, log: true, w: 124, h: 70 }),
        selectorFixture('pick', 'Protons per molecule', { x: 112, y: 84 }, { options: ['One', 'Two', 'Three', ' '], start: 4, w: 56 })
      ]
    }, { w: 178, h: 100 }),
    hints: [
      'Use "Pour" until the curve has run to the end of the plot, then set the answer dial.',
      'Look at where along the volume axis the curve rises steeply, and how far apart those places are.',
      'Compare the base needed to reach the last steep rise with the base needed to reach the first.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const e = eq(SULFUROUS);
      return { ok: false, msg: `The display reads ${fmt(titrationML(SULFUROUS, e), 2)} at ${mL1(e)} mL, ${fmt(titrationML(SULFUROUS, 2 * e), 2)} at ${mL1(2 * e)} mL and ${fmt(titrationML(SULFUROUS, 3 * e), 2)} at ${mL1(3 * e)} mL.` };
    },
    get reward() {
      const e = eq(SULFUROUS);
      return {
        log: 'Sulfurous acid showed two steep rises.',
        title: 'Polyprotic Acids',
        body: `The curve rose steeply at ${mL1(e)} mL and again at ${mL1(2 * e)} mL: the second proton needed as much base as the first. An acid that can give up more than one proton is a polyprotic acid, and each proton is used up in its own step.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-strength',
    title: 'How Strong Is the Acid',
    prompt: 'Find the strength of the hydrochloric acid in the flask, in mol/L.',
    widget,
    entry: { id: 'c', label: 'Strength', unit: 'M' },
    table: phTable({
      fixtures: [
        buretteFixture('bur', { x: 22, y: 46 }, { samples: [{ title: 'Hydrochloric acid', sub: ['25.00 mL', 'strength unknown'], ...UNKNOWN_STRONG, meter: false, tint: 'bromothymol' }], cap: 40 })
      ]
    }, { w: 44, h: 96 }),
    hints: [
      'Use "Pour size" and "Pour", and type the strength in the field.',
      'Watch the colour of the liquid in the flask as the volume nears the change.',
      'Turn the volume poured into an amount of base, and use it to find the amount and then the strength of the acid.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'c');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const c = TITRATION_UNKNOWN_C;
      if (Math.abs(v / c - 1) <= TOL_C) return { ok: true };
      const e = eq(UNKNOWN_STRONG);
      const near = x => Math.abs(v / x - 1) <= 0.03;
      if (near(CT * e)) return { ok: false, msg: `${fmt(v, 2)} is 0.100 times the volume at which the colour changed; the flask holds 25.00 mL.` };
      if (near(e / 25)) return { ok: false, msg: `${fmt(v, 3)} comes from the volume at which the colour changed and the 25.00 mL; the base in the burette is 0.100 M.` };
      if (near(CT)) return { ok: false, msg: 'That is the strength of the base in the burette.' };
      return { ok: false, msg: `${fmt(v, 3)} M does not match what the flask showed.` };
    },
    get reward() {
      const e = eq(UNKNOWN_STRONG);
      return {
        log: 'The colour changed at 31.4 mL.',
        title: 'From Volume to Strength',
        body: `The colour changed at ${mL1(e)} mL of 0.100 M base, which is ${fmt(e * CT, 2)} mmol. The 25.00 mL of acid held that amount, so its strength was ${fmt(TITRATION_UNKNOWN_C, 3)} M.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-unknown',
    title: 'A Sealed Weak Acid',
    prompt: 'Find the Ka of the weak acid in the flask.',
    widget,
    entry: { id: 'ka', label: 'Ka (write 0.0005 as 5e-4)', unit: '' },
    table: phTable({
      fixtures: [
        buretteAt({ samples: [{ title: 'Unknown acid', sub: ['25.0 mL', 'strength unknown'], ...UNKNOWN_WEAK, meter: true }], cap: 40 }, 24),
        curveFixture('curve', { x: 112, y: 40 }, { burette: 'bur', series: [{ sample: 0, name: 'Unknown acid', short: 'pH' }], xMax: 40, log: true, w: 124, h: 70 })
      ]
    }, { w: 178, h: 96 }),
    hints: [
      'Use "Pour size" and "Pour", read the display and the list, and type Ka in the field.',
      'Compare the curve with the volumes poured, and look for the volume where the steep rise is.',
      'Use the half-equivalence reading: find the equivalence volume, halve it, and turn the pH read there into the constant.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ka');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const Ka = TITRATION_UNKNOWNS.weak.Ka;
      if (Math.abs(v / Ka - 1) <= TOL_KA) return { ok: true };
      const start = titrationML(UNKNOWN_WEAK, 0);
      if (v >= 1 && v <= 14) return { ok: false, msg: `${fmt(v, 2)} looks like a pH reading; the question asks for Ka.` };
      if (Math.abs(Math.log10(v) + start) <= 0.1) return { ok: false, msg: `The display reads ${fmt(start, 2)} with no base poured; the acid alone gives that reading.` };
      return { ok: false, msg: `A Ka of ${sci(v, 2)} does not match the readings the display gave.` };
    },
    get reward() {
      const half = eq(UNKNOWN_WEAK) / 2;
      const r = titrationML(UNKNOWN_WEAK, half);
      return {
        log: 'The pH half way gave the pKa.',
        title: 'Reading Ka',
        body: `The steep rise was at ${mL1(eq(UNKNOWN_WEAK))} mL, so half way is ${mL1(half)} mL, where the pH read ${fmt(r, 2)}. That is the pKa, so Ka is about ${sci(10 ** -r, 2)}, for an acid whose strength was never given.`
      };
    }
  }
];

const TITRATION_UNKNOWN_C = TITRATION_UNKNOWNS.strong.c;

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Titration Curves',
  body: 'The equivalence point of a titration is not always pH 7: it depends on the acid. Half way to it, the pH equals the pKa.'
};

/* ---------------------------------------------------------------- scripts through the real action path */

const runs = (n) => Array.from({ length: n }, () => ({ run: 'bur' }));
const size = i => dial('bur', 'size', i);

export const SOLUTIONS = [
  [size(1), ...runs(5), dial('curve', 'mark', 25)],
  [place('above', 'slot:guess')],
  [size(1), ...runs(5), dial('pick', 'value', 3)],
  [size(1), ...runs(2), size(2), ...runs(2), size(3), ...runs(5), dial('pick', 'value', 1)],
  [place('c-phenolphthalein', 'slot:dye')],
  [size(1), ...runs(6), dial('pick', 'value', 2)],
  [size(1), ...runs(6), size(2), ...runs(1), size(3), ...runs(4), { type: { entry: 'c', value: '0.126' } }],
  [size(1), ...runs(2), { type: { entry: 'ka', value: '7.0e-6' } }]
];

export const MISSES = [
  [dial('curve', 'mark', 12)],
  [],
  [dial('pick', 'value', 2)],
  [dial('pick', 'value', 2)],
  [place('c-bromothymol', 'slot:dye')],
  [dial('pick', 'value', 1)],
  [{ type: { entry: 'c', value: '3.14' } }],
  [{ type: { entry: 'ka', value: '5.16' } }]
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

export const CHECKS = { HCL, ACETIC, FORMIC, ACETIC_DYES, SULFUROUS, UNKNOWN_STRONG, UNKNOWN_WEAK, DYES, RIGHT_DYE, TOL_MARK, TOL_C, TOL_KA, GUESS };
