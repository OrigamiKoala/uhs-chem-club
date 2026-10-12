/**
 * q1-knocks.js — Bellows, bench one: PRESSURE AND TEMPERATURE.
 *
 * The gas rig's first bench. A cylinder with a piston, a gauge on its wall, a
 * thermometer, a counter that ticks for every knock on the far wall and a window
 * onto the particles themselves. Nothing here is told: the player moves the
 * piston and watches a needle and a counter move together, and what the needle
 * has been measuring all along is the knocking.
 *
 *   1  what the gauge measures                            -> pressure
 *   2  what doubling the gas does to it                   -> (pressure follows the amount)
 *   3  what heating does to the particles                 -> kinetic energy
 *   4  how the speeds of the particles compare            -> Maxwell–Boltzmann distribution
 *   5  a light gas and a heavy one at one temperature     -> (equal energy, unequal speed)
 *   6  one push, three scales                             -> atm, kPa, mmHg
 *   7  where the pressure would reach zero                -> absolute zero, kelvin
 *   8  which statements the bench has shown               -> kinetic molecular theory
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 1 moves only the piston, so the particles'
 * speed, number and warmth do not change while the gauge and the knock counter
 * rise and fall together: the only thing left to be measured is the knocking.
 * Stage 6 puts a reference gauge with all three rings beside a cylinder that
 * carries one, so the conversion is read off a gauge, never given. Stage 7's
 * trace is drawn on axes that run well past the coldest point the dial reaches.
 *
 * EVERY STAGE IS A FIGHT against gas bladders, which swell and sag with the
 * gauge (`planFoe`, from the same planner the plate reads). No `check()` knows it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { gasState } from '../../engine/gasmount.js';
import { readOf } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpressure\b/i, introducedAt: 1 },
  { term: /\bkinetic energy\b/i, introducedAt: 3 },
  { term: /\bmaxwell.boltzmann\b/i, introducedAt: 4 },
  { term: /\b(?:atm|atmospheres?|kpa|kilopascals?|mmhg)\b/i, introducedAt: 6 },
  { term: /\babsolute zero\b/i, introducedAt: 7 },
  { term: /\bkelvin\b/i, introducedAt: 7 },
  { term: /\bkinetic molecular theory\b/i, introducedAt: 8 }
];

/** Mole, particle and the other words Tallow earned are plain here. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 298.15, V: 20, hold: 'V', ...extra
});

/** Detents the piston stops at, in litres. Helium at 25 degrees reads 100 at 25 L. */
const PISTON = [8, 10, 12, 16, 20, 25, 32];
const WARM = [0, 25, 100, 200, 400];
const SPREAD = [25, 200, 500];
const COLD = [-100, -50, 0, 50, 100, 200];

