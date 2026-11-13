/**
 * Unit 10 · Bench 5 — Under Load (q5-load)
 *
 * Brinewire's bench for cells away from standard conditions (CED 9.10), on the cell kit (`table/kits/cell.js`; the instruments are in
 * `cell-load.js`: a tin–lead cell driving a load with ion windows and a plot, two-beaker cells with set concentrations, and a concentration cell
 * with an ammeter). Eight stages and ONE click: the belief that a cell holds its voltage until it is empty, and that a dead cell is an empty one.
 *
 *   1  PREDICT: a tin–lead cell is run until the voltmeter reads zero; what does each beaker hold?
 *   2  TEST: run it; the voltage falls to zero while both ion windows are still full of dots
 *   3  more zinc ions in the zinc beaker: the voltage falls                                          (9.10.A.1)
 *   4  typed: tin count ÷ lead count in the dead cell, about K                                       -> reaction quotient
 *   5  a copper cell with a 1.0 M and a 0.010 M beaker: which bar do the electrons leave             -> concentration cell
 *   6  typed: the voltage of a zinc–copper cell with 1.0 M and 0.0010 M ions                         -> Nernst equation
 *   7  rank three prepared zinc–copper cells by voltage
 *   8  a sealed silver concentration cell: which beaker is the dilute one
 *
 * THE WRONG MODEL IS ON THE TABLE. The tin and lead cell stops while its tin window holds 72 dots and its lead window 28: the reaction
 * ran down to a balance and both ions are still there. A dead cell is not an empty cell.
 *
 * Every figure is `engine/celldata.js` and `engine/celldata-q5.js`. The CED says Le Châtelier's principle does not apply to cells (9.10.A.2),
 * so nothing here says a reaction "shifts". The reaction quotient is shown only as two ion counts until stage 4 earns it. This quest pays
 * no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { cellTable, selectorFixture, plaqueFixture, note, tag, pieceIn, dialValue, voltText, hideDials, canPiece } from '../../table/kits/cell.js';
import { loadFixture, loadRead, readFixture, readRead, ccFixture, ccRead } from '../../table/kits/cell-load.js';
import { cellE0, nernst, fmt } from '../../engine/celldata.js';
import { LOAD, CONC_STEPS, loadAt, balanceOf, readAt, concCellRead, concLabel, milliText } from '../../engine/celldata-q5.js';

import { attachScenes } from '../../table/kits/cell-attach.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\breaction quotient\b/i, introducedAt: 4 },
  { term: /\bQ\b/, introducedAt: 4 },
  { term: /\bconcentration cells?\b/i, introducedAt: 5 },
  { term: /\bNernst\b/, introducedAt: 6 }
];

/** Built quests whose words this bench uses (E° and K are theirs). */
export const BUILDS_ON = ['unit10/q4-potential'];

export function toolNoteFor() { return null; }

const SPEAKER = 'Vess';
const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit10/q5-load';
const GUESS = {
  tin: 'All the tin ions are gone',
  lead: 'All the lead ions are gone',
  empty: 'Both beakers are empty of ions',
  both: 'Both kinds of ion are still there'
};

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every figure shown is the planner's) */

const START = { cAnode0: 1, cCathode0: 1 };
/** Stage 2 and 4: tin (gives its ions) against lead. */
const TL = { anode: 'sn', cathode: 'pb' };
const END = () => loadAt(TL.cathode, TL.anode, START, LOAD.maxTick);
/** Stage 6: the zinc–copper cell with 1.0 M zinc ions and 0.0010 M copper ions. */
const S6 = { aC: 1, cC: 0.001 };
/** Stage 7: three prepared zinc–copper cells: [fixture, card, name, zinc concentration, copper concentration]. */
const S7_CELLS = [['fa', 'ta', 'Cell A', 1, 1], ['fb', 'tb', 'Cell B', 1, 0.01], ['fc', 'tc', 'Cell C', 0.01, 1]];
const S7_V = c => readAt('cu', 'zn', c[3], c[4]);
const S7_WANT = [...S7_CELLS].sort((p, q) => S7_V(p) - S7_V(q));
/** Stage 5: the concentration cell. */
const S5 = { metal: 'cu', cLeft: 1, cRight: 0.01 };
const TOL_V = 0.012 + 1e-9;

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const run = fixture => ({ run: fixture });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const times = (n, f) => Array.from({ length: n }, f);
const PRESSES = LOAD.maxTick / LOAD.perPress;

