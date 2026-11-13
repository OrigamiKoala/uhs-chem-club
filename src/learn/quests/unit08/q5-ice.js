/**
 * Unit 8 · Bench 5 — Equilibrium Concentrations (q5-ice)
 *
 * Teeter's ICE-table bench, on the pans kit (`table/kits/pans.js`, `pans-ice.js`). Six stages:
 *
 *   1  lay a change card in each column of the ICE table                     -> each change is x times its coefficient
 *   2  typed: [HI] for H₂ + I₂ ⇌ 2 HI from 1.0 M each (worked case in brief) -> perfect square
 *   3  PREDICT: how much of 1.0 M N₂O₄ turns into NO₂ when K is 0.0059?
 *   4  TEST: typed [NO₂]                                                     -> small-x approximation (fair under 5%)
 *   5  three vessels: in which vessel is the small-x approximation fair?
 *   6  typed: K from a start and one settled amount (HI)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, note, plaqueFixture, pieceIn, dialValue } from '../../table/kits/pans.js';
import { changeChip, boardFixture, boardRead, barsFixture, barsRead } from '../../table/kits/pans-ice.js';
import { Q5, iceColumns, iceAmounts, approxExtent, reactedPercent, kFromPartial } from '../../engine/eqdata.js';
import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bICE table\b/i, introducedAt: 1 },
  { term: /\bsmall-x approximation\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit08/q2-k', 'unit08/q3-q'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q5-ice';
const GUESS = { half: 'About half of it', few: 'Only a few percent of it', most: 'Almost all of it', none: 'None of it' };
const TALL = { h: 72 };

/* ------------------------------------------------------------------ the numbers */

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
const K_PARTIAL = kFromPartial(HI.species, HI_PARTIAL, { name: 'HI', value: HI_PARTIAL_ICE.amounts.HI });
const RP_SPECIES = { Reactant: -1, Product: 2 };
const PANS = [
  { K: 4.0e-3, start: 1.0 },
  { K: 4.0e-3, start: 0.01 },
  { K: 0.4, start: 1.0 }
].map(p => ({ ...p, pct: reactedPercent(RP_SPECIES, { Reactant: p.start }, p.K) }));
const FAIR = PANS.findIndex(p => p.pct < 5) + 1;

/* ------------------------------------------------------------------ layout */

const BOARD_AT = { x: 43, y: 28 };
const BARS_AT = { x: 116, y: 28 };
const startLine = init => `start: ${Object.entries(init).map(([n, v]) => `${conc(v)} M ${n}`).join(', ')}`;
const plaque = (lines, at = { x: 115, y: 60 }, w = 56) => plaqueFixture('plate', 'Vessel', at, lines, { w });

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

