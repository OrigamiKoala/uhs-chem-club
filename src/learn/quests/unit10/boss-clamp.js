/**
 * boss-clamp.js — Learn world 10 elite: THE CLAMP.
 *
 * The Fifth Guild's drain clamp on the pylons of Brinewire. It holds five cells, one for each sample of the fight, and it has been pulling
 * power out of the marsh cables without ever asking what the cells hold. Each of its five phases puts the TABLETOP of a bench the player
 * has worked back in front of them, on the cell kit (`table/kits/cell.js`), with a NEW case on the table and the Clamp standing in the
 * table's corner, watching it. Each phase is a different instrument and ONE decision:
 *
 *   1  the dip rack      rank iron, nickel, tin and silver from fresh dips                         (bench 2, which metal gives)
 *   2  the open cell     find the anode of a magnesium and silver cell from its ammeter             (bench 3, galvanic cells)
 *   3  the potential board  type the voltage of an iron and silver cell                            (bench 4, cell potential)
 *   4  the concentration cell  say which bar the electrons leave in a zinc cell                    (bench 5, under load)
 *   5  the supply bench  type the grams of zinc plated by 1.50 A in 20.0 minutes                   (bench 6, electrolysis)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence and
 * never the answer; rung 1 names the control. A refusal names a reading the table shows, never the rule. Nothing blocks a correct commit.
 * A miss costs one point of Integrity and three knock the table back, with every reading and hint still kept. The foe is the Clamp itself,
 * in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only observes, and a boss phase never declares a field stage or a
 * prediction.
 *
 * Every figure is `engine/celldata.js` (and the bench planners it feeds); the numbers a phase grades against are the planners', never typed
 * twice. Clearing the last phase files the Case File clue `clue_brinewire_clamp`. The boss pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { session } from '../../../session.js';
import {
  cellTable, selectorFixture, plaqueFixture, tag, pieceIn, dialValue, voltText, boardFixture, electrodePiece, hideDials
} from '../../table/kits/cell.js';
import { dipFixture, stripPiece, triedIn } from '../../table/kits/cell-dip.js';
import { galvFixture, galvRead } from '../../table/kits/cell-galv.js';
import { ccFixture, ccRead } from '../../table/kits/cell-load.js';
import { supplyFixture, supplyRead } from '../../table/kits/cell-supply.js';
import {
  METALS, FARADAY, cellE0, cellDirection, activityOrder, charge, molesElectrons, faradayMass, fmt
} from '../../engine/celldata.js';
import { dipResult, dipWords } from '../../engine/celldata-q2-activity.js';
import { electronsToward, loopCurrent } from '../../engine/celldata-galvanic.js';
import { concCellRead, concLabel } from '../../engine/celldata-q5.js';

import { attachScenes } from '../../table/kits/cell-attach.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit10/q2-activity', 'unit10/q3-galvanic', 'unit10/q4-potential', 'unit10/q5-load', 'unit10/q6-electrolysis'
];

export const CLUE_ID = 'clue_brinewire_clamp';
const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The Clamp, as every phase's foe: one body, watching the table. On a table it reads no probe, it only observes. */
const CLAMP_FOE = [{ id: 'clamp', label: 'The Clamp' }];

const widget = { type: 'table', label: 'The bench' };

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = fixture => ({ run: fixture });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

const nm = id => METALS[id].name;
const Nm = id => nm(id)[0].toUpperCase() + nm(id).slice(1);
const list = names => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/* ------------------------------------------------------------------
   THE FIGURES (inputs; every figure shown or graded is the planners')
   ------------------------------------------------------------------ */

// Phase 1: four metals the player has not ranked. The beakers, the strips and the name cards each stand in an order of their own.
// (Tin and lead are not paired: their potentials differ by 12 mV, so a dip would show a partial swap, not a clean coating.)
const P1_METALS = ['sn', 'fe', 'ag', 'ni'];
const P1_CARDS = ['ni', 'ag', 'fe', 'sn'];
const P1_WANT = activityOrder(P1_METALS);

// Phase 2: a new pair, silver on the left and magnesium on the right.
const P2 = { left: 'ag', right: 'mg' };
const P2_ANODE = cellDirection(P2.left, P2.right).anode;

