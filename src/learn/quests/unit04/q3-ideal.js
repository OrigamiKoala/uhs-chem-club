/**
 * q3-ideal.js — Bellows, bench three: THE IDEAL GAS LAW.
 *
 * Bench two found four relations, each with one thing held fixed. This one lets
 * nothing be fixed and finds the single number that ties all four together. It
 * starts where chemistry starts counting: one mole of gas in a cylinder, and how
 * much room it takes.
 *
 *   1  what one mole fills at 0 °C and one atmosphere        -> molar volume
 *   2  the one number every logged reading gives             -> gas constant, ideal gas law
 *   3  the amount of gas in a sealed tank, from its gauge    -> (n = PV / RT)
 *   4  which R goes with a gauge in atmospheres              -> (R follows the unit)
 *   5  naming a gas by its weight and its readings           -> (molar mass from the gas law)
 *   6  three gases, ordered by how dense they are            -> (density follows molar mass)
 *   7  the gas a pellet of limestone gives off               -> (moles from the equation, volume from the law)
 *   8  why every gas has the same molar volume               -> (particle size does not set the room)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2 prints a log of four readings from the rig
 * (different pressures, volumes, amounts and temperatures) and the constant is the
 * one thing they share; stage 4 prints a log in atmospheres, so the SECOND value of
 * R is found the same way as the first. A sealed tank (stages 3 and 5) hides its
 * amount behind hatching and prints only what the gauge, the thermometer, the
 * volume and the scale can say, so the amount has to be worked out.
 *
 * EVERY STAGE IS A FIGHT against gas bladders. No `check()` knows any of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, planGas, GASES, R, R_ATM, ATM_KPA, ZERO_C, pressureIdeal, volumeIdeal, sig } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmolar volume\b/i, introducedAt: 1 },
  { term: /\bgas constant\b/i, introducedAt: 2 },
  { term: /\bideal gas law\b/i, introducedAt: 2 }
];

/** Pressure, kelvin, the three laws and the mole are plain words from here on. */
export const BUILDS_ON = ['unit04/q2-laws', 'unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 300, V: 20, hold: 'V', ...extra
});
const choice = (id, label) => ({ id, label });

/** Pressure in kPa, the thermometer in kelvin and degrees, from the first stage of the bench. */
const BASE = { scale: 'kpa', units: true, labels: { gauge: 'PRESSURE' }, tempUnit: 'both' };

/** A logged reading, written exactly as the bench would read it. */
function logLine(n, T, V, unit = 'kPa') {
  const P = pressureIdeal(n, T, V);
  const p = unit === 'atm' ? `${(P / ATM_KPA).toFixed(2)} atm` : `${P.toFixed(1)} kPa`;
  return `${p}, ${V.toFixed(2)} L, ${n.toFixed(2)} mol, ${T.toFixed(0)} K`;
}

