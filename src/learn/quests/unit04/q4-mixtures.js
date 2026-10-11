/**
 * q4-mixtures.js — Bellows, bench four: PARTIAL PRESSURES.
 *
 * Every earlier bench held one gas. This one puts several in a tank and asks what
 * each is doing. The answer is the least expected thing about a gas: nothing. Each
 * pushes as if the others were not there, so a tank's reading is a sum and any
 * one gas's share of it can be found, counted, ranked and even pulled out.
 *
 *   1  pour one tank into another and compare the readings   -> partial pressure, Dalton's law
 *   2  how a gas in a mixture pushes against the same gas alone -> (each gas ignores the others)
 *   3  one gas's share of the particles                       -> mole fraction
 *   4  a gas's share of the push, from its share of the moles -> (partial pressure = mole fraction x total)
 *   5  the oxygen in the air at altitude                      -> (thin air is the same mixture at a lower total)
 *   6  adding a gas that reacts with nothing                  -> (every other partial pressure stays put)
 *   7  three gases ranked by their push                       -> (the moles decide, not the weight)
 *   8  the moles of one gas in a sealed tank                  -> (a trap shows one partial pressure)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 1 prints both tanks' readings before the pour
 * and the combined one after; stage 2 prints each gas's knock counter in the
 * mixture beside the same gas alone in an identical tank. Stage 7 is built to
 * catch the obvious mistake: the knock counter is NOT the ranking, because a light
 * gas knocks more often but a heavy one knocks harder, so only the moles decide.
 *
 * EVERY STAGE IS A FIGHT against gas bladders, one to a tank. A pour swells the
 * tank that is poured into and slackens the one that is emptied.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, planMixture, GASES, R, AIR, airPressureAt, pressureIdeal } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpartial pressures?\b/i, introducedAt: 1 },
  { term: /\bdalton.?s law\b/i, introducedAt: 1 },
  { term: /\bmole fractions?\b/i, introducedAt: 3 }
];

/** The gas law, pressure and the mole are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q2-laws'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const tank = (id, label, parts, extra = {}) => ({ id, label, head: 'mixture', parts, V: 10, T: 300, ...extra });
const choice = (id, label) => ({ id, label });

const BASE = { scale: 'kpa', units: true, labels: { gauge: 'PRESSURE' }, tempUnit: 'both' };

/** The air at four heights: the same tank of air given the room it would have at each. */
const HEIGHTS = [0, 3000, 5500, 8850];
const AIR_T = 288.15;
const AIR_PARTS = AIR.map(p => ({ gas: p.gas, n: p.n / 100 }));
const AIR_MOLES = AIR_PARTS.reduce((s, p) => s + p.n, 0);
const AIR_ROOMS = HEIGHTS.map(h => Math.round(((AIR_MOLES * R * AIR_T) / airPressureAt(h)) * 100) / 100);

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Pouring Together',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench holds tanks of mixed gas, each gas drawn in its own stencilled shape with a counter of its own. A key pours one tank into another, and the gauge reads the whole tank.'
    },
    prompt: 'Say how the reading on Tank A after the pour compares with the two readings before it.',
    controls: ['pour', 'reset'],
    keys: { pour: 'Pour B Into A' },
    ...BASE,
    gaugeMax: 500,
    rigs: [
      tank('a', 'TANK A', [{ gas: 'He', n: 1.0 }], { note: 'a tank of helium' }),
      tank('b', 'TANK B', [{ gas: 'Ne', n: 0.6 }], { note: 'a tank of neon, the same size' })
    ],
    widget: {
      type: 'choice', label: 'After the pour',
      options: [
        choice('sum', 'It equals the two readings added together'),
        choice('larger', 'It equals the larger of the two readings'),
        choice('average', 'It equals the average of the two readings'),
        choice('product', 'It is the two readings multiplied together')
      ]
    },
    encounter: {
      species: 'gas bladder',
      act: 'Compare Readings',
      intent: 'A bladder hangs on each tank, and one of them is about to be poured into the other.'
    },
    hints: [
      'Read the gauge on each tank, press "Pour B Into A", and read the gauge on Tank A again.',
      'Compare the new reading on Tank A with the two readings you took before the pour.',
      'Try adding the two old readings, averaging them and taking the larger, and see which one reproduces the new reading.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how they compare.' };
      if (state.choice === 'sum') return { ok: true };
      if (state.choice === 'larger') return { ok: false, msg: 'The reading after the pour is higher than either tank gave before it.' };
      if (state.choice === 'average') return { ok: false, msg: 'The tank is no bigger after the pour, so the two gases are not sharing a larger room; compare the new reading with the old ones.' };
      return { ok: false, msg: 'Check the size of the new reading against the old ones: it is not as large as a product would be.' };
    },
    reward: {
      log: 'The tank reads what the two gases read added together.',
      title: "Partial Pressure and Dalton's Law",
      body: "Each gas in a mixture pushes as hard as it would if it were alone in the tank, and that share is its partial pressure. The total pressure is the sum of the partial pressures, which is Dalton's law."
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Each Alone',
    prompt: 'Say how a gas in the mixture pushes compared with the same amount of that gas alone in an identical tank.',
    controls: ['temp'],
    temps: [27, 127, 227], tempStart: 1, tempList: 'C',
    ...BASE,
    gaugeMax: 800,
    rigs: [
      tank('a', 'TANK A', [{ gas: 'He', n: 1.0 }, { gas: 'Ne', n: 0.6 }], { note: 'a tank of two gases' }),
      tank('b', 'TANK B', [{ gas: 'Ne', n: 0.6 }], { note: 'a tank of neon, the same size' })
    ],
    widget: {
      type: 'choice', label: 'In the mixture, a gas pushes',
      options: [
        choice('alone', 'Exactly as hard as it would alone, as if the other gas were not there'),
        choice('less', 'Less hard, because the other gas gets in its way'),
        choice('more', 'Harder, because the other gas shoves it into the wall'),
        choice('half', 'Half as hard, because the two share the push')
      ]
    },
    encounter: {
      species: 'gas bladder',
      act: 'Compare Gas',
      intent: 'The two bladders swell and sag together as the heater comes up.'
    },
    hints: [
      'Compare the counter for neon in Tank A with the counter for neon in Tank B, and then turn the temperature dial.',
      'Check whether the neon counter in the mixture is lower, higher or equal to the neon counter alone at every setting.',
      'Look at the figure for neon in each tank at two different temperatures and see whether the two ever differ.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how the gas pushes.' };
      if (state.choice === 'alone') return { ok: true };
      if (state.choice === 'less') return { ok: false, msg: 'The neon counter in Tank A is not below the one in Tank B at any setting of the heater.' };
      if (state.choice === 'more') return { ok: false, msg: 'The neon counter in Tank A is not above the one in Tank B at any setting of the heater.' };
      return { ok: false, msg: 'The neon counter in the mixture has not been cut: compare it with the one in the other tank.' };
    },
    reward: {
      log: 'A gas ignores the gas beside it.',
      title: 'Each Gas Alone',
      body: 'A gas in a mixture knocks on the walls exactly as often as it would alone, because the particles are so far apart that they hardly notice one another. That is why the partial pressures simply add.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'A Share of the Particles',
    prompt: 'Give the fraction of the particles in the tank that are helium.',
    controls: ['temp'],
    temps: [27, 127], tempStart: 1, tempList: 'C',
    ...BASE,
    gaugeMax: 900,
    rigs: [tank('a', 'TANK A', [{ gas: 'He', n: 2.0 }, { gas: 'Ne', n: 3.0 }], { V: 25, note: 'a tank of two gases' })],
    widget: { type: 'decimal', label: 'Fraction of the particles that are helium', min: 0, max: 1, step: 0.05 },
    encounter: {
      species: 'gas bladder',
      act: 'Give Fraction',
      intent: 'The bladder swells with the whole tank and says nothing of how it is divided.'
    },
    hints: [
      'Read the amount of each gas in the table on the plate.',
      'Compare the amount of helium with the amount of all the gas in the tank.',
      'Divide the moles of helium by the moles of helium and neon together.'
    ],
    check(state) {
      if (state.decimal === null || state.decimal === undefined) return { ok: false, notYet: true, msg: 'Set the fraction.' };
      const m = readOf(STAGES[2], 'a', {});
      const want = m.rows.find(r => r.gas === 'He').x;
      if (Math.abs(state.decimal - want) < 0.025) return { ok: true };
      if (state.decimal > 1 || state.decimal < 0) return { ok: false, msg: 'A share of the particles cannot be below nothing or above all of them.' };
      return { ok: false, msg: 'Compare the helium with the helium and the neon together, and not with the neon alone.' };
    },
    reward: {
      log: 'The helium is a fixed share of the moles.',
      title: 'Mole Fraction',
      body: 'The fraction of the moles in a mixture that belong to one gas is its mole fraction: the moles of the gas over the total moles. The mole fractions in a mixture always add up to one.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'A Share of the Push',
    prompt: 'Give the partial pressure of oxygen in the tank, in kilopascals.',
    controls: [],
    ...BASE,
    labels: { gauge: 'PRESSURE', share: 'MOLE FRACTION' },
    show: { share: true },
    gaugeMax: 300,
    rigs: [tank('a', 'TANK A', [{ gas: 'N2', n: 3.0 }, { gas: 'O2', n: 1.0 }], { V: 49.88, note: 'a tank of two gases' })],
    widget: { type: 'number', label: 'Oxygen pushes with, in kPa', min: 0, max: 200, step: 10 },
    encounter: {
      species: 'gas bladder',
      act: 'Give Share',
      intent: 'The bladder holds still, swollen to whatever the whole tank reads.'
    },
    hints: [
      'Read the gauge for the whole tank and the mole fraction of each gas.',
      'Compare the share of the moles that oxygen makes up with the share of the push it should make up.',
      'Multiply the oxygen\'s mole fraction by the total pressure on the gauge.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the pressure.' };
      const m = readOf(STAGES[3], 'a', {});
      const want = m.rows.find(r => r.gas === 'O2').P;
      if (Math.abs(state.number - want) < 5) return { ok: true };
      if (Math.abs(state.number - m.P) < 5) return { ok: false, msg: 'That is the reading of the whole tank; oxygen is only part of what is in it.' };
      return { ok: false, msg: 'A gas pushes with the same share of the total as its share of the moles.' };
    },
    reward: {
      log: 'A share of the moles is a share of the push.',
      title: 'Partial Pressure From a Share',
      body: 'The partial pressure of a gas is its mole fraction times the total pressure. A gas that makes up a quarter of the moles makes up a quarter of the push.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Up the Mountain',
    prompt: 'Give the partial pressure of oxygen in the air 5500 m up, in kilopascals.',
    controls: ['volume'],
    volumes: AIR_ROOMS, volumeStart: 1,
    volumeNames: ['sea level', '3000 m', '5500 m', '8850 m'],
    volumeLabel: 'Height',
    ...BASE,
    labels: { gauge: 'PRESSURE', share: 'MOLE FRACTION' },
    show: { share: true },
    thermoLo: -50, thermoHi: 100,
    gaugeMax: 120,
    rigs: [tank('a', 'AIR', AIR_PARTS, { T: AIR_T, V: AIR_ROOMS[0], note: 'a sample of air' })],
    widget: { type: 'number', label: 'Oxygen pushes with, in kPa', min: 0, max: 30, step: 1 },
    encounter: {
      species: 'gas bladder',
      act: 'Give Push',
      intent: 'The bladder swells at the foot of the mountain and sags the higher the dial climbs.'
    },
    hints: [
      'Turn the height dial to 5500 m and read the gauge and the mole fraction of oxygen.',
      'Compare the mole fraction of oxygen at sea level with its mole fraction at 5500 m.',
      'Multiply the mole fraction of oxygen by the total pressure at 5500 m.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the pressure.' };
      const m = readOf(STAGES[4], 'a', { volume: 3 });
      const want = m.rows.find(r => r.gas === 'O2').P;
      if (state.number === Math.round(want)) return { ok: true };
      return { ok: false, msg: 'The mixture is the same at every height; only the total changes, so use the total at this height.' };
    },
    reward: {
      log: 'Thin air has the same mixture at a lower total.',
      title: 'Thin Air',
      body: 'At altitude the air is the same mixture but its total pressure is lower, so the partial pressure of oxygen falls with it. A climber is short of oxygen because its partial pressure is low, not because its mole fraction has changed.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Gas That Reacts With Nothing',
    prompt: 'Say what adding argon does to the push of the oxygen already in the tank.',
    controls: ['feed', 'reset'],
    keys: { feed: 'Add Argon' },
    ...BASE,
    gaugeMax: 1300,
    rigs: [tank('a', 'TANK A', [{ gas: 'N2', n: 0.8 }, { gas: 'O2', n: 0.2 }], { note: 'a tank of two gases' })],
    widget: {
      type: 'choice', label: 'The oxygen pushes',
      options: [
        choice('same', 'Exactly as it did before'),
        choice('more', 'More, because there is more gas pressing in'),
        choice('less', 'Less, because the oxygen is crowded out'),
        choice('shared', 'Less, because its push is shared out with the argon')
      ]
    },
    encounter: {
      species: 'gas bladder',
      act: 'Name Effect',
      intent: 'The bladder swells with every mole of argon that goes in.'
    },
    hints: [
      'Read the counter for oxygen, press "Add Argon", and read it again.',
      'Compare the oxygen counter with the total on the gauge before and after each press.',
      'Check which of the readings changes with every press and which stays exactly where it was.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'same') return { ok: true };
      if (state.choice === 'more') return { ok: false, msg: 'The gauge for the whole tank climbs, but look at the counter for the oxygen on its own.' };
      return { ok: false, msg: 'Compare the oxygen counter before and after the argon goes in; it has not been cut.' };
    },
    reward: {
      log: 'Argon adds its own push and takes nothing from the oxygen.',
      title: 'Gases Ignore One Another',
      body: 'A gas that reacts with nothing adds its own partial pressure to the total and leaves every other partial pressure where it was. Each gas in a mixture behaves as if it had the whole tank to itself.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Rank by Push',
    prompt: 'Put the three gases in the tank in order of partial pressure, largest first.',
    controls: ['temp'],
    temps: [27, 127, 227], tempStart: 1, tempList: 'C',
    ...BASE,
    labels: { gauge: 'PRESSURE', share: 'MOLE FRACTION' },
    show: { share: true },
    gaugeMax: 700,
    rigs: [tank('a', 'TANK A', [{ gas: 'He', n: 0.5 }, { gas: 'N2', n: 1.0 }, { gas: 'CO2', n: 1.5 }], { V: 20, note: 'a tank of three gases' })],
    widget: {
      type: 'order', label: 'Largest partial pressure first',
      items: [{ id: 'He', label: 'He' }, { id: 'N2', label: 'N₂' }, { id: 'CO2', label: 'CO₂' }]
    },
    encounter: {
      species: 'gas bladder',
      act: 'Rank Gases',
      intent: 'The bladder swells with all three gases at once.'
    },
    hints: [
      'Read the amount, the mole fraction and the knock counter for each gas in the table.',
      'Compare the order the knock counters give with the order the amounts give, and the order each gives for the share of the total.',
      'Decide which reading the partial pressure follows by checking which one adds up to the gauge.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three gases in order.' };
      const m = readOf(STAGES[6], 'a', {});
      const want = m.rows.slice().sort((a, b) => b.P - a.P).map(r => r.gas);
      if (state.order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'The partial pressures must add up to the gauge, and the knock counters do not: check which column does.' };
    },
    reward: {
      log: 'The moles decide the push.',
      title: 'Moles Decide the Push',
      body: 'At one temperature in one tank, the gas with the most moles has the largest partial pressure, whatever its particles weigh. Light particles knock more often and heavy ones knock harder, and the two balance out.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Pulling One Out',
    prompt: 'Give the moles of carbon dioxide in the sealed tank.',
    controls: ['trap', 'reset'],
    keys: { trap: 'Trap Carbon Dioxide' },
    ...BASE,
    reference: ['R = 8.31 kPa·L per mol·K'],
    gaugeMax: 250,
    rigs: [tank('a', 'TANK A', [{ gas: 'N2', n: 0.4 }, { gas: 'CO2', n: 0.2 }], { sealed: true, note: 'a sealed tank of two gases' })],
    widget: { type: 'decimal', label: 'Moles of carbon dioxide', min: 0, max: 1, step: 0.05 },
    encounter: {
      species: 'gas bladder',
      act: 'Count Moles',
      intent: 'The bladder gives nothing away, but it sags the moment the trap takes a gas.'
    },
    hints: [
      'Read the gauge, press "Trap Carbon Dioxide", and read the gauge again.',
      'Compare the two readings: the difference is the push the trapped gas was making on its own.',
      'Turn the difference in pressure into moles with the gas law, using the volume and temperature printed on the tank.'
    ],
    check(state) {
      if (state.decimal === null || state.decimal === undefined) return { ok: false, notYet: true, msg: 'Set the moles.' };
      const m = readOf(STAGES[7], 'a', {});
      const want = m.rows.find(r => r.gas === 'CO2').n;
      if (Math.abs(state.decimal - want) < 0.025) return { ok: true };
      return { ok: false, msg: 'Only the drop in the reading belongs to the trapped gas; turn that drop, and not the whole reading, into moles.' };
    },
    reward: {
      log: 'One gas counted by taking it out.',
      title: 'Counting One Gas',
      body: "Taking one gas out of a mixture and watching the gauge fall gives that gas's partial pressure, and the gas law turns that into moles. Partial pressures let you count each gas in a tank you cannot see into."
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
      body: 'Every gas in a mixture pushes exactly as it would alone, so the total is a sum, each share follows its moles, and a gas that reacts with nothing changes nothing but the total.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Air, breathing gas, a gas collected over a liquid and the exhaust of a reaction are all mixtures. Partial pressures are how each one is counted.'
    },
    {
      heading: 'Next',
      body: 'The next bench slows the particles down for a closer look, and finds out how fast each one goes and how soon it escapes.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A tank holds nitrogen at a partial pressure of 3.0 atm and oxygen at a partial pressure of 1.0 atm. What is the total pressure?',
    options: [
      { id: 'a', label: '4.0 atm' },
      { id: 'b', label: '3.0 atm' },
      { id: 'c', label: '2.0 atm' },
      { id: 'd', label: '3.5 atm' }
    ],
    answer: 'a',
    explanation: 'By Dalton’s law the total pressure is the sum of the partial pressures: 3.0 + 1.0 = 4.0 atm.'
  },
  {
    question: 'A mixture is 2.0 mol of helium and 3.0 mol of neon. What is the mole fraction of helium?',
    options: [
      { id: 'a', label: '0.40' },
      { id: 'b', label: '0.60' },
      { id: 'c', label: '0.67' },
      { id: 'd', label: '2.0' }
    ],
    answer: 'a',
    explanation: 'The mole fraction is the moles of helium over the total moles: 2.0 / (2.0 + 3.0) = 0.40.'
  },
  {
    question: 'The total pressure of a gas mixture is 200 kPa and oxygen makes up 25 % of its moles. What is the partial pressure of oxygen?',
    options: [
      { id: 'a', label: '50 kPa' },
      { id: 'b', label: '25 kPa' },
      { id: 'c', label: '150 kPa' },
      { id: 'd', label: '175 kPa' }
    ],
    answer: 'a',
    explanation: 'The partial pressure is the mole fraction times the total pressure: 0.25 × 200 = 50 kPa.'
  },
  {
    question: 'Why is the air at the top of a high mountain hard to breathe, when it is still about 21 % oxygen?',
    options: [
      { id: 'a', label: 'The total pressure is lower, so the partial pressure of oxygen is lower' },
      { id: 'b', label: 'The mole fraction of oxygen falls with height' },
      { id: 'c', label: 'The oxygen particles are heavier' },
      { id: 'd', label: 'The nitrogen pushes the oxygen out' }
    ],
    answer: 'a',
    explanation: 'The mixture is the same at every height, but the total pressure falls, and each gas’s partial pressure falls with it.'
  },
  {
    question: 'Argon, which reacts with nothing, is pumped into a sealed tank of nitrogen and oxygen at constant temperature. What happens to the partial pressure of the oxygen?',
    options: [
      { id: 'a', label: 'It stays the same' },
      { id: 'b', label: 'It rises' },
      { id: 'c', label: 'It falls' },
      { id: 'd', label: 'It becomes equal to the argon’s' }
    ],
    answer: 'a',
    explanation: 'Each gas behaves as if the others were not there, so only the total pressure rises.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'sum' },
  { choice: 'alone' },
  { decimal: 0.4 },
  { number: 50 },
  { number: 11 },
  { choice: 'same' },
  { order: ['CO2', 'N2', 'He'] },
  { decimal: 0.2 }
];

export const MISSES = [
  { choice: 'average' },
  { choice: 'less' },
  { decimal: 0.6 },
  { number: 200 },
  { number: 21 },
  { choice: 'more' },
  { order: ['He', 'N2', 'CO2'] },
  { decimal: 0.6 }
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
      pour: ({ bench }) => bench.pour('b', 'a'),
      feed: ({ bench }) => bench.feed('a', 'Ar', 1),
      trap: ({ bench }) => bench.trap('a', 'CO2')
    }
  });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { readOf, planMixture, GASES, R, AIR, airPressureAt, pressureIdeal, HEIGHTS, AIR_ROOMS, AIR_T, AIR_PARTS };