// Phase 3: iron and silver.
const P3 = { a: 'fe', b: 'ag' };
const P3_WANT = cellE0(P3.b, P3.a);
const TOL_V = 0.02 + 1e-9;

// Phase 4: a zinc concentration cell, the dilute beaker on the left.
const P4 = { metal: 'zn', cLeft: 0.010, cRight: 1.0 };

// Phase 5: zinc plated by 1.50 A for 20.0 minutes.
const P5 = { metal: 'zn', I: 1.50, minutes: 20.0 };
const TOL_G = 0.012 + 1e-9;
const FARADAY_LINE = '1 mol of electrons carries 96,485 C';
const MOLAR_LINES = ['Molar masses in g/mol:', 'Ni 58.7 · Cu 63.5 · Zn 65.4 · Ag 107.9'];

/** The dips a strip has been given in a rack of `metals`: the dip rack's beaker id for a solution. */
const bid = (metals, id) => `b${metals.indexOf(id)}`;
const seat = (metals, id) => `slot:dip.${bid(metals, id)}`;

/** What a beaker showed for a strip, as a refusal's reading. */
function dipLine(t, metals, stripId, ionId) {
  const res = triedIn({ fixtures: t.fixtures, pieces: t.pieces }, 'dip', bid(metals, ionId), stripId);
  if (!res) return `The ${nm(stripId)} strip has not been dipped in the ${METALS[ionId].ion} solution yet.`;
  return res.coats.length ? `The ${nm(stripId)} strip took a ${dipWords(res)} coating in the ${METALS[ionId].ion} solution.` : `The ${nm(stripId)} strip stayed clean in the ${METALS[ionId].ion} solution.`;
}

