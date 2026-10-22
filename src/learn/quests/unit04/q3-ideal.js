/**
 * q3-ideal.js — Bellows, bench three: THE IDEAL GAS LAW.
 *
 * The metering skid, where gas is weighed out of a holder, and the third of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the
 * gas kit (`table/kits/gas.js`). Bench two found four relations, each with one thing held fixed. This one lets nothing be fixed and finds
 * the single number that ties all four together. It starts where chemistry starts counting: one mole of gas in a cylinder, and how much
 * room it takes.
 *
 *   1  what one mole fills at 0 °C and one atmosphere        -> molar volume
 *   2  the one number every recorded reading gives           -> gas constant, ideal gas law
 *   3  the amount of gas in a sealed tank, from its gauge    -> (n = PV / RT)
 *   4  which R goes with a gauge in atmospheres              -> (R follows the unit)
 *   5  naming a gas by its weight and its readings           -> (molar mass from the gas law)
 *   6  three gases, ranked by how dense they are             -> (density follows molar mass)
 *   7  the gas a pellet of limestone gives off               -> (moles from the equation, volume from the law)
 *   8  tanks sorted by how many particles they hold          -> (particle size does not set the room)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2 records pressure times volume against amount times temperature, and every reading falls on one line
 * through the origin whose slope is the constant; stage 4 does the same with the gauge in atmospheres, so the SECOND value of R is found
 * the same way as the first. A sealed tank (stages 3, 5, 6 and 8) prints its gauge, its room and its temperature on a plate and hides what
 * it holds behind a question mark; the scale gives its weight. The amount has to be worked out.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, tank, numCard, scaleFixture, plaqueFixture, markerFixture, markerRead, rigAt, cylRead, whereIs, tankRead, tankMoles, tankGrams,
  pelletPiece, pelletMoles, volumeIdeal, ATM_KPA, R, R_ATM, GASES, pressureIdeal
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmolar volume\b/i, introducedAt: 1 },
  { term: /\bgas constant\b/i, introducedAt: 2 },
  { term: /\bideal gas law\b/i, introducedAt: 2 }
];

/** Pressure, kelvin, the three laws and the mole are plain words from here on. */
export const BUILDS_ON = ['unit04/q2-laws', 'unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const RIG = 'rig';
const STP = 273.15;

/** The tank of stage 3: argon at 300 K in 20 L, its gauge the pressure of four moles. */
export const ARGON = { gas: 'Ar', n: 4, V: 20, T: 300 };
/** The sealed gas of stage 5, and what stage 6's three tanks hold (same room, pressure and temperature, so the same amount). */
export const UNKNOWN = { gas: 'CO2', n: 0.5, V: 10, T: 300 };
export const SAME = { V: 10, T: 300, n: 0.4 };
/** The pellet of stage 7 sits in the acid dish at 25 °C and one atmosphere. */
export const PELLET_T = 298.15;

const NUMS = (cards, y, x0 = 84, step = 18) => cards.map(([id, label, v], i) => numCard(id, label, { x: x0 + i * step, y }, v));

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'One mole fills the same room, whichever gas it is.',
        title: 'Molar Volume',
        body: 'One mole of any gas fills about 22.4 litres at 0 °C and one atmosphere. This volume is the molar volume of a gas, and the two cylinders show it is the same for light helium and heavy carbon dioxide.'
      }
  },
  {
      reward: {
        log: 'One number ties every reading together.',
        title: 'The Gas Constant',
        body: 'Pressure times volume, divided by amount times temperature, comes to 8.31 for every reading in these units. That number is the gas constant R, and the whole relation, PV = nRT, is the ideal gas law.'
      }
  },
  {
      reward: {
        log: 'A sealed tank counted from its gauge.',
        title: 'Counting From a Gauge',
        body: 'Rearranged, the law gives the amount of gas: n equals PV over RT. A sealed tank can be counted with nothing but its gauge, its volume and its thermometer.'
      }
  },
  {
      reward: {
        log: 'R follows the unit of the gauge.',
        title: 'R Follows the Unit',
        body: 'R has a different value for each unit of pressure: 8.31 with kilopascals and 0.0821 with atmospheres. Use the value whose units match the gauge, or the answer is out by the conversion factor.'
      }
  },
  {
      reward: {
        log: 'A gas named by its weight and its readings.',
        title: 'Molar Mass From a Gas',
        body: 'The amount of gas comes from the gas law, and the molar mass is the mass on the scale divided by that amount. Pressure, volume, temperature and mass are enough to name a gas.'
      }
  },
  {
      reward: {
        log: 'Equal amounts fill equal volumes, so the heavier gas is the denser.',
        title: 'Gas Density',
        body: 'At the same temperature and pressure, equal amounts of any gas fill the same volume, so the heavier the particles the denser the gas. Gas density rises with molar mass and with pressure, and falls as the temperature rises.'
      }
  },
  {
      reward: {
        log: 'A volume of gas from a mass of solid.',
        title: 'Gas From a Reaction',
        body: 'The balanced equation gives the moles of gas for each mole of solid, and the gas law turns those moles into a volume at the conditions you choose. The same pellet fills a different volume at a different temperature or pressure.'
      }
  },
  {
      reward: {
        log: 'The room is mostly empty space.',
        title: 'Why the Volume Is Shared',
        body: 'Gas particles are so far apart that the room is almost all empty space, so the volume depends on how many particles there are and not on what they are. That is why one mole of any gas fills the same volume at the same temperature and pressure.',
        last: true
      }
  }
];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = rig('ra', { x: 20, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', n: 1, hold: 'P', V: 20, T: STP, P0: ATM_KPA }], vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true }
    });
    const b = rig('rb', { x: 58, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder B', gas: 'CO2', hold: 'P', V: 20, T: STP, P0: ATM_KPA }], amounts: [0.5, 1, 1.5, 2], amountStart: 1, vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true }
    });
    return {
      title: 'One Mole',
      briefing: { speaker: SPEAKER, body: 'Both cylinders stand at 0 °C under a weight of one atmosphere, and each prints the mass of the gas in it. Press Submit when the table shows your answer.' },
      prompt: 'Add gas to Cylinder B until it fills the same room as Cylinder A.',
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Gas in dial and watch its volume beside Cylinder A\'s.',
        'Compare the volumes, and the masses of gas the two cylinders print, at each setting.',
        'Stop on the setting where the two volumes match.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.amount.value) === 1) return { ok: false, notYet: true, msg: 'Cylinder B\'s dial is where it started: add gas and watch the volume.' };
        const va = cylRead(t, 'ra', 0).V;
        const vb = cylRead(t, 'rb', 0).V;
        if (Math.abs(vb - va) < 0.05) return { ok: true };
        return { ok: false, msg: vb < va ? 'Cylinder B fills less room than Cylinder A: add more gas.' : 'Cylinder B fills more room than Cylinder A: take some gas out.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 28 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 1, hold: 'dial', V: 22.4, T: STP }], volumes: [11.2, 22.4, 44.8], volumeStart: 2,
      temps: [0, 27, 127], tempList: 'C', tempStart: 1, amounts: [1, 2], amountStart: 1, vmax: 44.8, show: { kelvin: true }, plot: { x: 'nT', y: 'PV' }
    });
    const cards = [['n831', '8.31', 8.31], ['n0831', '0.0831', 0.0831], ['n83', '83.1', 83.1], ['n101', '101.3', 101.3]];
    return {
      title: 'The Same Number',
      prompt: 'Find what pressure times volume, divided by amount times kelvin, comes to, and put its card in the slot.',
      widget,
      table: gasTable({
        pieces: NUMS(cards, 38),
        fixtures: [r],
        zones: { slots: [{ id: 'answer', label: 'It comes to', at: { x: 111, y: 52 }, size: { w: 22, h: 11 } }] },
        tools: ['straightedge']
      }, { recorder: { at: { x: 111, y: 17 }, size: { w: 40, h: 24 }, xLabel: 'n x T', xUnit: 'mol K', yLabel: 'P x V', yUnit: 'kPa L' } }),
      hints: [
        'Record readings at several settings of all three dials.',
        'Lay the straightedge across the points and compare pressure times volume with amount times kelvin.',
        'Divide pressure times volume by amount times kelvin for any one reading.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (Math.abs(card.props.value - R) < 0.01) return { ok: true };
        return { ok: false, msg: 'Record a reading and divide pressure times volume by amount times kelvin yourself: is the quotient that card?' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const P = pressureIdeal(ARGON.n, ARGON.T, ARGON.V);
    return {
      title: 'A Sealed Tank',
      prompt: 'Set the marker to the number of moles of argon in the sealed tank.',
      widget,
      table: gasTable({
        pieces: [tank('t', 'TANK A', { x: 30, y: 30 }, { gas: ARGON.gas, P, V: ARGON.V, T: ARGON.T, plate: true, gaugeMax: 900 })],
        fixtures: [
          plaqueFixture('r', 'The gas constant', { x: 90, y: 14 }, ['R = 8.31 kPa·L per mol·K'], { w: 52 }),
          markerFixture('moles', 'Moles of argon in the tank', { x: 90, y: 44 }, { min: 0, max: 10, step: 1, start: 0, unit: 'mol', w: 52 })
        ]
      }),
      hints: [
        'Read the tank\'s gauge, its room and its temperature from its plate.',
        'Compare those three readings with the constant on the plaque.',
        'Divide the gauge reading times the room by the constant times the temperature.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'moles');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the amount you worked out.' };
        if (Math.abs(v - tankMoles(t.pieces.t)) <= 0.5) return { ok: true };
        return { ok: false, msg: 'Check the working: multiply the gauge reading by the room, then divide by the constant times the temperature.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 27 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 1, hold: 'dial', V: 22.4, T: STP }], volumes: [11.2, 22.4, 44.8], volumeStart: 2,
      temps: [0, 27, 127], tempList: 'C', tempStart: 1, vmax: 44.8, units: 'atm', show: { kelvin: true }, plot: { x: 'nT', y: 'PVatm' }
    });
    const cards = [['n831', '8.31', 8.31], ['n0821', '0.0821', 0.0821], ['n624', '62.4', 62.4], ['n101', '101.3', 101.3]];
    return {
      title: 'Which R',
      prompt: 'Find what the same quotient comes to for a gauge that reads atmospheres, and put its card in the slot.',
      widget,
      table: gasTable({
        pieces: NUMS(cards, 38),
        fixtures: [r],
        zones: { slots: [{ id: 'answer', label: 'It comes to', at: { x: 111, y: 52 }, size: { w: 22, h: 11 } }] },
        tools: ['straightedge']
      }, { recorder: { at: { x: 111, y: 17 }, size: { w: 40, h: 24 }, xLabel: 'n x T', xUnit: 'mol K', yLabel: 'P x V', yUnit: 'atm L' } }),
      hints: [
        'Record readings at several settings, reading the gauge in atmospheres this time.',
        'Compare pressure times volume with amount times kelvin for any one reading.',
        'Divide the atmosphere reading times the room by the amount times kelvin.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (Math.abs(card.props.value - R_ATM) < 0.0005) return { ok: true };
        return { ok: false, msg: 'Record a reading and divide the gauge reading times the room by amount times kelvin yourself: is the quotient that card?' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sc = scaleFixture('scale', { x: 24, y: 22 }, { w: 42, h: 30 });
    const trays = [['ch4', 'CH₄'], ['n2', 'N₂'], ['o2', 'O₂'], ['co2', 'CO₂']];
    return {
      title: 'Name the Gas',
      prompt: 'Put the sealed tank in the tray for the gas it holds.',
      widget,
      table: gasTable({
        pieces: [tank('t', 'TANK A', { x: 60, y: 22 }, { gas: UNKNOWN.gas, n: UNKNOWN.n, V: UNKNOWN.V, T: UNKNOWN.T, sealed: true, plate: true, gaugeMax: 300 })],
        fixtures: [sc.fixture, plaqueFixture('ref', 'Constants', { x: 100, y: 22 }, ['R = 8.31 kPa·L per mol·K', 'Molar masses, g/mol:', 'CH₄ 16.0  N₂ 28.0  O₂ 32.0  CO₂ 44.0'], { w: 58 })],
        zones: {
          slots: sc.slots,
          trays: trays.map(([id, label], i) => ({ id, label, at: { x: 20 + i * 35, y: 52 }, size: { w: 30, h: 20 }, cell: 15 }))
        }
      }),
      hints: [
        'Weigh the tank on the scale and read its gauge, its room and its temperature from its plate.',
        'Work out how many moles the tank holds, then how much one mole of its gas weighs.',
        'Compare the weight of one mole with the molar masses on the plaque.'
      ],
      check(state) {
        const t = state.table;
        const tray = whereIs(t, 't');
        if (!['ch4', 'n2', 'o2', 'co2'].includes(tray)) return { ok: false, notYet: true, msg: 'Put the tank in a tray.' };
        if (tray === UNKNOWN.gas.toLowerCase()) return { ok: true };
        return { ok: false, msg: 'Weigh the tank, work out its moles from its plate, and divide the mass by the moles: does that match the molar mass of the gas in that tray?' };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const sc = scaleFixture('scale', { x: 24, y: 22 }, { w: 42, h: 30 });
    const same = (gas) => ({ gas, n: SAME.n, V: SAME.V, T: SAME.T, sealed: true, plate: true, gaugeMax: 300 });
    return {
      title: 'Same Conditions',
      prompt: 'Put the three tanks on the rail from the densest gas to the least dense.',
      widget,
      table: gasTable({
        pieces: [
          tank('a', 'TANK A', { x: 84, y: 56 }, same('N2')), tank('b', 'TANK B', { x: 106, y: 56 }, same('CO2')), tank('c', 'TANK C', { x: 128, y: 56 }, same('He'))
        ],
        fixtures: [sc.fixture],
        zones: {
          slots: sc.slots,
          rail: { id: 'rail', at: { x: 106, y: 40 }, size: { w: 70, h: 20 }, first: 'Densest', last: 'Least dense', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] }
        }
      }),
      hints: [
        'Weigh each tank on the scale and read what its plate says.',
        'Compare the weights of tanks that hold the same room at the same pressure and temperature.',
        'Put the heaviest tank at the dense end of the rail and the lightest at the other end.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three tanks on the rail.' };
        const want = ['a', 'b', 'c'].sort((x, y) => tankGrams(t.pieces[y]) - tankGrams(t.pieces[x]));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Weigh each tank: tanks that fill the same room at the same pressure and temperature differ in how much their gas weighs.' };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const r = rig(RIG, { x: 36, y: 22 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'CO2', hold: 'P', V: 20, T: PELLET_T, P0: ATM_KPA }], pellet: 'acid', vmax: 3, show: { volume: false, amount: false },
      title: 'Cylinder under a free piston'
    });
    return {
      title: 'A Gas From a Solid',
      prompt: 'Drop the pellet in the acid dish, then set the marker to the room the gas it gives fills, in litres.',
      widget,
      table: gasTable({
        pieces: [pelletPiece('pellet', { x: 22, y: 50 }, 5.0)],
        fixtures: [
          r,
          plaqueFixture('ref', 'The reaction', { x: 110, y: 14 }, ['CaCO₃ → CaO + CO₂', 'Molar mass of CaCO₃: 100.1 g/mol', 'R = 8.31 kPa·L per mol·K'], { w: 62 }),
          markerFixture('litres', 'Room the gas fills', { x: 110, y: 50 }, { min: 0, max: 3, step: 0.05, start: 0, unit: 'L', w: 52 })
        ],
        zones: { slots: [{ id: 'acid', label: 'Acid dish', at: { x: 56, y: 50 }, size: { w: 20, h: 11 } }] }
      }),
      hints: [
        'Put the pellet in the acid dish and watch the piston.',
        'Work out the moles of gas the pellet makes from its mass and the equation, then apply the gas law at the gauge and temperature shown.',
        'Divide the amount times the constant times the temperature by the pressure.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'litres');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the room you worked out.' };
        const want = volumeIdeal(pelletMoles(5.0), PELLET_T, ATM_KPA);
        if (Math.abs(v - want) <= 0.04) return { ok: true };
        return { ok: false, msg: 'Check the working: moles from the pellet\'s mass and molar mass first, then room from the gas law at the gauge reading and the temperature.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const mk = (id, label, gas, P, V, T, at, extra = {}) => tank(id, label, at, { gas, P, V, T, plate: true, gaugeMax: 300, ...extra });
    const tray = (id, label, x) => ({ id, label, at: { x, y: 24 }, size: { w: 46, h: 24 }, cell: 15 });
    return {
      title: 'Why the Same',
      prompt: 'Put each tank in the tray for how many particles it holds compared with Tank A.',
      widget,
      table: gasTable({
        pieces: [
          mk('a', 'TANK A', 'He', 100, 10, 300, { x: 14, y: 52 }, { fixed: true }),
          mk('b', 'TANK B', 'Xe', 100, 10, 300, { x: 44, y: 52 }),
          mk('c', 'TANK C', 'N2', 100, 20, 300, { x: 68, y: 52 }),
          mk('d', 'TANK D', 'Ar', 50, 10, 300, { x: 92, y: 52 }),
          mk('e', 'TANK E', 'Ne', 100, 10, 300, { x: 116, y: 52 })
        ],
        zones: { trays: [tray('fewer', 'Fewer particles', 25), tray('same', 'The same number', 75), tray('more', 'More particles', 125)] }
      }),
      hints: [
        'Read the gauge, the room and the temperature on each tank.',
        'Compare each tank\'s three readings with Tank A\'s.',
        'Count a tank as holding the same number of particles only if its gauge times its room over its temperature matches Tank A\'s.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['b', 'c', 'd', 'e'];
        if (!ids.every(id => ['fewer', 'same', 'more'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Put every tank in a tray.' };
        const nA = tankMoles(t.pieces.a);
        for (const id of ids) {
          const ratio = tankMoles(t.pieces[id]) / nA;
          const want = Math.abs(ratio - 1) < 1e-6 ? 'same' : ratio > 1 ? 'more' : 'fewer';
          if (whereIs(t, id) !== want) return { ok: false, msg: 'Compare that tank\'s gauge, room and temperature with Tank A\'s: does the gas law give the same number of moles?' };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn Cylinder B\'s Gas in dial.'],
  2: ['Record readings, lay the straightedge,', 'then drag a card into the slot.'],
  3: ['Set the marker to the amount you work out.'],
  4: ['Record readings, lay the straightedge,', 'then drag a card into the slot.'],
  5: ['Drag the tank onto the scale pan to weigh it,', 'then into a tray.'],
  6: ['Drag a tank onto the scale pan to weigh it,', 'then onto the rail.'],
  7: ['Drag the pellet into the acid dish.'],
  8: ['Drag each tank into a tray.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Pressure times volume divided by amount times temperature is one number for every gas, and with it any one of the four quantities can be found from the other three. A mole of any gas fills the same room because the room is nearly all empty space.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The ideal gas law counts what a gauge cannot show: how much gas is in a sealed tank, what it weighs per mole, how much a reaction gives off.'
    },
    {
      heading: 'Next',
      body: 'The next bench puts more than one gas in the tank and asks what each one is doing.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the volume of 2.00 mol of an ideal gas at 0 °C and 1 atm?',
    options: [
      { id: 'a', label: '44.8 L' },
      { id: 'b', label: '22.4 L' },
      { id: 'c', label: '11.2 L' },
      { id: 'd', label: '4.48 L' }
    ],
    answer: 'a',
    explanation: 'The molar volume of a gas at 0 °C and 1 atm is 22.4 L, so 2.00 mol fills 44.8 L.'
  },
  {
    question: 'How many moles of gas are in a 5.00 L tank at 3.00 atm and 300 K? (R = 0.0821 L·atm/mol·K)',
    options: [
      { id: 'a', label: '0.609 mol' },
      { id: 'b', label: '1.64 mol' },
      { id: 'c', label: '6.09 mol' },
      { id: 'd', label: '0.0609 mol' }
    ],
    answer: 'a',
    explanation: 'n = PV/RT = (3.00 × 5.00) / (0.0821 × 300) = 0.609 mol.'
  },
  {
    question: 'A 0.500 mol sample of an unknown gas has a mass of 22.0 g. Which gas is it likely to be?',
    options: [
      { id: 'a', label: 'CO₂' },
      { id: 'b', label: 'O₂' },
      { id: 'c', label: 'N₂' },
      { id: 'd', label: 'CH₄' }
    ],
    answer: 'a',
    explanation: 'The molar mass is 22.0 g / 0.500 mol = 44.0 g/mol, which is carbon dioxide.'
  },
  {
    question: 'At the same temperature and pressure, which gas is the densest?',
    options: [
      { id: 'a', label: 'CO₂' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'He' },
      { id: 'd', label: 'H₂' }
    ],
    answer: 'a',
    explanation: 'Equal amounts of any gas fill equal volumes, so density follows molar mass. CO₂, at 44.0 g/mol, is the heaviest of these.'
  },
  {
    question: 'Why do equal moles of different gases fill the same volume at the same temperature and pressure?',
    options: [
      { id: 'a', label: 'The particles are very small compared with the distances between them' },
      { id: 'b', label: 'All gas particles have the same mass' },
      { id: 'c', label: 'All gas particles have the same size' },
      { id: 'd', label: 'Heavier particles are more tightly packed' }
    ],
    answer: 'a',
    explanation: 'The room a gas takes is almost all empty space, so the volume depends on the number of particles and not on their size or mass.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const weigh = id => put(id, 'slot:scale.pan');

export const SOLUTIONS = [
  [dial('rb', 'amount', 2)],
  [{ run: RIG }, dial(RIG, 'temp', 2), { run: RIG }, dial(RIG, 'amount', 2), { run: RIG }, dial(RIG, 'volume', 3), { run: RIG },
    { lay: { kind: 'straightedge', through: [0, 3] } }, put('n831', 'slot:answer')],
  [dial('moles', 'value', 4)],
  [{ run: RIG }, dial(RIG, 'temp', 2), { run: RIG }, dial(RIG, 'volume', 3), { run: RIG }, { lay: { kind: 'straightedge', through: [0, 2] } }, put('n0821', 'slot:answer')],
  [weigh('t'), put('t', 'tray:co2')],
  [weigh('a'), weigh('b'), weigh('c'), put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')],
  [put('pellet', 'slot:acid'), dial('litres', 'value', 1.2)],
  [...sort({ b: 'same', c: 'more', d: 'fewer', e: 'same' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('rb', 'amount', 4)],
  [{ run: RIG }, put('n83', 'slot:answer')],
  [dial('moles', 'value', 2)],
  [{ run: RIG }, put('n831', 'slot:answer')],
  [weigh('t'), put('t', 'tray:o2')],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2')],
  [put('pellet', 'slot:acid'), dial('litres', 'value', 3)],
  [...sort({ b: 'more', c: 'same', d: 'fewer', e: 'same' })]
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
export { rigAt, cylRead, tankRead, tankMoles, tankGrams, pelletMoles, volumeIdeal, GASES, R, R_ATM, ATM_KPA };
