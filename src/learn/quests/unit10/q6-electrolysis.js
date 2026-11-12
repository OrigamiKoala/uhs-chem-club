/**
 * Unit 10 · Bench 6 — Electrolysis (q6-electrolysis)
 *
 * Brinewire's last bench, on the cell kit (`table/kits/cell.js`, the supply bench in `cell-supply.js`). A supply is wired to a cell and the
 * cell is pushed the wrong way. Eight stages and ONE click: the belief that a pushed current only heats the water. It undoes the
 * reaction: zinc plates out of its solution, sodium comes out of the melt, and the mass plated follows the charge.
 *
 *   1  make zinc plate out of the zinc–copper cell's solution (a supply against the cell)    -> electrolytic cell, electrolysis
 *   2  which electrode of molten sodium chloride makes sodium                                -> cathode, anode, reduction, oxidation
 *   3  rank three silver-plating runs by the charge each passed                              -> coulomb (charge = current x time)
 *   4  typed: grams of copper plated by 2.00 A in 30.0 min (the bench ran 60 s)              -> Faraday's law
 *   5  typed: grams of silver plated by 3.00 A in 10.0 min                                   -> one electron per silver ion
 *   6  seat zinc–copper cells in a chain until the water cell gives off gas                  -> a favoured reaction drives an unfavoured one
 *   7  say what each gas tube of water and of brine collects                                 -> the product depends on what is easier to change
 *   8  typed: the current that plated the sealed plate                                       -> Faraday's law backwards
 *
 * Every figure is `engine/celldata.js` / `engine/celldata-electrolysis.js`. No stage prints a pole label: electrodes are named by where
 * electrons are pushed and by what forms. This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  cellTable, selectorFixture, plaqueFixture, tag, pieceIn, dialValue, voltText, hideDials
} from '../../table/kits/cell.js';
import { supplyFixture, supplyRead, packPiece, platePiece, weighGrams } from '../../table/kits/cell-supply.js';
import { METALS, FARADAY, WATER_BACK_VOLTAGE, cellE0, cellsToExceed, charge, molesElectrons, faradayMass, fmt } from '../../engine/celldata.js';
import { driveZnCu, platingRun, currentFor, waterRun, compareRun, RUN_SECONDS } from '../../engine/celldata-electrolysis.js';

import { gasPiece } from '../../table/kits/cell-dip.js';
import { attachScenes } from '../../table/kits/cell-attach.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\belectrolytic cells?\b/i, introducedAt: 1 },
  { term: /\belectrolysis\b/i, introducedAt: 1 },
  { term: /\bcoulombs?\b/i, introducedAt: 3 },
  { term: /\bFaraday's law\b/i, introducedAt: 4 },
  { term: /\boverpotential\b/i, introducedAt: 6 }
];

/** Built quests whose words this bench uses (oxidation/reduction, anode/cathode, cell voltage). */
export const BUILDS_ON = ['unit10/q1-halves', 'unit10/q3-galvanic', 'unit10/q4-potential'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every figure shown is the planner's) */

const S3_RUNS = [{ I: 1, t: 30 }, { I: 2, t: 10 }, { I: 0.5, t: 100 }];
const S3_WANT = [1, 0, 2].map(i => `r${i + 1}`);
const S4 = { metal: 'cu', I: 2.00, minutes: 30.0 };
const S8 = { metal: 'ni', I: 0.800, t: 1500 };
const S7 = { I: 0.5, t: 60 };
const TOL_G = 0.02 + 1e-9;
const TOL_A = 0.02 + 1e-9;
const PLATE_TIME = { plate: 'Plated for 25.0 min' };

const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const run = fixture => ({ run: fixture });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const name = id => METALS[id].name;

/** The table state's supply bench `sup`, read. */
const bench = t => supplyRead(t, 'sup');
const ref = lines => plaqueFixture('plate', 'For reference', { x: 140, y: 24 }, lines, { w: 58 });
const FARADAY_LINE = '1 mol of electrons carries 96,485 C';
const MOLAR_LINES = ['Molar masses in g/mol:', 'Ni 58.7 · Cu 63.5 · Zn 65.4 · Ag 107.9'];

/** A refusal for a typed plating figure that names a reading the table shows (the half-reaction line, a unit, the run's units), never the rule. */
function slipOf(v, { want, cases, unitNote }) {
  const near = x => Math.abs(v - x) <= 0.02 * Math.abs(x) + 1e-9;
  for (const [x, msg] of cases) if (near(x)) return { ok: false, msg };
  if (unitNote && near(want * 1000)) return { ok: false, msg: 'That figure is in milligrams; the field is in grams.' };
  return null;
}

/* ---------------------------------------------------------------- stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-reverse',
    title: 'Reversing the Cell',
    prompt: 'What does a supply need to do to make zinc plate out of the solution?',
    widget,
    table: cellTable({ fixtures: [supplyFixture('sup', { x: 64, y: 40 }, 'zncu').fixture] }, { w: 128, h: 82 }),
    hints: [
      'Set the two dials, press "Run", and read what the zinc strip did.',
      'Compare the zinc strip across runs at each setting of both dials.',
      'Compare the supply\'s voltage with the 1.10 V the cell gives by itself.'
    ],
    check(state) {
      const r = bench(state.table);
      if (!r.now) return { ok: false, notYet: true, msg: 'Press "Run".' };
      if (r.now.zincPlates) return { ok: true };
      const into = r.now.dir === 'zn' ? 'zinc' : 'copper';
      const word = r.now.zn < 0 ? `lost ${fmt(-r.now.zn * 1000, 1)} mg` : `gained ${fmt(r.now.zn * 1000, 1)} mg`;
      return { ok: false, msg: `At ${fmt(r.now.Vs, 1)} V with electrons sent into the ${into} strip, the zinc strip ${word}.` };
    },
    get reward() {
      const win = driveZnCu(1.5, 'zn'); const lose = driveZnCu(0.5, 'zn');
      return {
        log: 'A supply stronger than the cell turned zinc ions back into zinc.',
        title: 'Electrolysis',
        body: `At 1.5 V the zinc strip gained ${fmt(win.zn * 1000, 1)} mg; at 0.5 V it lost ${fmt(-lose.zn * 1000, 1)} mg. Driving a cell backwards with a supply makes an electrolytic cell: electrolysis.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-melt',
    title: 'Molten Salt',
    prompt: 'At which electrode does sodium form in molten sodium chloride?',
    widget,
    table: cellTable({
      fixtures: [
        supplyFixture('sup', { x: 54, y: 38 }, 'melt').fixture,
        hideDials(selectorFixture('pick', 'Sodium forms at', { x: 136, y: 38 }, { options: ['the left electrode', 'the right electrode', ' '], start: 3, w: 60, list: true }))
      ]
    }, { w: 172, h: 76 }),
    hints: [
      'Set the "Electrons sent into" dial, press "Run", and tap the electrode you choose.',
      'Compare where the silvery liquid forms with the electrode the electrons were sent into.',
      'Compare where the metal forms with the direction of the electrons, and remember which side reduction happens at.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Tap an electrode.' };
      const r = bench(state.table);
      if (!r.now) return { ok: false, msg: 'The melt has not been run yet.' };
      if (v === (r.now.into === 'left' ? 1 : 2)) return { ok: true };
      const other = r.now.into === 'left' ? 'right' : 'left';
      return { ok: false, msg: `The silvery liquid formed at the ${r.now.into} electrode and the pale green gas at the ${other} electrode.` };
    },
    get reward() {
      return {
        log: 'Sodium came out at the electrode the electrons were sent into.',
        title: 'Cathode and Anode',
        body: 'Sodium ions gained electrons at the cathode and chloride ions lost them at the anode. Reduction is at the cathode and oxidation at the anode in every cell.'
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-charge',
    title: 'How Much Passed',
    briefing: { speaker: SPEAKER, body: 'Electric charge is counted in coulombs. A current of one ampere carries one coulomb each second.' },
    prompt: 'Which run passed the least charge and which the most?',
    widget,
    table: cellTable({
      pieces: S3_RUNS.map((r, i) => tag(`r${i + 1}`, `${r.I} A, ${r.t} s`, { x: 24 + i * 35, y: 70 })),
      fixtures: [supplyFixture('sup', { x: 59, y: 32 }, 'plate', { metal: 'ag', solution: 'Silver nitrate solution', runs: S3_RUNS }).fixture],
      zones: { rail: { at: { x: 59, y: 90 }, size: { w: 104, h: 12 }, first: 'Least charge', last: 'Most charge', items: [], start: [] } }
    }, { w: 118, h: 102 }),
    hints: [
      'Choose a run with the "Run" dial, press "Run" for each, then drag the three cards onto the rail.',
      'Compare the mass of silver each run put on the plate with the current and the time it used.',
      'Charge depends on how much current flowed and for how long together, so rank by both numbers at once.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all 3 cards on the rail.' };
      if (order.join() === S3_WANT.join()) return { ok: true };
      const q = id => charge(S3_RUNS[+id.slice(1) - 1].I, S3_RUNS[+id.slice(1) - 1].t);
      const k = order.findIndex((id, i) => i > 0 && q(id) < q(order[i - 1]));
      const a = t.pieces[order[k - 1]]; const b = t.pieces[order[k]];
      const rows = bench(t).rows;
      const read = id => rows.find(x => x.c === +id.slice(1) - 1);
      const ra = read(a.id); const rb = read(b.id);
      if (!ra || !rb) return { ok: false, msg: `${a.label} sits left of ${b.label}, and the plate has no reading for ${!ra ? a.label : b.label} yet.` };
      return { ok: false, msg: `${a.label} sits left of ${b.label}, but the plate gained ${fmt(ra.g * 1000, 1)} mg for ${a.label} and ${fmt(rb.g * 1000, 1)} mg for ${b.label}.` };
    },
    get reward() {
      const rows = S3_RUNS.map(r => `${fmt(charge(r.I, r.t), 0)} C`);
      return {
        log: 'The mass of silver followed the current and the time together.',
        title: 'The Coulomb',
        body: `${rows[0]}, ${rows[1]} and ${rows[2]}: charge in coulombs is amperes × seconds, and the silver plated grew in step with it.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-copper',
    title: 'Plating Copper',
    briefing: {
      speaker: SPEAKER,
      body: 'A current and a time give a charge in coulombs, and one mole of electrons carries 96,485 C.',
      worked: [
        'Al³⁺ + 3 e⁻ → Al',
        '1.00 A × 965 s = 965 C',
        '965 ÷ 96,485 = 0.0100 mol e⁻',
        '÷ 3 = 0.00333 mol Al = 0.090 g'
      ]
    },
    prompt: 'What mass of copper, in grams, is plated by 2.00 A running for 30.0 minutes?',
    widget,
    entry: { id: 'g', label: 'Copper plated', unit: 'g' },
    table: cellTable({
      fixtures: [
        supplyFixture('sup', { x: 52, y: 36 }, 'plate', { metal: 'cu', solution: 'Copper(II) sulfate solution', half: 'Cu²⁺ + 2 e⁻ → Cu', currents: [1, 2], times: [30, 60], counter: true }).fixture,
        ref([FARADAY_LINE, ...MOLAR_LINES])
      ]
    }, { w: 172, h: 72 }),
    hints: [
      'Choose a current and a time with the two dials, press "Run", and type the grams in the field.',
      'Compare how the plated mass changes with the current and with the time across the runs.',
      'Turn the charge into moles of electrons with the plate, then use the half-reaction line to turn those into moles and grams of copper.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'g');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = faradayMass(S4.I, S4.minutes * 60, S4.metal);
      if (Math.abs(v - want) <= TOL_G) return { ok: true };
      const wrongM = id => faradayMass(S4.I, S4.minutes * 60, 'cu') * METALS[id].M / METALS.cu.M;
      const hit = slipOf(v, {
        want,
        unitNote: true,
        cases: [
          [faradayMass(S4.I, S4.minutes, S4.metal), 'That treats 30.0 minutes as 30.0 s; the time in the question is in minutes.'],
          [want * 2, 'The cell\'s half-reaction line reads Cu²⁺ + 2 e⁻ → Cu; that figure counts one electron for each copper atom.'],
          [wrongM('ag'), 'That uses 107.9 g/mol, the molar mass of silver; this cell holds copper.'],
          [wrongM('zn'), 'That uses 65.4 g/mol, the molar mass of zinc; this cell holds copper.'],
          [charge(S4.I, S4.minutes * 60), 'That figure is a charge in coulombs; the field is in grams.']
        ]
      });
      if (hit) return hit;
      if (v < 0) return { ok: false, msg: 'A mass plated is a size, not a negative number.' };
      const r = bench(state.table).rows.find(x => x.I === 2 && x.t === 60);
      return { ok: false, msg: r ? `The bench plated ${fmt(r.g * 1000, 1)} mg of copper in a 60 s run at 2.00 A; that does not lead to ${fmt(v, 2)} g for 30.0 minutes.` : 'Run the bench at 2.00 A to see what a short run plates.' };
    },
    get reward() {
      const t = S4.minutes * 60; const q = charge(S4.I, t); const mol = molesElectrons(q);
      return {
        log: 'The plated mass followed the charge, the electrons per atom and the molar mass.',
        title: "Faraday's Law",
        body: `${fmt(q, 0)} C is ${fmt(mol, 4)} mol of electrons; two for each copper atom gives ${fmt(mol / 2, 4)} mol, ${fmt(faradayMass(S4.I, t, 'cu'), 2)} g. This is Faraday's law.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's6-chain',
    title: 'Cells Driving Cells',
    prompt: 'How many zinc–copper cells does it take to split water?',
    widget,
    table: (() => {
      const s = supplyFixture('sup', { x: 62, y: 28 }, 'water', { cells: 3 });
      return cellTable({
        pieces: [packPiece('p1', { x: 26, y: 68 }), packPiece('p2', { x: 62, y: 68 }), packPiece('p3', { x: 98, y: 68 })],
        fixtures: [s.fixture],
        zones: { slots: s.slots }
      }, { w: 124, h: 90 });
    })(),
    hints: [
      'Drag cells into the chain, press "Run", and watch the tubes.',
      'Compare the chain\'s voltage with whether any gas gathered, at different numbers of cells.',
      'Cells joined one after another add their voltages, so change the number of cells until gas gathers.'
    ],
    check(state) {
      const r = bench(state.table);
      if (!r.now) return { ok: false, notYet: true, msg: 'Press "Run".' };
      if (r.now.goes) return { ok: true };
      return { ok: false, msg: `${r.now.k} cell${r.now.k === 1 ? '' : 's'} in the chain read ${voltText(r.now.V)} V and the tubes stayed empty.` };
    },
    get reward() {
      const k = cellsToExceed(WATER_BACK_VOLTAGE, cellE0('cu', 'zn'));
      const w = waterRun(k);
      return {
        log: 'Cells in a chain added their voltages until the water cell gave gas.',
        title: 'Coupled Reactions',
        body: `One cell gives ${voltText(cellE0('cu', 'zn'))} V, below the ${voltText(WATER_BACK_VOLTAGE)} V water needs, but ${k} cells give ${voltText(w.V)} V and gas forms: a reaction that runs by itself can drive one that does not.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's7-gases',
    title: 'Water and Brine',
    prompt: 'Which gas does each tube collect?',
    widget,
    table: (() => {
      const s = supplyFixture('sup', { x: 68, y: 40 }, 'compare', S7);
      const cards = [['h1', 'H₂'], ['h2', 'H₂'], ['o1', 'O₂'], ['o2', 'O₂'], ['cl', 'Cl₂']];
      return cellTable({
        pieces: cards.map(([id, label], i) => gasPiece(id, label, { x: 18 + i * 26, y: 96 })),
        fixtures: [s.fixture],
        zones: { slots: s.slots }
      }, { w: 140, h: 108 });
    })(),
    hints: [
      'Press "Run", then drag one gas bubble to the seat under each tube.',
      'Compare each tube\'s volume and what its gas does with the other three tubes.',
      'Match each gas to the cell and the electrode it came from, using its volume and how it behaved.'
    ],
    check(state) {
      const t = state.table;
      const label = i => pieceIn(t, `sup.t${i}`)?.label;
      if ([1, 2, 3, 4].some(i => !label(i))) return { ok: false, notYet: true, msg: 'Put a bubble in the seat under every tube.' };
      const want = ['H₂', 'O₂', 'H₂', 'Cl₂'];
      const bad = want.findIndex((g, i) => label(i + 1) !== g);
      if (bad < 0) return { ok: true };
      const r = bench(t);
      if (!r.now) return { ok: false, msg: 'The cells have not been run yet.' };
      const where = ['water, left tube', 'water, right tube', 'brine, left tube', 'brine, right tube'][bad];
      const g = [r.now.water.cathode, r.now.water.anode, r.now.brine.cathode, r.now.brine.anode][bad];
      const look = { 'H₂': 'burned with a pop', 'O₂': 'relit a glowing splint', 'Cl₂': 'was pale green and bleached litmus' }[g.gas];
      return { ok: false, msg: `The ${where} gathered ${fmt(g.mL, 1)} mL of a gas that ${look}; the bubble in its seat does not fit that.` };
    },
    get reward() {
      const c = compareRun(S7.I, S7.t);
      return {
        log: 'The gas at the anode depended on what was in the cell.',
        title: 'What Forms',
        body: `Water gave ${fmt(c.water.cathode.mL, 1)} mL of hydrogen and ${fmt(c.water.anode.mL, 1)} mL of oxygen; brine gave ${fmt(c.brine.cathode.mL, 1)} mL each of hydrogen and chlorine, because oxygen forms slowly at real electrodes (overpotential).`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's8-sealed',
    title: 'The Sealed Plate',
    prompt: 'What current, in amperes, plated the sealed plate in the time shown?',
    widget,
    entry: { id: 'i', label: 'Current', unit: 'A' },
    table: (() => {
      const s = supplyFixture('sup', { x: 52, y: 30 }, 'weigh', { metal: S8.metal, solution: 'Nickel(II) sulfate solution', half: 'Ni²⁺ + 2 e⁻ → Ni', I: S8.I, t: S8.t });
      return cellTable({
        pieces: [platePiece('plate-x', { x: 36, y: 74 })],
        fixtures: [s.fixture, plaqueFixture('plate', 'For reference', { x: 140, y: 24 }, [FARADAY_LINE, ...MOLAR_LINES], { w: 58 })],
        zones: { slots: s.slots }
      }, { w: 172, h: 90 });
    })(),
    hints: [
      'Lay the plate on the balance to read its mass, then type the current in the field.',
      'Compare the mass on the balance with the time shown and the half-reaction line.',
      'Run stage 4\'s chain backwards, from grams to coulombs.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'i');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const want = S8.I;
      if (Math.abs(v - want) <= TOL_A) return { ok: true };
      const g = platingRun(S8.metal, S8.I, S8.t).g;
      const I = (id, n = METALS[S8.metal].n, t = S8.t) => (g * n * FARADAY) / (METALS[id].M * t);
      const near = x => Math.abs(v - x) <= 0.015 * Math.abs(x) + 1e-9;
      const f = state.table.fixtures.sup;
      const plate = supplyRead(state.table, 'sup').plate;
      if (!plate) return { ok: false, msg: 'Lay the plate on the balance to read its mass.' };
      if (near(I(S8.metal, 2, S8.t / 60))) return { ok: false, msg: 'That treats 25.0 minutes as 25.0 s; the time shown is in minutes.' };
      if (near(I(S8.metal, 1))) return { ok: false, msg: 'The cell\'s half-reaction line reads Ni²⁺ + 2 e⁻ → Ni; that figure counts one electron for each nickel atom.' };
      if (near(I('cu'))) return { ok: false, msg: 'That uses 63.5 g/mol, the molar mass of copper; this cell holds nickel.' };
      if (near(I('zn'))) return { ok: false, msg: 'That uses 65.4 g/mol, the molar mass of zinc; this cell holds nickel.' };
      return { ok: false, msg: `The balance reads ${fmt(weighGrams(f), 3)} g after 25.0 minutes; ${fmt(v, 2)} A does not give that mass.` };
    },
    get reward() {
      const g = platingRun(S8.metal, S8.I, S8.t).g; const mol = g / METALS.ni.M;
      return {
        log: 'The mass on the plate gave the current that made it.',
        title: "Faraday's Law Backwards",
        body: `${fmt(g, 3)} g of nickel is ${fmt(mol, 5)} mol; two electrons each makes ${fmt(mol * 2, 5)} mol of electrons, or ${fmt(mol * 2 * 96485, 0)} C. Over ${S8.t} s that is ${fmt(currentFor('ni', g, S8.t), 2)} A: the law works from mass to current as well as from current to mass.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, { compact: [2, 5], demos: {}, own: { 1: { sitesKey: 'sides', extra: { pickMap: [1, 2], siteX: [0.36, 0.64] } } } });

export const DEBRIEF = {
  title: 'Electrolysis',
  body: 'A supply stronger than a cell drives its reaction backwards. The charge passed, current times time, counts the electrons, and the electrons count the atoms plated.'
};

export const SOLUTIONS = [
  [dial('sup', 'v', 2), dial('sup', 'dir', 1), run('sup')],
  [dial('sup', 'dir', 1), run('sup'), dial('pick', 'value', 1)],
  [dial('sup', 'sel', 1), run('sup'), dial('sup', 'sel', 2), run('sup'), dial('sup', 'sel', 3), run('sup'), ...S3_WANT.map((id, i) => put(id, `rail:${i}`))],
  [dial('sup', 'cur', 2), dial('sup', 'time', 2), run('sup'), typed('g', fmt(faradayMass(S4.I, S4.minutes * 60, 'cu'), 2))],
  [put('p1', 'slot:sup.k1'), put('p2', 'slot:sup.k2'), run('sup')],
  [run('sup'), put('h1', 'slot:sup.t1'), put('o1', 'slot:sup.t2'), put('h2', 'slot:sup.t3'), put('cl', 'slot:sup.t4')],
  [put('plate-x', 'slot:sup.pan'), typed('i', fmt(S8.I, 3))]
];

export const MISSES = [
  [dial('sup', 'v', 1), dial('sup', 'dir', 1), run('sup')],
  [dial('sup', 'dir', 2), run('sup'), dial('pick', 'value', 1)],
  [dial('sup', 'sel', 1), run('sup'), dial('sup', 'sel', 2), run('sup'), dial('sup', 'sel', 3), run('sup'), ...['r1', 'r2', 'r3'].map((id, i) => put(id, `rail:${i}`))],
  [typed('g', fmt(faradayMass(S4.I, S4.minutes, 'cu'), 4))],
  [put('p1', 'slot:sup.k1'), run('sup')],
  [run('sup'), put('h1', 'slot:sup.t1'), put('o1', 'slot:sup.t2'), put('h2', 'slot:sup.t3'), put('o2', 'slot:sup.t4')],
  [put('plate-x', 'slot:sup.pan'), typed('i', '0.4')]
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

export const CHECKS = { S3_RUNS, S3_WANT, S4, S7, S8, TOL_G, TOL_A, RUN_SECONDS, PLATE_TIME };