const readsOf = t => readRead({ fixtures: t.fixtures }, 'rig');

/* ---------------------------------------------------------------- stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Run Until It Stops',
    // A PREDICT STAGE: no cell is on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'When a tin and lead cell has driven a small load until its voltmeter reads zero, what does each beaker hold?',
    widget,
    table: cellTable({
      pieces: [
        tag('st1', 'Tin and lead cell, 1.0 M ions in each beaker', { x: 76, y: 9 }),
        note('tin', GUESS.tin, { x: 36, y: 30 }),
        note('lead', GUESS.lead, { x: 100, y: 30 }),
        note('empty', GUESS.empty, { x: 36, y: 52 }),
        note('both', GUESS.both, { x: 100, y: 52 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 156, y: 41 }, size: { w: 36, h: 14 } }] }
    }, { w: 176, h: 66 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture the cell running until the voltmeter reads zero, and what is left in each beaker.',
      'Ask whether a cell that has stopped must have run out of something.'
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
      body: 'Next, the tin and lead cell is run and its two beakers are watched.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-run',
    title: 'The Cell Runs Down',
    get prompt() { return guessLine('Which ions are still present when the cell\'s voltage reaches zero?', recall(QUEST_KEY)); },
    widget,
    table: cellTable({
      fixtures: [
        loadFixture('load', { x: 84, y: 40 }, { ...TL })
      ]
    }, { w: 176, h: 76 }),
    hints: [
      'Press "Run" until the voltmeter stops falling, then tap each kind of ion that is still in its beaker.',
      'Compare the two windows at the start and after each run, and the voltage on the plot.',
      'Check whether either window has emptied by the time the voltmeter reads zero.'
    ],
    check(state) {
      const d = state.table.fixtures.scene.dials;
      const tin = Math.round(d.t0.value) === 1; const lead = Math.round(d.t1.value) === 1;
      if (!tin && !lead) return { ok: false, notYet: true, msg: 'Tap each kind of ion that is still there.' };
      if (tin && lead) return { ok: true };
      const r = loadRead({ fixtures: state.table.fixtures }, 'load');
      if (!r.ran) return { ok: false, msg: `The cell has not been run yet; the windows hold ${r.now.nAnode} tin and ${r.now.nCathode} lead ions.` };
      return { ok: false, msg: `At tick ${r.tick} the voltmeter read ${milliText(r.now.E)} V, the tin window held ${r.now.nAnode} ions and the lead window ${r.now.nCathode}.` };
    },
    get reward() {
      const e = END();
      const g = recall(QUEST_KEY);
      const said = g === 'both' ? 'As you predicted, both kinds of ion were still there. ' : g ? 'Not what you predicted. ' : '';
      return {
        log: 'The voltage fell to zero with both ions still in the beakers.',
        title: 'A Dead Cell Is Not Empty',
        body: `${said}The voltage fell from ${milliText(loadAt(TL.cathode, TL.anode, START, 0).E)} V to ${milliText(e.E)} V, leaving ${e.nAnode} tin and ${e.nCathode} lead ions: the cell stopped without being used up.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-zinc',
    title: 'More Zinc Ions',
    prompt: 'What happens to the cell\'s voltage when the zinc ion concentration is raised from 0.010 M to 1.0 M?',
    widget,
    table: cellTable({
      fixtures: [
        readFixture('rig', { x: 40, y: 40 }, { left: 'zn', right: 'cu', aC: 0.01, cC: 1, aDial: true, aLabel: 'Zn²⁺' }),
        selectorFixture('pick', 'The voltage', { x: 112, y: 40 }, { options: ['rises', 'falls', 'stays the same', ' '], start: 4, w: 56, list: true })
      ]
    }, { w: 150, h: 84 }),
    hints: [
      'Press "Run" at one zinc concentration, turn the dial to the other, press "Run" again, then use the answer dial.',
      'Compare the two lines kept on the cell: the zinc concentration and the voltage beside it.',
      'See which way the voltage moved when the zinc concentration went up.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const r = readsOf(state.table);
      if (r.rows.length < 2) return { ok: false, msg: `The cell has been read at ${r.rows.length ? 'one' : 'no'} zinc concentration${r.rows.length ? '' : 's'}; two lines let you compare.` };
      const [lo, hi] = r.rows;
      return { ok: false, msg: `The cell read ${voltText(lo.V)} V with ${concLabel(lo.aC)} zinc ions and ${voltText(hi.V)} V with ${concLabel(hi.aC)}.` };
    },
    get reward() {
      const lo = readAt('cu', 'zn', CONC_STEPS[0], 1); const hi = readAt('cu', 'zn', CONC_STEPS[1], 1);
      return {
        log: 'More zinc ions gave a lower voltage.',
        title: 'More Product, Lower Voltage',
        body: `With ${concLabel(CONC_STEPS[0])} zinc ions the cell read ${voltText(lo)} V and with ${concLabel(CONC_STEPS[1])} it read ${voltText(hi)} V. Zinc ions are made as the cell runs, and the more of them the beaker holds, the lower the voltage.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-balance',
    title: 'The Balance Point',
    briefing: { speaker: SPEAKER, body: 'The ratio of product ions to reactant ions at any moment is the reaction quotient, Q.' },
    prompt: 'Why does the cell\'s voltage reach zero?',
    widget,
    table: cellTable({
      fixtures: [
        loadFixture('load', { x: 77, y: 38 }, { ...TL, counts: true, tick: LOAD.maxTick }),
        plaqueFixture('plate', 'At equilibrium', { x: 176, y: 18 }, [`K = ${fmt(balanceOf(TL.cathode, TL.anode, START).K, 1)}`], { w: 42 })
      ],
      pieces: [
        note('out', 'The reactant ions ran out', { x: 34, y: 86 }),
        note('equal', 'The two kinds of ion became equal', { x: 99, y: 86 }),
        note('eq', 'The ratio of ions, Q, reached K', { x: 164, y: 86 })
      ],
      zones: { slots: [{ id: 'reason', label: 'Why it stopped', at: { x: 176, y: 49 }, size: { w: 42, h: 14 } }] }
    }, { w: 198, h: 95 }),
    hints: [
      'Compare the tin and lead ion counts under the windows with the K value on the plate.',
      'Compare the ratio of tin ions to lead ions under the windows with the K value on the plate.',
      'Ask what happens to the cell\'s voltage when Q reaches K.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'reason');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (card.id === 'eq') return { ok: true };
      const e = END();
      if (card.id === 'out') return { ok: false, msg: `Both windows still hold ions: ${e.nAnode} tin and ${e.nCathode} lead.` };
      return { ok: false, msg: `The two windows are not equal: ${e.nAnode} tin and ${e.nCathode} lead.` };
    },
    get reward() {
      const e = END(); const b = balanceOf(TL.cathode, TL.anode, START);
      return {
        log: 'The ratio of ions matched K when the cell reached zero.',
        title: 'Reaction Quotient',
        body: `${e.nAnode} ÷ ${e.nCathode} = ${fmt(e.nAnode / e.nCathode, 1)}, close to K = ${fmt(b.K, 1)}. A cell is at equilibrium, and reads 0 V, when Q reaches K.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-copper',
    title: 'Two Copper Beakers',
    prompt: 'In a copper cell with a 1.0 M beaker and a 0.010 M beaker, which electrode do the electrons leave?',
    widget,
    table: cellTable({
      fixtures: [
        ccFixture('cc', { x: 50, y: 34 }, { ...S5, names: ['Left', 'Right'] }),
        hideDials(selectorFixture('pick', 'Electrons leave', { x: 128, y: 34 }, { options: ['the electrode in the 1.0 M beaker', 'the electrode in the 0.010 M beaker', ' '], start: 3, w: 68, list: true }))
      ]
    }, { w: 176, h: 72 }),
    hints: [
      'Press "Run", read the ammeter, then tap the electrode you choose.',
      'Compare the side the ammeter pointer swings toward with the concentration printed under each beaker.',
      'Find the electrode the electrons move away from and read the concentration of its beaker.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Tap an electrode.' };
      if (v === 2) return { ok: true };
      const r = ccRead({ fixtures: state.table.fixtures }, 'cc');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet; the ammeter needle is at rest.' };
      return { ok: false, msg: `The voltmeter read ${fmt(r.V, 3)} V, right electrode against left, and the needle swung toward the ${r.needle > 0 ? 'right' : 'left'} electrode.` };
    },
    get reward() {
      const c = concCellRead(S5.metal, S5.cLeft, S5.cRight);
      return {
        log: 'The electrons left the electrode in the dilute beaker.',
        title: 'Concentration Cell',
        body: `The same metal at 1.0 M and 0.010 M read ${fmt(c.E, 3)} V: a concentration cell, which runs until the two concentrations match.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-nernst',
    title: 'A Cell Nobody Wired',
    briefing: {
      speaker: SPEAKER,
      body: 'The Nernst equation corrects E° for concentration: E = E° − (0.0592 ÷ n) × log Q.',
      worked: ['0.010 M Zn²⁺, 1.0 M Cu²⁺ (E° = 1.10 V, n = 2):', 'Q = 0.010 ÷ 1.0 = 0.010, log Q = −2', '(0.0592 ÷ 2) × (−2) = −0.059', 'E = 1.10 + 0.059 = 1.16 V']
    },
    prompt: 'What is the voltage, in volts, of the zinc and copper cell with 1.0 M zinc ions and 0.0010 M copper ions?',
    widget,
    entry: { id: 'v', label: 'Cell voltage', unit: 'V' },
    table: cellTable({
      fixtures: [
        readFixture('rig', { x: 40, y: 32 }, { left: 'zn', right: 'cu', aC: S6.aC, cC: S6.cC, wired: false }),
        plaqueFixture('plate', 'For reference', { x: 116, y: 32 }, ['E° of this cell: 1.10 V', 'E = E° − (0.0592 ÷ n) log Q', 'Q = products ÷ reactants, ions only'], { w: 66 })
      ]
    }, { w: 156, h: 66 }),
    hints: [
      'Read the concentrations under the beakers and type the voltage in the field.',
      'Compare the charges on the two ions and the two concentrations with the equation on the plate.',
      'Follow the worked case in the briefing using this cell\'s concentrations and n = 2.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'v');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const E0 = cellE0('cu', 'zn');
      const want = readAt('cu', 'zn', S6.aC, S6.cC);
      if (Math.abs(v - want) <= TOL_V) return { ok: true };
      const near = x => Math.abs(v - x) <= 0.015;
      const Q = S6.aC / S6.cC;
      const inverted = nernst(E0, 2, 1 / Q);
      const noN = nernst(E0, 1, Q);
      const lnForm = E0 - (0.0592 / 2) * Math.log(Q);
      if (near(inverted)) return { ok: false, msg: `${fmt(v, 2)} V is above the 1.10 V on the plate, and this cell holds ${concLabel(S6.aC)} zinc ions against ${concLabel(S6.cC)} copper ions.` };
      if (near(noN)) return { ok: false, msg: `The ions under the beakers are Zn²⁺ and Cu²⁺; ${fmt(v, 2)} V counts one electron.` };
      if (near(lnForm)) return { ok: false, msg: 'The 0.0592 on the plate goes with the base-ten log of Q, not the natural log.' };
      if (near(E0)) return { ok: false, msg: `1.10 V is the plate's figure for equal concentrations; this cell holds ${concLabel(S6.aC)} zinc ions and ${concLabel(S6.cC)} copper ions.` };
      if (Math.abs(v - E0) > 0.5) return { ok: false, msg: `The plate gives 1.10 V, and the readings at stage 3 moved by hundredths of a volt; ${fmt(v, 2)} V is far from it.` };
      return { ok: false, msg: `The plate gives 1.10 V for this cell with equal concentrations; ${fmt(v, 2)} V does not follow from ${concLabel(S6.aC)} zinc ions and ${concLabel(S6.cC)} copper ions.` };
    },
    get reward() {
      const E0 = cellE0('cu', 'zn'); const Q = S6.aC / S6.cC;
      return {
        log: 'The voltage followed E° and the log of Q.',
        title: 'The Nernst Equation',
        body: `E = E° − (0.0592 ÷ 2) log Q = ${fmt(nernst(E0, 2, Q), 2)} V, the Nernst equation: the voltage is above E° when Q is below 1 and below E° when Q is above 1.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-rank',
    title: 'Three Prepared Cells',
    prompt: 'Order these three cells from lowest voltage to highest voltage.',
    widget,
    table: (() => {
      const fixtures = S7_CELLS.map(([fid, , name, a, c], i) => readFixture(fid, { x: 32 + i * 56, y: 30 }, { left: 'zn', right: 'cu', aC: a, cC: c, w: 50, title: name }));
      for (const f of fixtures) { f.props.gate = { railFull: S7_CELLS.length }; f.props.gateMsg = 'Order all three cans on the rail first, then press "Run".'; }
      return cellTable({
        fixtures,
        pieces: S7_CELLS.map(([, cid, name], i) => canPiece(cid, name, { x: 32 + i * 28, y: 70 })),
        zones: { rail: { at: { x: 88, y: 92 }, size: { w: 150, h: 12 }, first: 'Lowest voltage', last: 'Highest voltage', items: [], start: [] } }
      }, { w: 176, h: 106 });
    })(),
    hints: [
      'Drag the three cans onto the rail first, then press "Run" on each cell.',
      'Compare the voltages the three voltmeters read, and the concentrations printed under the beakers.',
      'Compare product ions with reactant ions in each cell before you run it.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < S7_CELLS.length) return { ok: false, notYet: true, msg: `Put all ${S7_CELLS.length} cards on the rail.` };
      const want = S7_WANT.map(c => c[1]);
      if (order.join() === want.join()) return { ok: true };
      const byCard = id => S7_CELLS.find(c => c[1] === id);
      const k = order.findIndex((id, i) => i > 0 && S7_V(byCard(id)) < S7_V(byCard(order[i - 1])));
      const a = byCard(order[k - 1]); const b = byCard(order[k]);
      const ra = readRead({ fixtures: t.fixtures }, a[0]).now; const rb = readRead({ fixtures: t.fixtures }, b[0]).now;
      if (!ra || !rb) return { ok: false, msg: `${a[2]} sits left of ${b[2]}, and ${!ra ? a[2] : b[2]} has not been read yet.` };
      return { ok: false, msg: `${a[2]} sits left of ${b[2]}, but ${a[2]} read ${voltText(ra.V)} V and ${b[2]} read ${voltText(rb.V)} V.` };
    },
    get reward() {
      const rows = S7_WANT.map(c => `${c[2]} ${voltText(S7_V(c))} V`);
      return {
        log: 'The cell farthest from balance read the highest.',
        title: 'Distance from Balance',
        body: `${rows.join(', ')}. A cell with more reactant than product ions reads above E°, and one with more product ions reads below.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, {
  own: {
    1: { sitesKey: 'ionsLeft', dials: { t0: { min: 0, max: 1, step: 1, value: 0, label: 'Tin ions' }, t1: { min: 0, max: 1, step: 1, value: 0, label: 'Lead ions' } } },
    4: { sitesKey: 'sides', extra: { pickMap: [1, 2] } }
  }, compact: [6], demos: { 0: 'running' } });

export const DEBRIEF = {
  title: 'Under Load',
  body: 'A cell does not run out; it runs down toward a balance. The voltage falls to zero where Q reaches K, with both ions still there, and it is higher the farther Q is from K.'
};

export const SOLUTIONS = [
  [put('both', 'slot:guess')],
  [...times(PRESSES, () => run('load')), dial('scene', 't0', 1), dial('scene', 't1', 1)],
  [run('rig'), dial('rig', 'a', 2), run('rig'), dial('pick', 'value', 2)],
  [put('eq', 'slot:reason')],
  [run('cc'), dial('pick', 'value', 2)],
  [typed('v', fmt(readAt('cu', 'zn', S6.aC, S6.cC), 2))],
  [...S7_WANT.map((c, i) => put(c[1], `rail:${i}`)), ...S7_CELLS.map(c => run(c[0]))]
];

export const MISSES = [
  [],
  [run('load'), run('load'), dial('scene', 't0', 1)],
  [run('rig'), dial('rig', 'a', 2), run('rig'), dial('pick', 'value', 1)],
  [put('equal', 'slot:reason')],
  [run('cc'), dial('pick', 'value', 1)],
  [typed('v', '1.19')],
  [...['fa', 'fb', 'fc'].map((f, i) => put(`t${f[1]}`, `rail:${i}`)), ...S7_CELLS.map(c => run(c[0]))]
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

export const CHECKS = { TL, START, S5, S6, S7_CELLS, S7_WANT, TOL_V, GUESS };
