/**
 * q5-speed.js — Bellows, bench five: SPEED AND ESCAPE.
 *
 * Bench one found that the particles of a gas move at a spread of speeds. This
 * one asks what that spread does: it moves and flattens as the gas is heated, it
 * sorts the gases by weight, its fast tail is what a demanding collision needs,
 * and it decides how soon a gas leaks through a hole and how slowly it spreads.
 *
 *   1  how the speed screen answers a rising temperature       -> (the peak moves right and flattens)
 *   2  three gases ordered by how fast their particles move    -> (lighter is faster)
 *   3  how many more clear a speed bar when the gas is hotter  -> (the tail grows fast)
 *   4  which gas runs out of a pinholed chamber first          -> effusion
 *   5  how many times faster hydrogen leaks than oxygen        -> Graham's law (beyond the exam)
 *   6  an unknown gas named by racing it against helium        -> (the leak times give the molar mass)
 *   7  why a smell takes time to cross a room                  -> diffusion
 *   8  which of two gases reaches the far end of a tube first  -> (the lighter spreads faster, too)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 3 prints, under the same bar, the share of
 * the particles above it at each temperature, so the factor is read off two
 * printed figures. Stage 5 prints the time each chamber takes to half empty, and
 * the ratio of the times is the ratio of the rates. Stage 7's plate prints the
 * distance a single particle has run beside the distance it is from where it
 * started, and the two are very far apart.
 *
 * EVERY STAGE IS A FIGHT against gas bladders. A bladder on a pinholed chamber
 * sags as its gas leaves, and one at the end of a tube swells when the gas arrives.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, speeds, fractionAbove, halfTime, front, leftAfter, toKelvin, GASES } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 4 },
  { term: /\bgraham.?s law\b/i, introducedAt: 5 },
  { term: /\bdiffusion\b/i, introducedAt: 7 }
];

/** Pressure, kelvin, the speed screen and the gas laws are plain words here. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q3-ideal'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 300, V: 20, hold: 'V', ...extra
});
const leak = (id, label, gas, extra = {}) => ({ id, label, head: 'leak', gas, dots: 24, ...extra });
const tube = (id, label, gas, extra = {}) => ({ id, label, head: 'tube', gas, length: 8, ...extra });
const choice = (id, label) => ({ id, label });

const BASE = { scale: 'kpa', units: true, labels: { gauge: 'PRESSURE', energy: 'KINETIC ENERGY' }, tempUnit: 'both' };

/** The speed bar of stage 3, in m/s, and the two temperatures it is compared at. */
export const BAR = 1000;
const COMPARE_C = [27, 127, 227, 327];

/** The seconds a time dial can be set to. */
const TIMES = [0, 1, 2, 3, 4, 5, 6];