const choice = (id, label) => ({ id, label });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Rising and Falling',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench holds helium in a cylinder with a piston, a pressure gauge — how hard the gas pushes — and a knock counter. The window shows the particles themselves.'
    },
    prompt: 'The piston is the sliding wall that sets how much room the gas has. Say what the pressure gauge follows as the room changes.',
    controls: ['volume'],
    volumes: PISTON, volumeStart: 4,
    vmax: 32, gaugeMax: 400,
    rigs: [cyl('a', 'CYLINDER A', 'He', { hold: 'dial', note: 'a cylinder of helium' })],
    widget: {
      type: 'choice', label: 'The pressure gauge follows',
      options: [
        choice('knocks', 'How often the particles hit the wall'),
        choice('speed', 'How fast the particles move'),
        choice('amount', 'How much gas is in the cylinder'),
        choice('warmth', 'How warm the gas is')
      ]
    },
    hints: [
      'Turn the volume dial through its whole range and watch the gauge, the knock counter and the window together.',
      'Compare what the gauge and the counter do with what the number of particles and their speed do as the piston moves.',
      'Look for the one reading that rises and falls exactly as the gauge does while everything else stays put.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the pressure gauge follows.' };
      if (state.choice === 'knocks') return { ok: true };
      if (state.choice === 'speed') return { ok: false, msg: 'The particles move at the same speed at every setting of the piston, so speed is not what the gauge follows.' };
      if (state.choice === 'amount') return { ok: false, msg: 'The window holds the same number of particles at every setting, so the amount of gas is not what changes.' };
      return { ok: false, msg: 'The thermometer does not move while the piston does, so warmth is not what the gauge follows.' };
    },
    reward: {
      log: 'The gauge follows the knocks.',
      title: 'Pressure',
      body: 'The gauge reads pressure: the combined push of all the particles knocking on the wall. Squeeze the same particles into less room and they knock more often, so the pressure climbs.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Twice the Gas',
    prompt: 'Say what doubling the amount of gas does to the pressure.',
    controls: ['add', 'remove', 'reset'],
    step: 1, nMin: 1, nMax: 4,
    labels: { gauge: 'PRESSURE' },
    vmax: 20, gaugeMax: 400,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { note: 'a sealed cylinder of nitrogen' })],
    widget: {
      type: 'choice', label: 'Twice the gas',
      options: [
        choice('doubles', 'The pressure doubles'),
        choice('halves', 'The pressure halves'),
        choice('same', 'The pressure stays the same'),
        choice('little', 'The pressure rises only a little')
      ]
    },
    hints: [
      'Add gas one step at a time and read the gauge before and after.',
      'Compare the reading with one mole of gas in the cylinder against the reading with two.',
      'Divide the new reading by the old one to see by what factor the pressure moved.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'doubles') return { ok: true };
      if (state.choice === 'halves') return { ok: false, msg: 'More particles in the same room knock more often, so the reading cannot fall.' };
      if (state.choice === 'same') return { ok: false, msg: 'The gauge moves when gas is added; compare its readings before and after.' };
      return { ok: false, msg: 'Compare the two readings as a ratio, not as a difference: the factor is a whole number.' };
    },
    reward: {
      log: 'Twice the gas, twice the pressure.',
      title: 'Pressure Follows the Amount',
      body: 'Twice the particles in the same room knock twice as often, so the pressure doubles. At a fixed volume and temperature the pressure is proportional to the amount of gas.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Warming Up',
    prompt: 'Say what heating does to the particles.',
    controls: ['temp'],
    temps: WARM, tempStart: 2, tempList: 'C', tempUnit: 'C',
    labels: { gauge: 'PRESSURE' },
    show: { speed: true, energy: true, knocks: false },
    vmax: 20, gaugeMax: 600,
    rigs: [cyl('a', 'CYLINDER A', 'He', { note: 'a sealed cylinder of helium' })],
    widget: {
      type: 'choice', label: 'Heating the gas',
      options: [
        choice('faster', 'The particles move faster'),
        choice('bigger', 'The particles get bigger'),
        choice('heavier', 'The particles get heavier'),
        choice('more', 'More particles appear')
      ]
    },
    hints: [
      'Turn the temperature dial up and watch the particles in the window.',
      'Compare the average speed and the number of particles at the coldest setting and at the hottest.',
      'Read which of the readings on the plate changes with the temperature and which stay put.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what heating does.' };
      if (state.choice === 'faster') return { ok: true };
      if (state.choice === 'bigger') return { ok: false, msg: 'The particles are drawn the same size at every setting of the heater.' };
      if (state.choice === 'heavier') return { ok: false, msg: 'The mass of the gas in the cylinder is the same at every setting of the heater.' };
      return { ok: false, msg: 'The amount of gas on the plate does not change when the heater does.' };
    },
    reward: {
      log: 'Hotter particles move faster.',
      title: 'Kinetic Energy',
      body: 'Heated particles move faster, and the energy of that motion is their kinetic energy. Temperature measures the average kinetic energy of the particles.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'A Crowd, Not a Line',
    prompt: 'Say how the speeds of the particles in one cylinder compare with one another.',
    controls: ['temp'],
    temps: SPREAD, tempStart: 1, tempList: 'C', tempUnit: 'C',
    labels: { gauge: 'PRESSURE', energy: 'KINETIC ENERGY' },
    show: { speed: true, energy: true, knocks: false },
    inset: 'speed', speedMax: 2400,
    vmax: 20, gaugeMax: 600,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { note: 'a sealed cylinder of nitrogen' })],
    widget: {
      type: 'choice', label: 'The speeds',
      options: [
        choice('same', 'Every particle moves at the same speed'),
        choice('spread', 'They move at a range of speeds, most of them near a middle one'),
        choice('halves', 'Half stand still and half move fast'),
        choice('sorted', 'The fastest are all at one end of the window')
      ]
    },
    hints: [
      'Read the speed screen and then turn the temperature dial.',
      'Compare the height of the bars near the middle of the screen with the bars at either end.',
      'Look at where the tallest bar stands and at how the whole picture changes as the gas warms.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how the speeds compare.' };
      if (state.choice === 'spread') return { ok: true };
      if (state.choice === 'same') return { ok: false, msg: 'The speed screen has bars across a wide range of speeds, not one.' };
      if (state.choice === 'halves') return { ok: false, msg: 'The bars of the speed screen are smooth from one speed to the next; no gap holds a still group.' };
      return { ok: false, msg: 'The window shows slow and fast particles all through the cylinder, not sorted along it.' };
    },
    reward: {
      log: 'A spread of speeds with one peak.',
      title: 'Maxwell–Boltzmann Distribution',
      body: 'The speeds follow a Maxwell–Boltzmann distribution: a spread of speeds with a peak. Heating moves the peak to higher speeds and flattens the spread.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Light and Heavy',
    prompt: 'Say how helium and carbon dioxide compare at one temperature.',
    controls: ['temp'],
    temps: [25, 200], tempStart: 1, tempList: 'C', tempUnit: 'C',
    labels: { gauge: 'PRESSURE', energy: 'KINETIC ENERGY' },
    show: { speed: true, energy: true, knocks: false },
    vmax: 20, gaugeMax: 600,
    rigs: [
      cyl('a', 'CYLINDER A', 'He', { note: 'a sealed cylinder of helium' }),
      cyl('b', 'CYLINDER B', 'CO2', { note: 'a sealed cylinder of carbon dioxide' })
    ],
    widget: {
      type: 'choice', label: 'At one temperature',
      options: [
        choice('same-energy', 'They have the same average kinetic energy, and the heavier particles move more slowly'),
        choice('same-speed', 'They move at the same speed, and the heavier particles carry more kinetic energy'),
        choice('heavy-more', 'The heavier particles move faster and carry more kinetic energy'),
        choice('light-more', 'The lighter particles move faster and carry more kinetic energy')
      ]
    },
    hints: [
      'Read the average speed and the kinetic energy on both plates, then turn the temperature dial.',
      'Compare each plate with the other at the same setting of the dial.',
      'Find which of the two readings matches between the plates and which does not.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how the two gases compare.' };
      if (state.choice === 'same-energy') return { ok: true };
      if (state.choice === 'same-speed') return { ok: false, msg: 'The two plates print different average speeds at the same temperature.' };
      if (state.choice === 'heavy-more') return { ok: false, msg: 'Compare the two average speeds: the heavier gas is not the faster one.' };
      return { ok: false, msg: 'Compare the two kinetic energy readings: they are not different.' };
    },
    reward: {
      log: 'The same energy, a different speed.',
      title: 'Same Temperature, Same Energy',
      body: 'At one temperature every gas has the same average kinetic energy, so the lighter particles must move faster. The temperature fixes the energy, never the speed.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Three Scales',
    prompt: 'Give the reading Cylinder A would show on the middle ring.',
    controls: ['volume'],
    volumes: [11.2, 15, 22.41, 30, 44.8], volumeStart: 4,
    labels: { gauge: 'PRESSURE' },
    show: { knocks: false },
    vmax: 44.8, gaugeMax: 250,
    rigs: [
      cyl('a', 'CYLINDER A', 'N2', { T: 273.15, V: 14.94, follow: false, scale: 'ring1', note: 'a sealed cylinder of nitrogen with an inner-ring gauge' }),
      cyl('b', 'CYLINDER B', 'N2', { T: 273.15, hold: 'dial', scale: 'all', note: 'a reference cylinder with all three rings' })
    ],
    widget: {
      type: 'choice', label: 'On the middle ring',
      options: [choice('114', '114'), choice('15.2', '15.2'), choice('152', '152'), choice('1140', '1140')]
    },
    hints: [
      'Turn the volume dial on the reference cylinder and read all three of its rings at once.',
      'Compare what the inner ring and the middle ring read together on the reference cylinder.',
      'Work out how many times larger the middle ring reads than the inner ring, then apply that to the reading on Cylinder A.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reading.' };
      if (state.choice === '152') return { ok: true };
      return { ok: false, msg: 'Find on the reference gauge what the middle ring reads when the inner ring reads one, and scale that to Cylinder A.' };
    },
    reward: {
      log: 'One push, three scales.',
      title: 'Atmospheres, Kilopascals, mmHg',
      body: 'The three rings are three units for the same pressure: one atmosphere (atm) is 101.3 kilopascals (kPa) is 760 millimetres of mercury (mmHg). Any reading in one unit can be turned into either of the others.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where It Stops',
    prompt: 'Find the temperature at which the pressure would fall to zero.',
    controls: ['temp', 'clear'],
    temps: COLD, tempStart: 3, tempList: 'C', tempUnit: 'C',
    labels: { gauge: 'PRESSURE' },
    scale: 'kpa', units: true,
    trace: { x: 'TC', y: 'P', xmin: -300, xmax: 250, ymin: 0, ymax: 250, xticks: [-300, -200, -100, 0, 100, 200] },
    inset: 'trace',
    thermoLo: -300, thermoHi: 300,
    show: { knocks: false },
    vmax: 20, gaugeMax: 300,
    rigs: [cyl('a', 'CYLINDER A', 'He', { note: 'a sealed rigid cylinder of helium' })],
    widget: {
      type: 'choice', label: 'The pressure reaches zero at',
      options: [choice('-100', '−100 °C'), choice('-200', '−200 °C'), choice('-273', '−273 °C'), choice('-373', '−373 °C')]
    },
    hints: [
      'Step the temperature dial through every setting so the trace has points to join.',
      'Carry the straight line down the plate beyond the coldest point the dial reaches.',
      'Read the temperature on the bottom axis where the carried line meets the floor of the plot.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a temperature.' };
      if (state.choice === '-273') return { ok: true };
      if (state.choice === '-100' || state.choice === '-200') {
        return { ok: false, msg: 'The line is still above the floor of the plot at that temperature; carry it on further down.' };
      }
      return { ok: false, msg: 'The line has already met the floor of the plot before it gets that cold.' };
    },
    reward: {
      log: 'Zero pressure at the coldest possible point.',
      title: 'Absolute Zero',
      body: 'Carried back, the line reaches zero pressure at −273 °C. Nothing can be colder, because the particles would have no motion left to lose. That point is absolute zero, and the kelvin scale starts counting from it.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'What the Bench Showed',
    prompt: 'Pick every statement the bench has shown to be true.',
    controls: ['volume', 'temp'],
    volumes: PISTON, volumeStart: 4,
    temps: [25, 200, 500], tempStart: 1, tempList: 'C', tempUnit: 'both',
    labels: { gauge: 'PRESSURE', energy: 'KINETIC ENERGY' },
    scale: 'kpa', units: true,
    show: { speed: true, energy: true },
    inset: 'speed', speedMax: 2400,
    vmax: 32, gaugeMax: 900,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { hold: 'dial', note: 'a cylinder of nitrogen' })],
    widget: {
      type: 'multi', label: 'True of a gas',
      options: [
        { id: 'moving', label: 'Gas particles are always moving' },
        { id: 'knock', label: 'The pressure comes from particles knocking on the walls' },
        { id: 'apart', label: 'Gas particles are far apart compared with their own size' },
        { id: 'stop', label: 'Cooling a gas to 0 °C makes its particles stop' },
        { id: 'heavy', label: 'Heavier particles carry more kinetic energy at the same temperature' },
        { id: 'equal', label: 'Every particle in a gas moves at the same speed' }
      ]
    },
    hints: [
      'Move the piston and the heater and test each statement against what the plate does.',
      'Compare each statement with the knock counter, the window and the speed screen in turn.',
      'Set aside any statement that the speed screen, the thermometer or the two-gas comparison has already contradicted.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the statements that are true.' };
      const want = ['apart', 'knock', 'moving'];
      const got = state.picks.slice().sort();
      if (got.join() === want.join()) return { ok: true };
      if (state.picks.some(p => !want.includes(p))) {
        return { ok: false, msg: 'One of your picks is contradicted by something the bench has already shown; test each against the speed screen and the thermometer.' };
      }
      return { ok: false, msg: 'A statement the bench has shown to be true is still unpicked; look back at the window and the knock counter.' };
    },
    reward: {
      log: 'The whole picture, in one theory.',
      title: 'Kinetic Molecular Theory',
      body: 'Everything the bench has shown fits one picture, the kinetic molecular theory. A gas is a crowd of tiny particles in constant random motion, far apart, and its pressure is their knocking on the walls.'
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
      body: 'A gauge counts knocks. More gas, less room or more heat all make the knocks harder or more frequent, and the temperature is the average energy of the crowd that does the knocking. The coldest a gas can get is where that motion ends.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every gas law you will meet is one of these relationships written down with numbers. You have now seen where each one comes from.'
    },
    {
      heading: 'Next',
      body: 'The next bench changes one thing at a time and reads off exactly how the others answer.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'According to kinetic molecular theory, what causes the pressure of a gas?',
    options: [
      { id: 'a', label: 'Particles colliding with the walls of the container' },
      { id: 'b', label: 'The weight of the gas pressing on its container' },
      { id: 'c', label: 'Attractions between the particles' },
      { id: 'd', label: 'The particles being at rest against the walls' }
    ],
    answer: 'a',
    explanation: 'The pressure is the combined force of countless collisions between moving particles and the container walls, divided by the wall area.'
  },
  {
    question: 'A sealed, rigid container of gas is heated. What happens to the average kinetic energy of the particles and to the pressure?',
    options: [
      { id: 'a', label: 'Both increase' },
      { id: 'b', label: 'Both decrease' },
      { id: 'c', label: 'The kinetic energy increases and the pressure stays the same' },
      { id: 'd', label: 'The kinetic energy stays the same and the pressure increases' }
    ],
    answer: 'a',
    explanation: 'Temperature measures average kinetic energy, so heating raises it. Faster particles hit the walls harder and more often, so the pressure rises too.'
  },
  {
    question: 'Helium and krypton are at the same temperature. Which statement is true?',
    options: [
      { id: 'a', label: 'They have the same average kinetic energy, and helium atoms move faster' },
      { id: 'b', label: 'They have the same average speed, and krypton atoms carry more energy' },
      { id: 'c', label: 'Krypton atoms have more kinetic energy and move faster' },
      { id: 'd', label: 'Helium atoms have more kinetic energy but move at the same speed' }
    ],
    answer: 'a',
    explanation: 'Average kinetic energy depends only on temperature. With the same energy, the lighter helium atoms must be moving faster than the heavier krypton atoms.'
  },
  {
    question: 'What is 1.50 atm in kilopascals?',
    options: [
      { id: 'a', label: '152 kPa' },
      { id: 'b', label: '114 kPa' },
      { id: 'c', label: '15.2 kPa' },
      { id: 'd', label: '1140 kPa' }
    ],
    answer: 'a',
    explanation: 'One atmosphere is 101.3 kPa, so 1.50 atm is 1.50 × 101.3 = 152 kPa.'
  },
  {
    question: 'On a graph of the pressure of a fixed amount of gas in a rigid container against temperature in °C, at what temperature does the straight line reach zero pressure?',
    options: [
      { id: 'a', label: '−273 °C' },
      { id: 'b', label: '0 °C' },
      { id: 'c', label: '−100 °C' },
      { id: 'd', label: '+273 °C' }
    ],
    answer: 'a',
    explanation: 'The line, carried back, meets zero pressure at −273 °C, which is absolute zero, or 0 K.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'knocks' },
  { choice: 'doubles' },
  { choice: 'faster' },
  { choice: 'spread' },
  { choice: 'same-energy' },
  { choice: '152' },
  { choice: '-273' },
  { picks: ['moving', 'knock', 'apart'] }
];

export const MISSES = [
  { choice: 'speed' },
  { choice: 'halves' },
  { choice: 'bigger' },
  { choice: 'same' },
  { choice: 'same-speed' },
  { choice: '114' },
  { choice: '-100' },
  { picks: ['moving', 'knock', 'stop'] }
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
export const CHECKS = { readOf };
