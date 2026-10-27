/**
 * q2-laws.js — Bellows, bench two: THE GAS LAWS.
 *
 * The Compressor's piston deck, on the gas kit (`table/kits/gas.js`). Bench one found what a gauge counts. This one changes ONE thing on
 * a gas at a time and reads how the others answer, which is how the gas laws were found.
 *
 * THE CLICK. Almost everyone who has used a thermometer believes a gas "doubles" when the number on it doubles: 20 degrees to 40 degrees
 * is twice as hot. Stage 1 asks for that guess about a gas under a light piston (a predict stage, no instrument), and stage 2 gives two
 * cylinders on the bench and asks for the heater setting at which one is twice the room of the other. It is 313 degrees, not 40. The
 * Celsius number is the wrong thing to double, so the next stage draws the line of room against heat and carries it down to where the
 * room would be nothing: absolute zero, where the kelvin scale starts counting. The same idea is then met in a new case, a sealed tank
 * in the cold, with a second guess (stage 4) and its test (stage 5).
 *
 *   1  PREDICT: warmed from 20 to 40 degrees, how much bigger is the room
 *   2  TEST: heat one cylinder until its room is twice another's
 *   3  carry the line of room against heat down to zero room       -> Absolute Zero, Kelvin, Charles's law
 *   4  PREDICT: a sealed tank cools by 50 degrees, what does its gauge do
 *   5  TEST: cool the tank and read what the gauge did             -> Gay-Lussac's law
 *
 * (Cut as repeats: the quarter-room stage and the knocks-double stage, which bench one's squeeze already works out; the weighted piston
 * fed with gas, which bench three finds again as the room one mole fills; the combined-law stage and the four plotted records.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, markerFixture, markerRead, rigAt, cylRead } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf, cardColumn } from './_shared.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\babsolute zero\b/i, introducedAt: 3 },
  { term: /\bkelvin\b/i, introducedAt: 3 },
  { term: /\bcharles.?s law\b/i, introducedAt: 3 },
  { term: /\bgay.lussac.?s law\b/i, introducedAt: 5 }
];

/** Pressure, the knocks, the speed screen and Boyle's law are plain words from q1-knocks. */
export const BUILDS_ON = ['unit04/q1-knocks'];

/** The keys the player's two guesses are kept under (`engine/predict.js`). */
export const KEY_ROOM = 'unit04/q2-laws#room';
export const KEY_TANK = 'unit04/q2-laws#tank';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';
const T20 = 293.15;
const P_ATM = 101.325;

/** The guesses of stage 1, and the two stages' shared words. */
export const ROOM_GUESSES = [['twice', 'Twice as big'], ['little', 'A little bigger'], ['none', 'No bigger']];
/** The guesses of stage 4 (and the verdicts of stage 5). */
export const TANK_GUESSES = [['same', 'Stays the same'], ['sixth', 'Falls by about a sixth'], ['half', 'Falls by about a half']];

/** Holder 8's heater, in degrees C: one setting is the trap (40), and one has the room twice Holder 7's. */
export const DOUBLE_TEMPS = [20, 40, 100, 200, 313, 400];
/** Stage 3's heater, in degrees C. The strip is ruled well past the coldest the heater reaches, so the line has to be carried on. */
const LINE_TEMPS = [20, 60, 100, 150, 200];
export const ZERO_TOL = 10;
/** Stage 5's tank cooler, in degrees C, and the setting the prompt names. */
export const COOL_TEMPS = [20, 0, -30, -80];
export const COOL_AT = 3;

