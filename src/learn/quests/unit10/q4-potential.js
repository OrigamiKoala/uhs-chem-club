/**
 * Unit 10 · Bench 4 — Cell Potential (q4-potential)
 *
 * Brinewire's voltage bench, on the cell kit (`table/kits/cell.js`: the potential board and its electrodes in `cell-board.js`, the
 * ready-built cell in `cell-rig.js`). The board reads one metal against a hydrogen reference; the cell reads two metals against each other.
 * Eight stages and ONE click: the belief that writing a reaction twice over doubles the volts.
 *
 *   1  rank four metals by their voltage against the reference                                -> standard reduction potential
 *   2  typed: the voltage of a cell nobody has wired (readings on the board's strip)          -> E°cell
 *   3  wire four cells and sort them by the lamp                                              -> a positive voltage runs
 *   4  PREDICT: the cell is written twice over; what does the voltmeter read?
 *   5  TEST: write the equation once and twice over and compare the voltage and the energy
 *   6  typed: the energy released per mole of magnesium reacting with copper(II)              -> ΔG° = −nFE°
 *   7  typed: log K of zinc with silver ions                                                   -> K from E°
 *   8  typed: the voltage of a cell made from two sealed metals
 *
 * THE WRONG MODEL IS ON THE TABLE. The same cell run once and twice over reads 1.10 V both times while the energy counter goes from 212
 * kJ to 424 kJ: a number that doubles with the amount of reaction cannot be a voltage that does not.
 *
 * Every figure is `engine/celldata.js`: the reading of each electrode, the cell, the energy. The board prints readings, never a rank or a
 * difference, and the cell is unwired on every typed stage. This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  cellTable, selectorFixture, plaqueFixture, note, tag, pieceIn, dialValue, boardFixture, electrodePiece, rigFixture, rigRead, voltText
} from '../../table/kits/cell.js';
import { METALS, cellE0, electronsMoved, deltaG0, logK, activityOrder, fmt, sci } from '../../engine/celldata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bstandard reduction potential\b/i, introducedAt: 1 },
  { term: /\bE°cell\b/, introducedAt: 2 },
  { term: /ΔG°/, introducedAt: 6 },
  { term: /\bFaraday constant\b/i, introducedAt: 6 }
];

/** Built quests whose words this bench uses (more are added as the world's benches are built). */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit10/q4-potential';
const GUESS = {
  same: '1.10 V, the same',
  double: '2.20 V, twice as much',
  half: '0.55 V, half as much',
  zero: '0 V'
};

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every figure shown is the planner's) */

const SEAT = 'slot:board.seat';
const BOARD_AT = { x: 48, y: 31 };
const E = id => METALS[id].E0;
const S1_METALS = ['mg', 'zn', 'cu', 'ag'];
const S1_WANT = activityOrder(S1_METALS);
/** Stage 3's four cells: [id, left metal, right metal]. */
const S3_CELLS = [['ra', 'zn', 'cu', 'Cell A'], ['rb', 'ag', 'cu', 'Cell B'], ['rc', 'cu', 'ag', 'Cell C'], ['rd', 'ag', 'zn', 'Cell D']];
const S6 = { cathode: 'cu', anode: 'mg' };
const S7 = { cathode: 'ag', anode: 'zn' };
const S8 = { a: 'fe', b: 'au' };
const TOL_V = 0.02 + 1e-9;
const FARADAY_ROUND = 96485;

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const run = fixture => ({ run: fixture });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

function boardTable(electrodes, { w = 176, h = 64, extras = [], fixtures = [], pieces = [], zones = {} } = {}) {
  const b = boardFixture('board', BOARD_AT);
  return cellTable({
    pieces: [...electrodes, ...pieces],
    fixtures: [b.fixture, ...fixtures],
    zones: { slots: [b.slot], ...zones }
  }, { w, h });
}

/** The readings the board has taken so far, by the name on each electrode. */
const strip = t => t.fixtures.board.props.noted || [];
const readOf = (t, name) => strip(t).find(n => n.name === name)?.E;

