/**
 * Unit 9 · Bench 3 — Weak Acids and Bases (q3-weak)
 *
 * Verdigris's weak-acid bench, on the ph kit (`table/kits/ph.js`: the flask in `ph-flask.js`, the ratio rig in `ph-rig.js`). A flask holds
 * one solution with a window of 200 of its formula units; a pH meter lies on a flask to read it. Eight stages and ONE click: the belief
 * that acid strength is concentration, so that two acids at the same strength read the same pH.
 *
 *   1  PREDICT: how do 0.10 M hydrochloric acid and 0.10 M acetic acid compare?
 *   2  TEST: read three acids at 0.10 M and sort them by how much has let go of its proton       -> weak and strong acids
 *   3  typed: the percent of the acetic acid that has ionized, from its pH                        -> percent ionization
 *   4  the ratio rig on three acetic acid flasks: one arrangement reads the same number           -> Ka, pKa
 *   5  typed: the pH of 0.15 M acetic acid (no meter; the constant is on a plate)
 *   6  say what the share ionized does as the acid is diluted
 *   7  the ratio rig on three ammonia flasks                                                      -> Kb
 *   8  the ratio rig on three acid and base pairs: Ka and Kb give one number together             -> Ka x Kb = Kw
 *
 * THE WRONG MODEL IS ON THE TABLE. Hydrochloric and acetic acid are both 0.10 M and the meter reads 1.00 and 2.88; the window shows 200 units
 * and 3 units handing over a proton. A pH that depends only on concentration cannot read two numbers for one strength.
 *
 * Every figure is `engine/phdata.js`: the exact solution of each flask (water's own ionization included), the 200-unit window counted from
 * it, the meter reading it, the rig multiplying the species it holds. The rig prints a reading for whatever is laid on it and never says
 * which arrangement to look for. This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, plaqueFixture, note, tag, pieceIn, dialValue, flaskFixture, meterPiece, rigParts, tile,
  rigRead, steady, readingsText, numText, flaskSol, windowOf, concText
} from '../../table/kits/ph.js';
import { ACIDS, BASES, KW25, fmt, sci, pOf } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bweak acid\b/i, introducedAt: 2 },
  { term: /\bstrong acid\b/i, introducedAt: 2 },
  { term: /\bioniz\w*/i, introducedAt: 2 },
  { term: /\bpercent ionization\b/i, introducedAt: 3 },
  { term: /\bKa\b/, introducedAt: 4 },
  { term: /\bpKa\b/, introducedAt: 4 },
  { term: /\bKb\b/, introducedAt: 7 }
];

/**
 * Built quests whose words this bench uses. The bench needs the proton, hydronium, conjugate base and pH of `unit09/q1-handover` and
 * `q2-scale`, which are charted and not built yet: list them here when they are (verify:learn requires real built quests).
 */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q3-weak';
const GUESS = {
  same: 'The two readings are the same',
  lower: 'Acetic acid reads lower',
  higher: 'Acetic acid reads higher',
  seven: 'Acetic acid reads 7'
};

/* ---------------------------------------------------------------- what each stage's flasks hold (inputs; every figure shown is the planner's) */

const HCL = { id: 'hcl', c: 0.10 };
const ACETIC = { id: 'acetic', c: 0.10 };
const HF = { id: 'hf', c: 0.10 };
const NAMES = { hcl: 'Hydrochloric acid', acetic: 'Acetic acid', hf: 'Hydrofluoric acid', nh3: 'Ammonia' };
/** The same acid at three strengths (stage 4, 6) and the same base (stage 7). */
const DILUTIONS = [0.10, 0.010, 0.0010];
const ACETIC_C = DILUTIONS.map(c => ({ id: 'acetic', c }));
const NH3_C = DILUTIONS.map(c => ({ id: 'nh3', c }));
const HARD = { id: 'acetic', c: 0.15 };
/** Stage 8: three acids with their conjugate bases; the constants are the tables'. */
const PAIRS = [
  { title: 'Acetic acid pair', Ka: ACIDS.acetic.Ka, Kb: BASES.acetate.Kb },
  { title: 'Ammonia pair', Ka: ACIDS.nh4.Ka, Kb: BASES.nh3.Kb },
  { title: 'Hydrofluoric pair', Ka: ACIDS.hf.Ka, Kb: BASES.fluoride.Kb }
];

const TOL_PH = 0.03;
/** Stage 3's window shows whole units of 200, so the percent is good to half a unit; a typed figure within that or 7 % is right. */
const pctOK = (v, exact) => Math.abs(v - exact) <= Math.max(0.07 * exact, 0.25);