/** Four readings taken at four different states, and the one number they share. */
const LOG_KPA = [
  logLine(1, 273.15, 22.414),
  logLine(1, 273.15, 11.207),
  logLine(1, 300, 24.62),
  logLine(2, 273.15, 22.414)
];
const LOG_ATM = [
  logLine(1, 273.15, 22.414, 'atm'),
  logLine(1, 273.15, 11.207, 'atm'),
  logLine(1, 300, 24.62, 'atm')
];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'One Mole',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench meters gas into a cylinder by the mole and reads what it does under any weight, heat or room. A sealed tank keeps its amount to itself, and everything else on its plate is for you to work from.'
    },
    prompt: 'Say what volume one mole of gas fills at 0 °C and a pressure of one atmosphere.',
    controls: ['add', 'remove', 'reset'],
    step: 0.5, nMin: 0.5, nMax: 3,
    ...BASE,
    show: { mass: true, molar: true, knocks: false },
    vmax: 70, gaugeMax: 200,
    rigs: [
      cyl('a', 'CYLINDER A', 'He', { n: 0.5, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of helium under a free piston' }),
      cyl('b', 'CYLINDER B', 'CO2', { n: 0.5, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of carbon dioxide under a free piston' })
    ],
    widget: {
      type: 'choice', label: 'One mole fills',
      options: [choice('22.4', '22.4 L'), choice('11.2', '11.2 L'), choice('24.8', '24.8 L'), choice('44.8', '44.8 L')]
    },
    hints: [
      'Add gas to both cylinders and read the amount on each plate.',
      'Compare the volume each cylinder fills when it holds exactly one mole.',
      'Read the volume of either cylinder at the moment its plate reads an amount of one mole.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a volume.' };
      if (state.choice === '22.4') return { ok: true };
      return { ok: false, msg: 'Check the amount on the plate when you read the volume, and the temperature the gas is at.' };
    },
    reward: {
      log: 'One mole fills the same room, whichever gas it is.',
      title: 'Molar Volume',
      body: 'One mole of any gas fills about 22.4 litres at 0 °C and one atmosphere. This volume is the molar volume of a gas, and the two cylinders show it is the same for light helium and heavy carbon dioxide.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Same Number',
    prompt: 'Find the number that every reading in the log gives.',
    controls: ['volume', 'temp', 'add', 'remove', 'reset'],
    volumes: [11.2, 22.4, 44.8], volumeStart: 2,
    temps: [0, 27, 127], tempStart: 1, tempList: 'C',
    step: 1, nMin: 1, nMax: 2,
    ...BASE,
    show: { knocks: false },
    reference: LOG_KPA,
    vmax: 44.8, gaugeMax: 700,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { T: ZERO_C, V: 22.4, hold: 'dial', note: 'a cylinder of nitrogen' })],
    widget: {
      type: 'choice', label: 'The same number',
      options: [choice('8.31', '8.31'), choice('0.0831', '0.0831'), choice('83.1', '83.1'), choice('101.3', '101.3')]
    },
    hints: [
      'Read the four logged readings and then take readings of your own on the cylinder.',
      'Compare how pressure, volume, amount and temperature change together from one reading to the next.',
      'Combine the four figures of one reading so that the result is the same for every reading in the log.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a number.' };
      if (state.choice === '8.31') return { ok: true };
      if (state.choice === '101.3') return { ok: false, msg: 'That is a pressure that appears in the log, and the figures in the log do not all share it.' };
      return { ok: false, msg: 'Work one reading through and check the result against another; the number must come out the same each time.' };
    },
    reward: {
      log: 'One number ties every reading together.',
      title: 'The Gas Constant',
      body: 'Pressure times volume, divided by amount times temperature, comes to 8.31 for every reading in these units. That number is the gas constant R, and the whole relation, PV = nRT, is the ideal gas law.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'A Sealed Tank',
    prompt: 'Give the amount of gas in the sealed tank, in moles.',
    controls: ['temp'],
    temps: [300, 350, 400, 450], tempStart: 1, tempList: 'K',
    ...BASE,
    reference: ['R = 8.31 kPa·L per mol·K'],
    vmax: 20, gaugeMax: 900,
    rigs: [cyl('a', 'TANK A', 'Ar', { n: 4, T: 300, V: 20, hold: 'V', sealed: true, note: 'a sealed tank of argon' })],
    widget: { type: 'number', label: 'Moles in the tank', min: 1, max: 10, step: 1 },
    hints: [
      'Read the gauge, the volume and the thermometer, and heat the tank to take more readings.',
      'Compare readings at two temperatures to check that the amount you work out does not change.',
      'Rearrange the gas law to put the amount on its own and work it out from the pressure, the volume, R and the kelvin temperature.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the amount.' };
      const r = readOf(STAGES[2], 'a', {});
      if (state.number === Math.round(r.n)) return { ok: true };
      return { ok: false, msg: 'Check your arithmetic against a second reading taken at another temperature; the amount must not change with it.' };
    },
    reward: {
      log: 'A sealed tank counted from its gauge.',
      title: 'Counting From a Gauge',
      body: 'Rearranged, the law gives the amount of gas: n equals PV over RT. A sealed tank can be counted with nothing but its gauge, its volume and its thermometer.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which R',
    prompt: 'Say which value of R goes with a gauge that reads in atmospheres.',
    controls: ['volume'],
    volumes: [11.2, 22.4, 44.8], volumeStart: 2,
    labels: { gauge: 'PRESSURE' }, scale: 'atm', units: true, tempUnit: 'both',
    reference: LOG_ATM,
    show: { knocks: false },
    vmax: 44.8, gaugeMax: 250,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { T: ZERO_C, V: 22.4, hold: 'dial', note: 'a cylinder of nitrogen with a gauge in atmospheres' })],
    widget: {
      type: 'choice', label: 'The value of R',
      options: [choice('8.31', '8.31'), choice('0.0821', '0.0821'), choice('62.4', '62.4'), choice('101.3', '101.3')]
    },
    hints: [
      'Read the three logged readings, which are in atmospheres this time.',
      'Work out the same number from them that you found on the bench before, using these figures.',
      'Divide pressure times volume by amount times temperature for one logged reading and take the result as R.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === '0.0821') return { ok: true };
      if (state.choice === '8.31') return { ok: false, msg: 'That value of R belongs with a gauge in kilopascals; these readings are in a different unit.' };
      return { ok: false, msg: 'Work the logged readings through: R is whatever number they all give in these units.' };
    },
    reward: {
      log: 'R follows the unit of the gauge.',
      title: 'R Follows the Unit',
      body: 'R has a different value for each unit of pressure: 8.31 with kilopascals and 0.0821 with atmospheres. Use the value whose units match the gauge, or the answer is out by the conversion factor.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Name the Gas',
    prompt: 'Name the gas in the sealed tank.',
    controls: ['temp'],
    temps: [300, 400], tempStart: 1, tempList: 'K',
    ...BASE,
    show: { mass: true },
    reference: ['R = 8.31 kPa·L per mol·K', 'Molar masses in g/mol: CH₄ 16.0, N₂ 28.0, O₂ 32.0, CO₂ 44.0'],
    vmax: 10, gaugeMax: 400,
    rigs: [cyl('a', 'TANK A', 'CO2', { n: 0.5, T: 300, V: 10, hold: 'V', sealed: true, note: 'a sealed tank of an unnamed gas' })],
    widget: {
      type: 'choice', label: 'The gas is',
      options: [choice('CH4', 'CH₄'), choice('N2', 'N₂'), choice('O2', 'O₂'), choice('CO2', 'CO₂')]
    },
    hints: [
      'Read the gauge, the volume, the thermometer and the scale for the tank.',
      'Work out the amount of gas from the readings, then compare the mass on the scale with it.',
      'Divide the mass of the gas by its amount in moles and match the result to the molar masses on the plate.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a gas.' };
      if (state.choice === 'CO2') return { ok: true };
      return { ok: false, msg: 'Work out the amount of gas first, then divide the mass on the scale by it and compare with the molar masses listed.' };
    },
    reward: {
      log: 'A gas named by its weight and its readings.',
      title: 'Molar Mass From a Gas',
      body: 'The amount of gas comes from the gas law, and the molar mass is the mass on the scale divided by that amount. Pressure, volume, temperature and mass are enough to name a gas.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Conditions',
    prompt: 'Put the three gases in order of density, densest first.',
    controls: ['temp'],
    temps: [0, 100, 200], tempStart: 1, tempList: 'C',
    ...BASE,
    show: { mass: true, knocks: false },
    vmax: 40, gaugeMax: 200,
    rigs: [
      cyl('a', 'CYLINDER A', 'He', { n: 1, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of helium under a free piston' }),
      cyl('b', 'CYLINDER B', 'N2', { n: 1, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of nitrogen under a free piston' }),
      cyl('c', 'CYLINDER C', 'CO2', { n: 1, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of carbon dioxide under a free piston' })
    ],
    widget: {
      type: 'order', label: 'Densest first',
      items: [{ id: 'a', label: 'Cylinder A' }, { id: 'b', label: 'Cylinder B' }, { id: 'c', label: 'Cylinder C' }]
    },
    hints: [
      'Read the volume and the mass on all three plates, and turn the temperature dial to see how they change.',
      'Compare the volumes the three cylinders fill with the masses they hold.',
      'Divide the mass by the volume for each cylinder and put the largest quotient first.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders in order.' };
      const dens = id => { const r = readOf(STAGES[5], id, {}); return r.mass / r.V; };
      const want = ['a', 'b', 'c'].sort((x, y) => dens(y) - dens(x));
      if (state.order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Density is mass over volume: compare both columns on each plate, not only the mass.' };
    },
    reward: {
      log: 'Equal amounts fill equal volumes, so the heavier gas is the denser.',
      title: 'Gas Density',
      body: 'At the same temperature and pressure, equal amounts of any gas fill the same volume, so the heavier the particles the denser the gas. Gas density rises with molar mass and with pressure, and falls as the temperature rises.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'A Gas From a Solid',
    prompt: 'Give the volume of gas this pellet gives off at 25 °C and one atmosphere.',
    controls: ['drop', 'reset'],
    keys: { drop: 'Drop Pellet' },
    ...BASE,
    show: { knocks: false },
    reference: [
      'Pellet: 5.00 g of CaCO₃, molar mass 100.1 g/mol',
      'CaCO₃ → CaO + CO₂, one mole of gas for each mole of solid',
      'R = 8.31 kPa·L per mol·K'
    ],
    vmax: 3, gaugeMax: 200,
    rigs: [cyl('a', 'CYLINDER A', 'CO2', { n: 0, T: 298.15, hold: 'P', P0: ATM_KPA, charge: false, note: 'an empty cylinder under a free piston, with a pellet port' })],
    widget: {
      type: 'choice', label: 'The gas fills',
      options: [choice('1.22', '1.22 L'), choice('0.0500', '0.0500 L'), choice('2.44', '2.44 L'), choice('12.2', '12.2 L')]
    },
    hints: [
      'Work out how many moles of solid the pellet is, and press "Drop Pellet" to watch what the cylinder does.',
      'Compare the moles of gas the equation gives with the moles of solid you started with.',
      'Put the moles of gas into the gas law with the temperature in kelvin and the pressure in the same units as R.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a volume.' };
      if (state.choice === '1.22') return { ok: true };
      if (state.choice === '0.0500') return { ok: false, msg: 'That is an amount of gas in moles; the question asks for the room it fills.' };
      return { ok: false, msg: 'Check the number of moles in the pellet, and that the temperature in the gas law is in kelvin.' };
    },
    reward: {
      log: 'A volume of gas from a mass of solid.',
      title: 'Gas From a Reaction',
      body: 'The balanced equation gives the moles of gas for each mole of solid, and the gas law turns those moles into a volume at the conditions you choose. The same pellet fills a different volume at a different temperature or pressure.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Why the Same',
    prompt: 'Say why one mole of any gas fills the same volume at one temperature and pressure.',
    controls: ['temp'],
    temps: [0, 100], tempStart: 1, tempList: 'C',
    ...BASE,
    show: { mass: true, knocks: false },
    vmax: 40, gaugeMax: 200,
    rigs: [
      cyl('a', 'CYLINDER A', 'He', { n: 1, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of helium under a free piston' }),
      cyl('b', 'CYLINDER B', 'Xe', { n: 1, T: ZERO_C, hold: 'P', P0: ATM_KPA, note: 'a cylinder of xenon under a free piston' })
    ],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('space', 'The particles are tiny next to the space between them, so what they are does not set the volume'),
        choice('heavy', 'Heavier particles are packed more closely together'),
        choice('bigger', 'Bigger particles push each other apart and fill more room'),
        choice('chance', 'It happens only for these two gases')
      ]
    },
    hints: [
      'Read the volume and the mass of both cylinders, then turn the temperature dial.',
      'Compare how much each particle weighs with how much room each cylinder fills.',
      'Look at how much of each window is particles and how much is empty space, and ask whether the weight of a particle changes the room it needs.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'space') return { ok: true };
      if (state.choice === 'heavy') return { ok: false, msg: 'The two cylinders hold very different masses yet fill the same volume, so weight is not packing them.' };
      if (state.choice === 'bigger') return { ok: false, msg: 'Look at the windows: the particles are far smaller than the gaps between them.' };
      return { ok: false, msg: 'Try the temperature dial and compare the two cylinders again; they keep matching.' };
    },
    reward: {
      log: 'The room is mostly empty space.',
      title: 'Why the Volume Is Shared',
      body: 'Gas particles are so far apart that the room is almost all empty space, so the volume depends on how many particles there are and not on what they are. That is why one mole of any gas fills the same volume at the same temperature and pressure.'
    }
  }
];

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
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: '22.4' },
  { choice: '8.31' },
  { number: 4 },
  { choice: '0.0821' },
  { choice: 'CO2' },
  { order: ['c', 'b', 'a'] },
  { choice: '1.22' },
  { choice: 'space' }
];

export const MISSES = [
  { choice: '11.2' },
  { choice: '83.1' },
  { number: 2 },
  { choice: '8.31' },
  { choice: 'O2' },
  { order: ['a', 'b', 'c'] },
  { choice: '12.2' },
  { choice: 'heavy' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...gasState(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  return mountGas(container, ctx, {
    STAGES, DEBRIEF, toolNoteFor, blankState,
    tools: {
      // The pellet gives off its moles of gas, from the mass on the plate and the equation beside it.
      drop: ({ bench }) => bench.gasTo('a', PELLET_MOLES)
    }
  });
}

/** 5.00 g of CaCO3 at 100.09 g/mol, one mole of gas for each mole of solid. */
export const PELLET = { gramsOfSolid: 5.00, molarMass: 100.09 };
const PELLET_MOLES = PELLET.gramsOfSolid / PELLET.molarMass;

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { readOf, planGas, GASES, R, R_ATM, volumeIdeal, sig, PELLET, LOG_KPA, LOG_ATM };
