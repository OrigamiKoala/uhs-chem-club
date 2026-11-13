/**
 * Unit 8 · Bench 2 — The Number That Holds (q2-k)
 *
 * Teeter's equilibrium vessels, on the pans kit (`table/kits/pans.js`, the ratio instruments in `pans-ratio.js`). A vessel has a bar
 * for every substance; "Settle" lets it reach equilibrium. Seven stages:
 *
 *   1  PREDICT: where do three vessels that began differently settle?
 *   2  TEST: lay particles on the ratio board so it reads the same on all three vessels -> K (butane ⇌ isobutane)
 *   3  the same, for H₂ + I₂ ⇌ 2 HI, where a coefficient becomes a power               -> Kc
 *   4  the same, for CaCO₃(s) ⇌ CaO(s) + CO₂(g), where the amount of solid varies      -> solids are left out; Kp
 *   5  typed: K to two significant figures for 2 NO₂ ⇌ N₂O₄ (with worked case in briefing)
 *   6  pick the vessel whose reaction goes nearly to completion                        -> large K
 *   7  predict which vessel will make the least product from its K (before settling)   -> small K
 *
 * The ratio board prints a reading for whatever is laid on it and never says which arrangement is right; the planner is
 * `engine/eqdata.js` (`rigReading`, `settleAmounts`). Both arrangements that give a steady number are accepted (a ratio and its inverse).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, note, tag, pieceIn, dialValue } from '../../table/kits/pans.js';
import { vesselFixture, rigParts, tile, rigRead, vslRead } from '../../table/kits/pans-ratio.js';
import { K_SYSTEMS, readingsAgree, fmtNum, kSlips } from '../../engine/eqdata.js';
import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickColumns } from '../../table/kits/pans-choice.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bK\b/, introducedAt: 2 },
  { term: /\bequilibrium constant\b/i, introducedAt: 2 },
  { term: /\bKc\b/, introducedAt: 3 },
  { term: /\bKp\b/, introducedAt: 4 },
  { term: /\blarge K\b/i, introducedAt: 6 },
  { term: /\bsmall K\b/i, introducedAt: 7 }
];

export const BUILDS_ON = ['unit08/q1-both'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q2-k';
const GUESS = {
  equal: 'In every vessel, butane and isobutane settle at equal amounts',
  same: 'All three vessels settle with the same amount of butane and the same of isobutane',
  diff: 'Every vessel settles somewhere different, with nothing in common',
  gone: 'In every vessel, all the butane is used up'
};

const BUT = K_SYSTEMS.butane;
const HI = K_SYSTEMS.hi;
const CA = K_SYSTEMS.caco3;
const NO = K_SYSTEMS.n2o4;

/* ---------------------------------------------------------------- the data each stage's vessels start from */

const BUT_PANS = [{ start: { butane: 1.2 } }, { start: { isobutane: 1.8 } }, { start: { butane: 0.3, isobutane: 0.3 } }];
const HI_PANS = [{ start: { H2: 1, I2: 1 } }, { start: { HI: 1 } }, { start: { H2: 0.6, I2: 1.4, HI: 0.5 } }];
const CA_PANS = [{ start: { CaCO3: 1, CaO: 0 } }, { start: { CaCO3: 0.6, CaO: 0.4 } }, { start: { CaCO3: 0.2, CaO: 0.8 } }];
const NO_PAN = [{ start: { NO2: 0.736 } }];
/** Four vessels of Reactant ⇌ Product that begin with 1.00 mol/L of Reactant alone; only K differs. */
const K_BIG = [0.7, 2e5, 6e-4, 5];
const K_SMALL = [7e4, 0.3, 3e-6, 4];
const BIG_PICK = 2;
const SMALL_PICK = 3;
const levelPans = Ks => Ks.map(K => ({ start: { R: 1 }, K }));

/* ---------------------------------------------------------------- shared pieces of a stage */

const X_TILES = 137;
const tileAt = i => ({ x: X_TILES, y: 9 + i * 13.5 });
const TABLE_H = 72;
const PANS_AT = { x: 62, y: 22 };
const RIG_AT = { x: 62, y: 57 };