/** A typed plating figure that is a known slip answers with a reading the table shows; otherwise null. */
function slipOf(v, cases, want) {
  const near = x => Math.abs(v - x) <= 0.02 * Math.abs(x) + 1e-9;
  for (const [x, msg] of cases) if (near(x)) return { ok: false, msg };
  if (near(want * 1000)) return { ok: false, msg: 'That figure is in milligrams; the field is in grams.' };
  return null;
}

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (the last 23.5 units of the table, down to y 23.5).
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-rank',
    title: 'Phase 1 · The Dip Rack',
    prompt: 'Rank iron, nickel, tin and silver from the metal that gives electrons most readily to the one that gives least.',
    widget,
    table: (() => {
      const d = dipFixture('dip', { x: 64, y: 33 }, { beakers: P1_METALS.map((ion, i) => ({ id: `b${i}`, ion })) });
      return cellTable({
        pieces: P1_METALS.map((m, i) => stripPiece(`s-${m}`, m, { x: 19 + i * 30, y: 71 }, i === 0 ? {} : { caption: null })),
        fixtures: [d.fixture],
        zones: {
          slots: d.slots,
          rail: { at: { x: 88, y: 108 }, size: { w: 150, h: 12 }, first: 'Gives most readily', last: 'Gives least readily', items: [], start: [] }
        }
      }, { w: 204, h: 122 });
    })(),
    foes: CLAMP_FOE,
    encounter: {
      species: 'the clamp',
      act: 'Commit Order',
      intent: 'The Clamp holds four strips of metal over four beakers and does not know which gives.'
    },
    hints: [
      'Dip the strips in the beakers, then drag the four strips onto the rail.',
      'Each beaker keeps a mark for every strip dipped in it; compare which strips were coated in which solutions.',
      'A strip that is coated has given electrons to the ions in the solution, so rank the metals by how many of the other solutions each one coated in.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < P1_METALS.length) return { ok: false, notYet: true, msg: `Put all ${P1_METALS.length} strips on the rail.` };
      if (order.join() === P1_WANT.map(m => `s-${m}`).join()) return { ok: true };
      const E = id => METALS[id.slice(2)].E0;
      const k = order.findIndex((id, i) => i > 0 && E(id) < E(order[i - 1]));
      const a = order[k - 1].slice(2); const b = order[k].slice(2);
      return { ok: false, msg: `${Nm(a)} sits left of ${nm(b)}. ${dipLine(t, P1_METALS, b, a)}` };
    },
    get reward() {
      const o = P1_WANT;
      const gave = m => o.slice(o.indexOf(m) + 1);
      const parts = o.slice(0, -1).map(m => `${nm(m)} coated in the ${list(gave(m).map(g => METALS[g].ion))} ${gave(m).length > 1 ? 'solutions' : 'solution'}`);
      return {
        log: 'The four strips fell into an order of their own.',
        title: 'A New Order',
        body: `${Nm(o[0])} ${parts[0].slice(nm(o[0]).length + 1)}, ${parts.slice(1).join(', ')}; ${nm(o[o.length - 1])} coated in none. The more solutions a metal coats in, the more readily it gives electrons.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-anode',
    title: 'Phase 2 · The Open Cell',
    prompt: 'Find the anode of the magnesium and silver cell.',
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 46 }, { left: P2.left, right: P2.right, link: 'fixed', ammeter: true });
      return cellTable({
        fixtures: [
          g.fixture,
          hideDials(selectorFixture('pick', 'The anode is', { x: 120, y: 52 }, { options: ['The left strip', 'The right strip', ' '], start: 3, w: 52, list: true }))
        ],
        zones: { slots: g.slots }
      }, { w: 184, h: 100 });
    })(),
    foes: CLAMP_FOE,
    encounter: {
      species: 'the clamp',
      act: 'Commit Anode',
      intent: 'The Clamp clips a magnesium strip and a silver strip into a pair of beakers.'
    },
    hints: [
      'Press "Run", read the ammeter, then tap the strip you choose.',
      'Look at which way the ammeter points, and what its label says that direction means.',
      'The ammeter tells which beaker the electrons move toward, so they left through the other strip.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Tap a strip.' };
      const want = P2_ANODE === P2.left ? 1 : 2;
      if (v === want) return { ok: true };
      const r = galvRead(state.table, 'rig');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet; the ammeter reads zero.' };
      return { ok: false, msg: `The ammeter pointed ${r.I > 0 ? 'right' : 'left'} and read ${fmt(Math.abs(r.I), 2)} A.` };
    },
    get reward() {
      const to = electronsToward(P2.left, P2.right);
      const toMetal = to === 'left' ? P2.left : P2.right;
      return {
        log: 'The electrons left through the magnesium.',
        title: 'Where Electrons Leave',
        body: `The electrons moved toward the ${nm(toMetal)} beaker, so they left through ${nm(P2_ANODE)}. The ${nm(P2_ANODE)} strip is the anode: its atoms give up electrons.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-volts',
    title: 'Phase 3 · The Potential Board',
    prompt: 'Find the voltage, in volts, of a cell made from iron and silver.',
    widget,
    entry: { id: 'e', label: 'Cell voltage', unit: 'V' },
    table: (() => {
      const b = boardFixture('board', { x: 48, y: 31 });
      return cellTable({
        pieces: [electrodePiece('e-ag', 'ag', { x: 120, y: 14 }), electrodePiece('e-fe', 'fe', { x: 120, y: 34 })],
        fixtures: [b.fixture],
        zones: { slots: [b.slot] }
      }, { w: 176, h: 64 });
    })(),
    foes: CLAMP_FOE,
    encounter: {
      species: 'the clamp',
      act: 'Commit Voltage',
      intent: 'The Clamp clamps an iron bar and a silver bar together and calls the pair a cell.'
    },
    hints: [
      'Read both electrodes on the board, then type the voltage of the cell in the field.',
      'Compare the two readings: the cell takes its voltage from how far apart they are.',
      'Take the lower reading away from the higher one.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'e');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (Math.abs(v - P3_WANT) <= TOL_V) return { ok: true };
      const lo = METALS[P3.a].E0; const hi = METALS[P3.b].E0;
      const near = x => Math.abs(v - x) <= 0.03;
      if (near(hi + lo)) return { ok: false, msg: `${fmt(hi + lo, 2)} is the two readings added together, ${voltText(lo)} and ${voltText(hi)}.` };
      if (near(-P3_WANT)) return { ok: false, msg: 'That is the difference taken the other way round.' };
      if (near(2 * hi - lo)) return { ok: false, msg: `The board read ${voltText(hi)} V for silver; that figure counts the silver reading twice.` };
      if (near(hi) || near(lo) || near(-lo)) return { ok: false, msg: 'That is one electrode\'s reading by itself; the cell uses both.' };
      if (near(2 * P3_WANT)) return { ok: false, msg: 'That is twice the gap between the two readings.' };
      return { ok: false, msg: `The board read ${voltText(lo)} V for iron and ${voltText(hi)} V for silver; that does not make ${fmt(v, 2)} V.` };
    },
    get reward() {
      return {
        log: 'The cell voltage came from the gap between two readings.',
        title: 'A Gap Again',
        body: `Silver read ${voltText(METALS.ag.E0)} V and iron ${voltText(METALS.fe.E0)} V, so E°cell is ${voltText(METALS.ag.E0)} − (${voltText(METALS.fe.E0)}) = ${fmt(P3_WANT, 2)} V. Silver took the electrons and iron gave them.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-bar',
    title: 'Phase 4 · The Zinc Beakers',
    prompt: 'Which electrode do the electrons leave in the zinc cell?',
    widget,
    table: cellTable({
      fixtures: [
        ccFixture('cc', { x: 50, y: 34 }, { ...P4, names: ['Left', 'Right'], title: 'Zinc cell' }),
        hideDials(selectorFixture('pick', 'Electrons leave', { x: 120, y: 56 }, { options: ['the left electrode', 'the right electrode', ' '], start: 3, w: 56, list: true }))
      ]
    }, { w: 176, h: 80 }),
    foes: CLAMP_FOE,
    encounter: {
      species: 'the clamp',
      act: 'Commit Electrode',
      intent: 'The Clamp stands two beakers of zinc salt at different concentrations and joins them with a wire.'
    },
    hints: [
      'Press "Run", read the ammeter, then tap the electrode you choose.',
      'Compare the side the ammeter pointer swings toward with the concentration printed under each beaker.',
      'Find the electrode the electrons move away from, and say whether it stands on the left or the right.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Tap an electrode.' };
      const want = concCellRead(P4.metal, P4.cLeft, P4.cRight).leaves === 'left' ? 1 : 2;
      if (v === want) return { ok: true };
      const r = ccRead({ fixtures: state.table.fixtures }, 'cc');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet; the ammeter needle is at rest.' };
      return { ok: false, msg: `The voltmeter read ${fmt(r.V, 3)} V, right electrode against left, and the needle swung toward the ${r.needle > 0 ? 'right' : 'left'} electrode.` };
    },
    get reward() {
      const c = concCellRead(P4.metal, P4.cLeft, P4.cRight);
      return {
        log: 'The electrons left the electrode in the dilute beaker.',
        title: 'The Dilute Side Loses',
        body: `The cell read ${fmt(c.E, 3)} V and the electrons left the ${c.leaves} electrode, which stood in the ${concLabel(Math.min(P4.cLeft, P4.cRight))} beaker. The dilute side is the anode, where zinc dissolves, and the cell runs until the two concentrations match.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-plate',
    title: 'Phase 5 · The Plating Run',
    prompt: 'What mass of zinc, in grams, is plated by 1.50 A running for 20.0 minutes?',
    widget,
    entry: { id: 'g', label: 'Zinc plated', unit: 'g' },
    table: (() => {
      const s = supplyFixture('sup', { x: 52, y: 36 }, 'plate', { metal: P5.metal, solution: 'Zinc sulfate solution', half: 'Zn²⁺ + 2 e⁻ → Zn', currents: [1, 2], times: [30, 60], counter: true });
      return cellTable({
        fixtures: [s.fixture, plaqueFixture('plate', 'For reference', { x: 140, y: 52 }, [FARADAY_LINE, ...MOLAR_LINES], { w: 58 })]
      }, { w: 172, h: 84 });
    })(),
    foes: CLAMP_FOE,
    encounter: {
      species: 'the clamp',
      act: 'Commit Mass',
      intent: 'The Clamp pushes a current through a zinc bath and wants to know what it has taken.'
    },
    hints: [
      'Choose a current and a time with the two dials, press "Run", and type the grams in the field.',
      'Compare how the plated mass changes with the current and with the time across the runs.',
      'Connect the charge passed in that time to moles of electrons and the half-reaction line on the bench.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'g');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const t = P5.minutes * 60;
      const want = faradayMass(P5.I, t, P5.metal);
      if (Math.abs(v - want) <= TOL_G) return { ok: true };
      const wrongM = id => want * METALS[id].M / METALS[P5.metal].M;
      const hit = slipOf(v, [
        [faradayMass(P5.I, P5.minutes, P5.metal), 'That treats 20.0 minutes as 20.0 s; the time in the question is in minutes.'],
        [want * 2, 'The cell\'s half-reaction line reads Zn²⁺ + 2 e⁻ → Zn; that figure counts one electron for each zinc atom.'],
        [wrongM('cu'), 'That uses 63.5 g/mol, the molar mass of copper; this bath holds zinc.'],
        [wrongM('ag'), 'That uses 107.9 g/mol, the molar mass of silver; this bath holds zinc.'],
        [wrongM('ni'), 'That uses 58.7 g/mol, the molar mass of nickel; this bath holds zinc.'],
        [charge(P5.I, t), 'That figure is a charge in coulombs; the field is in grams.']
      ], want);
      if (hit) return hit;
      if (v < 0) return { ok: false, msg: 'A mass plated is a size, not a negative number.' };
      const r = supplyRead(state.table, 'sup').rows.find(x => x.I === 2 && x.t === 60);
      return { ok: false, msg: r ? `The bench plated ${fmt(r.g * 1000, 1)} mg of zinc in a 60 s run at 2.00 A; that does not lead to ${fmt(v, 2)} g for 20.0 minutes.` : 'Run the bench at 2.00 A to see what a short run plates.' };
    },
    get reward() {
      const t = P5.minutes * 60; const q = charge(P5.I, t); const mol = molesElectrons(q);
      return {
        log: 'The plated mass followed the charge, the electrons per atom and the molar mass.',
        title: 'The Mass Follows the Charge',
        body: `${fmt(P5.I, 2)} A × ${t} s = ${fmt(q, 0)} C, which is ${fmt(mol, 4)} mol of electrons, and two electrons plate each zinc atom: ${fmt(mol / 2, 4)} mol × 65.4 g/mol = ${fmt(faradayMass(P5.I, t, 'zn'), 2)} g.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, { demos: {}, placement: 'below', inside: [0], foe: true, own: { 1: { sitesKey: 'sides', extra: { pickMap: [1, 2] } }, 3: { sitesKey: 'sides', extra: { pickMap: [1, 2] } } } });

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: CLUE_ID,
  sections: [
    {
      heading: 'What You Found',
      body: 'The Clamp lets go of its strips and stands still. In its last cell is an electrode of marsh copper, with a coating on it that nobody on the Fifth\'s crew had weighed.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase put a cell in front of you that the Clamp never read: which metal loses, where the electrons leave, what the voltage is, which side is dilute, how much plates. Each one has an answer that a meter or a balance can show.'
    },
    {
      heading: 'Next',
      body: 'The last cell goes into the Case File. Its power came from the marsh itself, and the cell reads the same as every cell on the road.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const dip = (strip, ion) => put(`s-${strip}`, seat(P1_METALS, ion));
const dipAll = P1_METALS.flatMap(ion => P1_METALS.filter(m => m !== ion).map(m => dip(m, ion)));

export const SOLUTIONS = [
  [...dipAll, ...P1_WANT.map((m, i) => put(`s-${m}`, `rail:${i}`))],
  [run('rig'), dial('pick', 'value', P2_ANODE === P2.left ? 1 : 2)],
  [put('e-ag', 'slot:board.seat'), put('e-fe', 'slot:board.seat'), typed('e', fmt(P3_WANT, 2))],
  [run('cc'), dial('pick', 'value', concCellRead(P4.metal, P4.cLeft, P4.cRight).leaves === 'left' ? 1 : 2)],
  [dial('sup', 'cur', 2), dial('sup', 'time', 2), run('sup'), typed('g', fmt(faradayMass(P5.I, P5.minutes * 60, P5.metal), 2))]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dip('fe', 'ni'), ...['ni', 'fe', 'sn', 'ag'].map((m, i) => put(`s-${m}`, `rail:${i}`))],
  [run('rig'), dial('pick', 'value', P2_ANODE === P2.left ? 2 : 1)],
  [typed('e', '-1.24')],
  [run('cc'), dial('pick', 'value', concCellRead(P4.metal, P4.cLeft, P4.cRight).leaves === 'left' ? 2 : 1)],
  [typed('g', '0.0102')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { P1_METALS, P1_CARDS, P1_WANT, P2, P2_ANODE, P3, P3_WANT, P4, P5, TOL_V, TOL_G, loopCurrent, FARADAY };