/* ---------------------------------------------------------------- stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-reference',
    title: 'Against a Reference',
    prompt: 'Rank the four metals by the voltage each one reads against the hydrogen reference.',
    widget,
    table: boardTable(
      S1_METALS.map((m, i) => electrodePiece(`e-${m}`, m, { x: 112 + (i % 2) * 34, y: 10 + Math.floor(i / 2) * 20 })),
      {
        w: 176, h: 108,
        pieces: S1_METALS.map((m, i) => tag(`r-${m}`, METALS[m].symbol, { x: 30 + i * 36, y: 72 })),
        zones: { rail: { at: { x: 88, y: 98 }, size: { w: 150, h: 12 }, first: 'Lowest reading', last: 'Highest reading', items: [], start: [] } }
      }
    ),
    hints: [
      'Drag an electrode into the seat to read it, lift it out, and drag the four name cards onto the rail.',
      'Compare the signed readings on the strip, each taken against the same reference.',
      'Line the cards up from the lowest reading to the highest, negative readings first.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < S1_METALS.length) return { ok: false, notYet: true, msg: `Put all ${S1_METALS.length} cards on the rail.` };
      const want = S1_WANT.map(m => `r-${m}`);
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => i > 0 && E(id.slice(2)) < E(order[i - 1].slice(2)));
      const a = t.pieces[order[k - 1]]; const b = t.pieces[order[k]];
      const ra = readOf(t, METALS[a.id.slice(2)].symbol); const rb = readOf(t, METALS[b.id.slice(2)].symbol);
      if (ra == null || rb == null) return { ok: false, msg: `${a.label} sits left of ${b.label}, and the strip has no reading for ${ra == null ? a.label : b.label} yet.` };
      return { ok: false, msg: `${a.label} sits left of ${b.label}, but the strip reads ${voltText(ra)} V for ${a.label} and ${voltText(rb)} V for ${b.label}.` };
    },
    get reward() {
      const r = S1_WANT.map(m => `${METALS[m].name} ${fmt(E(m), 2)} V`);
      return {
        log: 'Each metal read its own voltage against the hydrogen reference.',
        title: 'Standard Reduction Potential',
        body: `Against the same reference the metals read ${r.join(', ')}. A metal's reading in a 1.00 M solution of its ions at 25 °C is its standard reduction potential, E°.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-cell',
    title: 'A Cell Nobody Wired',
    prompt: 'Find the voltage, in volts, of a cell made from magnesium and silver.',
    widget,
    entry: { id: 'e', label: 'Cell voltage', unit: 'V' },
    table: boardTable([electrodePiece('e-mg', 'mg', { x: 118, y: 12 }), electrodePiece('e-ag', 'ag', { x: 118, y: 32 })], { w: 150, h: 64 }),
    hints: [
      'Read both electrodes on the board, then type the voltage of the cell in the field.',
      'Compare the two readings: the cell takes its voltage from how far apart they are.',
      'Take the lower reading away from the higher one.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'e');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = cellE0('ag', 'mg');
      if (Math.abs(v - want) <= TOL_V) return { ok: true };
      const lo = E('mg'); const hi = E('ag');
      const near = x => Math.abs(v - x) <= 0.03;
      if (near(hi + lo)) return { ok: false, msg: `${fmt(hi + lo, 2)} is the two readings added together, ${voltText(lo)} and ${voltText(hi)}.` };
      if (near(-want)) return { ok: false, msg: 'That is the difference taken the other way round.' };
      if (near(hi) || near(lo) || near(-lo)) return { ok: false, msg: 'That is one electrode\'s reading by itself; the cell uses both.' };
      if (near(2 * want)) return { ok: false, msg: 'That is twice the gap between the two readings.' };
      return { ok: false, msg: `The board read ${voltText(lo)} V for magnesium and ${voltText(hi)} V for silver; that does not make ${fmt(v, 2)} V.` };
    },
    get reward() {
      const want = cellE0('ag', 'mg');
      return {
        log: 'The cell voltage came from the gap between two readings.',
        title: 'Cell Voltage',
        body: `The cell's standard voltage, E°cell, is the higher reading minus the lower one: ${fmt(E('ag'), 2)} − (${fmt(E('mg'), 2)}) = ${fmt(want, 2)} V. The metal with the higher reading takes the electrons and is the cathode; the lower one gives them and is the anode.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-lamp',
    title: 'Which Cells Run',
    prompt: 'Run the four cells and sort them by whether the lamp lights.',
    widget,
    table: (() => {
      const rigs = S3_CELLS.map(([id, l, r, name], i) => rigFixture(id, { x: 26 + (i % 2) * 52, y: 26 + Math.floor(i / 2) * 50 }, { left: l, right: r, title: name }));
      return cellTable({
        pieces: S3_CELLS.map(([id,,, name], i) => tag(`c${id.slice(1)}`, name, { x: 22 + i * 36, y: 108 })),
        fixtures: rigs,
        zones: {
          trays: [
            { id: 'lit', label: 'Lamp lit', at: { x: 134, y: 24 }, size: { w: 52, h: 36 }, cell: 25, cellH: 12 },
            { id: 'dark', label: 'Lamp dark', at: { x: 134, y: 70 }, size: { w: 52, h: 36 }, cell: 25, cellH: 12 }
          ]
        }
      }, { w: 176, h: 120 });
    })(),
    hints: [
      'Press "Run" on each cell, then drag the four cards into the two trays.',
      'Compare each cell\'s voltmeter reading with its lamp, and look at which metal stands on which side.',
      'Look at the sign of each reading: the lamp follows it.'
    ],
    check(state) {
      const t = state.table;
      const where = Object.fromEntries(S3_CELLS.map(([id]) => [id, t.pieces[`c${id.slice(1)}`].zone]));
      if (Object.values(where).some(z => !z || !z.startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Drag every card into a tray.' };
      for (const [id, l, r, name] of S3_CELLS) {
        const lit = cellE0(r, l) > 1e-9;
        if (where[id] === (lit ? 'tray:lit' : 'tray:dark')) continue;
        const read = rigRead({ fixtures: t.fixtures }, id);
        if (!read.now) return { ok: false, msg: `${name} has not been run yet.` };
        return { ok: false, msg: `${name} read ${voltText(read.now.V)} V and its lamp ${read.now.lit ? 'lit' : 'stayed dark'}.` };
      }
      return { ok: true };
    },
    get reward() {
      const rows = S3_CELLS.map(([, l, r, name]) => `${name} ${cellE0(r, l) > 0 ? '+' : ''}${voltText(cellE0(r, l))} V`);
      return {
        log: 'The cells that lit the lamp read above zero.',
        title: 'A Positive Voltage',
        body: `${rows.join(', ')}. A cell whose standard voltage is positive runs by itself; the same pair the other way round reads the same size with the opposite sign and does not.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Twice Over',
    // A PREDICT STAGE: no cell is on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'What does a zinc–copper cell that reads 1.10 V read when its equation is written twice over?',
    widget,
    table: cellTable({
      pieces: [
        tag('st1', 'Zn + Cu²⁺ → Zn²⁺ + Cu reads 1.10 V', { x: 40, y: 9 }),
        tag('st2', '2 Zn + 2 Cu²⁺ → 2 Zn²⁺ + 2 Cu reads ?', { x: 112, y: 9 }),
        note('same', GUESS.same, { x: 30, y: 30 }),
        note('double', GUESS.double, { x: 80, y: 30 }),
        note('half', GUESS.half, { x: 30, y: 50 }),
        note('zero', GUESS.zero, { x: 80, y: 50 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 128, y: 40 }, size: { w: 36, h: 14 } }] }
    }, { w: 150, h: 62 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture what each voltage counts, and what changes when twice as much reacts.',
      'Ask whether the push on each electron depends on how many electrons there are.'
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
      body: 'Next, the zinc–copper cell is run with its equation written once and twice over.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-scale',
    title: 'Writing It Twice',
    get prompt() { return guessLine('Run the zinc–copper cell with its equation written once and then twice over, and say what changes.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const r = rigFixture('rig', { x: 40, y: 49 }, { left: 'zn', right: 'cu', energy: true, equation: true, scalable: true, w: 76 });
      return cellTable({
        fixtures: [
          r,
          selectorFixture('pick', 'What changes', { x: 122, y: 49 }, {
            options: ['Voltage the same, energy doubles', 'Voltage and energy both double', 'Voltage doubles, energy the same', 'Neither changes', ' '], start: 5, w: 64, list: true
          })
        ]
      }, { w: 164, h: 98 });
    })(),
    hints: [
      'Press "Run" with the equation dial on "once", turn it to "twice over", press "Run" again, and use the answer dial.',
      'Compare the two lines kept on the cell: the voltage and the energy released for each setting.',
      'See which of the two numbers is the same in both lines and which one follows the number of electrons moved.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const r = rigRead({ fixtures: state.table.fixtures }, 'rig');
      if (r.rows.length < 2) return { ok: false, msg: `The cell has been run at ${r.rows.length ? 'one' : 'no'} setting${r.rows.length ? '' : 's'}; the two lines let you compare.` };
      const [a, b] = r.rows;
      return { ok: false, msg: `The cell read ${voltText(a.V)} V and released ${fmt(a.kJ, 0)} kJ written once, and read ${voltText(b.V)} V and released ${fmt(b.kJ, 0)} kJ written twice over.` };
    },
    get reward() {
      const a = rigAtZnCu(1); const b = rigAtZnCu(2);
      const g = recall(QUEST_KEY);
      const verdict = g === 'same' ? `The voltage did stay at ${voltText(a.V)} V, as you predicted. ` : g ? `The voltage stayed at ${voltText(a.V)} V, not what you predicted. ` : '';
      return {
        log: 'The voltage stayed put while the energy doubled.',
        title: 'Volts Are Per Electron',
        body: `${verdict}Written twice over, the cell still read ${voltText(b.V)} V, but it released ${fmt(b.kJ, 0)} kJ instead of ${fmt(a.kJ, 0)} kJ. A voltage is the energy for each electron pushed through, so it does not change with the amount of reaction; the energy does.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-energy',
    title: 'The Energy Released',
    prompt: 'Find the energy, in kJ, released when one mole of magnesium reacts with copper(II) ions.',
    widget,
    entry: { id: 'kj', label: 'Energy released', unit: 'kJ' },
    table: cellTable({
      fixtures: [
        rigFixture('rig', { x: 48, y: 42 }, { left: S6.anode, right: S6.cathode, equation: true, w: 70, title: 'Magnesium with copper' }),
        plaqueFixture('plate', 'For reference', { x: 126, y: 42 }, ['1 mol of electrons carries 96,485 C', '1 V pushes 1 J for each C'], { w: 52 })
      ]
    }, { w: 164, h: 84 }),
    hints: [
      'Press "Run" on the cell and type the energy in kJ in the field.',
      'Compare the equation printed under the cell with the voltage on its meter.',
      'Multiply the moles of electrons by the charge on a mole and by the cell voltage, then change joules to kilojoules.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const E0 = cellE0(S6.cathode, S6.anode); const n = electronsMoved(S6.cathode, S6.anode);
      const want = -deltaG0(E0, n);
      if (Math.abs(v - want) <= 0.01 * want + 1e-9) return { ok: true };
      const near = x => Math.abs(v - x) <= 0.02 * Math.abs(x);
      if (near(want / n)) return { ok: false, msg: 'That is the energy for one mole of electrons; the board shows the electrons each magnesium atom gives.' };
      if (near(want * 1000)) return { ok: false, msg: 'That figure is in joules; the field is in kJ.' };
      if (near(-want)) return { ok: false, msg: 'The cell releases energy, so the figure is a size, not a negative number.' };
      const znCu = -deltaG0(cellE0('cu', 'zn'), 2);
      if (near(znCu)) return { ok: false, msg: 'That is the energy of the zinc–copper cell; this cell uses magnesium.' };
      return { ok: false, msg: `The cell reads ${voltText(cellE0(S6.cathode, S6.anode))} V and its equation moves ${electronsMoved(S6.cathode, S6.anode)} electrons; that does not give ${fmt(v, 0)} kJ.` };
    },
    get reward() {
      const E0 = cellE0(S6.cathode, S6.anode); const n = electronsMoved(S6.cathode, S6.anode);
      return {
        log: 'The energy released followed the electrons moved and the voltage.',
        title: 'Free Energy from a Voltage',
        body: `${n} × ${FARADAY_ROUND.toLocaleString('en-US')} C × ${fmt(E0, 2)} V = ${fmt(-deltaG0(E0, n), 0)} kJ released, so ΔG° = −nFE° = ${fmt(deltaG0(E0, n), 0)} kJ. Here n is the moles of electrons moved and F, 96,485 C/mol, is the Faraday constant.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-k',
    title: 'How Far It Goes',
    prompt: 'Find log K, to the nearest whole number, for zinc reacting with silver ions.',
    widget,
    entry: { id: 'logk', label: 'log K', unit: '' },
    table: cellTable({
      fixtures: [
        rigFixture('rig', { x: 48, y: 42 }, { left: S7.anode, right: S7.cathode, equation: true, w: 70, title: 'Zinc with silver' }),
        plaqueFixture('plate', 'For reference', { x: 126, y: 42 }, ['log K = n × E° ÷ 0.0592'], { w: 52 })
      ]
    }, { w: 164, h: 84 }),
    hints: [
      'Press "Run" on the cell and type log K in the field.',
      'Compare the charges on the ions in the printed equation to see how many electrons it moves.',
      'Take n as the electrons moved by the equation as printed, E° from the meter, and use the plate.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'logk');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const E0 = cellE0(S7.cathode, S7.anode); const n = electronsMoved(S7.cathode, S7.anode);
      const want = logK(E0, n);
      if (Math.abs(v - want) <= 0.8 + 1e-9) return { ok: true };
      const near = x => Math.abs(v - x) <= 0.03 * Math.abs(x);
      if (near(logK(E0, 1))) return { ok: false, msg: 'That counts one electron; the balanced equation has zinc giving two.' };
      if (near(lnKof(E0, n))) return { ok: false, msg: 'That is the natural log; the plate divides by 0.0592 to give the base-ten log.' };
      return { ok: false, msg: `The cell reads ${voltText(cellE0(S7.cathode, S7.anode))} V and its equation moves ${electronsMoved(S7.cathode, S7.anode)} electrons; that does not give a log K of ${fmt(v, 0)}.` };
    },
    get reward() {
      const E0 = cellE0(S7.cathode, S7.anode); const n = electronsMoved(S7.cathode, S7.anode);
      return {
        log: 'A large cell voltage means the reaction goes almost to completion.',
        title: 'Voltage and K',
        body: `For Zn + 2 Ag⁺ the cell gives n = ${n} electrons and E° = ${fmt(E0, 2)} V, so log K = nE° ÷ 0.0592 = ${fmt(logK(E0, n), 1)}, a K near 10^${fmt(logK(E0, n), 0)}. A large positive E° means a very large K.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Two Sealed Metals',
    prompt: 'Find the voltage, in volts, of a cell made from the two sealed metals.',
    widget,
    entry: { id: 'e', label: 'Cell voltage', unit: 'V' },
    table: boardTable(
      [electrodePiece('e-a', S8.a, { x: 118, y: 12 }, { label: 'Metal A', sealed: true }), electrodePiece('e-b', S8.b, { x: 118, y: 32 }, { label: 'Metal B', sealed: true })],
      { w: 150, h: 64 }
    ),
    hints: [
      'Read both sealed electrodes on the board and type the voltage in the field.',
      'Compare the two readings on the strip, one negative and one positive.',
      'Take the lower reading away from the higher one.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'e');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = cellE0(S8.b, S8.a);
      if (Math.abs(v - want) <= TOL_V) return { ok: true };
      const lo = E(S8.a); const hi = E(S8.b);
      const near = x => Math.abs(v - x) <= 0.03;
      if (near(hi + lo)) return { ok: false, msg: 'That is the two readings added together.' };
      if (near(-want)) return { ok: false, msg: 'That is the difference taken the other way round.' };
      return { ok: false, msg: `The strip reads ${voltText(lo)} V for Metal A and ${voltText(hi)} V for Metal B; that does not make ${fmt(v, 2)} V.` };
    },
    get reward() {
      const want = cellE0(S8.b, S8.a);
      return {
        log: 'The sealed metals gave a cell voltage from the same subtraction.',
        title: 'Sealed Cell',
        body: `Metal A read ${voltText(E(S8.a))} V and Metal B ${voltText(E(S8.b))} V, so the cell reads ${fmt(want, 2)} V. They were ${METALS[S8.a].name} and ${METALS[S8.b].name}.`
      };
    }
  }
];

/** The zinc–copper cell at a setting, from the rig's own planner (stage 5 reward). */
function rigAtZnCu(scale) {
  const V = cellE0('cu', 'zn'); const n = electronsMoved('zn', 'cu') * scale;
  return { V, kJ: -deltaG0(V, n) };
}
const lnKof = (E0, n) => logK(E0, n) * Math.LN10;