/* ---------------------------------------------------------------- shared pieces of a stage */

/** A flask whose top edge stands at `top`: the builder wants its centre, which depends on its height. */
function flaskAt(id, x, top, o) {
  const probe = flaskFixture(id, { x, y: 0 }, o);
  return flaskFixture(id, { x, y: top + probe.size.h / 2 }, o);
}

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });

const S2_X = [24, 70, 116];
const S2_SOLUTES = [HCL, ACETIC, HF];
const S2_IDS = ['f1', 'f2', 'f3'];
const FLASK_W = 44;
const TRAYS = [
  { id: 'all', label: 'Nearly all have let go', at: { x: 36, y: 67 }, size: { w: 68, h: 26 }, cell: 27, cellH: 12 },
  { id: 'some', label: 'Only some have let go', at: { x: 108, y: 67 }, size: { w: 68, h: 26 }, cell: 27, cellH: 12 }
];

/** Three flasks in a row, each with a seat for the meter. */
function threeFlasks(solutes) {
  const fl = solutes.map((s, i) => flaskAt(S2_IDS[i], S2_X[i], 1, { solute: s, label: NAMES[s.id], w: FLASK_W, window: 16 }));
  return { fixtures: fl.map(f => f.fixture), slots: fl.map(f => f.slot) };
}

/** The rig stages: three flasks across the top, the rig under them with its columns beneath the flasks, tiles in a column at the right. */
const RIG_AT_X = 75;
function rigTable(solutes, tiles, { top = 2, bottom = 2 } = {}) {
  const rig = rigParts('rig', { x: RIG_AT_X, y: 54 }, {
    cols: solutes.map((s, i) => ({ flask: S2_IDS[i], title: concText(s.c) })), top, bottom
  });
  const x0 = RIG_AT_X - rig.size.w / 2 + rig.lw;
  const fl = solutes.map((s, i) => flaskAt(S2_IDS[i], x0 + 35 * (i + 0.5), 1, { solute: s, label: NAMES[s.id], w: 35, window: 14, meter: false }));
  return phTable({
    pieces: tiles.map(([key, label], i) => tile(`t-${key}`, key, label, { x: 162, y: 10 + i * 18 })),
    fixtures: [...fl.map(f => f.fixture), rig.fixture],
    zones: { slots: rig.slots }
  }, { w: 176, h: 72 });
}