/** How a tank's gauge changed between two settings, as the card that says so. */
export function fallCard(from, to) {
  const drop = 1 - to / from;
  return drop < 0.02 ? 'same' : drop < 0.33 ? 'sixth' : 'half';
}

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: KEY_ROOM,
    title: 'Temperature and Volume',
    prompt: 'A gas under a light piston is warmed from 20 °C to 40 °C: how much bigger does the room it fills get?',
    items: ROOM_GUESSES,
    hints: [
      'Choose one of the cards.',
      'Consider how heating affects gas particles under a free piston.',
      'Select the card that matches your prediction.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Two gas cylinders will now test how temperature changes affect gas volume.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const base = { gas: 'He', n: 1, hold: 'P', V: 24, T: T20, P0: P_ATM };
    const a = rig('ra', { x: 20, y: 25 }, { cyls: [{ id: 'a', label: 'Holder 7', ...base }], vmax: 60, compact: true, w: 34, show: { gauge: false, amount: false } });
    const b = rig('rb', { x: 58, y: 25 }, {
      cyls: [{ id: 'a', label: 'Holder 8', ...base }], temps: DOUBLE_TEMPS, tempList: 'C', tempStart: 1, vmax: 60, compact: true, w: 34, show: { gauge: false, amount: false }
    });
    return {
      title: 'Doubling Volume',
      get prompt() {
        return youPredicted(KEY_ROOM, ROOM_GUESSES, 'set Holder 8\'s heater so that its room is twice Holder 7\'s.', 'Set Holder 8\'s heater so that its room is twice Holder 7\'s.');
      },
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Holder 8\'s Heater dial.',
        'Compare the volumes of both cylinders at each setting.',
        'Find the setting where Holder 8\'s volume is exactly double Holder 7\'s.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Holder 8\'s heater is where it started: turn it and watch its room.' };
        const ratio = cylRead(t, 'rb', 0).V / cylRead(t, 'ra', 0).V;
        if (Math.abs(ratio - 2) < 0.02) return { ok: true };
        return { ok: false, msg: ratio < 2 ? 'Holder 8\'s room is still less than double Holder 7\'s.' : 'Holder 8\'s room is already more than double Holder 7\'s.' };
      },
      get reward() {
        return {
          log: 'Twice the room took 313 degrees, not 40.',
          title: 'Temperature and Volume',
          body: 'Doubling volume required heating to 313 °C rather than 40 °C. Gas volume scales with absolute temperature measured from absolute zero, not the Celsius scale.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 28 }, {
      cyls: [{ id: 'a', label: 'Holder 9', gas: 'He', n: 1, hold: 'P', V: 24, T: T20, P0: P_ATM }], temps: LINE_TEMPS, tempList: 'C', tempStart: 1, vmax: 45,
      show: { gauge: false, amount: false }, plot: { x: 'TC', y: 'V' }
    });
    return {
      title: 'Extrapolating to Zero Volume',
      prompt: 'Set the marker to the temperature at which the room of the gas would reach zero.',
      widget,
      table: gasTable({
        fixtures: [r, markerFixture('zero', 'Room reaches zero at', { x: 108, y: 55 }, { min: -400, max: 0, step: 10, start: 0, unit: '°C', w: 50 })],
        tools: ['straightedge']
      }, { recorder: { at: { x: 112, y: 24 }, size: { w: 42, h: 28 }, xLabel: 'Heat', xUnit: '°C', yLabel: 'Room', yUnit: 'L', range: { xMin: -300, xMax: 250, yMin: 0, yMax: 45 } } }),
      hints: [
        'Use the "Heater" dial, "Record", and the straightedge.',
        'Record readings at several settings, then align the straightedge across them.',
        'Find the temperature where the line reaches zero volume.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'zero');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the temperature you read off the line.' };
        if (Math.abs(v - (-273.15)) <= ZERO_TOL) return { ok: true };
        return { ok: false, msg: t.recorder.tool ? 'The laid line reaches the bottom edge of the strip at a different temperature from the marker.' : 'There is no line on the strip yet: record some readings and lay the straightedge across them.' };
      },
      reward: {
        log: 'The room reaches zero at −273 °C.',
        title: 'Absolute Zero',
        body: 'Extrapolating the line shows volume reaching zero at −273 °C, known as absolute zero. Measuring upward from absolute zero defines the kelvin scale. Volume is directly proportional to kelvin temperature (Charles\'s law).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TANK,
    title: 'Temperature and Pressure',
    prompt: 'A sealed tank cools from 20 °C to −30 °C: what does its gauge do?',
    items: TANK_GUESSES,
    hints: [
      'Choose one of the cards.',
      'The tank is rigid, so volume is fixed; consider how cooling affects collisions.',
      'Select the card that matches your prediction.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'A sealed tank will now be cooled on the bench to test how temperature change affects gas pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Pod tank, sealed', gas: 'N2', n: 1, hold: 'V', V: 10, T: T20 }], temps: COOL_TEMPS, tempList: 'C', tempStart: 1, vmax: 10,
      show: { amount: false, volume: false }, plot: { x: 'TC', y: 'P' }
    });
    return {
      title: 'Pressure in the Cold',
      get prompt() {
        return youPredicted(KEY_TANK, TANK_GUESSES, 'cool the tank to −30 °C, then lay the card for what its gauge did.', 'Cool the tank to −30 °C, then lay the card for what its gauge did.');
      },
      widget,
      table: gasTable({
        pieces: cardColumn(TANK_GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: i < 2 ? { x: 90 + i * 38, y: 44.5 } : { x: 109, y: 57.5 } })),
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'What the gauge did', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }, { recorder: { at: { x: 109, y: 11 }, size: { w: 36, h: 14 }, xLabel: 'Heat', xUnit: '°C', yLabel: 'Gauge', yUnit: '' } }),
      hints: [
        'Use the "Heater" dial and "Record", then place a card in the slot.',
        'Compare the gauge at −30 °C with the starting reading at 20 °C.',
        'Select the card indicating the fraction of initial pressure lost.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.temp.value) !== COOL_AT) return { ok: false, notYet: true, msg: 'Turn the Heater dial to the temperature the prompt names.' };
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const want = fallCard(rigAt(t, RIG, { temp: 1 })[0].P, rigAt(t, RIG, { temp: COOL_AT })[0].P);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: 'The gauge at the cooled setting is not the share of the first reading that card says.' };
      },
      get reward() {
        return {
          log: 'The gauge fell with the kelvin temperature.',
          title: 'Gay-Lussac\'s Law',
          body: 'In a sealed rigid tank, gas pressure is directly proportional to kelvin temperature. Cooling reduces pressure by the exact fraction that the kelvin temperature drops (Gay-Lussac\'s law).'
        };
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn Holder 8\'s Heater dial.'],
  3: ['Record each setting, lay the straightedge,', 'then set the marker.'],
  4: ['Place a card in the slot.'],
  5: ['Turn the Heater dial and Record,', 'then place a card in the slot.']
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
      body: 'Gas volume and pressure are directly proportional to absolute temperature in kelvin, not Celsius. Extrapolating volume to zero defines absolute zero at −273 °C (0 K). At constant pressure, volume scales with kelvin temperature (Charles\'s law); at constant volume, pressure scales with kelvin temperature (Gay-Lussac\'s law).'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas under a light piston is warmed from 20 °C to 40 °C. Roughly how does its volume change?',
    options: [
      { id: 'a', label: 'It grows by about 7 percent' },
      { id: 'b', label: 'It doubles' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It grows by about 50 percent' }
    ],
    answer: 'a',
    explanation: 'Volume follows the kelvin temperature: 20 °C is 293 K and 40 °C is 313 K, a rise of about 7 percent.'
  },
  {
    question: 'At what Celsius temperature would the volume of a gas, carried back along its line, reach zero?',
    options: [
      { id: 'a', label: '−273 °C' },
      { id: 'b', label: '0 °C' },
      { id: 'c', label: '−100 °C' },
      { id: 'd', label: '+273 °C' }
    ],
    answer: 'a',
    explanation: 'That point is absolute zero, 0 K, the start of the kelvin scale.'
  },
  {
    question: 'A sealed rigid cylinder of gas is cooled from 400 K to 200 K. What happens to its pressure?',
    options: [
      { id: 'a', label: 'It halves' },
      { id: 'b', label: 'It doubles' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It falls to a quarter' }
    ],
    answer: 'a',
    explanation: 'At a fixed volume the pressure is proportional to the kelvin temperature (Gay-Lussac\'s law), so halving the kelvin temperature halves the pressure.'
  },
  {
    question: 'A balloon holds 2.0 L of air at 300 K. Heated under the same pressure to 600 K, what is its new volume?',
    options: [
      { id: 'a', label: '4.0 L' },
      { id: 'b', label: '2.0 L' },
      { id: 'c', label: '1.0 L' },
      { id: 'd', label: '8.0 L' }
    ],
    answer: 'a',
    explanation: 'Volume is proportional to the kelvin temperature (Charles\'s law), so doubling the kelvin doubles the volume.'
  },
  {
    question: 'Which of these is the same temperature as 0 K?',
    options: [
      { id: 'a', label: 'Absolute zero, the coldest possible' },
      { id: 'b', label: 'The freezing point of water' },
      { id: 'c', label: 'The temperature of room air' },
      { id: 'd', label: 'The boiling point of water' }
    ],
    answer: 'a',
    explanation: '0 K is absolute zero, about −273 °C. Water freezes at 273 K.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('little', 'slot:predict')],
  [dial('rb', 'temp', 3), dial('rb', 'temp', 5)],
  [dial(RIG, 'temp', 1), { run: RIG }, dial(RIG, 'temp', 2), { run: RIG }, dial(RIG, 'temp', 3), { run: RIG }, dial(RIG, 'temp', 5), { run: RIG },
    { lay: { kind: 'straightedge', through: [0, 3] } }, dial('zero', 'value', -270)],
  [put('sixth', 'slot:predict')],
  [dial(RIG, 'temp', 1), { run: RIG }, dial(RIG, 'temp', 3), { run: RIG }, put('sixth', 'slot:show')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('rb', 'temp', 2)],
  [dial(RIG, 'temp', 1), { run: RIG }, dial(RIG, 'temp', 5), { run: RIG }, { lay: { kind: 'straightedge', through: [0, 1] } }, dial('zero', 'value', -100)],
  [],
  [dial(RIG, 'temp', 3), put('half', 'slot:show')]
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
export { rigAt, cylRead };
