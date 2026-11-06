/**
 * Unit 8 · Bench 5 — Equilibrium Concentrations (q5-ice)
 *
 * Teeter's ledger desk, on the pans kit (`table/kits/pans.js`, `pans-ice.js`). The ledger gives a pan's start and its K; the bench is the
 * ICE board (what it starts with, the change, what is left) and a sealed pan drawn as bars. Eight stages and ONE click: the belief that K
 * says what share of the reactant turns over.
 *
 *   1  lay a change chip in each column of the board                        -> each change is x times its coefficient; the ICE table
 *   2  type [HI] for H₂ + I₂ ⇌ 2 HI from 1.0 M each (K = 54)                -> a perfect square, solved by its root
 *   3  PREDICT: how much of 1.0 M N₂O₄ turns into NO₂ when K is 0.0059?
 *   4  TEST: type [NO₂]                                                      -> a small K leaves the reactant almost as it began
 *   5  three pans: where is the approximation fair?                         -> fair when under 5 % of the start reacts
 *   6  type K from a start and one settled amount (HI)                      -> work back from a measurement
 *   7  type [NO₂] from 0.020 M N₂O₄ (the approximation fails)               -> the quadratic
 *   8  type [HI] on a pan whose K must be found on another pan              -> K carries across starts
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction offers "about half of it". The bars of stage 4 stay near their start.
 *
 * Every typed stage has a picture behind it: the bars show the pan settling, drawn from the planner that grades the figure
 * (`engine/eqdata.js` `iceAmounts`, found by bisection). Substances in the pans are real (H₂, I₂, HI at 698 K; N₂O₄, NO₂ at 298 K) or stand-in
 * letters with K printed.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, note, plaqueFixture, selectorFixture, pieceIn, dialValue } from '../../table/kits/pans.js';
import { changeChip, boardFixture, boardRead, barsFixture, barsRead } from '../../table/kits/pans-ice.js';
import { Q5, iceColumns, iceAmounts, approxExtent, reactedPercent, kFromPartial } from '../../engine/eqdata.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bICE table\b/i, introducedAt: 1 },
  { term: /\bapproximation\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit08/q2-k', 'unit08/q3-q'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q5-ice';
const GUESS = { half: 'About half of it', few: 'Only a few percent of it', most: 'Almost all of it', none: 'None of it' };
const TALL = { h: 72 };

/* ------------------------------------------------------------------ the numbers (all from engine/eqdata.js) */

const conc = v => (v >= 1 ? v.toFixed(1) : v >= 0.1 ? v.toFixed(2) : v.toFixed(3));
const sig3 = v => String(Number((v * (1 + 1e-9)).toPrecision(3)));
const within = (v, want, rel) => Math.abs(v - want) <= rel * Math.abs(want);

const HI = Q5.hi;
const HI_1 = { 'H₂': 1, 'I₂': 1 };
const HI_ICE = iceAmounts(HI.species, HI_1, HI.K);
const HI_PARTIAL = { 'H₂': 0.5, 'I₂': 0.5 };
const HI_PARTIAL_ICE = iceAmounts(HI.species, HI_PARTIAL, HI.K);
const N2 = Q5.n2o4;
const N2_START = { 'N₂O₄': 1 };
const N2_ICE = iceAmounts(N2.species, N2_START, N2.K);
const N2_PCT = Math.round(reactedPercent(N2.species, N2_START, N2.K));
const N2_LOW = { 'N₂O₄': 0.02 };
const N2_LOW_ICE = iceAmounts(N2.species, N2_LOW, N2.K);
const N2_LOW_APPROX = 2 * approxExtent(N2.species, N2_LOW, N2.K);
const N2_LOW_PCT = Math.round(reactedPercent(N2.species, N2_LOW, N2.K));
const K_PARTIAL = kFromPartial(HI.species, HI_PARTIAL, { name: 'HI', value: HI_PARTIAL_ICE.amounts.HI });
const PANS = [
  { K: 4.0e-3, start: 1.0 },
  { K: 4.0e-3, start: 0.01 },
  { K: 0.4, start: 1.0 }
].map(p => ({ ...p, pct: reactedPercent(Q5.gen.species, { A: p.start }, p.K) }));
const FAIR = PANS.findIndex(p => p.pct < 5) + 1;

/* ------------------------------------------------------------------ layout */

