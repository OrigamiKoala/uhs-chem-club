/**
 * q2-laws.js — Bellows, bench two: THE GAS LAWS.
 *
 * Bench one found out what a gauge measures. This one changes ONE thing on the rig
 * at a time and reads how the others answer, which is the whole of how the gas
 * laws were found: squeeze it, warm it in a sealed tank, warm it under a free
 * piston, add to it. Each law arrives on the card after the player has watched it
 * happen, and the last stage puts all of them in one sum.
 *
 *   1  a quarter of the room, the same temperature         -> Boyle's law
 *   2  why the knocks double when the room halves          -> inversely proportional
 *   3  tripling the kelvin temperature at steady pressure  -> Charles's law
 *   4  why the line reaches zero in kelvin and not in °C   -> (the kelvin scale is a count from zero)
 *   5  heating a sealed tank by half again                 -> Gay-Lussac's law
 *   6  doubling the gas at the same temperature and weight -> Avogadro's law
 *   7  pressure and temperature both changed               -> combined gas law
 *   8  four gauge records, sorted by what each held fixed  -> (the four relations as one gas)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2 shows the knock counter doubling while the
 * average speed and the particle count do not move. Stage 4 draws the SAME line
 * twice, on a kelvin axis and on a Celsius axis, and only one of them meets the
 * origin. Stage 7 puts the answer between two detents of the dial, so it can only
 * be reached by scaling a reading, and never by reading one.
 *
 * EVERY STAGE BUT THE LAST IS A FIGHT against gas bladders: they sag, hold, swell
 * and strain with the push, or with the room when the piston is free. Stage 8
 * files four plotted records, which are not bodies, so it plays without a foe.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, GASES, R } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bboyle.?s law\b/i, introducedAt: 1 },
  { term: /\binversely proportional\b/i, introducedAt: 2 },
  { term: /\bcharles.?s law\b/i, introducedAt: 3 },
  { term: /\bgay.lussac.?s law\b/i, introducedAt: 5 },
  { term: /\bavogadro.?s law\b/i, introducedAt: 6 },
  { term: /\bcombined gas law\b/i, introducedAt: 7 }
];

/** Pressure, kelvin, the units and the speed screen are plain words from q1-knocks. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 300, V: 20, hold: 'dial', ...extra
});
const rec = (id, label, record) => ({ id, label, head: 'record', record, note: 'a gauge record' });
const choice = (id, label) => ({ id, label });

/** Common to every stage: pressure in kPa, the thermometer in kelvin and degrees. */
const BASE = { scale: 'kpa', units: true, labels: { gauge: 'PRESSURE' }, tempUnit: 'both' };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'A Quarter of the Room',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench changes one thing at a time and keeps the rest fixed, so what you read is how the others answer. The dials turn the piston and the heater, and the keys add gas.'
    },
    prompt: 'We\'re testing compression on this pneumatic cylinder while keeping temperature steady. What happens to the gas pressure when you compress the volume down to one quarter?',
    controls: ['volume'],
    volumes: [5, 10, 20, 40], volumeStart: 3,
    ...BASE,
    vmax: 40, gaugeMax: 600,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { note: 'a cylinder of nitrogen at a steady temperature' })],
    widget: {
      type: 'choice', label: 'A quarter of the room',
      options: [
        choice('quadruples', 'The pressure becomes four times as large'),
        choice('doubles', 'The pressure doubles'),
        choice('quarter', 'The pressure falls to a quarter'),
        choice('same', 'The pressure stays the same')
      ]
    },
    hints: [
      'Turn the volume dial and read the pressure at each setting.',
      'Compare the reading at the largest room with the reading when the room is a quarter as large.',
      'Divide the new pressure by the old one and compare that factor with the factor the volume changed by.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'quadruples') return { ok: true };
      if (state.choice === 'doubles') return { ok: false, msg: 'Halving the room is the step before this one; here the room shrinks by a factor of four.' };
      if (state.choice === 'quarter') return { ok: false, msg: 'Less room makes the gauge climb, so the reading cannot fall.' };
      return { ok: false, msg: 'The gauge moves when the piston does; read it at both settings.' };
    },
    reward: {
      log: 'A quarter of the room, four times the pressure.',
      title: "Boyle's Law",
      body: "At a fixed temperature, the pressure of a gas rises as its volume falls, and pressure times volume stays the same. This is Boyle's law."
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Same Particles',
    prompt: 'Halving the cylinder volume causes the pressure reading to jump by a factor of two. Why does compressing the gas into half the room double the pressure?',
    controls: ['volume'],
    volumes: [5, 10, 20, 40], volumeStart: 3,
    ...BASE,
    show: { speed: true },
    vmax: 40, gaugeMax: 600,
    rigs: [cyl('a', 'CYLINDER A', 'He', { note: 'a cylinder of helium at a steady temperature' })],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('hits', 'Each particle reaches the wall twice as often, so the knocks come twice as often'),
        choice('faster', 'The particles move twice as fast'),
        choice('more', 'There are twice as many particles'),
        choice('heavier', 'The particles get heavier')
      ]
    },
    hints: [
      'Turn the volume dial and watch the knock counter, the average speed and the particles in the window together.',
      'Compare which of those readings change as the piston moves with which stay where they were.',
      'Find the reading that changes by the same factor as the pressure while the speed and the particle count do not.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'hits') return { ok: true };
      if (state.choice === 'faster') return { ok: false, msg: 'The average speed reads the same at every setting of the piston.' };
      if (state.choice === 'more') return { ok: false, msg: 'The window holds the same number of particles at every setting of the piston.' };
      return { ok: false, msg: 'Nothing on the plate changes the mass of the gas when the piston moves.' };
    },
    reward: {
      log: 'The same particles knock more often in less room.',
      title: 'Inversely Proportional',
      body: 'With the same particles in half the room, each one reaches the wall twice as often, so the knocks double. Pressure and volume are inversely proportional: as one falls the other rises by the same factor.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Under a Weight',
    prompt: 'Under a free-floating piston with constant counterweight pressure, what happens to the gas volume when you triple the kelvin temperature?',
    controls: ['temp'],
    temps: [200, 300, 400, 600], tempStart: 1, tempList: 'K',
    ...BASE,
    trace: { x: 'T', y: 'V', xmin: 0, xmax: 700, ymin: 0, ymax: 60, xticks: [0, 200, 400, 600] },
    inset: 'trace',
    thermoLo: -100, thermoHi: 400,
    vmax: 50, gaugeMax: 200,
    rigs: [cyl('a', 'CYLINDER A', 'He', { hold: 'P', P0: 101.3, note: 'a cylinder of helium under a free piston' })],
    widget: {
      type: 'choice', label: 'Three times the kelvin',
      options: [
        choice('triples', 'The volume becomes three times as large'),
        choice('doubles', 'The volume doubles'),
        choice('third', 'The volume falls to a third'),
        choice('same', 'The volume stays the same')
      ]
    },
    hints: [
      'Turn the temperature dial up from the lowest setting and read the volume at each.',
      'Compare the volume at the lowest temperature with the volume at the highest, and the two kelvin figures with each other.',
      'Divide the larger volume by the smaller one and compare that factor with the factor the kelvin temperature changed by.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'triples') return { ok: true };
      if (state.choice === 'doubles') return { ok: false, msg: 'Compare the kelvin figures at the two settings: the temperature has not merely doubled.' };
      if (state.choice === 'third') return { ok: false, msg: 'Heating pushes the piston out, so the volume cannot fall.' };
      return { ok: false, msg: 'The piston moves when the heater does; read the volume at both settings.' };
    },
    reward: {
      log: 'The volume follows the kelvin temperature.',
      title: "Charles's Law",
      body: "At a steady pressure, the volume of a gas is proportional to its kelvin temperature: three times the kelvin, three times the volume. This is Charles's law."
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which Scale',
    prompt: 'Look at our dual temperature plots: the volume trendline intercepts the origin at 0 K, but not at 0 °C. Why does the volume line meet zero at 0 K rather than 0 °C?',
    controls: ['temp', 'clear'],
    temps: [100, 200, 300, 400, 500, 600], tempStart: 3, tempList: 'K',
    ...BASE,
    trace: [
      { x: 'T', y: 'V', xmin: 0, xmax: 700, ymin: 0, ymax: 60, xticks: [0, 200, 400, 600] },
      { x: 'TC', y: 'V', xmin: -300, xmax: 400, ymin: 0, ymax: 60, xticks: [-300, -100, 100, 300] }
    ],
    inset: 'trace',
    thermoLo: -200, thermoHi: 400,
    vmax: 50, gaugeMax: 200,
    rigs: [cyl('a', 'CYLINDER A', 'He', { hold: 'P', P0: 101.3, note: 'a cylinder of helium under a free piston' })],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('motion', 'Zero kelvin is where the particles would have no motion left, and 0 °C is only where water freezes'),
        choice('wrong', 'The Celsius readings on the plate are wrong'),
        choice('always', 'A line like this passes through zero on every scale'),
        choice('liquid', 'The gas turns into a liquid at 0 °C')
      ]
    },
    hints: [
      'Step the temperature dial through every setting and look at both plots.',
      'Compare where the line meets the volume axis on the kelvin plot with where it meets it on the Celsius plot.',
      'Ask which of the two scales has its zero at the temperature where the particles would have no motion left.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'motion') return { ok: true };
      if (state.choice === 'wrong') return { ok: false, msg: 'Both plots are drawn from the same readings; only the scale along the bottom differs.' };
      if (state.choice === 'always') return { ok: false, msg: 'Look at the two plots: the same line meets the axis at different places on them.' };
      return { ok: false, msg: 'Nothing on the plate turns the gas into a liquid, and the line does not change at that point.' };
    },
    reward: {
      log: 'Volume is in proportion to the temperature only from absolute zero.',
      title: 'Why Kelvin',
      body: 'Volume at a steady pressure is proportional to the temperature only when the temperature is counted from absolute zero, as kelvin is. The zero of the Celsius scale is just where water freezes, so the same line does not pass through it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Sealed Tank',
    prompt: 'This rigid storage tank has a fixed internal volume. By what factor does the internal pressure rise when we heat the tank from 300 K to 450 K?',
    controls: ['temp'],
    temps: [300, 375, 450, 600], tempStart: 1, tempList: 'K',
    ...BASE,
    vmax: 10, gaugeMax: 700,
    rigs: [cyl('a', 'TANK A', 'N2', { V: 10, hold: 'V', note: 'a sealed rigid tank of nitrogen' })],
    widget: { type: 'decimal', label: 'The pressure is multiplied by', min: 0.5, max: 3, step: 0.1 },
    hints: [
      'Set the temperature dial to 300 K and read the pressure, then set it to 450 K and read it again.',
      'Compare the two pressures as a ratio, and the two kelvin temperatures as a ratio.',
      'Divide the pressure at 450 K by the pressure at 300 K to find the factor.'
    ],
    check(state) {
      if (state.decimal === null || state.decimal === undefined) return { ok: false, notYet: true, msg: 'Set the factor.' };
      const a = readOf(STAGES[4], 'a', { temp: 1 });
      const b = readOf(STAGES[4], 'a', { temp: 3 });
      const want = Math.round((b.P / a.P) * 10) / 10;
      if (Math.abs(state.decimal - want) < 0.05) return { ok: true };
      if (state.decimal <= 1) return { ok: false, msg: 'Heating a sealed tank raises the reading, so the factor must be larger than one.' };
      return { ok: false, msg: 'Read the pressure at both temperatures on the gauge and divide the larger by the smaller.' };
    },
    reward: {
      log: 'The pressure follows the kelvin temperature.',
      title: "Gay-Lussac's Law",
      body: "At a fixed volume, the pressure of a gas is proportional to its kelvin temperature, so heating a sealed tank raises the pressure in step. This is Gay-Lussac's law."
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Feeding the Piston',
    prompt: 'At constant temperature and weight, our injector feeds extra gas into the cylinder. What happens to the volume when you double the moles of gas inside?',
    controls: ['add', 'remove', 'reset'],
    step: 1, nMin: 1, nMax: 4,
    ...BASE,
    vmax: 100, gaugeMax: 200,
    rigs: [cyl('a', 'CYLINDER A', 'Ne', { hold: 'P', P0: 101.3, note: 'a cylinder of neon under a free piston' })],
    widget: {
      type: 'choice', label: 'Twice the gas',
      options: [
        choice('doubles', 'The volume doubles'),
        choice('halves', 'The volume halves'),
        choice('same', 'The volume stays the same'),
        choice('triples', 'The volume becomes three times as large')
      ]
    },
    hints: [
      'Add gas one step at a time and read the volume before and after each.',
      'Compare the volume with one mole in the cylinder against the volume with two.',
      'Divide the larger volume by the smaller to find the factor, and compare it with the factor the amount changed by.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'doubles') return { ok: true };
      if (state.choice === 'halves') return { ok: false, msg: 'Gas fed in under a free piston pushes it out, so the room cannot shrink.' };
      if (state.choice === 'same') return { ok: false, msg: 'The piston moves when gas is added; read the volume before and after.' };
      return { ok: false, msg: 'Compare the amounts on the plate before and after: the amount did not go up by that factor.' };
    },
    reward: {
      log: 'Twice the gas fills twice the room.',
      title: "Avogadro's Law",
      body: "At the same temperature and pressure, the volume of a gas is proportional to the amount of gas: equal amounts fill equal volumes. This is Avogadro's law."
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Everything at Once',
    prompt: 'Both pressure and temperature are shifting at once! Calculate what volume Cylinder A would expand to if the pressure is halved while the temperature climbs to 450 K.',
    controls: ['temp'],
    temps: [300, 400, 500, 600], tempStart: 1, tempList: 'K',
    ...BASE,
    show: { knocks: false },
    vmax: 100, gaugeMax: 200,
    rigs: [
      cyl('a', 'CYLINDER A', 'N2', { n: 0.802, V: 20, hold: 'V', follow: false, note: 'a cylinder of nitrogen as it stands' }),
      cyl('b', 'CYLINDER B', 'N2', { n: 0.802, hold: 'P', P0: 50, note: 'the same gas under half the weight' })
    ],
    widget: { type: 'number', label: 'Volume of A, in litres', min: 20, max: 100, step: 5 },
    hints: [
      'Turn the temperature dial and read the volume of Cylinder B at each of its settings.',
      'Compare Cylinder A with Cylinder B at the same temperature to see what halving the pressure does, then see what the temperature does to B.',
      'Take the volume of A and multiply it by the factor the pressure change brings and by the ratio of the two kelvin temperatures.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the volume.' };
      const a = readOf(STAGES[6], 'a', {});
      const want = a.V * (a.P / 50) * (450 / a.T);
      if (Math.abs(state.number - want) < 2.5) return { ok: true };
      return { ok: false, msg: 'Two things change here, the pressure and the temperature, and each moves the volume on its own; account for both.' };
    },
    reward: {
      log: 'Pressure and temperature, together.',
      title: 'Combined Gas Law',
      body: 'When pressure, volume and temperature all change, the quantity pressure times volume over kelvin temperature stays the same for a fixed amount of gas. This is the combined gas law, and the laws before it are the cases where one quantity is held fixed.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Four Records',
    prompt: 'The flight recorder captured four distinct gas response curves. Sort each record by the variable that was held constant while measurements were taken!',
    controls: [],
    rigs: [
      rec('a', 'RECORD A', { x: 'V', y: 'P', fixed: { n: 1, T: 300 }, xmin: 2, xmax: 40, ymin: 0, ymax: 1300, xticks: [2, 10, 20, 30, 40] }),
      rec('b', 'RECORD B', { x: 'T', y: 'V', fixed: { n: 1, P: 101.3 }, xmin: 0, xmax: 600, ymin: 0, ymax: 50, xticks: [0, 200, 400, 600] }),
      rec('c', 'RECORD C', { x: 'T', y: 'P', fixed: { n: 1, V: 10 }, xmin: 0, xmax: 600, ymin: 0, ymax: 500, xticks: [0, 200, 400, 600] }),
      rec('d', 'RECORD D', { x: 'n', y: 'V', fixed: { T: 300, P: 101.3 }, xmin: 0, xmax: 4, ymin: 0, ymax: 100, xticks: [0, 1, 2, 3, 4] })
    ],
    widget: {
      type: 'bins', label: 'Held fixed',
      rows: [{ id: 'a', label: 'Record A' }, { id: 'b', label: 'Record B' }, { id: 'c', label: 'Record C' }, { id: 'd', label: 'Record D' }],
      bins: [
        { id: 'temperature', label: 'Temperature' },
        { id: 'pressure', label: 'Pressure' },
        { id: 'volume', label: 'Volume' },
        { id: 'both', label: 'Pressure and temperature' }
      ]
    },
    hints: [
      'Read the two quantities each record plots against each other.',
      'Compare the quantity a record leaves out of its axes with what the gas laws say moves with the two it plots.',
      'For each record, say which law draws that shape, then name the quantity that law holds fixed.'
    ],
    check(state) {
      const need = ['a', 'b', 'c', 'd'];
      if (need.some(id => !state.bins[id])) return { ok: false, notYet: true, msg: 'File all four records.' };
      const want = { a: 'temperature', b: 'pressure', c: 'volume', d: 'both' };
      if (need.every(id => state.bins[id] === want[id])) return { ok: true };
      return { ok: false, msg: 'Check each record against the law that draws that shape, and ask what that law holds fixed.' };
    },
    reward: {
      log: 'Four changes, one gas.',
      title: 'One Gas, Four Changes',
      body: 'Each record is the same gas answering a different change: a curve when only the volume and pressure move, and straight lines through zero when the pressure or the volume is held. Together they are one relation between pressure, volume, temperature and amount.'
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
      body: 'Pressure and volume pull against each other, pressure and kelvin temperature climb together, volume and kelvin temperature climb together, and volume follows the amount of gas. All four are the same gas, each one answering the change you made.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every gas calculation on an exam is one of these relations or two of them chained together. You have now seen each one happen.'
    },
    {
      heading: 'Next',
      body: 'The next bench shows that all four relations are one equation, and finds the number that ties them together.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas at 2.00 atm is compressed at a constant temperature until its volume is one third of what it was. What is the new pressure?',
    options: [
      { id: 'a', label: '6.00 atm' },
      { id: 'b', label: '0.67 atm' },
      { id: 'c', label: '3.00 atm' },
      { id: 'd', label: '2.00 atm' }
    ],
    answer: 'a',
    explanation: 'At a constant temperature the product of pressure and volume stays the same (Boyle’s law). One third of the volume means three times the pressure, so 6.00 atm.'
  },
  {
    question: 'A balloon holds 2.0 L of air at 300 K. What is its volume at 450 K, at the same pressure?',
    options: [
      { id: 'a', label: '3.0 L' },
      { id: 'b', label: '1.3 L' },
      { id: 'c', label: '4.5 L' },
      { id: 'd', label: '2.0 L' }
    ],
    answer: 'a',
    explanation: 'At a constant pressure the volume is proportional to the kelvin temperature (Charles’s law): 2.0 L × 450/300 = 3.0 L.'
  },
  {
    question: 'Why must temperatures be in kelvin in gas-law calculations?',
    options: [
      { id: 'a', label: 'Because volume and pressure are proportional to temperature only when it is counted from absolute zero' },
      { id: 'b', label: 'Because kelvin degrees are larger than Celsius degrees' },
      { id: 'c', label: 'Because Celsius temperatures cannot be negative' },
      { id: 'd', label: 'Because gases only exist above 0 K' }
    ],
    answer: 'a',
    explanation: 'A proportion needs a true zero. The kelvin scale puts zero at absolute zero, where the particles would have no motion left; the Celsius zero is just where water freezes.'
  },
  {
    question: 'A sealed rigid tank of gas is heated from 250 K to 500 K. What happens to its pressure?',
    options: [
      { id: 'a', label: 'It doubles' },
      { id: 'b', label: 'It halves' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It becomes four times as large' }
    ],
    answer: 'a',
    explanation: 'At a fixed volume the pressure is proportional to the kelvin temperature (Gay-Lussac’s law), and the kelvin temperature doubled.'
  },
  {
    question: 'A gas at 100 kPa, 10.0 L and 300 K is taken to 50 kPa and 600 K. What volume does it fill?',
    options: [
      { id: 'a', label: '40.0 L' },
      { id: 'b', label: '10.0 L' },
      { id: 'c', label: '20.0 L' },
      { id: 'd', label: '5.0 L' }
    ],
    answer: 'a',
    explanation: 'By the combined gas law, V2 = V1 × (P1/P2) × (T2/T1) = 10.0 × 2 × 2 = 40.0 L.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'quadruples' },
  { choice: 'hits' },
  { choice: 'triples' },
  { choice: 'motion' },
  { decimal: 1.5 },
  { choice: 'doubles' },
  { number: 60 },
  { bins: { a: 'temperature', b: 'pressure', c: 'volume', d: 'both' } }
];

export const MISSES = [
  { choice: 'doubles' },
  { choice: 'faster' },
  { choice: 'doubles' },
  { choice: 'wrong' },
  { decimal: 2 },
  { choice: 'triples' },
  { number: 40 },
  { bins: { a: 'pressure', b: 'temperature', c: 'volume', d: 'both' } }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...gasState(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  return mountGas(container, ctx, { STAGES, DEBRIEF, toolNoteFor, blankState });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { readOf, GASES, R };