/** How many times more of the particles clear the bar at 227 °C than at 27 °C. */
function tailFactor() {
  return fractionAbove('N2', toKelvin(227, 'C'), BAR) / fractionAbove('N2', toKelvin(27, 'C'), BAR);
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Warming the Crowd',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench puts the speed screen, a pinhole, a tube of still air and a tracked particle in front of the gas. Dials set the temperature and the time.'
    },
    prompt: 'Say what happens to the speed screen as the gas is heated.',
    controls: ['temp'],
    temps: [27, 127, 327, 627], tempStart: 1, tempList: 'C',
    ...BASE,
    show: { speed: true, energy: true, knocks: false },
    inset: 'speed', speedMax: 2400,
    thermoLo: -50, thermoHi: 700, vmax: 20, gaugeMax: 900,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { note: 'a sealed cylinder of nitrogen' })],
    widget: {
      type: 'choice', label: 'Heating the gas',
      options: [
        choice('flat', 'The peak moves to higher speeds and the spread widens and flattens'),
        choice('spike', 'The peak moves to higher speeds and the spread narrows into a spike'),
        choice('taller', 'The peak stays where it is and only the bars grow taller'),
        choice('left', 'The peak moves to lower speeds')
      ]
    },
    hints: [
      'Turn the temperature dial from its lowest setting to its highest and watch the speed screen.',
      'Compare where the tallest bar stands and how high it reaches at the lowest setting and at the highest.',
      'Note which way the peak moves along the speed axis and what happens to its height as the spread grows.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the screen does.' };
      if (state.choice === 'flat') return { ok: true };
      if (state.choice === 'spike') return { ok: false, msg: 'The tallest bar gets lower as the gas warms, not higher; a narrower spread would pile particles up.' };
      if (state.choice === 'taller') return { ok: false, msg: 'Compare where the tallest bar stands at the coldest and the hottest settings: it is not in the same place.' };
      return { ok: false, msg: 'Faster particles are what the heater makes, so the peak cannot move toward the slow end.' };
    },
    reward: {
      log: 'Hotter: a peak further right and a flatter spread.',
      title: 'Hotter, Faster, Wider',
      body: 'Heating moves the peak of the speed distribution to higher speeds and spreads it out, so a hotter gas has a higher typical speed and a longer tail of very fast particles.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Three Gases',
    prompt: 'Put the three gases in order of the speed of their particles, fastest first.',
    controls: ['temp'],
    temps: [27, 127, 327], tempStart: 1, tempList: 'C',
    ...BASE,
    show: { speed: true, knocks: false },
    inset: 'speed', speedMax: 2400,
    thermoLo: -50, thermoHi: 400, vmax: 20, gaugeMax: 700,
    rigs: [
      cyl('a', 'CYLINDER A', 'N2', { note: 'a sealed cylinder of nitrogen' }),
      cyl('b', 'CYLINDER B', 'He', { note: 'a sealed cylinder of helium' }),
      cyl('c', 'CYLINDER C', 'CO2', { note: 'a sealed cylinder of carbon dioxide' })
    ],
    widget: {
      type: 'order', label: 'Fastest first',
      items: [{ id: 'a', label: 'Cylinder A' }, { id: 'b', label: 'Cylinder B' }, { id: 'c', label: 'Cylinder C' }]
    },
    hints: [
      'Read the average speed and the speed screen on all three plates and turn the temperature dial.',
      'Compare where each speed screen has its peak with what each cylinder holds.',
      'Put first the plate whose peak stands furthest along the speed axis.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders in order.' };
      const sp = id => readOf(STAGES[1], id, {}).mean;
      const want = ['a', 'b', 'c'].sort((x, y) => sp(y) - sp(x));
      if (state.order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Read the average speed on each plate, not the pressure or the kinetic energy; those do not sort the gases.' };
    },
    reward: {
      log: 'The lighter the particle, the faster it goes.',
      title: 'Lighter, Faster',
      body: 'At one temperature every gas has the same average kinetic energy, so the lighter the particles the faster they move. Speed goes as one over the square root of the molar mass — what one mole weighs.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Fast Tail',
    prompt: 'A bar on the speed screen marks one speed. Say roughly how many times more of the particles clear it at 227 °C than at 27 °C.',
    controls: ['temp'],
    temps: COMPARE_C, tempStart: 1, tempList: 'C',
    ...BASE,
    show: { speed: true, knocks: false },
    inset: 'speed', speedMax: 2400, bar: BAR,
    thermoLo: -50, thermoHi: 400, vmax: 20, gaugeMax: 900,
    rigs: [cyl('a', 'CYLINDER A', 'N2', { note: 'a sealed cylinder of nitrogen' })],
    widget: {
      type: 'choice', label: 'More of them clear the bar, by about',
      options: [choice('2', '2 times'), choice('4', '4 times'), choice('8', '8 times'), choice('40', '40 times')]
    },
    hints: [
      'Set the temperature dial to 27 °C and read the share above the bar, then do the same at 227 °C.',
      'Compare the two shares as a ratio, and not as a difference.',
      'Divide the share above the bar at 227 °C by the share at 27 °C.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a factor.' };
      const f = tailFactor();
      const nearest = ['2', '4', '8', '40'].sort((a, b) => Math.abs(Math.log(Number(a) / f)) - Math.abs(Math.log(Number(b) / f)))[0];
      if (state.choice === nearest) return { ok: true };
      return Number(state.choice) < Number(nearest)
        ? { ok: false, msg: 'The two shares above the bar differ by more than that.' }
        : { ok: false, msg: 'The two shares above the bar differ by less than that.' };
    },
    reward: {
      log: 'A little heat multiplies the fast tail.',
      title: 'The Fast Tail',
      body: 'Only the fastest particles clear a high bar, and a modest rise in temperature multiplies their number several times over. Where a collision needs a minimum energy to count, it is this tail that does the work.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'A Hole in the Wall',
    prompt: 'Say which gas escapes through the pinhole first, and why.',
    controls: ['time'],
    times: TIMES, timeStart: 1,
    ...BASE,
    rigs: [
      leak('a', 'CHAMBER A', 'N2', { note: 'a chamber of nitrogen with a pinhole' }),
      leak('b', 'CHAMBER B', 'He', { note: 'a chamber of helium with a pinhole' })
    ],
    widget: {
      type: 'choice', label: 'The first to run out',
      options: [
        choice('light', 'The helium, because its lighter particles move faster and reach the hole more often'),
        choice('heavy', 'The nitrogen, because its heavier particles push harder at the hole'),
        choice('same', 'Both together, because they are at the same temperature'),
        choice('none', 'Neither: nothing leaves through a hole this small')
      ]
    },
    hints: [
      'Turn the time dial and read how much is left in each chamber at each setting.',
      'Compare the share left in the two chambers at the same time.',
      'Ask which gas has the faster particles at the same temperature, and whether the chamber that empties first holds it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose which gas and why.' };
      if (state.choice === 'light') return { ok: true };
      if (state.choice === 'heavy') return { ok: false, msg: 'Compare how much is left in each chamber at the same time: the heavier gas is not the one that is nearly gone.' };
      if (state.choice === 'same') return { ok: false, msg: 'The two chambers do not hold the same share at any time but the first.' };
      return { ok: false, msg: 'The plates show gas leaving both chambers as the time dial moves.' };
    },
    reward: {
      log: 'The lighter gas leaks out first.',
      title: 'Effusion',
      body: 'A gas leaking through a pinhole is effusing, and the lighter gas effuses faster because its particles move faster and reach the hole more often.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Much Faster',
    prompt: 'Give how many times faster hydrogen leaks than oxygen.',
    controls: ['time'],
    times: TIMES, timeStart: 1,
    ...BASE,
    show: { half: true },
    rigs: [
      leak('a', 'CHAMBER A', 'H2', { note: 'a chamber of hydrogen with a pinhole' }),
      leak('b', 'CHAMBER B', 'O2', { note: 'a chamber of oxygen with a pinhole' })
    ],
    widget: { type: 'number', label: 'Hydrogen leaks this many times faster', min: 1, max: 10, step: 1 },
    hints: [
      'Read the time each chamber takes to be half empty.',
      'Compare the two times as a ratio.',
      'Divide the time the oxygen takes by the time the hydrogen takes, since the faster leak takes the shorter time.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the ratio.' };
      const want = Math.round(halfTime('O2') / halfTime('H2'));
      if (state.number === want) return { ok: true };
      return { ok: false, msg: 'Compare the two times to half empty: the faster leak takes the shorter time, and the ratio is the ratio of the rates.' };
    },
    reward: {
      log: 'The rates go as one over the root of the molar mass.',
      title: "Graham's Law",
      body: "The rate of effusion is inversely proportional to the square root of the molar mass, so hydrogen, about sixteen times lighter than oxygen, leaks four times as fast. This is Graham's law, which goes beyond the exam."
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Name the Gas',
    prompt: 'Name the gas in the unmarked chamber.',
    controls: ['time'],
    times: TIMES, timeStart: 1,
    ...BASE,
    show: { half: true },
    reference: ['Molar masses — what one mole weighs — in g/mol: He 4.0, Ne 20.2, Ar 39.9, Kr 83.8, Xe 131'],
    rigs: [
      leak('a', 'CHAMBER A', 'He', { note: 'a chamber of helium with a pinhole' }),
      leak('b', 'CHAMBER B', 'Ar', { sealed: true, note: 'an unmarked chamber with a pinhole' })
    ],
    widget: {
      type: 'choice', label: 'The unmarked gas is',
      options: [choice('Ne', 'Ne'), choice('Ar', 'Ar'), choice('Kr', 'Kr'), choice('Xe', 'Xe')]
    },
    hints: [
      'Read the time each chamber takes to be half empty.',
      'Compare the two times as a ratio, and square it.',
      'Multiply the molar mass of helium by the square of the ratio of the times to get the molar mass of the unmarked gas.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a gas.' };
      if (state.choice === 'Ar') return { ok: true };
      return { ok: false, msg: 'Square the ratio of the two times before comparing it with the molar masses; the rates go as the root of the mass.' };
    },
    reward: {
      log: 'A gas named by racing it against one you know.',
      title: 'Naming by Leak',
      body: 'Squaring the ratio of the leak times gives the ratio of the molar masses, so an unknown gas can be named by racing it against a gas whose molar mass is known.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'A Smell Crosses a Room',
    prompt: 'Say why a smell takes seconds to cross a room when its particles move at hundreds of metres a second.',
    controls: ['time'],
    times: [1, 2, 4, 8, 16], timeStart: 1,
    ...BASE,
    rigs: [{ id: 'a', label: 'PARTICLE', head: 'path', gas: 'N2', note: 'one tracked particle in a crowd', stepsPerSecond: 6 }],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('collisions', 'The particle is knocked sideways by the crowd all the time, so most of its path does not go forward'),
        choice('slow', 'The particles of a smell move much more slowly than the particles of air'),
        choice('heavy', 'The particles of a smell are too heavy to cross a room'),
        choice('made', 'The smell has to be made before it can spread')
      ]
    },
    hints: [
      'Turn the time dial up and watch the track the particle makes.',
      'Compare the distance the particle has run with how far it is from where it started.',
      'Look at how the two figures grow as the time goes on and what that says about the particle\'s path.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'collisions') return { ok: true };
      if (state.choice === 'slow') return { ok: false, msg: 'The plate tracks one particle at the speed its gas has; it is not slow, it is the track that wanders.' };
      if (state.choice === 'heavy') return { ok: false, msg: 'The particle crosses the whole plate in time; its weight is not what holds it up.' };
      return { ok: false, msg: 'The tracked particle is already there from the first second of the plate.' };
    },
    reward: {
      log: 'A crowd turns a straight run into a wander.',
      title: 'Diffusion',
      body: 'Particles spread by diffusion, a random walk of collisions: the distance run is large but the distance from the start grows slowly. That is why a gas takes seconds to cross a room its particles could cross in a fraction of a second.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Race Down the Tube',
    prompt: 'Say which gas reaches the far end of its tube first.',
    controls: ['time'],
    times: [0, 2, 4, 6, 8, 10, 12], timeStart: 1,
    ...BASE,
    rigs: [
      tube('a', 'TUBE A', 'HCl', { note: 'a tube of still air with hydrogen chloride released at one end' }),
      tube('b', 'TUBE B', 'NH3', { note: 'a tube of still air with ammonia released at one end' })
    ],
    widget: {
      type: 'choice', label: 'First to the far end',
      options: [choice('HCl', 'HCl'), choice('NH3', 'NH₃')]
    },
    hints: [
      'Turn the time dial up and watch how far each gas has crept.',
      'Compare how far the two gases have got at the same time.',
      'Pick the gas that has crept further down its tube at the same setting of the time dial.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a gas.' };
      const win = front('NH3', 8) >= front('HCl', 8) ? 'NH3' : 'HCl';
      if (state.choice === win) return { ok: true };
      return { ok: false, msg: 'Compare how far the two bands have got at the same time on the dial, and not which gas looks bigger.' };
    },
    reward: {
      log: 'The lighter gas spreads faster as well.',
      title: 'The Lighter Gas Arrives First',
      body: 'Spreading is quicker for the lighter gas, as leaking is: ammonia arrives before hydrogen chloride in tubes of equal length. The same square-root relation to the molar mass governs both.'
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
      body: 'Heating widens the spread of speeds and lengthens its fast tail, lighter gases are faster at the same temperature, a hole lets the lighter gas out first, and a crowd turns a straight dash into a slow wander.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Gases are separated by leaking, smells and spills travel by wandering, and the fast tail is the first sign of what makes some collisions count and others not.'
    },
    {
      heading: 'Next',
      body: 'The last bench squeezes and cools a gas until the ideal picture stops being true.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas is heated in a rigid container. What happens to the Maxwell–Boltzmann distribution of its particle speeds?',
    options: [
      { id: 'a', label: 'The peak moves to a higher speed and the curve flattens and widens' },
      { id: 'b', label: 'The peak moves to a higher speed and the curve narrows' },
      { id: 'c', label: 'The peak stays where it is and gets taller' },
      { id: 'd', label: 'The peak moves to a lower speed' }
    ],
    answer: 'a',
    explanation: 'Heating raises the average kinetic energy, so the typical speed rises and the spread of speeds widens, which lowers the peak.'
  },
  {
    question: 'Which of these gases has the highest average particle speed at 300 K?',
    options: [
      { id: 'a', label: 'H₂' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'O₂' },
      { id: 'd', label: 'CO₂' }
    ],
    answer: 'a',
    explanation: 'All gases have the same average kinetic energy at one temperature, so the lightest particles move fastest. H₂ has the smallest molar mass.'
  },
  {
    question: 'Raising the temperature greatly increases the number of particles above a given high speed. Why does this matter for reactions?',
    options: [
      { id: 'a', label: 'Only particles with enough energy can react when they collide, and the fast tail supplies them' },
      { id: 'b', label: 'Faster particles are heavier' },
      { id: 'c', label: 'Heat changes the molar mass of the particles' },
      { id: 'd', label: 'Hotter gases contain more particles' }
    ],
    answer: 'a',
    explanation: 'Many collisions need a minimum energy to count. A small rise in temperature multiplies the number of particles in the fast tail that have it.'
  },
  {
    question: 'Oxygen has a molar mass of 32 g/mol and methane 16 g/mol. How do their effusion rates compare at the same temperature?',
    options: [
      { id: 'a', label: 'Methane effuses about 1.4 times as fast' },
      { id: 'b', label: 'Methane effuses twice as fast' },
      { id: 'c', label: 'Oxygen effuses about 1.4 times as fast' },
      { id: 'd', label: 'They effuse at the same rate' }
    ],
    answer: 'a',
    explanation: 'By Graham’s law the rate goes as one over the square root of the molar mass: √(32/16) = √2 ≈ 1.4, in favour of the lighter methane.'
  },
  {
    question: 'Why does the smell of perfume take several seconds to cross a room when its molecules move at hundreds of metres per second?',
    options: [
      { id: 'a', label: 'They collide with air molecules constantly, so their path is a random walk' },
      { id: 'b', label: 'Perfume molecules are slower than air molecules' },
      { id: 'c', label: 'Perfume molecules must wait to evaporate' },
      { id: 'd', label: 'The air pushes the molecules back toward the bottle' }
    ],
    answer: 'a',
    explanation: 'Diffusion is slow because each particle changes direction at every collision, so the distance from the start grows much more slowly than the distance travelled.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'flat' },
  { order: ['b', 'a', 'c'] },
  { choice: '8' },
  { choice: 'light' },
  { number: 4 },
  { choice: 'Ar' },
  { choice: 'collisions' },
  { choice: 'NH3' }
];

export const MISSES = [
  { choice: 'spike' },
  { order: ['a', 'b', 'c'] },
  { choice: '2' },
  { choice: 'heavy' },
  { number: 2 },
  { choice: 'Kr' },
  { choice: 'slow' },
  { choice: 'HCl' }
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
export const CHECKS = { readOf, speeds, fractionAbove, halfTime, front, leftAfter, tailFactor, GASES, BAR };