const S1_COLS = iceColumns(HI.species, HI_1);
const S1_CHIPS_AT = [14, 34, 54, 74, 94].map(x => ({ x, y: 62 }));

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const b = boardWith(S1_COLS);
    return {
      id: 's1-board',
      title: 'Change in Each Column',
      briefing: {
        speaker: 'Vess',
        body: 'An ICE table has three rows for each substance: the Initial amount, the Change, and the amount at Equilibrium.'
      },
      prompt: 'How does each substance change while the vessel settles?',
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
        'Press "Settle" on the vessel, then lay a change card in each column.',
        'Compare how far the HI bar moved with how far the H₂ and I₂ bars moved.',
        'Watch which bars fell and which rose, and compare their distances with the equation.'
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
        body: 'H₂ and I₂ each fell by x and HI rose by 2x, as the coefficients say.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = boardWith(S1_COLS, { lay: true });
    return {
      id: 's2-square',
      title: 'Solving for x',
      briefing: {
        speaker: 'Vess',
        body: 'K turns the bottom row of the ICE table into one equation for x. When both sides are squares, take the square root of both sides.',
        worked: [
          'For 2.0 M H₂ and 2.0 M I₂ with K = 64:',
          '(2x)² ÷ (2.0 − x)² = 64  →  2x ÷ (2.0 − x) = 8  →  x = 1.6, HI = 3.2 M'
        ]
      },
      prompt: 'What is the concentration of HI when this vessel has settled, in mol/L?',
      entry: { id: 'hi', label: 'HI at equilibrium', unit: 'M' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: S1_COLS, K: HI.K, max: 2, title: 'Vessel' }), plaque([HI.eq, `K = ${HI.K} at ${HI.T} K`, startLine(HI_1)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Press "Settle" on the vessel and read the bottom row of the ICE table.',
        'Write K = (2x)² ÷ (1.0 − x)² = 54, and take the square root of both sides.',
        'Follow the worked example in the briefing to find x, then double x for HI.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'hi');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
        const want = HI_ICE.amounts.HI;
        if (within(v, want, 0.02)) return { ok: true };
        if (within(v, HI_ICE.x, 0.03)) return { ok: false, msg: `${sig3(v)} is the x on the board; the HI column holds 2x.` };
        if (v < 2) {
          const x = v / 2;
          const q = (v * v) / Math.pow(1 - x, 2);
          return { ok: false, msg: `With HI = ${sig3(v)} M, Q would be ${sig3(q)} instead of K = 54.` };
        }
        return { ok: false, msg: aboveBelow(v, want, 'HI') };
      },
      reward: {
        log: 'Taking the square root of both sides solved for x.',
        title: 'A Perfect Square',
        body: 'Taking the square root of both sides gives x = 0.786 M, so HI = 1.57 M at equilibrium.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'How Much Changes?',
    predict: true,
    prompt: 'How much of 1.0 M N₂O₄ turns into NO₂ when K for N₂O₄ ⇌ 2 NO₂ is 0.0059?',
    widget,
    table: pansTable({
      pieces: [note('half', GUESS.half, { x: 30, y: 14 }), note('few', GUESS.few, { x: 78, y: 14 }), note('most', GUESS.most, { x: 30, y: 36 }), note('none', GUESS.none, { x: 78, y: 36 })],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'react', { title: 'A reaction starting', kf: 0.02, kr: 0.2, seed: 7, span: 36, h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Drag one of the four prediction cards into the slot.',
      'Compare K = 0.0059 with 1.',
      'A K far below 1 means the product stays much smaller than the reactant.'
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
      body: 'Next, the vessel settles and the bars show how much N₂O₄ changes.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cols = iceColumns(N2.species, N2_START);
    const b = boardWith(cols, { lay: true });
    return {
      id: 's4-small',
      title: 'A Small K',
      briefing: {
        speaker: 'Vess',
        body: 'When K is very small, x is tiny beside the starting amount, so 1.0 − x can be treated as 1.0. This small-x approximation is fair when less than 5% reacts.'
      },
      get prompt() {
        const g = guessKey();
        return g ? `You predicted "${GUESS[g]}". What is the concentration of NO₂ when this vessel has settled, in mol/L?` : 'What is the concentration of NO₂ when this vessel has settled, in mol/L?';
      },
      entry: { id: 'no2', label: 'NO₂ at equilibrium', unit: 'M' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: cols, K: N2.K, max: 1, title: 'Vessel' }), plaque([N2.eq, `K = ${N2.K.toFixed(4)} at ${N2.T} K`, startLine(N2_START)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Press "Settle" on the vessel and read the bottom row of the ICE table.',
        'Compare the settled N₂O₄ bar with its dashed starting line.',
        'With 1.0 − x taken as 1.0, solve (2x)² ÷ 1.0 = 0.0059 for x, then double x for NO₂.'
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
        const said = !g ? '' : g === 'few' ? `You predicted only a few percent, and about ${N2_PCT}% turned over. ` : `You predicted "${GUESS[g].toLowerCase()}", and about ${N2_PCT}% turned over. `;
        return {
          log: 'A small K left the reactant almost as it began.',
          title: 'The Small-x Approximation',
          body: `${said}With 1.0 − x taken as 1.0, (2x)² = 0.0059, so NO₂ is 0.077 M.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-fair',
    title: 'Is the Shortcut Fair?',
    prompt: 'In which vessel is the small-x approximation fair?',
    widget,
    table: pansTable({
      fixtures: [
        ...PANS.map((p, i) => pickable(barsFixture(`bars${i + 1}`, { x: 25 + i * 50, y: 25 }, {
          species: iceColumns(RP_SPECIES, { Reactant: p.start }), K: p.K, max: p.start, mark95: 'Reactant', title: `Vessel ${i + 1}`, w: 48, h: 42,
          info: `K ${p.K}, start ${conc(p.start)} M`
        }), i + 1)),
        choiceFixture('pick', 'Fair on', { x: 75, y: 58 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', ' '], start: 4, w: 56 })
      ]
    }, { h: 70 }),
    hints: [
      'Press "Settle" on each vessel, then tap the vessel you choose.',
      'Compare where the solid Reactant bar ends against its dashed starting line.',
      'The small-x approximation is fair only where less than 5% of the Reactant reacts.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === FAIR) return { ok: true };
      return { ok: false, msg: `On Vessel ${v} the solid Reactant bar settles below the 5% mark.` };
    },
    reward: {
      log: 'The approximation held where under 5% reacted.',
      title: 'When the Shortcut Is Fair',
      body: 'Only where the reactant bar stays within 5% of its start. Where more reacts, the full equation is needed.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const cols = iceColumns(HI.species, HI_PARTIAL);
    const b = boardWith(cols, { lay: true });
    return {
      id: 's6-partial',
      title: 'K From One Reading',
      prompt: 'What is K for this reaction, from the amount of HI in the settled vessel?',
      entry: { id: 'k', label: 'K', unit: '' },
      widget,
      table: pansTable({
        pieces: b.chips,
        fixtures: [b.fixture, barsFixture('bars', BARS_AT, { species: cols, K: HI.K, max: 1, reads: ['HI'], title: 'Vessel' }), plaque([HI.eq, `at ${HI.T} K`, startLine(HI_PARTIAL)])],
        zones: { slots: b.slots }
      }, TALL),
      hints: [
        'Press "Settle" on the vessel and read the settled HI concentration.',
        'Set the settled HI equal to 2x on the ICE table to find x.',
        'The table ties every amount to the one that was measured: find H₂ and I₂ from x, then work out K.'
      ],
      check(state) {
        const v = gradedTyped(state.table, 'k');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type K in the field.' };
        if (within(v, K_PARTIAL.K, 0.03)) return { ok: true };
        const a = K_PARTIAL.amounts;
        if (within(v, a.HI / (a['H₂'] * a['I₂']), 0.03)) return { ok: false, msg: `${sig3(v)} is HI divided by H₂ and I₂ with no power on HI.` };
        if (within(v, a.HI / a['H₂'], 0.03)) return { ok: false, msg: `${sig3(v)} is HI divided by H₂ alone; the reaction on the plate has I₂ as well.` };
        return { ok: false, msg: `${sig3(v)} is not the ratio of the amounts left in the vessel.` };
      },
      reward: {
        log: 'One settled amount gave x, then every amount, then K.',
        title: 'K From a Settled Vessel',
        body: 'One measured amount gives x, x gives every amount, and those give K = 54.'
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
  [settle('bars'), typed('k', K_PARTIAL.K)]
];

export const MISSES = [
  [settle('bars'), put('k3', 'slot:board.c0'), put('k1', 'slot:board.c1'), put('k4', 'slot:board.c2')],
  [settle('bars'), typed('hi', HI_ICE.x)],
  [],
  [settle('bars'), typed('no2', N2_ICE.x)],
  [settle('bars2'), { setDial: { fixture: 'pick', dial: 'value', value: 2 } }],
  [settle('bars'), typed('k', K_PARTIAL.amounts.HI / (K_PARTIAL.amounts['H₂'] * K_PARTIAL.amounts['I₂']))]
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

export const CHECKS = { HI_ICE, HI_PARTIAL_ICE, N2_ICE, K_PARTIAL, PANS, FAIR, N2_PCT };
