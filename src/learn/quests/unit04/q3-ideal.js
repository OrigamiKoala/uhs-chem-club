/**
 * q3-ideal.js — Bellows, bench three: THE IDEAL GAS LAW.
 *
 * The metering skid, where gas is counted out of a holder, on the gas kit (`table/kits/gas.js`). Bench two found gases follow the kelvin
 * temperature. This one lets nothing be held fixed and asks how many particles a gas holds, which is where chemistry starts counting.
 *
 * THE CLICK. Most players believe a heavier gas, with its bigger, heavier particles, must take up more room than a light one. Stage 1
 * asks for that guess about a mole of helium against a mole of carbon dioxide (a predict stage, no instrument). Stage 2 puts the two in
 * cylinders under the same weight and asks for the amount of carbon dioxide that fills the same room as the helium: the same number of
 * moles, though one weighs eleven times the other. The idea is named only then: equal numbers of particles fill equal rooms, whatever
 * the gas. Stage 3 uses it to count sealed tanks from their plates, and stage 4 finds the one number that ties the readings together.
 *
 *   1  PREDICT: a mole of a light gas and a mole of a heavy gas, which fills more room
 *   2  TEST: add gas until the two cylinders fill the same room         -> Molar Volume, Avogadro's law
 *   3  tanks against a reference: fewer, the same number, or more       -> Counting From a Gauge, the ideal gas law
 *   4  the number that pressure x room / amount x kelvin comes to       -> The Gas Constant
 *
 * (Cut as repeats or as arithmetic past the idea: the second gas constant for a gauge in atmospheres, naming a gas from its weight, the
 * density ranking, and the pellet of limestone, which were the same counting at AP depth.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, tank, numCard, cylRead, whereIs, tankMoles, R } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf, sort } from './_shared.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bmolar volume\b/i, introducedAt: 2 },
  { term: /\bavogadro.?s law\b/i, introducedAt: 2 },
  { term: /\bideal gas law\b/i, introducedAt: 3 },
  { term: /\bgas constant\b/i, introducedAt: 4 }
];

/** Pressure, kelvin, the laws of bench two and the mole are plain words from here on. */
export const BUILDS_ON = ['unit04/q2-laws', 'unit01/q6-weigh'];

export const QUEST_KEY = 'unit04/q3-ideal';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';
const STP = 273.15;
const P_ATM = 101.325;

export const GUESSES = [['he', 'Helium fills more'], ['co2', 'Carbon dioxide fills more'], ['same', 'They fill the same room']];

/** Stage 2's amounts of carbon dioxide, in moles; the one that fills helium's room is not the first. */
export const CO2_AMOUNTS = [0.5, 1, 1.5, 2];

/** Stage 3's tanks: the reference, and four that differ from it in one reading each. */
export const TANKS = [
  { id: 'a', gas: 'He', P: 100, V: 10, T: 300 },
  { id: 'b', gas: 'Xe', P: 100, V: 10, T: 300 },
  { id: 'c', gas: 'N2', P: 100, V: 20, T: 300 },
  { id: 'd', gas: 'Ar', P: 50, V: 10, T: 300 },
  { id: 'e', gas: 'He', P: 100, V: 10, T: 600 }
];