export const DEBRIEF = {
  title: 'Cell Potential',
  body: 'A voltage is energy for each electron, so it comes from the two metals and not from the amount that reacts. The cell\'s voltage fixes the energy released and how far the reaction goes.'
};

export const SOLUTIONS = [
  [...S1_METALS.map(m => put(`e-${m}`, SEAT)), ...S1_WANT.map((m, i) => put(`r-${m}`, `rail:${i}`))],
  [put('e-mg', SEAT), put('e-ag', SEAT), typed('e', fmt(cellE0('ag', 'mg'), 2))],
  [...S3_CELLS.map(([id]) => run(id)), ...S3_CELLS.map(([id, l, r]) => put(`c${id.slice(1)}`, cellE0(r, l) > 0 ? 'tray:lit' : 'tray:dark'))],
  [put('same', 'slot:guess')],
  [run('rig'), dial('rig', 'scale', 2), run('rig'), dial('pick', 'value', 1)],
  [run('rig'), typed('kj', fmt(-deltaG0(cellE0('cu', 'mg'), 2), 0))],
  [run('rig'), typed('logk', fmt(logK(cellE0('ag', 'zn'), 2), 0))],
  [put('e-a', SEAT), put('e-b', SEAT), typed('e', fmt(cellE0(S8.b, S8.a), 2))]
];

export const MISSES = [
  [put('e-mg', SEAT), put('e-zn', SEAT), ...['mg', 'zn', 'ag', 'cu'].map((m, i) => put(`r-${m}`, `rail:${i}`))],
  [put('e-mg', SEAT), put('e-ag', SEAT), typed('e', '-1.57')],
  [run('ra'), run('rb'), run('rc'), run('rd'), put('ca', 'tray:dark'), put('cb', 'tray:lit'), put('cc', 'tray:lit'), put('cd', 'tray:dark')],
  [],
  [run('rig'), dial('rig', 'scale', 2), run('rig'), dial('pick', 'value', 2)],
  [typed('kj', '261')],
  [typed('logk', '26')],
  [typed('e', '1.06')]
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

export const CHECKS = { S1_METALS, S1_WANT, S3_CELLS, S6, S7, S8, TOL_V, GUESS };