const BOARD_AT = { x: 43, y: 28 };
const BARS_AT = { x: 116, y: 28 };
const startLine = init => `start: ${Object.entries(init).map(([n, v]) => `${conc(v)} M ${n}`).join(', ')}`;
const plaque = (lines, at = { x: 115, y: 60 }, w = 56) => plaqueFixture('plate', 'Vessel', at, lines, { w });

/** The board, its slots, and, if `lay`, the chips already in them (the right ones). */
function boardWith(species, { lay = false } = {}) {
  const { fixture, slots } = boardFixture('board', BOARD_AT, { species });
  const chips = lay ? species.map((s, i) => changeChip(`c${i + 1}`, s.nu, { ...slots[i].at }, { zone: `slot:${slots[i].id}` })) : [];
  return { fixture, slots, chips };
}

const gradedTyped = (t, id) => entryNumber(t, id);

function aboveBelow(v, want, name) {
  return v > want ? `The ${name} bar settles lower than ${sig3(v)}.` : `The ${name} bar settles higher than ${sig3(v)}.`;
}

const guessKey = () => { const g = recall(QUEST_KEY); return g && GUESS[g] ? g : null; };

/** The ICE board in the first stage: a row of chips to choose from. */
const S1_COLS = iceColumns(HI.species, HI_1);
const S1_CHIPS_AT = [14, 34, 54, 74, 94].map(x => ({ x, y: 62 }));

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const b = boardWith(S1_COLS);
    return {
      id: 's1-board',
      title: 'Change in Each Column',
      prompt: 'Lay a change card in each column to show how each substance changes while the vessel settles.',
      widget,
      table: pansTable({
        pieces: [
          changeChip('k1', -1, S1_CHIPS_AT[0]), changeChip('k2', -1, S1_CHIPS_AT[1]), changeChip('k3', 1, S1_CHIPS_AT[2]),
          changeChip('k4', 2, S1_CHIPS_AT[3]), changeChip('k5', -2, S1_CHIPS_AT[4])
        ],
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: S1_COLS, K: HI.K, max: 2, title: 'Vessel' })],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Use the "Settle" key on the vessel, the change cards and the board.',
        'Compare how far each solid bar moves from its dashed bar.',
        'Each substance changes by the same x, times its coefficient in the reaction, used up for a reactant and made for a product.'
      ],
      check(state) {
        const t = state.table;
        const r = boardRead(t, 'board');
        if (!r.full) return { ok: false, notYet: true, msg: 'Lay a card in every column.' };
        if (r.right) return { ok: true };
        const bars = barsRead(t, 'bars');
        if (!bars.settled) return { ok: false, msg: 'The vessel has not settled, so the cards have nothing to be compared with.' };
        const w = r.wrong[0];
        const name = w.s.name;
        const d = bars.amounts[name] - bars.init[name];
        if (Math.sign(d) !== Math.sign(w.chip.props.nu)) return { ok: false, msg: `The ${name} bar ${d < 0 ? 'fell' : 'rose'} when the vessel settled, and the card on ${name} says the opposite.` };
        const other = S1_COLS.find(c => c.name !== name);
        const od = Math.abs(bars.amounts[other.name] - bars.init[other.name]);
        const rel = Math.abs(Math.abs(d) - od) < 1e-6 ? 'the same distance as' : Math.abs(d) > od ? 'further than' : 'less far than';
        return { ok: false, msg: `The ${name} bar moved ${rel} the ${other.name} bar, and the cards on the board do not show that.` };
      },
      reward: {
        log: 'Each substance changed by x times its coefficient.',
        title: 'The ICE Table',
        body: 'A reactant is used up and a product is made by the same x, multiplied by each coefficient in the reaction. A table with a row for the start, the change and the amounts at equilibrium is called an ICE table.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = boardWith(S1_COLS, { lay: true });
    return {
      id: 's2-square',
      title: 'A Perfect Square',
      prompt: 'Type the concentration of HI when this vessel has settled, in moles per litre.',
      entry: { id: 'hi', label: 'HI at equilibrium', unit: 'M' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: S1_COLS, K: HI.K, max: 2, title: 'Vessel' }), plaque([HI.eq, `K = ${HI.K} at ${HI.T} K`, startLine(HI_1)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Use the "Settle" key on the vessel, the board and the number field.',
        'Compare the bottom row of the board with the K on the plate, since K is the ratio of those amounts with each one raised to its coefficient.',
        'Both sides of the equation are perfect squares, so take the square root of both sides and solve for x.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'hi');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
        const want = HI_ICE.amounts.HI;
        if (within(v, want, 0.02)) return { ok: true };
        if (within(v, HI_ICE.x, 0.03)) return { ok: false, msg: `${sig3(v)} is the x on the board; the HI column holds 2x.` };
        return { ok: false, msg: aboveBelow(v, want, 'HI') };
      },
      reward: {
        log: 'Taking the square root of both sides solved for x.',
        title: 'A Perfect Square',
        body: 'When the start amounts make both sides of K a perfect square, the square root of K equals the square root of the ratio. That leaves a plain equation in x, and the ICE table turns x into every amount.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'How Much Changes?',
    // A PREDICT STAGE: no board, no pan, no chip. The guess comes back with the test.
    predict: true,
    prompt: 'How much of 1.0 M N₂O₄ turns into NO₂ when K for N₂O₄ ⇌ 2 NO₂ is 0.0059?',
    widget,
    table: pansTable({
      pieces: [note('half', GUESS.half, { x: 30, y: 14 }), note('few', GUESS.few, { x: 78, y: 14 }), note('most', GUESS.most, { x: 30, y: 36 }), note('none', GUESS.none, { x: 78, y: 36 })],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'react', { title: 'A reaction starting', kf: 0.02, kr: 0.2, seed: 7, span: 36 , h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Use the four cards and the slot.',
      'Compare the size of K with 1, since K is the ratio of the amounts the vessel holds when it settles.',
      'A K far below 1 means the ratio has to stay small, so the amount of the product the vessel holds stays small.'
    ],
    check(state) {
      if (!pieceIn(state.table, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the vessel settles and the bars show how much of the N₂O₄ really changes.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cols = iceColumns(N2.species, N2_START);
    const b = boardWith(cols, { lay: true });
    return {
      id: 's4-small',
      title: 'A Small K',
      get prompt() {
        const g = guessKey();
        return g ? `You predicted "${GUESS[g]}". Type the concentration of NO₂ when this vessel has settled, in moles per litre.` : 'Type the concentration of NO₂ when this vessel has settled, in moles per litre.';
      },
      entry: { id: 'no2', label: 'NO₂ at equilibrium', unit: 'M' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: cols, K: N2.K, max: 1, title: 'Vessel' }), plaque([N2.eq, `K = ${N2.K.toFixed(4)} at ${N2.T} K`, startLine(N2_START)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Use the "Settle" key on the vessel, the board and the number field.',
        'Compare the N₂O₄ bar when the vessel has settled with its dashed bar.',
        'If the N₂O₄ bar hardly moves, 1.0 − x is close to 1.0, which turns the equation for x into a plain one without a quadratic.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'no2');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
        const want = N2_ICE.amounts['NO₂'];
        if (within(v, want, 0.05)) return { ok: true };
        if (within(v, N2_ICE.x, 0.05)) return { ok: false, msg: `${sig3(v)} is the x on the board; the NO₂ column holds 2x.` };
        return { ok: false, msg: aboveBelow(v, want, 'NO₂') };
      },
      get reward() {
        const g = guessKey();
        const said = !g ? '' : g === 'few' ? `You predicted only a few percent, and the bars agreed: about ${N2_PCT} percent turned over. ` : `You predicted "${GUESS[g].toLowerCase()}", but only about ${N2_PCT} percent turned over. `;
        return {
          log: 'A small K left the reactant almost as it began.',
          title: 'The Small-x Approximation',
          body: `${said}When K is small, x is small next to the start, so 1.0 − x can be treated as 1.0: the small-x approximation. K is a ratio of amounts, not a share that turns over.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-fair',
    title: 'Is the Shortcut Fair?',
    prompt: 'Tap the vessel where the small-x approximation is fair.',
    widget,
    table: pansTable({
      fixtures: [
        ...PANS.map((p, i) => pickable(barsFixture(`bars${i + 1}`, { x: 25 + i * 50, y: 25 }, {
          species: iceColumns(Q5.gen.species, { A: p.start }), K: p.K, max: p.start, mark95: 'A', title: `Vessel ${i + 1}`, w: 48, h: 42,
          info: `K ${p.K}, start ${conc(p.start)} M`
        }), i + 1)),
        choiceFixture('pick', 'Fair on', { x: 75, y: 58 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', ' '], start: 4, w: 56 })
      ]
    }, { h: 70 }),
    hints: [
      'Use the "Settle" key on each vessel, then tap the vessel you choose.',
      'Compare where the solid bar for A ends on each vessel with its dashed line.',
      'The approximation treats A as unchanged from its start, so it is fair only where the A bar stays close to its start.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === FAIR) return { ok: true };
      return { ok: false, msg: `On Vessel ${v} the solid bar for A settles below the dashed line.` };
    },
    reward: {
      log: 'The approximation held where under 5 % reacted.',
      title: 'When the Shortcut Is Fair',
      body: 'The approximation treats the reactant as unchanged from its start. It is fair when less than 5 % of the start reacts; where more reacts, solve the quadratic.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const cols = iceColumns(HI.species, HI_PARTIAL);
    const b = boardWith(cols, { lay: true });
    return {
      id: 's6-partial',
      title: 'K From One Reading',
      prompt: 'Type K for this reaction from the amount of HI the vessel holds when it has settled.',
      entry: { id: 'k', label: 'K', unit: '' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: cols, K: HI.K, max: 1, reads: ['HI'], title: 'Vessel' }), plaque([HI.eq, `at ${HI.T} K`, startLine(HI_PARTIAL)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Use the "Settle" key on the vessel, the board and the number field.',
        'Compare the HI the vessel holds when settled with the 2x in the HI column, to find x and then the other two amounts.',
        'Put the three amounts into the ratio of K, with each raised to its coefficient.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'k');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type K in the field.' };
        if (within(v, K_PARTIAL.K, 0.03)) return { ok: true };
        const a = K_PARTIAL.amounts;
        if (within(v, a.HI / (a['H₂'] * a['I₂']), 0.03)) return { ok: false, msg: `${sig3(v)} is HI divided by H₂ and I₂ with no power on HI.` };
        if (within(v, a.HI / a['H₂'], 0.03)) return { ok: false, msg: `${sig3(v)} is HI divided by H₂ alone; the reaction on the plate has I₂ as well.` };
        return { ok: false, msg: `${sig3(v)} is not the ratio of the amounts left on the vessel.` };
      },
      reward: {
        log: 'One settled amount gave x, then every amount, then K.',
        title: 'K From a Settled Vessel',
        body: 'Work back from one measured amount: it gives x, x gives every amount, and the amounts give K. The K you find belongs to the reaction at that temperature, not to the start.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const cols = iceColumns(N2.species, N2_LOW);
    return {
      id: 's7-quadratic',
      title: 'A Small Start',
      prompt: 'Type the concentration of NO₂ when this vessel has settled, in moles per litre.',
      entry: { id: 'no2', label: 'NO₂ at equilibrium', unit: 'M' },
      widget,
      table: pansTable({
        fixtures: [
          barsFixture('bars', { x: 42, y: 28 }, { species: cols, K: N2.K, max: 0.02, mark95: 'N₂O₄', title: 'Vessel', w: 62, h: 42 }),
          plaqueFixture('plate', 'Vessel', { x: 116, y: 28 }, [N2.eq, `K = ${N2.K.toFixed(4)} at ${N2.T} K`, startLine(N2_LOW)], { w: 62 })
        ]
      }),
      hints: [
        'Use the "Settle" key on the vessel and the number field.',
        'Compare the N₂O₄ bar when the vessel has settled with its dashed line.',
        'If the bar falls well below the line, 0.020 − x cannot be treated as 0.020, so write the equation for x out in full and solve it as a quadratic.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'no2');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
        const want = N2_LOW_ICE.amounts['NO₂'];
        if (within(v, want, 0.03)) return { ok: true };
        if (within(v, N2_LOW_APPROX, 0.03)) return { ok: false, msg: `${sig3(v)} treats the N₂O₄ as unchanged from its start, and its solid bar settles well below the dashed line.` };
        return { ok: false, msg: aboveBelow(v, want, 'NO₂') };
      },
      reward: {
        log: 'The quadratic gave the amount that matches the bars.',
        title: 'When the Shortcut Fails',
        body: `A start this small lets about ${N2_LOW_PCT} percent of the N₂O₄ react, so 0.020 − x cannot be treated as 0.020. The quadratic formula gives amounts that match the vessel.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const a = iceColumns(HI.species, HI_PARTIAL);
    const bcols = iceColumns(HI.species, HI_1);
    return {
      id: 's8-sealed',
      title: 'Two Vessels, One K',
      prompt: 'Type the concentration of HI when Vessel B has settled, in moles per litre.',
      entry: { id: 'hi', label: 'HI in Vessel B', unit: 'M' },
      widget,
      table: pansTable({
        fixtures: [
          barsFixture('barsA', { x: 36, y: 26 }, { species: a, K: HI.K, max: 2, reads: ['HI'], title: 'Vessel A', w: 62, h: 42 }),
          barsFixture('barsB', { x: 114, y: 26 }, { species: bcols, K: HI.K, max: 2, title: 'Vessel B', w: 62, h: 42 }),
          plaqueFixture('plate', 'Two vessels', { x: 75, y: 58 }, [`${HI.eq}, both at ${HI.T} K`, `Vessel A starts with ${conc(0.5)} M H₂ and ${conc(0.5)} M I₂`, `Vessel B starts with ${conc(1)} M H₂ and ${conc(1)} M I₂`], { w: 90 })
        ]
      }, { h: 70 }),
      hints: [
        'Use the "Settle" key on both vessels and the number field.',
        'Compare the two vessels: both are the same reaction at the same temperature, but only Vessel A shows a settled amount.',
        'Find K from Vessel A, then use that K with an ICE table for Vessel B.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'hi');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
        const want = HI_ICE.amounts.HI;
        if (within(v, want, 0.02)) return { ok: true };
        if (within(v, HI_PARTIAL_ICE.amounts.HI, 0.03)) return { ok: false, msg: `${sig3(v)} is the HI that Vessel A settled at, from a different start.` };
        return { ok: false, msg: aboveBelow(v, want, 'HI') };
      },
      reward: {
        log: 'K from one vessel solved the other.',
        title: 'K Carries Across Starts',
        body: 'K is the same for every vessel of one reaction at one temperature, whatever it starts with. Find it from the vessel that gives enough data, then solve the other vessel with an ICE table.'
      }
    };
  })()
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Equilibrium Concentrations',
  body: 'A start and a K fix what a vessel holds when it settles: an ICE table sets the unknown x, and K solves for it.'
};

const put = (piece, to) => ({ place: { piece, to } });
const settle = id => ({ run: id });
const typed = (entry, v) => ({ type: { entry, value: sig3(v) } });

export const SOLUTIONS = [
  [settle('bars'), put('k1', 'slot:board.c0'), put('k2', 'slot:board.c1'), put('k4', 'slot:board.c2')],
  [settle('bars'), typed('hi', HI_ICE.amounts.HI)],
  [put('few', 'slot:guess')],
  [settle('bars'), typed('no2', N2_ICE.amounts['NO₂'])],
  [settle('bars1'), settle('bars2'), settle('bars3'), { setDial: { fixture: 'pick', dial: 'value', value: FAIR } }],
  [settle('bars'), typed('k', K_PARTIAL.K)],
  [settle('bars'), typed('no2', N2_LOW_ICE.amounts['NO₂'])],
  [settle('barsA'), settle('barsB'), typed('hi', HI_ICE.amounts.HI)]
];

export const MISSES = [
  [settle('bars'), put('k3', 'slot:board.c0'), put('k1', 'slot:board.c1'), put('k4', 'slot:board.c2')],
  [settle('bars'), typed('hi', HI_ICE.x)],
  [],
  [settle('bars'), typed('no2', N2_ICE.x)],
  [settle('bars2'), { setDial: { fixture: 'pick', dial: 'value', value: 2 } }],
  [settle('bars'), typed('k', K_PARTIAL.amounts.HI / (K_PARTIAL.amounts['H₂'] * K_PARTIAL.amounts['I₂']))],
  [settle('bars'), typed('no2', N2_LOW_APPROX)],
  [settle('barsA'), settle('barsB'), typed('hi', HI_PARTIAL_ICE.amounts.HI)]
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

export const CHECKS = { HI_ICE, HI_PARTIAL_ICE, N2_ICE, N2_LOW_ICE, N2_LOW_APPROX, K_PARTIAL, PANS, FAIR, N2_PCT, N2_LOW_PCT };