/** The vessels, the ratio board and its particle tiles. */
function rigTable(system, pans, tiles, { top = 1, bottom = 1 } = {}) {
  const rig = rigParts('rig', RIG_AT, { vsl: 'pans', top, bottom });
  return pansTable({
    pieces: tiles.map(([sp, p], i) => tile(`t-${sp}${p}`, system, sp, p, tileAt(i))),
    fixtures: [vesselFixture('pans', PANS_AT, { system, pans }), rig.fixture],
    zones: { slots: rig.slots }
  }, { h: TABLE_H });
}

/** What the ratio board reads on the three vessels, as a sentence. */
const readingsText = r => {
  const v = r.readings.map(x => fmtNum(x, 3));
  return `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
};

/** The check of the three ratio-board stages: settled, something laid, and the three readings agree. */
function rigCheck(state) {
  const r = rigRead(state.table, 'rig');
  if (!r.laid) return { ok: false, notYet: true, msg: 'Lay a particle card on the ratio board.' };
  if (!r.settled) return { ok: false, notYet: true, msg: 'The ratio board prints nothing until the vessels have settled.' };
  if (readingsAgree(r.readings)) return { ok: true };
  return { ok: false, msg: `The ratio board reads ${readingsText(r)} on the three vessels.` };
}

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);

const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where Do They End?',
    predict: true,
    prompt: 'Three vessels start with different amounts: what do they have in common once settled?',
    widget,
    table: pansTable({
      pieces: [
        tag('st1', 'Vessel 1 begins with only butane', { x: 30, y: 12 }),
        tag('st2', 'Vessel 2 begins with only isobutane', { x: 76, y: 12 }),
        tag('st3', 'Vessel 3 begins with equal amounts of butane and isobutane', { x: 122, y: 12 }),
        note('equal', GUESS.equal, { x: 30, y: 36 }),
        note('same', GUESS.same, { x: 78, y: 36 }),
        note('diff', GUESS.diff, { x: 30, y: 58 }),
        note('gone', GUESS.gone, { x: 78, y: 58 })
      ],
      fixtures: [clipFixture('clip', { x: 126, y: 30 }, 'react', { title: 'A reaction starting', kf: 0.12, kr: 0.03, seed: 9, span: 36, h: 22, w: 40 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 57 }, size: { w: 36, h: 14 } }] }
    }, { h: TABLE_H }),
    hints: [
      'Drag one of the four prediction cards into the slot.',
      'Picture each vessel from its starting card, and think about what it looks like once settled.',
      'Compare what the three vessels began with, and ask whether where they end depends on that.'
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
      body: 'Next, the three vessels are settled and measured.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-ratio',
    title: 'The Ratio Board',
    get prompt() { return guessLine('Which ratio of amounts comes out the same for all three settled vessels?', recall(QUEST_KEY)); },
    widget,
    table: rigTable('butane', BUT_PANS, [['butane', 1], ['isobutane', 1]]),
    hints: [
      'Press "Settle", then place the particle cards above and below the line on the ratio board.',
      'Compare the three numbers the ratio board prints under the vessels for each arrangement you try.',
      'Try each card alone, then both together, and keep the arrangement whose three numbers match.'
    ],
    check: rigCheck,
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'equal' ? 'Vessel 3 began with equal amounts and moved away from them. ' : g === 'same' ? 'The amounts differed from vessel to vessel, but the ratio did not. ' : g === 'gone' ? 'Some butane was left in every vessel. ' : '';
      return {
        log: 'Isobutane over butane held at the same number on every vessel.',
        title: 'The Equilibrium Constant',
        body: `${verdict}Isobutane ÷ butane is ${fmtNum(BUT.K, 2)} in every vessel, whatever it began with. Products over reactants at equilibrium is the equilibrium constant, K.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-powers',
    title: 'Two of the Same',
    prompt: 'Which ratio is the same for all three settled vessels of H₂ + I₂ ⇌ 2 HI?',
    widget,
    table: rigTable('hi', HI_PANS, [['H2', 1], ['I2', 1], ['HI', 1], ['HI', 2]], { top: 2, bottom: 2 }),
    hints: [
      'Press "Settle", then place particle cards on the ratio board.',
      'Compare the three readings for each arrangement; HI² counts the HI concentration squared.',
      'Look at the coefficient 2 in front of HI in the equation printed on the vessels.'
    ],
    check: rigCheck,
    reward: {
      log: 'HI squared over H₂ times I₂ held at one number.',
      title: 'Coefficients Become Powers',
      body: `HI² ÷ (H₂ × I₂) is ${fmtNum(HI.K, 2)} in every vessel: the 2 in front of HI became a power. With concentrations in mol/L, the constant is written Kc.`
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-solids',
    title: 'A Vessel With Solids',
    prompt: 'Which ratio is the same for all three settled vessels of CaCO₃ ⇌ CaO + CO₂?',
    widget,
    table: rigTable('caco3', CA_PANS, [['CaCO3', 1], ['CaO', 1], ['CO2', 1]], { top: 2, bottom: 2 }),
    hints: [
      'Press "Settle", then place particle cards on the ratio board.',
      'Compare the readings when solids are included with when they are left off.',
      'Test arrangements one card at a time, and keep only what leaves the three numbers matching.'
    ],
    check: rigCheck,
    reward: {
      log: 'Only the gas stayed the same from vessel to vessel.',
      title: 'Solids Are Left Out',
      body: 'Only the CO₂ pressure is the same in every vessel, because a pure solid\'s concentration does not depend on how much is there. With pressures the constant is written Kp.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-typed',
    title: 'Find K',
    briefing: {
      speaker: 'Vess',
      body: 'K is products over reactants, each raised to its coefficient in the equation.',
      worked: [
        'For H₂ + I₂ ⇌ 2 HI with H₂ = 0.21 M, I₂ = 0.21 M, HI = 1.54 M:',
        'K = HI² ÷ (H₂ × I₂) = 1.54² ÷ (0.21 × 0.21) = 54'
      ]
    },
    prompt: 'What is K for this vessel, to two significant figures?',
    widget,
    entry: { id: 'k', label: 'K', unit: '' },
    table: pansTable({
      fixtures: [vesselFixture('pans', { x: 38, y: 22 }, { system: 'n2o4', pans: NO_PAN, settled: true, w: 70, titles: ['The vessel at equilibrium'] })]
    }, { h: 46 }),
    hints: [
      'Read the pressure of each gas from the bars and the equation beside them.',
      'Put the product pressure on top and the reactant pressure on the bottom, raised to its coefficient.',
      'Follow the worked example in the briefing: divide N₂O₄ by NO₂ squared, then round to two figures.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const pan = vslRead(state.table, 'pans').pans[0];
      if (Math.abs(v - pan.K) / pan.K <= 0.03) return { ok: true };
      const sl = kSlips(NO, pan.eq);
      const near = x => Math.abs(v - x) / x <= 0.03;
      const eq = `NO₂ at ${fmtNum(pan.eq.NO2, 3)} atm and N₂O₄ at ${fmtNum(pan.eq.N2O4, 3)} atm`;
      if (near(sl.inverted)) return { ok: false, msg: `That figure is the ratio turned upside down: ${eq} puts N₂O₄ on the products side of the equation.` };
      if (near(sl.noPower)) return { ok: false, msg: `That figure counts NO₂ once; the equation has a 2 in front of NO₂.` };
      if (near(sl.multiplied)) return { ok: false, msg: `That figure multiplies the NO₂ pressure by 2; the 2 in the equation does not multiply it.` };
      return { ok: false, msg: `With ${eq}, that is not the figure the ratio of this vessel comes to.` };
    },
    reward: {
      log: 'K for 2 NO₂ ⇌ N₂O₄ came from the bars.',
      title: 'K From a Vessel',
      body: `The settled pressures, with the 2 as a power, give K = ${fmtNum(NO.K, 2)}. Any vessel of this reaction at this temperature gives the same.`
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-large',
    title: 'Nearly All the Way',
    prompt: 'Which reaction goes nearly to completion?',
    widget,
    table: pansTable({
      fixtures: [
        pickColumns(vesselFixture('pans', PANS_AT, { system: 'rp', pans: levelPans(K_BIG), lw: 12, legend: false })),
        choiceFixture('pick', 'Goes nearly to completion', { x: 62, y: 55 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', 'Vessel 4', ' '], start: 5, w: 60 })
      ]
    }, { h: 66 }),
    hints: [
      'Press "Settle", then tap the vessel you choose.',
      'Compare how much Reactant is left in each vessel after it settles.',
      'A reaction that goes nearly to completion leaves almost no Reactant.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === BIG_PICK) return { ok: true };
      const eq = vslRead(state.table, 'pans').pans[v - 1].eq;
      return { ok: false, msg: `On Vessel ${v}, ${fmtNum(eq.R, 3)} mol/L of Reactant is still left once it has settled.` };
    },
    reward: {
      log: 'Vessel 2 went nearly to completion.',
      title: 'Large K',
      body: `Vessel 2 settled with almost no Reactant; its K is ${fmtNum(K_BIG[BIG_PICK - 1], 2)}. A K far above 1 means the vessel settles as nearly all product (a large K).`
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-small',
    title: 'Hardly Started',
    prompt: 'Which reaction will have made the least product once it settles?',
    widget,
    table: pansTable({
      fixtures: [
        pickColumns(vesselFixture('pans', PANS_AT, { system: 'rp', pans: levelPans(K_SMALL), lw: 12, legend: false, showK: true, noRun: true })),
        choiceFixture('pick', 'Makes the least Product', { x: 62, y: 55 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', 'Vessel 4', ' '], start: 5, w: 60 })
      ]
    }, { h: 66 }),
    hints: [
      'Compare the K printed on each vessel, then tap your choice.',
      'Look for the K that is smallest compared with 1.',
      'A large K meant nearly all product; a K far below 1 means the opposite.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === SMALL_PICK) return { ok: true };
      const eq = vslRead(state.table, 'pans').pans[v - 1].eq;
      return { ok: false, msg: `Vessel ${v} has K = ${fmtNum(K_SMALL[v - 1], 2)}, which makes ${fmtNum(eq.P, 3)} mol/L of Product.` };
    },
    reward: {
      log: 'Vessel 3 barely started.',
      title: 'Small K',
      body: `Vessel 3, with K = ${fmtNum(K_SMALL[SMALL_PICK - 1], 2)}, makes almost no product. A K far below 1 means the vessel settles as nearly all reactant (a small K).`
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'The Number That Holds',
  body: 'From any start, a vessel settles at amounts whose ratio, products over reactants, is the same number. That number is K.'
};

/** Every settled-vessel stage presses "Settle" on its own vessels. */
const settle = [{ run: 'pans' }];
const slotT = i => `slot:rig.t${i}`;
const slotB = i => `slot:rig.b${i}`;

export const SOLUTIONS = [
  [put('same', 'slot:guess')],
  [...settle, put('t-isobutane1', slotT(1)), put('t-butane1', slotB(1))],
  [...settle, put('t-HI2', slotT(1)), put('t-H21', slotB(1)), put('t-I21', slotB(2))],
  [...settle, put('t-CO21', slotT(1))],
  [{ type: { entry: 'k', value: '6.7' } }],
  [dial('pick', 'value', BIG_PICK)],
  [dial('pick', 'value', SMALL_PICK)]
];

export const MISSES = [
  [],
  [...settle, put('t-butane1', slotT(1))],
  [...settle, put('t-HI1', slotT(1)), put('t-H21', slotB(1)), put('t-I21', slotB(2))],
  [...settle, put('t-CaO1', slotT(1)), put('t-CO21', slotT(2)), put('t-CaCO31', slotB(1))],
  [{ type: { entry: 'k', value: '1.3' } }],
  [dial('pick', 'value', 4)],
  [dial('pick', 'value', 1)]
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

export const CHECKS = { BUT_PANS, HI_PANS, CA_PANS, NO_PAN, K_BIG, K_SMALL, BIG_PICK, SMALL_PICK };