/** Stage 4's cards: the right one has its decimal point in the right place, and the others do not. */
export const R_CARDS = [['n831', '8.31', 8.31], ['n0831', '0.0831', 0.0831], ['n83', '83.1', 83.1], ['n101', '101.3', 101.3]];

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Molar Mass and Volume',
    prompt: 'One mole each of helium and carbon dioxide sit at one temperature under the same weight: which fills more room?',
    items: GUESSES,
    hints: [
      'Choose one of the cards.',
      'Consider whether molecular mass alters the volume of one mole of gas.',
      'Select the card that matches your prediction.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Two cylinders will now test whether different gases occupy different volumes at equal temperature and pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = rig('ra', { x: 20, y: 25 }, {
      cyls: [{ id: 'a', label: 'Holder 10', gas: 'He', n: 1, hold: 'P', V: 20, T: STP, P0: P_ATM }], vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true }
    });
    const b = rig('rb', { x: 58, y: 25 }, {
      cyls: [{ id: 'a', label: 'Holder 11', gas: 'CO2', hold: 'P', V: 20, T: STP, P0: P_ATM }], amounts: CO2_AMOUNTS, amountStart: 1, vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true }
    });
    return {
      title: 'Molar Volume',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'add gas to Holder 11 until it fills the same room as Holder 10.', 'Add gas to Holder 11 until it fills the same room as Holder 10.');
      },
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Use the "Gas in" dial of Holder 11.',
        'Compare the volumes of both cylinders at each setting.',
        'Stop at the setting where Holder 11 matches the volume of Holder 10.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.amount.value) === 1) return { ok: false, notYet: true, msg: 'Holder 11\'s dial is where it started: add gas and watch its room.' };
        const va = cylRead(t, 'ra', 0).V;
        const vb = cylRead(t, 'rb', 0).V;
        if (Math.abs(vb - va) < 0.05) return { ok: true };
        return { ok: false, msg: vb < va ? 'Holder 11 fills less room than Holder 10.' : 'Holder 11 fills more room than Holder 10.' };
      },
      get reward() {
        return {
          log: 'A mole of either gas fills the same room.',
          title: 'Molar Volume',
          body: 'One mole of any ideal gas fills about 22.4 litres at 0 °C and ordinary air pressure (molar volume), regardless of particle mass. Equal numbers of particles fill equal volumes: this is Avogadro\'s law.',
          model: {
            type: 'gas',
            boxes: [{ label: 'Helium', w: 2.4, parts: [{ kind: 'He', n: 12 }] }, { label: 'Carbon dioxide', w: 2.4, parts: [{ kind: 'CO2', n: 12 }] }],
            caption: 'One mole of each, 12 particles for each: particle mass differs, but volume is equal.'
          }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mk = ({ id, gas, P, V, T }, at, extra = {}) => tank(id, `TANK ${id.toUpperCase()}`, at, { gas, P, V, T, plate: true, gaugeMax: 300, ...extra });
    const tray = (id, label, x) => ({ id, label, at: { x, y: 24 }, size: { w: 46, h: 24 }, cell: 15 });
    const xs = { a: 14, b: 44, c: 68, d: 92, e: 116 };
    return {
      title: 'Counting Moles from Pressure',
      prompt: 'Put each tank in the tray for how many particles it holds compared with Tank A.',
      widget,
      table: gasTable({
        pieces: TANKS.map(t => mk(t, { x: xs[t.id], y: 52 }, t.id === 'a' ? { fixed: true } : {})),
        zones: { trays: [tray('fewer', 'Fewer particles', 25), tray('same', 'The same number', 75), tray('more', 'More particles', 125)] }
      }),
      hints: [
        'Sort each tank into one of the three trays.',
        'Compare each tank\'s gauge, room and temperature with Tank A\'s.',
        'Higher pressure or room means more particles, while higher temperature means fewer particles for the same room.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['b', 'c', 'd', 'e'];
        if (!ids.every(id => ['fewer', 'same', 'more'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Put every tank in a tray.' };
        const nA = tankMoles(t.pieces.a);
        for (const id of ids) {
          const ratio = tankMoles(t.pieces[id]) / nA;
          const want = Math.abs(ratio - 1) < 1e-6 ? 'same' : ratio > 1 ? 'more' : 'fewer';
          if (whereIs(t, id) !== want) return { ok: false, msg: `Tank ${id.toUpperCase()}'s gauge, room and temperature do not fit the tray it is in.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'A gauge, a room and a temperature count the gas.',
        title: 'Counting From a Gauge',
        body: 'Mole quantity in a gas is directly proportional to pressure and volume, and inversely proportional to absolute temperature. Combining these dependencies yields the ideal gas law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 28 }, {
      cyls: [{ id: 'a', label: 'Holder 12', gas: 'N2', n: 1, hold: 'dial', V: 22.4, T: STP }],
      temps: [0, 27, 127], tempList: 'C', tempStart: 1, amounts: [1, 2], amountStart: 1, vmax: 22.4, show: { kelvin: true, volume: false }, plot: { x: 'nT', y: 'PV' }
    });
    return {
      title: 'The Ideal Gas Constant',
      prompt: 'Find what pressure times room, divided by amount times kelvin, comes to, and put its card in the slot.',
      widget,
      table: gasTable({
        pieces: R_CARDS.map(([id, label, v], i) => numCard(id, label, { x: 84 + i * 18, y: 38 }, v)),
        fixtures: [r],
        zones: { slots: [{ id: 'answer', label: 'It comes to', at: { x: 111, y: 52 }, size: { w: 22, h: 11 } }] },
        tools: ['straightedge']
      }, { recorder: { at: { x: 111, y: 17 }, size: { w: 40, h: 24 }, xLabel: 'n x K', xUnit: 'mol K', yLabel: 'P x room', yUnit: 'kPa L' } }),
      hints: [
        'Use both dials, "Record" and the straightedge.',
        'Record readings at several settings and lay the straightedge across the points.',
        'Divide pressure times room by amount times kelvin for any point.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (Math.abs(card.props.value - R) < 0.01) return { ok: true };
        return { ok: false, msg: 'The recorded readings do not come to the number on that card.' };
      },
      reward: {
        log: 'One number ties every reading together.',
        title: 'The Gas Constant',
        body: 'Pressure times room, divided by amount times kelvin, equals 8.31 for every reading in these units. That number is the gas constant, written R, and the whole relation PV = nRT is the ideal gas law.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn Holder 11\'s Gas in dial.'],
  3: ['Sort each tank into a tray.'],
  4: ['Record readings, lay the straightedge,', 'then place a card in the slot.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'Equal volumes of all gases at identical temperature and pressure contain identical particle counts (Avogadro\'s law). Combining pressure, volume, temperature, and mole count produces the ideal gas law: PV = nRT, where R = 8.31 kPa·L/(mol·K).'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'One mole of helium and one mole of xenon are at the same temperature and pressure. Which fills more room?',
    options: [
      { id: 'a', label: 'They fill the same room' },
      { id: 'b', label: 'Xenon, because its atoms are heavier' },
      { id: 'c', label: 'Helium, because its atoms move faster' },
      { id: 'd', label: 'Xenon, because its atoms are bigger' }
    ],
    answer: 'a',
    explanation: 'Equal numbers of particles of any gas fill equal rooms at the same temperature and pressure (Avogadro\'s law).'
  },
  {
    question: 'About how much room does one mole of any gas fill at 0 °C and ordinary air pressure?',
    options: [
      { id: 'a', label: '22.4 L' },
      { id: 'b', label: '1.0 L' },
      { id: 'c', label: '100 L' },
      { id: 'd', label: '2.24 L' }
    ],
    answer: 'a',
    explanation: 'This is the molar volume of a gas.'
  },
  {
    question: 'Tank X and Tank Y have the same pressure and the same room, but Tank X is hotter. Which holds more particles?',
    options: [
      { id: 'a', label: 'Tank Y, the cooler one' },
      { id: 'b', label: 'Tank X, the hotter one' },
      { id: 'c', label: 'They hold the same number' },
      { id: 'd', label: 'It depends on the gas' }
    ],
    answer: 'a',
    explanation: 'Hotter particles push harder, so fewer of them give the same pressure in the same room.'
  },
  {
    question: 'How many moles of gas are in a rigid 8.31 L tank at 300 K and 300 kPa? (R = 8.31 kPa·L/mol·K)',
    options: [
      { id: 'a', label: '1.00 mol' },
      { id: 'b', label: '0.10 mol' },
      { id: 'c', label: '10.0 mol' },
      { id: 'd', label: '3.00 mol' }
    ],
    answer: 'a',
    explanation: 'n = PV/RT = (300 × 8.31) / (8.31 × 300) = 1.00 mol.'
  },
  {
    question: 'Which pair of readings multiplies out to the same number for every sample of an ideal gas?',
    options: [
      { id: 'a', label: 'Pressure times room, divided by amount times kelvin' },
      { id: 'b', label: 'Pressure plus room, divided by amount' },
      { id: 'c', label: 'Pressure times temperature, divided by room' },
      { id: 'd', label: 'Room divided by pressure' }
    ],
    answer: 'a',
    explanation: 'That quotient is the gas constant, R, which is the same for every reading.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('he', 'slot:predict')],
  [dial('rb', 'amount', 2)],
  [...sort({ b: 'same', c: 'more', d: 'fewer', e: 'fewer' })],
  [dial(RIG, 'temp', 1), dial(RIG, 'amount', 1), { run: RIG }, dial(RIG, 'temp', 3), dial(RIG, 'amount', 2), { run: RIG }, { lay: { kind: 'straightedge', through: [0, 1] } }, put('n831', 'slot:answer')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('rb', 'amount', 3)],
  [...sort({ b: 'more', c: 'more', d: 'fewer', e: 'fewer' })],
  [dial(RIG, 'temp', 1), { run: RIG }, put('n83', 'slot:answer')]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { cylRead, tankMoles, R };