/** The rig stages' check: something laid, and the readings the same on every flask without the number being 1 whatever the flask. */
function rigCheck(state) {
  const r = rigRead(state.table, 'rig');
  if (!r.laid) return { ok: false, notYet: true, msg: 'Lay a card on the board.' };
  if (steady(r.readings) && Math.abs(r.readings[0] - 1) > 0.02) return { ok: true };
  if (steady(r.readings)) return { ok: false, msg: `The board reads ${readingsText(r.readings)} on every column, because the cards above and below the line stand for equal amounts.` };
  return { ok: false, msg: `The board reads ${readingsText(r.readings)} on the three columns.` };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Same Reading?',
    // A PREDICT STAGE: no flask is on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Which best describes the pH readings of 0.10 M hydrochloric acid and 0.10 M acetic acid, read side by side?',
    widget,
    table: phTable({
      pieces: [
        tag('st1', '0.10 M hydrochloric acid', { x: 30, y: 9 }),
        tag('st2', '0.10 M acetic acid', { x: 80, y: 9 }),
        note('same', GUESS.same, { x: 30, y: 28 }),
        note('lower', GUESS.lower, { x: 80, y: 28 }),
        note('higher', GUESS.higher, { x: 30, y: 49 }),
        note('seven', GUESS.seven, { x: 80, y: 49 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 38 }, size: { w: 36, h: 14 } }] }
    }, { h: 62 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture what each flask holds, and what the pH reading counts.',
      'Ask whether two acids at the same concentration must give the same share of their protons to water.'
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
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, three acids at the same concentration are read.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-sort',
    title: 'Sorting the Flasks',
    get prompt() { return guessLine('Sort the three flasks by how much of the acid has let go of its protons.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const t = threeFlasks(S2_SOLUTES);
      return phTable({
        pieces: [
          meterPiece('meter', { x: 160, y: 9 }),
          tag('c-hcl', NAMES.hcl, { x: 160, y: 30 }),
          tag('c-acetic', NAMES.acetic, { x: 160, y: 47 }),
          tag('c-hf', NAMES.hf, { x: 160, y: 64 })
        ],
        fixtures: t.fixtures,
        zones: { trays: TRAYS, slots: t.slots }
      }, { w: 184, h: 82 });
    })(),
    hints: [
      'Use the pH meter on each flask, then drag the three cards into the two trays.',
      'Compare the pH readings and the windows of the three flasks, which hold the same amount of acid.',
      'Count how many of the 200 units in each window have handed over a proton, and ask which flasks show nearly all of them.'
    ],
    check(state) {
      const t = state.table;
      const where = Object.fromEntries(S2_SOLUTES.map((s, i) => [s.id, t.pieces[`c-${s.id}`].zone]));
      if (Object.values(where).some(z => !z || !z.startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Drag every card into a tray.' };
      for (const s of S2_SOLUTES) {
        const w = windowOf({ solute: s });
        const mostly = w.ionized / w.units >= 0.9;
        const want = mostly ? 'tray:all' : 'tray:some';
        if (where[s.id] === want) continue;
        return { ok: false, msg: `In the window of ${NAMES[s.id].toLowerCase()}, ${w.ionized} of ${w.units} units have handed over a proton, and its meter reads ${fmt(flaskSol({ solute: s }).pH, 2)}.` };
      }
      return { ok: true };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const pa = fmt(flaskSol({ solute: ACETIC }).pH, 2); const ph = fmt(flaskSol({ solute: HCL }).pH, 2);
      const verdict = g === 'higher' ? `Acetic acid did read higher, ${pa} against ${ph}. ` : g ? `The readings were ${ph} and ${pa}, not what you predicted. ` : '';
      return {
        log: 'Hydrochloric acid gave up nearly all of its protons; acetic acid and hydrofluoric acid gave up some.',
        title: 'Weak and Strong Acids',
        body: `${verdict}At the same concentration hydrochloric acid gave all of its protons to water and acetic acid only a few. An acid that ionizes only in part is a weak acid, and one that ionizes fully is a strong acid.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-percent',
    title: 'How Much Let Go',
    prompt: 'Find the percent of the acetic acid that has ionized in this flask.',
    widget,
    entry: { id: 'pct', label: 'Percent ionized', unit: '%' },
    table: (() => {
      const f = flaskAt('f1', 40, 1, { solute: ACETIC, label: NAMES.acetic, w: 64, window: 24 });
      return phTable({
        pieces: [meterPiece('meter', { x: 104, y: 12 })],
        fixtures: [f.fixture],
        zones: { slots: [f.slot] }
      }, { w: 128, h: 62 });
    })(),
    hints: [
      'Type the percent in the field; the meter lies on the flask\'s seat if you want its reading.',
      'Compare the amount of acid put in, printed on the flask, with the hydronium that the pH reading stands for.',
      'Turn the pH back into mol/L of hydronium, divide by the amount put in, and multiply by 100.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'pct');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = flaskSol({ solute: ACETIC });
      if (pctOK(v, s.percent)) return { ok: true };
      const near = (x, tol = 0.04) => Math.abs(v - x) <= tol * Math.abs(x);
      if (near(s.pH)) return { ok: false, msg: `${fmt(s.pH, 2)} is the pH this flask reads; the question asks for a percent of the acid put in.` };
      if (near(s.h)) return { ok: false, msg: `That figure is the hydronium in mol/L; the question asks for a percent of the acid put in.` };
      if (near(s.ionized)) return { ok: false, msg: 'That figure is the share as a fraction of 1; the question asks for a percent.' };
      return { ok: false, msg: `The flask holds ${concText(ACETIC.c)} of acid and its pH reads ${fmt(s.pH, 2)}; that is not the percent that has ionized.` };
    },
    get reward() {
      const s = flaskSol({ solute: ACETIC });
      return {
        log: 'About 1.3 percent of the acetic acid had ionized.',
        title: 'Percent Ionization',
        body: `A pH of ${fmt(s.pH, 2)} means ${sci(s.h, 2)} mol/L of hydronium from ${concText(ACETIC.c)} of acid put in, so ${fmt(s.percent, 1)} percent of the acetic acid has ionized. That share is the percent ionization.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-ka',
    title: 'The Steady Ratio',
    prompt: 'Arrange cards on the board into a ratio that reads the same number for all three acetic acid flasks.',
    widget,
    table: rigTable(ACETIC_C, [['H', 'H₃O⁺'], ['A', 'CH₃COO⁻'], ['HA', 'CH₃COOH']]),
    hints: [
      'Drag the three cards into the places above and below the line.',
      'Compare the three numbers the board prints for each arrangement you try.',
      'Try one card, then two, then three, and keep an arrangement whose three numbers agree.'
    ],
    check: rigCheck,
    get reward() {
      const Ka = ACIDS.acetic.Ka;
      return {
        log: 'H₃O⁺ times CH₃COO⁻ over CH₃COOH held at one number.',
        title: 'The Acid Constant',
        body: `H₃O⁺ times CH₃COO⁻ over CH₃COOH read ${sci(Ka, 2)} in all three flasks, although the share that ionized changed. That steady number is the acid's constant, Ka, and its negative log is the pKa, ${fmt(pOf(Ka), 2)}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-hard',
    title: 'A Concentration Between the Flasks',
    prompt: 'Find the pH of 0.15 M acetic acid, to two decimal places.',
    widget,
    entry: { id: 'ph', label: 'pH', unit: '' },
    table: (() => {
      const f = flaskAt('f1', 40, 1, { solute: HARD, label: NAMES.acetic, w: 64, window: 24, meter: false });
      return phTable({
        fixtures: [f.fixture, plaqueFixture('plate', 'Acetic acid', { x: 108, y: 16 }, ['Ka', sci(ACIDS.acetic.Ka, 2)], { w: 44 })]
      }, { w: 140, h: 50 });
    })(),
    hints: [
      'Type the pH in the field; the constant is printed on the plate.',
      'Compare this flask with the 0.10 M flasks: the concentration differs, and the plate does not.',
      'Write the ratio you found on the board with x for each ion and the amount put in less x for the acid, set it equal to the constant, and solve for x.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ph');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const s = flaskSol({ solute: HARD });
      if (Math.abs(v - s.pH) <= TOL_PH) return { ok: true };
      const w = windowOf({ solute: HARD });
      const ref = flaskSol({ solute: ACETIC });
      const slipNoRoot = pOf(ACIDS.acetic.Ka * HARD.c);
      const slipFull = pOf(HARD.c);
      if (Math.abs(v - slipNoRoot) <= 0.05) return { ok: false, msg: `The window shows ${w.ionized} of ${w.units} units handed over; a pH of ${fmt(slipNoRoot, 2)} would leave none.` };
      if (Math.abs(v - slipFull) <= 0.05) return { ok: false, msg: `The window shows ${w.whole} of ${w.units} units still whole; a pH of ${fmt(slipFull, 2)} would need every unit to have handed a proton over.` };
      if (Math.abs(v - ref.pH) <= 0.03) return { ok: false, msg: `That is the pH of the ${concText(ACETIC.c)} flask; this flask holds ${concText(HARD.c)}.` };
      return { ok: false, msg: `The window shows ${w.ionized} of ${w.units} units handed over, and that does not give a pH of ${fmt(v, 2)}.` };
    },
    get reward() {
      const s = flaskSol({ solute: HARD });
      return {
        log: 'The constant gave the pH of a concentration no flask showed.',
        title: 'A New Concentration',
        body: `The constant held at a concentration no flask showed: with the two ions equal, Ka gives ${sci(s.h, 2)} mol/L of H₃O⁺ and a pH of ${fmt(s.pH, 2)} for 0.15 M acetic acid.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-dilute',
    title: 'Diluting the Acid',
    prompt: 'Dilute the acetic acid until 25 of the 200 units have come apart.',
    widget,
    table: (() => {
      const f = flaskAt('f1', 36, 1, { solute: ACETIC_C[0], label: NAMES.acetic, w: 64, window: 20, dilute: 2 });
      return phTable({
        pieces: [meterPiece('meter', { x: 100, y: 9 })],
        fixtures: [f.fixture],
        zones: { slots: [f.slot] }
      }, { w: 184, h: 80 });
    })(),
    hints: [
      'Press "Dilute" and watch the window.',
      'Count the units that have come apart in the window after each dilution.',
      'The window always holds the same 200 units, so a count that rises is a share that rises.'
    ],
    // The graded answer is the flask: diluted until the window shows the planner's 25 of 200.
    check(state) {
      const n = Math.round(dialValue(state.table, 'f1', 'steps'));
      if (n === 0) return { ok: false, notYet: true, msg: 'Dilute the acid.' };
      const w = windowOf({ solute: { ...ACETIC_C[0], c: ACETIC_C[0].c * Math.pow(0.1, n) } });
      if (w.ionized === 25) return { ok: true };
      return { ok: false, msg: `After ${n} ${n === 1 ? 'dilution' : 'dilutions'} the window shows ${w.ionized} of ${w.units} units come apart.` };
    },
    get reward() {
      const p = ACETIC_C.map(s => fmt(flaskSol({ solute: s }).percent, 1));
      return {
        log: 'A larger share of the acid had ionized in the more dilute flasks.',
        title: 'Dilution',
        body: `The more dilute the acetic acid, the larger the share that has ionized: ${p[0]} percent at 0.10 M, ${p[1]} percent at 0.010 M and ${p[2]} percent at 0.0010 M, even though the pH rises.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-kb',
    title: 'The Base Constant',
    prompt: 'Arrange cards on the board into a ratio that reads the same number for all three ammonia flasks.',
    widget,
    table: rigTable(NH3_C, [['OH', 'OH⁻'], ['BH', 'NH₄⁺'], ['B', 'NH₃']]),
    hints: [
      'Drag the three cards into the places above and below the line.',
      'Compare the three numbers the board prints for each arrangement you try.',
      'Try one card, then two, then three, and keep an arrangement whose three numbers agree.'
    ],
    check: rigCheck,
    get reward() {
      return {
        log: 'NH₄⁺ times OH⁻ over NH₃ held at one number.',
        title: 'The Base Constant',
        body: `The same steady ratio holds for a base: NH₄⁺ times OH⁻ over NH₃ read ${sci(BASES.nh3.Kb, 2)} in all three flasks. That number is the base's constant, Kb.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-pairs',
    title: 'Acid and Base Together',
    prompt: 'Arrange cards so the board reads one number for all three pairs of an acid and its base.',
    widget,
    table: (() => {
      const rig = rigParts('rig', { x: 75, y: 24 }, {
        cols: PAIRS.map(p => ({ values: { Ka: p.Ka, Kb: p.Kb }, title: p.title, lines: [`Ka ${sci(p.Ka, 2)}`, `Kb ${sci(p.Kb, 2)}`] })), h: 32
      });
      return phTable({
        pieces: [tile('t-Ka', 'Ka', 'Ka', { x: 162, y: 12 }), tile('t-Kb', 'Kb', 'Kb', { x: 162, y: 30 })],
        fixtures: [rig.fixture],
        zones: { slots: rig.slots }
      }, { w: 176, h: 46 });
    })(),
    hints: [
      'Drag the two cards into the places above and below the line.',
      'Compare the three numbers the board prints for each arrangement; each column is a different acid with its own base.',
      'Try each card alone, then both on one side of the line, then one on each side.'
    ],
    check: rigCheck,
    reward: {
      log: 'Ka times Kb came to one number for every pair.',
      title: 'Ka Times Kb',
      body: `Ka times Kb read ${sci(KW25, 2)} for acetic acid, for ammonia and for hydrofluoric acid with their bases. For any acid and its conjugate base, Ka × Kb = Kw.`
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Weak Acids and Bases',
  body: 'Acids at the same concentration can read different pH, because a weak acid ionizes only in part. Ka and Kb are the steady ratios that say how far.'
};

const slotT = i => `slot:rig.t${i}`;
const slotB = i => `slot:rig.b${i}`;
const seat = i => `slot:f${i}.seat`;

export const SOLUTIONS = [
  [put('higher', 'slot:guess')],
  [put('meter', seat(1)), put('meter', seat(2)), put('meter', seat(3)), put('c-hcl', 'tray:all'), put('c-acetic', 'tray:some'), put('c-hf', 'tray:some')],
  [put('meter', seat(1)), { type: { entry: 'pct', value: '1.3' } }],
  [put('t-H', slotT(1)), put('t-A', slotT(2)), put('t-HA', slotB(1))],
  [{ type: { entry: 'ph', value: '2.79' } }],
  [{ run: 'f1' }, { run: 'f1' }],
  [put('t-OH', slotT(1)), put('t-BH', slotT(2)), put('t-B', slotB(1))],
  [put('t-Ka', slotT(1)), put('t-Kb', slotT(2))]
];

export const MISSES = [
  [],
  [put('c-hcl', 'tray:all'), put('c-acetic', 'tray:all'), put('c-hf', 'tray:some')],
  [{ type: { entry: 'pct', value: '2.88' } }],
  [put('t-H', slotT(1))],
  [{ type: { entry: 'ph', value: '5.57' } }],
  [{ run: 'f1' }],
  [put('t-OH', slotT(1))],
  [put('t-Ka', slotT(1))]
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

export const CHECKS = { S2_SOLUTES, ACETIC_C, NH3_C, HARD, PAIRS, DILUTIONS, pctOK, TOL_PH, numText };
