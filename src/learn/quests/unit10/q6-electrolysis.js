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
  { term: /\bFaraday's law\b/i, introducedAt: 4 }
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
    briefing: { speaker: SPEAKER, body: 'A power supply sends electrons into whichever strip you choose. Plating means coating solid metal from the solution onto a strip.' },
    prompt: 'Set the power supply dials and press Run so zinc plates onto the zinc strip.',
    widget,
    table: cellTable({ fixtures: [supplyFixture('sup', { x: 64, y: 40 }, 'zncu').fixture] }, { w: 128, h: 82 }),
    hints: [
      'Set the two dials, press "Run", and read what the zinc strip did.',
      'Compare the zinc strip across runs at each setting of both dials.',
      'To reverse the 1.10 V cell, the supply must beat 1.10 V and send electrons into zinc.'
    ],
    check(state) {
      const r = bench(state.table);
      if (!r.now) return { ok: false, notYet: true, msg: 'Press "Run" first.' };
      if (r.now.zincPlates) return { ok: true };
      const into = r.now.dir === 'zn' ? 'zinc' : 'copper';
      const word = r.now.zn < 0 ? `lost ${fmt(-r.now.zn * 1000, 1)} mg` : `gained ${fmt(r.now.zn * 1000, 1)} mg`;
      return { ok: false, msg: `At ${fmt(r.now.Vs, 1)} V sending electrons into ${into}, the zinc strip ${word}.` };
    },
    get reward() {
      const win = driveZnCu(1.5, 'zn'); const lose = driveZnCu(0.5, 'zn');
      return {
        log: 'A supply stronger than the cell turned zinc ions back into zinc.',
        title: 'Electrolysis',
        body: `At 1.5 V zinc gained ${fmt(win.zn * 1000, 1)} mg; at 0.5 V it lost ${fmt(-lose.zn * 1000, 1)} mg. Using a power supply to drive a reaction backwards is electrolysis (an electrolytic cell).`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-melt',
    title: 'Molten Salt',
    briefing: { speaker: SPEAKER, body: 'Molten means melted: liquid sodium chloride has free Na⁺ and Cl⁻ ions that can move to the electrodes.' },
    prompt: 'Set the direction dial, press Run, then tap the electrode on the Model where sodium forms.',
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
      'Na⁺ ions gain electrons to form sodium metal, so look where electrons are sent.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Tap an electrode on the Model first.' };
      const r = bench(state.table);
      if (!r.now) return { ok: false, msg: 'Press Run first.' };
      if (v === (r.now.into === 'left' ? 1 : 2)) return { ok: true };
      const other = r.now.into === 'left' ? 'right' : 'left';
      return { ok: false, msg: `The silvery liquid formed at the ${r.now.into} electrode, while pale green chlorine gas formed at the ${other} electrode.` };
    },
    get reward() {
      return {
        log: 'Sodium formed where electrons were sent in.',
        title: 'Cathode and Anode',
        body: 'Sodium ions gained electrons at the cathode, and chloride ions lost them at the anode. In every cell, reduction happens at the cathode and oxidation at the anode.'
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-charge',
    title: 'How Much Passed',
    briefing: { speaker: SPEAKER, body: 'Electric charge is measured in coulombs (C). A current of 1 ampere (A) carries 1 coulomb each second (C = A × s).' },
    prompt: 'Run all three trials, then order the cards on the rail from least charge passed to most.',
    widget,
    table: cellTable({
      pieces: S3_RUNS.map((r, i) => tag(`r${i + 1}`, `${r.I} A, ${r.t} s`, { x: 24 + i * 35, y: 70 })),
      fixtures: [supplyFixture('sup', { x: 59, y: 32 }, 'plate', { metal: 'ag', solution: 'Silver nitrate solution', runs: S3_RUNS }).fixture],
      zones: { rail: { at: { x: 59, y: 90 }, size: { w: 104, h: 12 }, first: 'Least charge', last: 'Most charge', items: [], start: [], slots: 3 } }
    }, { w: 118, h: 102 }),
    hints: [
      'Choose a run with the "Run" dial, press "Run" for each, then drag the three cards onto the rail.',
      'Compare the mass of silver each run put on the plate with the current and the time it used.',
      'Multiply current (A) by time (s) to find the charge in coulombs for each run.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Place all 3 cards on the rail first.' };
      if (order.join() === S3_WANT.join()) return { ok: true };
      const q = id => charge(S3_RUNS[+id.slice(1) - 1].I, S3_RUNS[+id.slice(1) - 1].t);
      const k = order.findIndex((id, i) => i > 0 && q(id) < q(order[i - 1]));
      const a = t.pieces[order[k - 1]]; const b = t.pieces[order[k]];
      const rows = bench(t).rows;
      const read = id => rows.find(x => x.c === +id.slice(1) - 1);
      const ra = read(a.id); const rb = read(b.id);
      if (!ra || !rb) return { ok: false, msg: `${a.label} is left of ${b.label}, and you have not run ${!ra ? a.label : b.label} yet.` };
      return { ok: false, msg: `${a.label} is left of ${b.label}, but ${a.label} plated ${fmt(ra.g * 1000, 1)} mg while ${b.label} plated ${fmt(rb.g * 1000, 1)} mg.` };
    },
    get reward() {
      const rows = S3_RUNS.map(r => `${fmt(charge(r.I, r.t), 0)} C`);
      return {
        log: 'The mass of silver followed the current and the time together.',
        title: 'The Coulomb',
        body: `The charges were ${rows[0]}, ${rows[1]}, and ${rows[2]} (amperes × seconds). The silver plated grew in direct proportion to the charge passed.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-copper',
    title: 'Plating Copper',
    briefing: {
      speaker: SPEAKER,
      body: 'Three steps to plated mass: (1) multiply amperes × seconds (convert minutes to seconds first) for coulombs; (2) divide by 96,485 C/mol for moles of electrons; (3) divide by electrons per atom and multiply by molar mass.',
      worked: [
        'Example (Al³⁺ + 3 e⁻ → Al): 1.00 A for 965 s',
        '1) Charge: 1.00 A × 965 s = 965 C',
        '2) Moles e⁻: 965 ÷ 96,485 = 0.0100 mol e⁻',
        '3) Mass: (0.0100 ÷ 3) × 27.0 = 0.090 g Al'
      ]
    },
    prompt: 'How many grams of copper are plated by 2.00 A running for 30.0 minutes (convert minutes to seconds)?',
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
      'Convert charge to moles of electrons using 96,485 C/mol, then use Cu²⁺ + 2 e⁻ → Cu and molar mass for grams.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'g');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field first.' };
      const want = faradayMass(S4.I, S4.minutes * 60, S4.metal);
      if (Math.abs(v - want) <= TOL_G) return { ok: true };
      const wrongM = id => faradayMass(S4.I, S4.minutes * 60, 'cu') * METALS[id].M / METALS.cu.M;
      const hit = slipOf(v, {
        want,
        unitNote: true,
        cases: [
          [faradayMass(S4.I, S4.minutes, S4.metal), 'You used 30.0 instead of converting 30.0 minutes to 1800 seconds.'],
          [want * 2, 'You used 1 electron per copper atom, but the half-reaction Cu²⁺ + 2 e⁻ → Cu takes 2 electrons.'],
          [wrongM('ag'), 'That uses silver\'s molar mass (107.9 g/mol); use copper (63.5 g/mol).'],
          [wrongM('zn'), 'That uses zinc\'s molar mass (65.4 g/mol); use copper (63.5 g/mol).'],
          [charge(S4.I, S4.minutes * 60), 'That is the charge in coulombs; convert it to grams of copper.']
        ]
      });
      if (hit) return hit;
      if (v < 0) return { ok: false, msg: 'Enter a positive mass in grams.' };
      const r = bench(state.table).rows.find(x => x.I === 2 && x.t === 60);
      return { ok: false, msg: r ? `The bench plated ${fmt(r.g * 1000, 1)} mg of copper in 60 s at 2.00 A, which does not match ${fmt(v, 2)} g for 30.0 minutes.` : 'Run the bench at 2.00 A to see what a short run plates.' };
    },
    get reward() {
      const t = S4.minutes * 60; const q = charge(S4.I, t); const mol = molesElectrons(q);
      return {
        log: 'The plated mass followed the charge, the electrons per atom and the molar mass.',
        title: "Faraday's Law",
        body: `${fmt(q, 0)} C is ${fmt(mol, 4)} mol of electrons, which plates ${fmt(mol / 2, 4)} mol (${fmt(faradayMass(S4.I, t, 'cu'), 2)} g) of copper. Mass plated is proportional to charge passed—Faraday's law.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's6-chain',
    title: 'Cells Driving Cells',
    briefing: { speaker: SPEAKER, body: 'Electricity can split water into hydrogen (H₂) and oxygen (O₂) gas once the voltage is high enough. Stack zinc–copper cells in the chain until gas collects in the tubes.' },
    prompt: 'Stack zinc–copper cells in the chain and press Run to find how many it takes to split water.',
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
      if (!r.now) return { ok: false, notYet: true, msg: 'Press "Run" first.' };
      if (r.now.goes) return { ok: true };
      return { ok: false, msg: `${r.now.k} cell${r.now.k === 1 ? '' : 's'} gave only ${voltText(r.now.V)} V, so no gas formed in the tubes.` };
    },
    get reward() {
      const k = cellsToExceed(WATER_BACK_VOLTAGE, cellE0('cu', 'zn'));
      const w = waterRun(k);
      return {
        log: 'Cells in a chain added their voltages until the water cell gave gas.',
        title: 'Coupled Reactions',
        body: `One cell gives ${voltText(cellE0('cu', 'zn'))} V—below the ${voltText(WATER_BACK_VOLTAGE)} V water needs—while ${k} cells give ${voltText(w.V)} V and split water. A spontaneous reaction can drive a nonspontaneous one.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's7-gases',
    title: 'Water and Brine',
    briefing: {
      speaker: SPEAKER,
      body: 'Water and salty brine are both powered at 3.0 V. Use each tube\'s gas volume and test result to identify what formed.'
    },
    prompt: 'Press Run, then drag the matching gas bubble (H₂, O₂, or Cl₂) under each of the four tubes.',
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
      'H₂ pops, O₂ relights a glowing splint, and Cl₂ is pale green.'
    ],
    check(state) {
      const t = state.table;
      const label = i => pieceIn(t, `sup.t${i}`)?.label;
      if ([1, 2, 3, 4].some(i => !label(i))) return { ok: false, notYet: true, msg: 'Place a gas bubble under all four tubes first.' };
      const want = ['H₂', 'O₂', 'H₂', 'Cl₂'];
      const bad = want.findIndex((g, i) => label(i + 1) !== g);
      if (bad < 0) return { ok: true };
      const r = bench(t);
      if (!r.now) return { ok: false, msg: 'Press Run first.' };
      const where = ['water, left tube', 'water, right tube', 'brine, left tube', 'brine, right tube'][bad];
      const g = [r.now.water.cathode, r.now.water.anode, r.now.brine.cathode, r.now.brine.anode][bad];
      const look = { 'H₂': 'burned with a pop', 'O₂': 'relit a glowing splint', 'Cl₂': 'was pale green and bleached litmus' }[g.gas];
      return { ok: false, msg: `The ${where} collected ${fmt(g.mL, 1)} mL of gas that ${look}, which does not match the bubble you placed.` };
    },
    get reward() {
      const c = compareRun(S7.I, S7.t);
      return {
        log: 'The gas at the anode depended on what was in the cell.',
        title: 'What Forms',
        body: `Water gave ${fmt(c.water.cathode.mL, 1)} mL H₂ and ${fmt(c.water.anode.mL, 1)} mL O₂; brine gave ${fmt(c.brine.cathode.mL, 1)} mL each of H₂ and Cl₂. Because oxygen forms slowly at real electrodes (overpotential), chloride ions react instead.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's8-sealed',
    title: 'The Sealed Plate',
    prompt: 'Weigh Plate X on the balance, convert the plating time to seconds, and type the current in amperes.',
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
      'Drag Plate X onto the balance to read its mass, then type the current in amperes.',
      'Compare the mass on the balance with the time shown and the half-reaction line.',
      'Convert grams to moles of nickel, then moles of electrons, then coulombs, and divide by seconds.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'i');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field first.' };
      const want = S8.I;
      if (Math.abs(v - want) <= TOL_A) return { ok: true };
      const g = platingRun(S8.metal, S8.I, S8.t).g;
      const I = (id, n = METALS[S8.metal].n, t = S8.t) => (g * n * FARADAY) / (METALS[id].M * t);
      const near = x => Math.abs(v - x) <= 0.015 * Math.abs(x) + 1e-9;
      const f = state.table.fixtures.sup;
      const plate = supplyRead(state.table, 'sup').plate;
      if (!plate) return { ok: false, msg: 'Drag Plate X onto the balance to read its mass first.' };
      if (near(I(S8.metal, 2, S8.t / 60))) return { ok: false, msg: 'You used 25.0 instead of converting 25.0 minutes to 1500 seconds.' };
      if (near(I(S8.metal, 1))) return { ok: false, msg: 'You used 1 electron per nickel atom, but the half-reaction Ni²⁺ + 2 e⁻ → Ni takes 2 electrons.' };
      if (near(I('cu'))) return { ok: false, msg: 'That uses copper\'s molar mass (63.5 g/mol); this cell plated nickel (58.7 g/mol).' };
      if (near(I('zn'))) return { ok: false, msg: 'That uses zinc\'s molar mass (65.4 g/mol); this cell plated nickel (58.7 g/mol).' };
      return { ok: false, msg: `The balance reads ${fmt(weighGrams(f), 3)} g after 25.0 minutes, which does not match ${fmt(v, 2)} A.` };
    },
    get reward() {
      const g = platingRun(S8.metal, S8.I, S8.t).g; const mol = g / METALS.ni.M;
      return {
        log: 'The mass on the plate gave the current that made it.',
        title: "Faraday's Law Backwards",
        body: `${fmt(g, 3)} g of nickel is ${fmt(mol, 5)} mol, needing ${fmt(mol * 2, 5)} mol of electrons (${fmt(mol * 2 * 96485, 0)} C). Over ${S8.t} s that is ${fmt(currentFor('ni', g, S8.t), 2)} A—Faraday's law works in reverse too.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, { compact: [2, 5], demos: {}, own: { 1: { sitesKey: 'sides', extra: { pickMap: [1, 2], siteX: [0.36, 0.64], siteLabels: ['Left', 'Right'] } } } });

export const DEBRIEF = {
  title: 'Electrolysis',
  body: 'A power supply stronger than a cell drives its reaction backwards. Charge passed (current × time) counts the electrons, and those electrons determine how much metal plates out.'
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
